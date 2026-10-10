"""Dane do strony „Jak działa Large Language Model” (web/src/app/extra/jak-dziala-llm).

Uruchomienie (z katalogu web/, CPU wystarcza):

    npm run data:internals            # trening małego GPT pomijany, jeśli jest już w JSON
    npm run data:internals -- --retrain

Wynik: web/src/data/llm-internals.json. Jeden przykład na całej stronie: PROMPT.

- bpe: uczenie BPE na akapicie (znaki → coraz dłuższe tokeny, słownik z ID)
  i tokenizacja nowego tekstu token po tokenie,
- gpt2: prawdziwe wartości GPT-2 small dla PROMPT: tokeny i ID, wektory
  embeddingu (RoPE liczy się w przeglądarce), Q/K/V jednej głowy, wybrane głowy
  atencji, residual stream warstwa po warstwie z odczytem rozkładu („logit lens”)
  i generowanie zachłanne,
- training: mały GPT na znakach uczony na „Panu Tadeuszu” (Wolne Lektury, domena
  publiczna): krzywa loss i próbki tekstu w kolejnych krokach.
"""

from __future__ import annotations

import json
import math
import re
import sys
import urllib.request
from collections import Counter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "llm-internals.json"
PROMPT = "The Eiffel Tower is located in the city of"

# ---------------------------------------------------------------- BPE
BPE_TEXT = (
    "The tower stands in the city. The tower is tall and the city is old. "
    "In the city of towers, every tower is located near the river. "
    "People in the city say the tower is the heart of the city, and the river is the soul of the city. "
    "Tourists come to the city to see the tower and the river, and they stay in the city for the night."
)
BPE_NEW = PROMPT + " Paris, near the river Seine. Every year people come to see the tower."
BPE_MERGES = 40
# alfabet bazowy: litery, cyfry, spacja i interpunkcja (jak bajty w prawdziwym tokenizerze: każdy tekst da się zakodować)
ALPHABET = sorted(set(" .,;:!?'-\"()") | set("0123456789") | {chr(c) for c in range(65, 91)} | {chr(c) for c in range(97, 123)})


def pretokenize(s: str) -> list[str]:
    # jak w GPT-2: słowo razem ze spacją przed nim, interpunkcja osobno
    return re.findall(r" ?[A-Za-z]+| ?[0-9]+| ?[^A-Za-z0-9\s]+|\s+", s)


def bpe() -> dict:
    vocab = list(ALPHABET)
    words = [list(w) for w in pretokenize(BPE_TEXT)]
    steps = [{"merge": None, "count": 0, "tokens": [t for w in words for t in w]}]
    merges = []
    for _ in range(BPE_MERGES):
        p: Counter = Counter()
        for w in words:
            for a, b in zip(w, w[1:]):
                p[(a, b)] += 1
        (a, b), cnt = p.most_common(1)[0]
        for w in words:
            i = 0
            while i < len(w) - 1:
                if w[i] == a and w[i + 1] == b:
                    w[i:i + 2] = [a + b]
                i += 1
        merges.append((a, b))
        vocab.append(a + b)
        steps.append({"merge": [a, b], "count": cnt, "tokens": [t for w in words for t in w]})

    def encode_word(w: str) -> list[str]:
        parts = list(w)
        for a, b in merges:
            i = 0
            while i < len(parts) - 1:
                if parts[i] == a and parts[i + 1] == b:
                    parts[i:i + 2] = [a + b]
                i += 1
        return parts

    ids = {t: i for i, t in enumerate(vocab)}
    enc = [{"t": t, "id": ids[t]} for w in pretokenize(BPE_NEW) for t in encode_word(w)]
    return {"text": BPE_TEXT, "alphabet": len(ALPHABET), "vocab": vocab, "steps": steps, "newText": BPE_NEW, "encoded": enc}


# ---------------------------------------------------------------- GPT-2
R = lambda x, n=3: round(float(x), n)  # noqa: E731


