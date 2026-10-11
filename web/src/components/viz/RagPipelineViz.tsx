"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import data from "@/data/rag.json";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";
import { useStepper } from "@/lib/useStepper";

const QUERY = data.queries.find((x) => x.q.includes("zdalnie"))!;
const CHUNKS = QUERY.chunks as unknown as Record<string, { snippet: string; rok: number }>;
const K = 3;
const STEPS = ["Pytanie", "Embedding", "Wyszukiwanie top-k", "Prompt", "Odpowiedź"];

/**
 * Organizm: pipeline RAG krok po kroku na prawdziwym przykładzie z notebooka:
 * pytanie → wektor → k najbliższych chunków (z filtrem rok ≥ 2025) → prompt → odpowiedź.
 * Kroki przełączają się same po wjechaniu w kadr; można też klikać.
 * Dane wyszukiwania: scripts/generate_rag_data.py; odpowiedź: zapisany wynik komórki web:rag.
 */
export function RagPipelineViz({ answer, model }: { answer: string; model: string }) {
  const st = useStepper(STEPS.length, { interval: 1800 });
  const reduce = useReducedMotion();
  const step = st.step;

  const ranked = QUERY.vector.slice(0, 5);
  const kept = ranked.filter((r) => CHUNKS[r.id].rok >= 2025).slice(0, K);

  return (
    <div ref={st.ref} className="space-y-5">
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-3" aria-label="Kroki pipeline RAG">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => st.go(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "w-full rounded-xl border px-1.5 py-2 text-left transition-colors sm:px-3",
                i === step ? "border-focus bg-focus/10" : i < step ? "border-hit/40" : "border-[var(--line)]",
              )}
            >
              <span className={cn("block font-mono text-xs", i === step ? "text-focus" : i < step ? "text-hit" : "text-fg-subtle")}>{i + 1}</span>
              <span className="hidden text-sm text-fg-muted sm:block">{s}</span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--panel-hi)]">
                <motion.span className="block h-full bg-hit" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: reduce ? 0 : 0.5 }} />
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Panel className="min-h-[19rem] p-5 md:p-7">
        <p className="mb-4 text-xs uppercase tracking-wider text-fg-subtle sm:hidden">{STEPS[step]}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <p className="text-xl text-focus md:text-2xl">„{QUERY.q}”</p>}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-fg-muted">Ten sam model embeddingów co dla chunków zamienia pytanie na wektor.</p>
                <p className="break-all font-mono text-sm text-brand-300 md:text-base">
                  [{QUERY.query_vec.map((v) => v.toFixed(3)).join(", ")}, … ] <span className="text-fg-subtle">768 liczb</span>
                </p>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-2">
                <p className="mb-3 font-mono text-xs text-fg-subtle">
                  Chroma: {data.n_chunks} chunków, where = {"{"}rok ≥ 2025{"}"}, k = {K}
                </p>
                {ranked.map((r, i) => {
                  const ok = kept.some((x) => x.id === r.id);
                  return (
                    <motion.div
                      key={r.id}
                      initial={reduce ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: ok ? 1 : 0.45, x: 0 }}
                      transition={{ delay: reduce ? 0 : i * 0.12 }}
                      className={cn("flex items-baseline gap-3 rounded-lg border px-3 py-2 text-sm", ok ? "border-hit/40 bg-hit/[0.07]" : "border-miss/40")}
                    >
                      <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-fg-subtle">{(1 - r.score).toFixed(3)}</span>
                      <span className={cn("shrink-0 font-mono text-xs", ok ? "text-hit" : "text-miss line-through")}>{r.id}</span>
                      <span className="hidden truncate text-xs text-fg-muted md:inline">{CHUNKS[r.id].snippet}</span>
                      {!ok && <span className="ml-auto shrink-0 font-mono text-xs text-miss">rok {CHUNKS[r.id].rok}</span>}
                    </motion.div>
                  );
                })}
                <p className="pt-1 font-mono text-[0.7rem] text-fg-subtle">pierwsza kolumna: odległość 1 − cos; najbliższy chunk pochodzi z nieaktualnej polityki</p>
              </div>
            )}
            {step === 3 && (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-ink-950/60 p-4 font-mono text-xs leading-relaxed text-fg-muted md:text-sm">
                <span className="text-brand-300">system:</span> Korzystasz wyłącznie z podanego kontekstu. Jeśli kontekst nie zawiera odpowiedzi, piszesz „Nie wiem”. Na końcu źródła.{"\n\n"}
                <span className="text-brand-300">user:</span> Kontekst:{"\n"}
                {kept.map((r) => (
                  <span key={r.id} className="block">
                    <span className="text-hit">[{r.id}]</span> {CHUNKS[r.id].snippet}
                  </span>
                ))}
                {"\n"}Pytanie: <span className="text-focus">{QUERY.q}</span>
              </pre>
            )}
            {step === 4 && (
              <div className="space-y-3">
                <p className="text-lg leading-relaxed md:text-xl">{answer}</p>
                <p className="font-mono text-xs text-fg-subtle">{model} · odpowiedź z zapisanego notebooka</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Panel>
    </div>
  );
}
