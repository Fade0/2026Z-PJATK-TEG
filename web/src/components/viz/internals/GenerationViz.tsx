"use client";

import { motion, useReducedMotion } from "motion/react";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { NetworkDiagram, STAGES } from "@/components/viz/internals/NetworkDiagram";
import { cn } from "@/lib/cn";

type Top = { t: string; p: number }[];
const data = raw.gpt2 as { prompt: string; generate: Top[] };
const ROUNDS = data.generate.length;
const PH = STAGES.length + 1; // etapy schematu + dopisanie tokenu
const tl = (t: string) => (t === "\n" ? "↵" : t.replace(/ /g, "·"));

/** Organizm: generowanie tekstu: sygnał przechodzi przez schemat sieci, powstaje rozkład, najbardziej prawdopodobny token trafia na wejście. Dane: scripts/llm_internals_data.py. */
export function GenerationViz() {
  const st = useStepper(ROUNDS * PH, { autoplay: false, interval: 420 });
  const reduce = useReducedMotion();
  const r = Math.floor(st.step / PH);
  const ph = st.step % PH;
  const top = data.generate[r];
  const ready = ph >= STAGES.length - 1;
  const appended = ph === PH - 1;
  const chosen = data.generate.slice(0, r + (appended ? 1 : 0)).map((x) => x[0].t);

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
              <StickySteps stepper={st} slider label={`runda ${r + 1}: ${appended ? `dopisanie „${tl(top[0].t)}”` : ready ? "rozkład następnego tokenu" : STAGES[ph]}`} />
      <p className="mt-6 font-mono text-lg md:text-xl">
        <span className="text-fg-muted">{data.prompt}</span>
        {chosen.map((t, i) => (
          <span key={i} className={cn("whitespace-pre", i === chosen.length - 1 && appended ? "rounded bg-focus/15 text-focus" : "text-fg")}>
            {t === "\n" ? "↵" : t}
          </span>
        ))}
        <span className="ml-0.5 inline-block h-5 w-2 translate-y-0.5 animate-pulse bg-focus/70" />
      </p>

      <div className="mt-6">
        <NetworkDiagram lit={appended ? -1 : ph} input={<>…city of{chosen.join("").replace(/\n/g, "↵")}</>} output={ready ? tl(top[0].t) : "?"} />
      </div>

      <div className={cn("mt-6 max-w-xl transition-opacity duration-300", ready ? "opacity-100" : "opacity-25")}>
        <p className="mb-3 text-xs uppercase tracking-wider text-fg-subtle">Rozkład na słowniku (5 najbardziej prawdopodobnych z 50 257)</p>
        <ul className="space-y-2">
          {top.map((t, i) => (
            <li key={i} className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3">
              <span className={cn("truncate font-mono", i === 0 ? "text-focus" : "text-fg-muted")}>{tl(t.t)}</span>
              <div className="h-4 overflow-hidden rounded-md bg-[var(--panel-hi)]">
                <motion.div
                  className={cn("h-full rounded-md", i === 0 ? "bg-focus" : "bg-brand-500/60")}
                  initial={false}
                  animate={{ width: ready ? `${t.p * 100}%` : "0%" }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="text-right font-mono text-sm tabular-nums">{(t.p * 100).toFixed(0)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-sm text-fg-muted">
        Każda runda to pełny przebieg przez sieć i jeden nowy token. Tu wybierany jest zawsze najbardziej prawdopodobny (dekodowanie zachłanne); w praktyce losuje się z rozkładu z temperaturą, top-k albo top-p. Żeby nie liczyć wszystkiego od nowa, model zapamiętuje klucze i wartości poprzednich tokenów (KV cache).
      </p>
    </Panel>
  );
}
