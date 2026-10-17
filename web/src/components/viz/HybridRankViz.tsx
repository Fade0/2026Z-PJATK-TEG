"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import { Search } from "lucide-react";
import data from "@/data/rag.json";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";

/** Dokument z odpowiedzią dla zapytań w rag.json (jak w zestawie EVAL w notebooku). */
export const GOLD: Record<string, string> = {
  "Ile pieniędzy mogę wydać na kursy i konferencje?": "benefity",
  "Mój komputer jest już stary, kiedy dostanę nowy?": "sprzet",
  "Co oznacza błąd LS-409?": "lumen-sync-kody-bledow",
  "Ile dni w tygodniu można pracować zdalnie?": "praca-zdalna-2026",
};

type Item = { id: string; score: number };
const COLUMNS: { key: "vector" | "bm25" | "rrf"; label: string; metric: string }[] = [
  { key: "vector", label: "Wektory", metric: "cos" },
  { key: "bm25", label: "BM25", metric: "BM25" },
  { key: "rrf", label: "Hybryda (RRF)", metric: "Σ 1/(60+poz.)" },
];

/** Przełącznik zapytań wspólny dla wizualizacji wyszukiwania. */
export function QueryToggle({ q, setQ }: { q: number; setQ: (i: number) => void }) {
  return (
    <ToggleGroup.Root type="single" value={String(q)} onValueChange={(v) => v && setQ(Number(v))} className="flex flex-wrap gap-2" aria-label="Zapytanie">
      {data.queries.map((x, i) => (
        <ToggleGroup.Item
          key={i}
          value={String(i)}
          className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 py-2 text-left text-sm text-fg-muted transition-all hover:text-fg data-[state=on]:border-focus data-[state=on]:bg-focus/10 data-[state=on]:text-focus"
        >
          <Search className="size-3.5 shrink-0" /> {x.q}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/** Wiersz rankingu: identyfikator chunku, wynik, fragment tekstu; właściwy dokument na zielono. */
export function RankRow({ id, score, gold, snippet, digits = 3, extra }: { id: string; score?: number; gold: boolean; snippet: string; digits?: number; extra?: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-sm", gold ? "border-hit/50 bg-hit/[0.08]" : "border-[var(--line)]")}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-mono text-xs", gold ? "text-hit" : "text-fg-muted")}>{id}</span>
        <span className="flex items-baseline gap-2 font-mono text-xs tabular-nums text-fg-subtle">
          {extra}
          {score !== undefined && score.toFixed(digits)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-xs leading-snug text-fg-muted">{snippet}</p>
    </div>
  );
}

/**
 * Organizm: trzy rankingi tego samego zapytania obok siebie (wektory, BM25, RRF).
 * Kolumny pojawiają się po kolei, jak etapy wyszukiwania hybrydowego: dwa niezależne
 * rankingi, potem ich połączenie. Dane: scripts/generate_rag_data.py (EmbeddingGemma, rank_bm25).
 */
export function HybridRankViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [q, setQ] = useState(0);
  const query = data.queries[q];
  const gold = GOLD[query.q];
  const chunks = query.chunks as unknown as Record<string, { snippet: string }>;

  return (
    <div ref={ref} className="space-y-5">
      <QueryToggle q={q} setQ={setQ} />
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col, c) => (
          <motion.div
            key={`${q}-${col.key}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: reduce ? 0 : c * 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Panel className={cn("h-full p-4", col.key === "rrf" && "border-brand-400/50")}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-sm font-medium">{col.label}</p>
                <p className="font-mono text-[0.7rem] text-fg-subtle">{col.metric}</p>
              </div>
              <ol className="space-y-2">
                {(query[col.key] as Item[]).slice(0, 5).map((it, i) => (
                  col.key === "bm25" && it.score <= 0 ? (
                    i === (query.bm25 as Item[]).findIndex((x) => x.score <= 0) ? (
                      <li key="none" className="border-t border-dashed border-[var(--line-strong)] pt-3 font-mono text-xs text-fg-subtle">
                        brak dopasowania: pozostałe chunki nie zawierają żadnego słowa z pytania (wynik 0)
                      </li>
                    ) : null
                  ) : (
                  <li key={it.id} className="flex gap-2">
                    <span className="w-4 pt-2 font-mono text-xs text-fg-subtle">{i + 1}</span>
                    <div className="min-w-0 grow">
                      <RankRow id={it.id} score={it.score} gold={it.id.split("#")[0] === gold} snippet={chunks[it.id].snippet} digits={col.key === "bm25" ? 2 : col.key === "rrf" ? 4 : 3} />
                    </div>
                  </li>
                  )
                ))}
              </ol>
            </Panel>
          </motion.div>
        ))}
      </div>
      <p className="font-mono text-[0.7rem] text-fg-subtle">
        <span className="text-hit">zielone</span> = chunk z dokumentu zawierającego odpowiedź · {data.n_chunks} chunków (300/50) · EmbeddingGemma, rank_bm25, RRF k=60
      </p>
    </div>
  );
}
