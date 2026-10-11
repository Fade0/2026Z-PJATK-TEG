"""Dane do wizualizacji zajęć 2 (RAG) -> web/src/data/rag.json.

Uruchomienie (z katalogu web/, Ollama z modelem embeddinggemma):
    npm run data:rag

Liczone tak samo jak w 02-rag/notebook.ipynb, żeby liczby na slajdach zgadzały się
z notebookiem: chunking RecursiveCharacterTextSplitter (300/50, tytuł doklejony
do chunku), embeddingi EmbeddingGemma bez prefiksów zadań, BM25 (rank_bm25)
z prymitywnym stemmingiem (6 znaków), RRF z k=60, reranker
sdadas/polish-reranker-base-ranknet (polski cross-encoder, CPU).
Bez kluczy API: odpowiedź modelu na slajdzie pochodzi z zapisanego notebooka.
"""

import json
import re
import urllib.request
from pathlib import Path

import numpy as np
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "web" / "src" / "data" / "rag.json"
DATA = ROOT / "02-rag" / "data"


def load_docs():
    docs = []
    for path in sorted(DATA.glob("*.md")):
        title, meta, _, *body = path.read_text(encoding="utf-8").split("\n")
        meta = dict(kv.split(": ") for kv in meta.split(" | "))
        docs.append({"id": path.stem, "title": title.lstrip("# "), "dzial": meta["dział"], "rok": int(meta["rok"]), "text": "\n".join(body).strip()})
    return docs


def embed(texts):
    req = urllib.request.Request("http://localhost:11434/api/embed", data=json.dumps({"model": "embeddinggemma", "input": texts}).encode(), headers={"Content-Type": "application/json"})
    return np.array(json.load(urllib.request.urlopen(req))["embeddings"])


STOP = set("a i w z na do o od po się że to jest są nie co jak ile czy dla przez lub albo oraz też mogę".split())


def tokenize(text):
    words = re.findall(r"\w+(?:-\d+)?", text.lower())
    return [w if any(ch.isdigit() for ch in w) else w[:6] for w in words if w not in STOP]


def chunking(doc):
    """Granice chunków (start, end) w tekście dokumentu dla siatki ustawień."""
    text = doc["text"]
    grid = {}
    for size in range(100, 801, 50):
        for overlap in (0, 25, 50, 100):
            if overlap >= size:
                continue
            parts = RecursiveCharacterTextSplitter(chunk_size=size, chunk_overlap=overlap).split_text(text)
            spans, cursor = [], 0
            for p in parts:
                start = text.find(p, max(0, cursor - overlap - 5))
                if start < 0:
                    start = text.find(p)
                spans.append([start, start + len(p)])
                cursor = start + len(p)
            grid[f"{size}/{overlap}"] = spans
    return {"doc": doc["id"], "title": doc["title"], "text": text, "grid": grid}


def main():
    docs = load_docs()
    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    chunks = [{"id": f"{d['id']}#{i}", "text": f"{d['title']}\n{p}", "rok": d["rok"], "dzial": d["dzial"]} for d in docs for i, p in enumerate(splitter.split_text(d["text"]))]
    E = embed([c["text"] for c in chunks])
    bm25 = BM25Okapi([tokenize(c["text"]) for c in chunks])
    reranker = CrossEncoder("sdadas/polish-reranker-base-ranknet")

    def snippet(c):
        body = c["text"].split("\n", 1)[1].replace("\n", " ")
        return body[:110] + ("…" if len(body) > 110 else "")

    queries = []
    for q in ["Ile pieniędzy mogę wydać na kursy i konferencje?", "Mój komputer jest już stary, kiedy dostanę nowy?", "Co oznacza błąd LS-409?", "Ile dni w tygodniu można pracować zdalnie?"]:
        qv = embed([q])[0]
        cos = E @ qv
        vec = list(np.argsort(-cos, kind="stable")[:20])
        bs = bm25.get_scores(tokenize(q))
        kw = list(np.argsort(-bs, kind="stable")[:20])  # remisy: kolejność chunków w korpusie
        fused = {}
        for ranking in (vec, kw):
            for pos, i in enumerate(ranking, start=1):
                fused[i] = fused.get(i, 0) + 1 / (60 + pos)
        hyb = sorted(fused, key=fused.get, reverse=True)[:10]
        rr = reranker.predict([(q, chunks[i]["text"]) for i in hyb])
        rer = [hyb[j] for j in np.argsort(-rr, kind="stable")]
        rr_by = {hyb[j]: float(rr[j]) for j in range(len(hyb))}
        used = set(vec[:6]) | set(kw[:6]) | set(hyb[:6]) | set(rer)
        queries.append({
            "q": q,
            "query_vec": [round(float(x), 3) for x in qv[:6]],
            "chunks": {chunks[i]["id"]: {"snippet": snippet(chunks[i]), "rok": chunks[i]["rok"], "dzial": chunks[i]["dzial"]} for i in used},
            "vector": [{"id": chunks[i]["id"], "score": round(float(cos[i]), 3)} for i in vec[:6]],
            "bm25": [{"id": chunks[i]["id"], "score": round(float(bs[i]), 2)} for i in kw[:6]],
            "rrf": [{"id": chunks[i]["id"], "score": round(fused[i], 4)} for i in hyb[:6]],
            "hybrid10": [chunks[i]["id"] for i in hyb],
            "rerank": [{"id": chunks[i]["id"], "score": round(rr_by[i], 3)} for i in rer],
        })
        print("✓", q)

    out = {
        "n_docs": len(docs),
        "n_chunks": len(chunks),
        "chunking": chunking(next(d for d in docs if d["id"] == "praca-zdalna-2026")),
        "queries": queries,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"✓ {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
