// Kod i wyniki na prezentacji zajęć 2.
//
// NB = komórki z 02-rag/notebook.ipynb oznaczone tagami `web:*`,
// wyciągane przez scripts/sync-notebooks.mjs. Nie należy ich edytować tutaj:
// po zmianie notebooka trzeba go uruchomić i zrobić commit; strona zaktualizuje się przy buildzie.

import generated from "@/content/generated/02-rag.json";

type CellData = { code: string; output: string };

const EMPTY: CellData = { code: "# brak komórki: uruchom `npm run sync`", output: "" };
export const NB = new Proxy(generated as Record<string, CellData>, {
  get: (target, key: string) => target[key] ?? EMPTY,
}) as Record<string, CellData>;

/** "czat: openai (gpt-5-nano, ...) | embeddingi: ollama (embeddinggemma)" -> modele do podpisów. */
const m = NB.setup.output.match(/czat: (\S+) \(([^,]+),.*\| embeddingi: (\S+) \(([^)]+)\)/);
export const MODELS = m ? { chat: m[2], embed: m[4] } : { chat: "LLM", embed: "embeddings" };

/** Pierwsza odpowiedź z komórki web:rag (pytanie o pracę zdalną) do wizualizacji pipeline. */
export const RAG_ANSWER = NB.rag.output.match(/^A: (.*)$/m)?.[1] ?? "";

/** Fragment kodu od linii zaczynającej się od `start` do linii przed `end` (bez `end` = do końca). */
export function slice(code: string, start: string, end?: string) {
  const from = code.indexOf(start);
  if (from < 0) return code;
  const to = end ? code.indexOf(end, from + start.length) : -1;
  return code.slice(from, to < 0 ? undefined : to).trimEnd();
}

export type JudgeCase = { name: string; question: string; answer: string; context: string; expected?: [number, number]; got: [number, number]; reason: string };

/**
 * Przypadki dla wizualizacji sędziego: pierwsze pytanie z web:judge (odpowiedź = RAG_ANSWER)
 * i przypadki kontrolne z web:judge-control (odpowiedzi z kodu komórki, oceny z jej wyniku).
 */
function judgeCases(): JudgeCase[] {
  const first = NB.judge.output.match(/^F=(\d) C=(\d)\s+(.+?)\s*\|\s*(.*)$/m);
  const cases: JudgeCase[] = first
    ? [{ name: "zwykłe pytanie", question: "Ile dni w tygodniu można pracować zdalnie?", answer: RAG_ANSWER, context: "praca-zdalna-2026 (top-3, filtr rok ≥ 2025)", got: [+first[1], +first[2]], reason: first[4] }]
    : [];
  const code = NB["judge-control"].code;
  const defs = [...code.matchAll(/\("([^"]+)", "([^"]+)", doc_context\("([^"]+)"\),\s*"([^"]+)", "[^"]+", \((\d), (\d)\)\)/g)];
  const lines = NB["judge-control"].output.split("\n");
  defs.forEach((d, i) => {
    const res = lines[i * 2]?.match(/sędzia F=(\d) C=(\d)/);
    cases.push({ name: d[1], question: d[2], context: d[3], answer: d[4], expected: [+d[5], +d[6]], got: res ? [+res[1], +res[2]] : [-1, -1], reason: (lines[i * 2 + 1] ?? "").trim() });
  });
  return cases;
}
// wynik komórki ucina uzasadnienie do stałej długości; urwane zdanie dostaje wielokropek
export const JUDGE_CASES = judgeCases().map((c) => ({ ...c, reason: /[.!?]$/.test(c.reason) ? c.reason : `${c.reason}…` }));
