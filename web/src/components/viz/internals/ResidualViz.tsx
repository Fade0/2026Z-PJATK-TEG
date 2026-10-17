"use client";

import { motion, useReducedMotion } from "motion/react";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { cn } from "@/lib/cn";

type Top = { t: string; p: number }[];
const data = raw.gpt2 as { prompt: string; tokens: string[]; d: number; stream: number[][][]; lens: Top[] };
const MAX = data.stream.length - 1;
const tl = (t: string) => t.replace(/ /g, "·");

/** Skala kolorów osobno dla każdej macierzy (odchylenie standardowe), bo norma strumienia rośnie z warstwami. */
function Heat({ m, labels }: { m: number[][]; labels?: boolean }) {
  const cols = m[0].length;
  const flat = m.flat();
  const sd = Math.sqrt(flat.reduce((a, v) => a + v * v, 0) / flat.length) || 1;
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `${labels ? "4.2rem " : ""}repeat(${cols}, var(--cell))` }}>
      {m.map((r, i) => (
        <div key={i} className="contents">
          {labels && <span className={cn("self-center truncate pr-1.5 text-right font-mono text-[0.65rem] leading-none", i === m.length - 1 ? "text-focus" : "text-fg-subtle")}>{tl(data.tokens[i])}</span>}
          {r.map((v, j) => (
            <span
              key={j}
              className={cn("aspect-square rounded-[2px] transition-[opacity,background-color] duration-500", v >= 0 ? "bg-cyan-400" : "bg-cat-4")}
              style={{ opacity: Math.min(1, 0.06 + Math.abs(v) / (2.2 * sd)) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Col({ title, m, labels, now }: { title: string; m: number[][]; labels?: boolean; now?: boolean }) {
  return (
    <div>
      <p className={cn("mb-2 text-[0.7rem] uppercase tracking-wider", now ? "text-focus" : "text-fg-subtle")}>{title}</p>
      <Heat m={m} labels={labels} />
    </div>
  );
}

/** Organizm: residual stream GPT-2 przepływa przez 12 warstw: stan tokenów, zmiana dopisana przez warstwę i odczyt następnego tokenu z ostatniej pozycji. Dane: scripts/llm_internals_data.py. */
export function ResidualViz() {
  const st = useStepper(MAX + 1, { autoplay: false, interval: 1300 });
  const s = st.step;
  const reduce = useReducedMotion();
  const m = data.stream[s];
  const diff = s ? m.map((r, i) => r.map((v, j) => v - data.stream[s - 1][i][j])) : null;
  const top = data.lens[s];

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
              <StickySteps stepper={st} slider label={s === 0 ? "embedding + pozycja" : `po warstwie ${s} z ${MAX}`} />
      <div className="mt-6 flex gap-1" aria-hidden>
        {data.stream.map((_, i) => (
          <span key={i} className={cn("h-2 flex-1 rounded-full transition-colors duration-300", i < s ? "bg-brand-500" : i === s ? "bg-focus" : "bg-[var(--panel-hi)]")} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 2xl:grid-cols-[auto_1fr]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4 [--cell:0.55rem] sm:[--cell:0.7rem]">
          {s ? (
            <>
              <Col title={`strumień po ${s === 1 ? "embeddingu" : `warstwie ${s - 1}`}`} m={data.stream[s - 1]} labels />
              <span className="mt-5 font-mono text-2xl text-fg-muted">+</span>
              <Col title={`warstwa ${s} dopisuje`} m={diff!} />
              <span className="mt-5 font-mono text-2xl text-fg-muted">=</span>
              <Col title={`strumień po warstwie ${s}`} m={m} now />
            </>
          ) : (
            <Col title="embedding + pozycja" m={m} labels now />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-fg-subtle">Następny token, gdyby model skończył tutaj</p>
          <p className="mt-3 font-mono">
            <span className="text-fg-muted">…city of </span>
            <span className="rounded bg-focus/15 px-1.5 text-focus">{tl(top[0].t)}</span>
          </p>
          <ul className="mt-4 space-y-3">
            {top.map((t, i) => (
              <li key={i} className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3">
                <span className={cn("truncate font-mono", i === 0 ? "text-focus" : "text-fg-muted")}>{tl(t.t)}</span>
                <div className="h-4 overflow-hidden rounded-md bg-[var(--panel-hi)]">
                  <motion.div
                    className={cn("h-full rounded-md", i === 0 ? "bg-focus" : "bg-brand-500/60")}
                    initial={false}
                    animate={{ width: `${t.p * 100}%` }}
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <span className="text-right font-mono text-sm tabular-nums">{(t.p * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-sm text-fg-muted">
        Pokazane są 24 z {data.d} liczb każdego tokenu; jasność każdej macierzy jest skalowana osobno, bo liczby w strumieniu rosną z warstwami. Wczesne warstwy przewidują ogólne „·the”, środkowe już nazwy miast („·London”, „·Rome”), a dopiero ostatnie wybierają „·Paris”. Odczyt z warstw pośrednich robi się tą samą warstwą wyjściową co na końcu, więc jest tylko przybliżeniem.
      </p>
    </Panel>
  );
}