def gpt2() -> dict:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tok = AutoTokenizer.from_pretrained("gpt2")
    model = AutoModelForCausalLM.from_pretrained("gpt2", attn_implementation="eager").eval()
    tr = model.transformer
    ids = tok(PROMPT, return_tensors="pt").input_ids
    toks = [tok.decode([i]) for i in ids[0]]
    T = len(toks)
    d, H = model.config.n_embd, model.config.n_head
    dh = d // H

    with torch.no_grad():
        out = model(ids, output_attentions=True, output_hidden_states=True)
    A = torch.stack([a[0] for a in out.attentions])  # [L, H, T, T]
    hs = out.hidden_states  # embedding + 12 warstw

    # embedding: 8 liczb z 4 par wymiarów rozłożonych po wektorze (dla RoPE: pary 0, 96, 192, 288 z 384)
    PAIRS = [0, 96, 192, 288]
    wte = tr.wte.weight.detach()
    emb = [[R(wte[i, 2 * p + k]) for p in PAIRS for k in (0, 1)] for i in ids[0]]
    emb8 = [[R(x) for x in wte[i, :8]] for i in ids[0]]  # pierwsze 8 liczb = pary 0–3

    # głowy o czytelnym wzorcu (wybór liczony, nie ręczny)
    last = T - 1
    prev = torch.stack([A[:, :, i, i - 1] for i in range(1, T)]).mean(0)
    l_prev, h_prev = divmod(int(prev.argmax()), H)
    first = A[:, :, 1:, 0].mean(-1)
    l_f, h_f = divmod(int(first.argmax()), H)
    content = [toks.index(t) for t in (" E", "iff", "el", " Tower")]
    look = A[:, :, last, content].sum(-1)
    look[:2] = 0
    l_c, h_c = divmod(int(look.argmax()), H)

    def mat(l, h):
        return [[R(x) for x in row] for row in A[l, h]]

    heads = [
        {"layer": l_c, "head": h_c, "kind": "content", "w": mat(l_c, h_c)},
        {"layer": l_prev, "head": h_prev, "kind": "prev", "w": mat(l_prev, h_prev)},
        {"layer": l_f, "head": h_f, "kind": "first", "w": mat(l_f, h_f)},
    ]

    # Q, K, V głowy „content”: X = ln_1(stan na wejściu warstwy), W z c_attn
    blk = tr.h[l_c]
    with torch.no_grad():
        X = blk.ln_1(hs[l_c][0])
        W, b = blk.attn.c_attn.weight, blk.attn.c_attn.bias  # [d, 3d]
        sl = lambda j: slice(j * d + h_c * dh, j * d + (h_c + 1) * dh)  # noqa: E731
        Wq, Wk, Wv = W[:, sl(0)], W[:, sl(1)], W[:, sl(2)]
        Q, K, V = X @ Wq + b[sl(0)], X @ Wk + b[sl(1)], X @ Wv + b[sl(2)]
        S = Q @ K.T / math.sqrt(dh)
        Sm = S.masked_fill(torch.triu(torch.ones(T, T, dtype=torch.bool), 1), float("-inf"))
        P = torch.softmax(Sm, -1)
        O = P @ V
    m = lambda x, r, c: [[R(v, 2) for v in row[:c]] for row in x[:r]]  # noqa: E731
    qkv = {
        "layer": l_c, "head": h_c, "d": d, "dh": dh, "heads": H,
        "X": m(X, T, 6), "Wq": m(Wq, 6, 4), "Wk": m(Wk, 6, 4), "Wv": m(Wv, 6, 4),
        "Q": m(Q, T, 4), "K": m(K, T, 4), "V": m(V, T, 4),
        "S": [[R(v, 2) if j <= i else None for j, v in enumerate(row)] for i, row in enumerate(S)],
        "P": [[R(v, 2) for v in row] for row in P], "O": m(O, T, 4),
    }

    # residual stream: 24 wymiary bez kilku znanych wymiarów-outlierów GPT-2
    # hidden_states[-1] ma już ln_f, więc surowy stan po ostatnim bloku bierze się z hooka
    raw_last = {}
    hook = tr.h[-1].register_forward_hook(lambda _m, _i, o: raw_last.setdefault("x", o[0] if isinstance(o, tuple) else o))
    with torch.no_grad():
        model(ids)
    hook.remove()
    hs = list(hs[:-1]) + [raw_last["x"]]
    allh = torch.stack([h[0] for h in hs])  # [13, T, d]
    outl = set(allh.abs().amax((0, 1)).topk(8).indices.tolist())
    dims = [i for i in range(d) if i not in outl][:24]
    stream, lens = [], []
    with torch.no_grad():
        for li, h in enumerate(hs):
            x = h[0][:, dims]
            stream.append([[R(v, 2) for v in row] for row in x])  # surowe: stan[n] = stan[n−1] + zmiana warstwy n
            y = tr.ln_f(h[0, -1])
            p = torch.softmax(model.lm_head(y), -1)
            v, i = p.topk(3)
            lens.append([{"t": tok.decode([int(k)]), "p": R(q, 4)} for q, k in zip(v, i)])

    # generowanie zachłanne
    gen, cur = [], ids
    with torch.no_grad():
        for _ in range(4):
            p = torch.softmax(model(cur).logits[0, -1], -1)
            v, i = p.topk(5)
            gen.append([{"t": tok.decode([int(k)]), "p": R(q, 4)} for q, k in zip(v, i)])
            cur = torch.cat([cur, i[:1].view(1, 1)], 1)

    return {
        "model": "gpt2", "prompt": PROMPT, "tokens": toks, "ids": ids[0].tolist(),
        "vocab": tok.vocab_size, "layers": model.config.n_layer, "headsPerLayer": H, "d": d,
        "emb": emb, "emb8": emb8, "ropePairs": PAIRS, "heads": heads, "qkv": qkv,
        "stream": stream, "lens": lens, "generate": gen,
    }


