"""Dane do animacji krok po kroku na zajęciach 2 -> web/src/data/rag-steps.json.

Uruchomienie (z katalogu web/, Ollama z embeddinggemma):
    npm run data:rag-steps

Te same ustawienia co w 02-rag/notebook.ipynb (chunki 300/50, EmbeddingGemma bez
prefiksów, BM25 z przycinaniem do 6 znaków, RRF k=60, sdadas/polish-reranker-base-ranknet).
Rzut 2D: t-SNE (metryka cosinusowa) liczony razem dla chunków i pytań. t-SNE zachowuje
sąsiedztwa, nie odległości, dlatego top-k na rysunku wyznacza cosinus na pełnych wektorach.
Tokeny promptu: tiktoken o200k_base (tokenizer gpt-5-nano).
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder
from sklearn.manifold import TSNE

sys.path.insert(0, str(Path(__file__).parent))
from generate_rag_data import ROOT, STOP, embed, load_docs, tokenize  # noqa: E402

OUT = ROOT / "web" / "src" / "data" / "rag-steps.json"
EVAL = [
    ("Ile dni w tygodniu można pracować zdalnie?", "praca-zdalna-2026"),
    ("Co oznacza błąd LS-409?", "lumen-sync-kody-bledow"),
    ("Jak naprawić błąd VPN-719?", "vpn"),
    ("Ile wynosi dieta za dobę w podróży służbowej po Polsce?", "delegacje"),
    ("Z jakim wyprzedzeniem trzeba złożyć wniosek o dwutygodniowy urlop?", "urlopy"),
    ("Ile kosztuje plan Zespół?", "lumen-sync-cennik"),
    ("Ile zapytań na minutę obsługuje API w najtańszym planie?", "lumen-sync-limity-api"),
    ("Jak długo trzymamy logi z adresami e-mail?", "ochrona-danych"),
    ("W jakim czasie dyżurny reaguje na krytyczną awarię?", "zglaszanie-awarii"),
    ("Zgubiłem YubiKey, co teraz?", "hasla-i-klucze"),
    ("Mój komputer jest już stary, kiedy dostanę nowy?", "sprzet"),
    ("Jak zarezerwować salę na spotkanie?", "biuro"),
    ("Ile pieniędzy mogę wydać na kursy i konferencje?", "benefity"),
    ("Kto pomaga nowej osobie w pierwszych miesiącach?", "onboarding"),
    ("Czy dostanę dopłatę do rachunków za prąd, gdy pracuję z domu?", "praca-zdalna-2026"),
    ("Co zrobić, gdy wysłałem dane klienta do złej osoby?", "ochrona-danych"),
]
SPACE_Q = ["Ile dni w tygodniu można pracować zdalnie?", "Mój komputer jest już stary, kiedy dostanę nowy?", "Co oznacza błąd LS-409?"]
SYSTEM = ("Odpowiadasz na pytania pracowników na podstawie fragmentów dokumentów firmy.\n"
          "Korzystasz wyłącznie z podanego kontekstu. Jeśli kontekst nie zawiera odpowiedzi, piszesz: \"Nie wiem\".\n"
          "Odpowiedź: 1-2 zdania po polsku, na końcu identyfikatory źródeł w nawiasach kwadratowych.")


def doc_rank(ids, gold):
    for pos, cid in enumerate(ids, start=1):
        if cid.split("#")[0] == gold:
            return pos
    return None


def main():
    docs = load_docs()
    sp = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    chunks = [{"id": f"{d['id']}#{i}", "doc": d["id"], "text": f"{d['title']}\n{p}", "rok": d["rok"], "dzial": d["dzial"]}
              for d in docs for i, p in enumerate(sp.split_text(d["text"]))]
    ids = [c["id"] for c in chunks]
    E = np.array(embed([c["text"] for c in chunks]))
    toks = [tokenize(c["text"]) for c in chunks]
    bm25 = BM25Okapi(toks)
    reranker = CrossEncoder("sdadas/polish-reranker-base-ranknet")
    enc = tiktoken.get_encoding("o200k_base")

    def rankings(q):
        qv = np.array(embed([q])[0])
        vec = [ids[i] for i in np.argsort(-(E @ qv), kind="stable")[:20]]
        s = bm25.get_scores(tokenize(q))
        kw = [ids[i] for i in np.argsort(-s, kind="stable")[:20]]  # jak w notebooku: także chunki z wynikiem 0
        fused = {}
        for r in (vec, kw):
            for pos, cid in enumerate(r, start=1):
                fused[cid] = fused.get(cid, 0) + 1 / (60 + pos)
        hyb = sorted(fused, key=fused.get, reverse=True)[:10]
        text = {c["id"]: c["text"] for c in chunks}
        rr = reranker.predict([(q, text[c]) for c in hyb])
        rer = [hyb[j] for j in np.argsort(-rr, kind="stable")]
        return qv, vec, kw, hyb, rer

    # (a) przestrzeń chunków
    QV = np.array([np.array(embed([q])[0]) for q in SPACE_Q])
    X = np.vstack([E, QV])
    P = TSNE(n_components=2, perplexity=12, metric="cosine", init="pca", random_state=0).fit_transform(X)
    P = (P - P.min(0)) / (P.max(0) - P.min(0))
    space = {
        "points": [{"id": c["id"], "doc": c["doc"], "dzial": c["dzial"], "x": round(float(P[i, 0]), 4), "y": round(float(P[i, 1]), 4)} for i, c in enumerate(chunks)],
        "queries": [{"q": q, "x": round(float(P[len(chunks) + j, 0]), 4), "y": round(float(P[len(chunks) + j, 1]), 4),
                     "vec": [round(float(v), 3) for v in QV[j][:5]],
                     "top": [{"id": ids[i], "cos": round(float((E @ QV[j])[i]), 3)} for i in np.argsort(-(E @ QV[j]), kind="stable")[:5]]}
                    for j, q in enumerate(SPACE_Q)],
    }

    # (b) Chroma: rekordy dla pytania o pracę zdalną
    q = SPACE_Q[0]
    qv = QV[0]
    order = np.argsort(-(E @ qv), kind="stable")[:6]
    chroma = {"q": q, "records": [{"id": ids[i], "text": chunks[i]["text"].split("\n", 1)[1][:120] + "…", "vec": [round(float(v), 3) for v in E[i][:4]],
                                    "dzial": chunks[i]["dzial"], "rok": chunks[i]["rok"], "dist": round(float(1 - E[i] @ qv), 3)} for i in order]}

    # (c) BM25 krok po kroku
    bq = "Ile pieniędzy mogę wydać na kursy i konferencje?"
    raw = re.findall(r"\w+(?:-\d+)?", bq.lower())
    qt = tokenize(bq)
    s = bm25.get_scores(qt)
    top = np.argsort(-s, kind="stable")[:4]
    k1, b = bm25.k1, bm25.b
    def contrib(i, t):
        tf = toks[i].count(t)
        if not tf:
            return 0.0
        return float(bm25.idf.get(t, 0) * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(toks[i]) / bm25.avgdl)))
    bm = {
        "q": bq,
        "raw": [{"word": w, "token": None if w in STOP else (w if any(ch.isdigit() for ch in w) else w[:6])} for w in raw],
        "idf": [{"token": t, "idf": round(float(bm25.idf.get(t, 0)), 2), "df": sum(1 for d in toks if t in d)} for t in qt],
        "n_chunks": len(chunks),
        "chunks": [{"id": ids[i], "total": round(float(s[i]), 2), "parts": {t: round(contrib(i, t), 2) for t in qt}} for i in top],
    }

    # (d) RRF: dwie listy dla jednego pytania
    _, vec, kw, hyb, _ = rankings(bq)
    sb = bm25.get_scores(qt)
    rrf = {"q": bq, "vector": vec[:6], "bm25": [c for c in kw[:6] if sb[ids.index(c)] > 0], "gold": "benefity"}

    # (e) prompt
    kept = [i for i in np.argsort(-(E @ qv), kind="stable") if chunks[i]["rok"] >= 2025][:3]
    ctx = [{"id": ids[i], "text": chunks[i]["text"], "tokens": len(enc.encode(f"[{ids[i]}] {chunks[i]['text']}"))} for i in kept]
    prompt = {"q": q, "system": SYSTEM, "system_tokens": len(enc.encode(SYSTEM)), "q_tokens": len(enc.encode(f"Pytanie: {q}")), "context": ctx}

    # (f) hit@k i MRR
    ev = []
    for question, gold in EVAL:
        _, vec, kw, hyb, rer = rankings(question)
        ev.append({"q": question, "gold": gold, "ranks": {"wektory": doc_rank(vec, gold), "BM25": doc_rank(kw, gold), "hybryda": doc_rank(hyb, gold), "rerank": doc_rank(rer, gold)}})
        print("✓", question)

    OUT.write_text(json.dumps({"space": space, "chroma": chroma, "bm25": bm, "rrf": rrf, "prompt": prompt, "eval": ev}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"✓ {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
