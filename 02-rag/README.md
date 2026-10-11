# Zajęcia 2: RAG

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/adrianstando/2026Z-PJATK-TEG/blob/main/02-rag/notebook.ipynb)
[![Open in Deepnote](https://deepnote.com/buttons/launch-in-deepnote-small.svg)](https://deepnote.com/launch?url=https://github.com/adrianstando/2026Z-PJATK-TEG/blob/main/02-rag/notebook.ipynb)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/adrianstando/2026Z-PJATK-TEG)

- **Prezentacja:** https://adrianstando.github.io/2026Z-PJATK-TEG/zajecia/02-rag/
- **Notebook z wynikami:** https://adrianstando.github.io/2026Z-PJATK-TEG/notebook/02-rag/
- **Zadanie:** [zadanie.ipynb](zadanie.ipynb) · [Colab](https://colab.research.google.com/github/adrianstando/2026Z-PJATK-TEG/blob/main/02-rag/zadanie.ipynb)

## Zakres

- chunking: rozmiar fragmentu, overlap i ich wpływ na wyniki wyszukiwania,
- baza wektorowa Chroma i filtrowanie po metadanych,
- pipeline RAG: pytanie → fragmenty → prompt → odpowiedź ze źródłami,
- wyszukiwanie hybrydowe: BM25 + embeddingi, łączenie rankingów (RRF),
- reranking cross-encoderem,
- ewaluacja: hit rate i MRR dla wyszukiwania, LLM jako sędzia dla odpowiedzi.

## Przed zajęciami

Skonfigurowany dostęp do modelu: [00-dostep-do-llm](../00-dostep-do-llm/README.md). Reranker (`sdadas/polish-reranker-base-ranknet`, ok. 500 MB) pobiera się przy pierwszym uruchomieniu.

## Zadanie

[zadanie.ipynb](zadanie.ipynb): RAG na własnym korpusie z metadanymi, porównanie metod wyszukiwania (wektory, BM25, hybryda, reranking) na zestawie testowym, ocena odpowiedzi przez LLM.

Oddanie mailem z tematem `[TEG] lab-02`, notebook z wynikami komórek, przed zajęciami 3.

## Uwagi do notebooka

- Korpus w [`data/`](data/) to 15 dokumentów **fikcyjnej** firmy (regulaminy, dokumentacja produktu Lumen Sync). W Colabie notebook pobiera go z repozytorium.
- Zapisane wyniki: czat z OpenAI (`gpt-5-nano`), embeddingi z lokalnej Ollamy (`embeddinggemma`). Inne modele dadzą inne liczby.
- Komórki z tagiem `web:*` są pokazywane na prezentacji.