# ---------------------------------------------------------------- mały GPT na znakach
PT_URL = "https://wolnelektury.pl/media/book/txt/pan-tadeusz.txt"
STEPS = 10000
SAMPLE_AT = [0, 250, 500, 1000, 2500, 5000, 10000]


def training() -> dict:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    torch.manual_seed(0)
    raw = urllib.request.urlopen(PT_URL).read().decode("utf-8")
    text = raw[raw.index("Litwo! Ojczyzno"): raw.index("\n-----")]
    chars = sorted(set(text))
    stoi = {c: i for i, c in enumerate(chars)}
    data = torch.tensor([stoi[c] for c in text])
    n = int(0.9 * len(data))
    train, val = data[:n], data[n:]
    V, C, D, H, L, B = len(chars), 64, 128, 4, 4, 32

    class Block(nn.Module):
        def __init__(self):
            super().__init__()
            self.ln1, self.ln2 = nn.LayerNorm(D), nn.LayerNorm(D)
            self.attn = nn.MultiheadAttention(D, H, batch_first=True)
            self.mlp = nn.Sequential(nn.Linear(D, 4 * D), nn.GELU(), nn.Linear(4 * D, D))
            self.register_buffer("mask", torch.triu(torch.ones(C, C, dtype=torch.bool), 1))

        def forward(self, x):
            t = x.shape[1]
            h = self.ln1(x)
            x = x + self.attn(h, h, h, attn_mask=self.mask[:t, :t], need_weights=False)[0]
            return x + self.mlp(self.ln2(x))

    class GPT(nn.Module):
        def __init__(self):
            super().__init__()
            self.tok, self.pos = nn.Embedding(V, D), nn.Embedding(C, D)
            self.blocks = nn.Sequential(*[Block() for _ in range(L)])
            self.ln, self.head = nn.LayerNorm(D), nn.Linear(D, V)

        def forward(self, idx):
            x = self.tok(idx) + self.pos(torch.arange(idx.shape[1]))
            return self.head(self.ln(self.blocks(x)))

    model = GPT()
    params = sum(p.numel() for p in model.parameters())
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, STEPS, eta_min=1e-4)

    def batch(src):
        ix = torch.randint(len(src) - C - 1, (B,))
        return torch.stack([src[i:i + C] for i in ix]), torch.stack([src[i + 1:i + C + 1] for i in ix])

    @torch.no_grad()
    def val_loss():
        model.eval()
        g = torch.Generator().manual_seed(1)
        ix = torch.randint(len(val) - C - 1, (64,), generator=g)
        x = torch.stack([val[i:i + C] for i in ix])
        y = torch.stack([val[i + 1:i + C + 1] for i in ix])
        out = F.cross_entropy(model(x).reshape(-1, V), y.reshape(-1)).item()
        model.train()
        return out

    @torch.no_grad()
    def sample(prompt="Litwo! ", n=140):
        model.eval()
        g = torch.Generator().manual_seed(7)
        idx = torch.tensor([[stoi[c] for c in prompt]])
        for _ in range(n):
            logits = model(idx[:, -C:])[0, -1] / 0.8
            nxt = torch.multinomial(torch.softmax(logits, -1), 1, generator=g)
            idx = torch.cat([idx, nxt[None]], 1)
        model.train()
        return "".join(chars[i] for i in idx[0].tolist())

    curve, samples = [], []
    for step in range(STEPS + 1):
        if step % 100 == 0:
            curve.append({"step": step, "loss": round(val_loss(), 4)})
        if step in SAMPLE_AT:
            samples.append({"step": step, "text": sample()})
            print(step, curve[-1]["loss"], samples[-1]["text"][:60].replace("\n", " "))
        if step == STEPS:
            break
        x, y = batch(train)
        loss = F.cross_entropy(model(x).reshape(-1, V), y.reshape(-1))
        opt.zero_grad()
        loss.backward()
        opt.step()
        sched.step()

    return {
        "corpus": "Adam Mickiewicz, „Pan Tadeusz” (Wolne Lektury)",
        "chars": len(text), "vocab": V, "params": params,
        "config": {"layers": L, "dim": D, "heads": H, "context": C, "batch": B},
        "uniformLoss": round(math.log(V), 4),
        "epochs": round(STEPS * B * C / len(train), 1),
        "curve": curve, "samples": samples,
    }


if __name__ == "__main__":
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    train = old["training"] if "training" in old and "--retrain" not in sys.argv else training()
    out = {"bpe": bpe(), "gpt2": gpt2(), "training": train}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    print("zapisano", OUT, OUT.stat().st_size // 1024, "KB")
