"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion, useInView, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, Shuffle } from "lucide-react";
import data from "@/data/rag.json";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { GOLD, QueryToggle, RankRow } from "@/components/viz/HybridRankViz";

/**
 * Organizm: reranking. Lista 10 kandydatów z wyszukiwania hybrydowego, potem cross-encoder
 * ocenia każdą parę (pytanie, chunk) i lista przestawia się według nowego wyniku.
 * Dane: scripts/generate_rag_data.py (sdadas/polish-reranker-base-ranknet).
 */
export function RerankViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [q, setQ] = useState(1);
  const [after, setAfter] = useState(false);
  const query = data.queries[q];
  const gold = GOLD[query.q];
  const chunks = query.chunks as unknown as Record<string, { snippet: string }>;
  const score = new Map(query.rerank.map((r) => [r.id, r.score]));
  const before = query.hybrid10;
  const order = after ? query.rerank.map((r) => r.id) : before;

  useEffect(() => {
    setAfter(false);
    if (!inView) return;
    const t = setTimeout(() => setAfter(true), reduce ? 0 : 1400);
    return () => clearTimeout(t);
  }, [q, inView, reduce]);

  return (
    <div ref={ref} className="space-y-5">
      <QueryToggle q={q} setQ={setQ} />
      <Panel className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">
            {after ? "po rerankingu: cross-encoder czyta pytanie i chunk razem" : "kandydaci z hybrydy (RRF), kolejność pierwszego etapu"}
          </p>
          <Button variant="ghost" onClick={() => setAfter((a) => !a)} aria-label="Przełącz reranking">
            <Shuffle className="size-4" /> {after ? "przed" : "rerank"}
          </Button>
        </div>
        <LayoutGroup>
          <ol className="grid gap-2 lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-5">
            {order.map((id, i) => {
              const was = before.indexOf(id) + 1;
              const delta = was - (i + 1);
              return (
                <motion.li layout={!reduce} key={id} transition={{ type: "spring", stiffness: 160, damping: 20 }} className="flex gap-2">
                  <span className="w-5 pt-2 font-mono text-xs text-fg-subtle">{i + 1}</span>
                  <div className="min-w-0 grow">
                    <RankRow
                      id={id}
                      score={after ? score.get(id) : undefined}
                      digits={3}
                      gold={id.split("#")[0] === gold}
                      snippet={chunks[id].snippet}
                      extra={
                        after && delta !== 0 ? (
                          <span className={delta > 0 ? "flex items-center text-hit" : "flex items-center text-miss"}>
                            {delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                            {Math.abs(delta)}
                          </span>
                        ) : null
                      }
                    />
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </LayoutGroup>
      </Panel>
      <p className="font-mono text-[0.7rem] text-fg-subtle">
        sdadas/polish-reranker-base-ranknet · wynik = trafność pary (pytanie, chunk) · <span className="text-hit">zielone</span> = dokument z odpowiedzią
      </p>
    </div>
  );
}
