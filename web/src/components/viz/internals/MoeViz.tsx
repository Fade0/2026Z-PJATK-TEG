"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { cn } from "@/lib/cn";

// Ilustracja: 8 ekspertów, top-2. Logity routera ręcznie dobrane (w modelu liczy je
// mała warstwa liniowa z wektora tokenu). Mechanika prawdziwa: softmax → top-k → renormalizacja.
const TOKENS = ["The", "·E", "iff", "el", "·Tower", "·is"];
const LOGITS = [
  [2.1, 0.2, -0.5, 1.6, 0.1, -1.0, 0.3, -0.2],
  [0.4, 2.3, 0.1, 1.2, -0.6, 0.0, -0.4, 0.2],
  [1.9, 0.6, -0.3, 2.0, 0.2, -0.8, 0.1, -0.5],
  [-0.2, 0.3, 2.4, 0.0, 0.1, 0.5, 1.7, 0.2],
  [0.0, 1.1, 0.2, -0.4, 0.6, 2.2, -0.1, 1.5],
  [-0.6, 0.1, 0.4, -0.3, 2.5, 1.9, 0.0, 0.3],
];
const E = 8;
const K = 2;

function route(l: number[]) {
  const m = Math.max(...l);
  const e = l.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  const p = e.map((x) => x / z);
  const top = p.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]).slice(0, K);
  const s = top.reduce((a, [v]) => a + v, 0);
  return { p, top: top.map(([v, i]) => ({ i, w: v / s })) };
}

/** Organizm: Mixture of Experts: router wybiera top-2 z 8 ekspertów dla każdego tokenu; licznik tokenów obsłużonych przez każdego eksperta. */
export function MoeViz() {
  const st = useStepper(TOKENS.length, { autoplay: false });
  const s = st.step;
  const reduce = useReducedMotion();
  const routes = useMemo(() => LOGITS.map(route), []);
  const r = routes[s];
  const load = Array.from({ length: E }, (_, e) => routes.slice(0, s + 1).filter((x) => x.top.some((t) => t.i === e)).length);

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <StickySteps stepper={st} slider label={`token „${TOKENS[s]}”`} />
      <div className="mt-6 flex flex-wrap gap-1.5">
        {TOKENS.map((t, i) => (
          <button
            key={i}
            onClick={() => st.go(i)}
            className={cn(
              "rounded-[var(--radius-chip)] border px-2 py-1 font-mono text-lg",
              i === s ? "border-focus bg-focus/15 text-focus" : i < s ? "border-[var(--line)] text-fg-muted" : "border-[var(--line)] text-fg-subtle opacity-50",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-fg-subtle">Router: softmax po ekspertach</p>
          <ul className="space-y-1.5">
            {r.p.map((p, e) => {
              const chosen = r.top.some((t) => t.i === e);
              return (
                <li key={e} className="grid grid-cols-[2.5rem_1fr_3.5rem] items-center gap-2">
                  <span className={cn("font-mono text-sm", chosen ? "text-hit" : "text-fg-subtle")}>E{e + 1}</span>
                  <div className="h-4 overflow-hidden rounded bg-[var(--panel-hi)]">
                    <motion.div className={cn("h-full rounded", chosen ? "bg-hit" : "bg-brand-500/40")} initial={false} animate={{ width: `${p * 100}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }} />
                  </div>
                  <span className="text-right font-mono text-xs tabular-nums text-fg-muted">{(p * 100).toFixed(0)}%</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-fg-subtle">Eksperci (osobne MLP); liczba = tokeny obsłużone do tej pory</p>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: E }, (_, e) => {
              const t = r.top.find((x) => x.i === e);
              return (
                <div key={e} className={cn("relative flex h-24 flex-col justify-between rounded-xl border p-2 transition-colors", t ? "border-hit/60 bg-hit/10" : "border-[var(--line)] bg-[var(--panel)]")}>
                  <span className={cn("font-mono text-sm", t ? "text-hit" : "text-fg-subtle")}>E{e + 1}</span>
                  <AnimatePresence mode="popLayout">
                    {t && (
                      <motion.span
                        key={s}
                        initial={reduce ? false : { opacity: 0, y: -24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="w-fit rounded bg-focus/15 px-1 font-mono text-xs text-focus"
                      >
                        {t.w.toFixed(2).replace(".", ",")}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="self-end font-mono text-xs tabular-nums text-fg-muted">{load[e]}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-fg-muted">
            Wyjście warstwy = suma wyjść {K} wybranych ekspertów ważona wagami routera. Pozostałe {E - K} nie liczą nic dla tego tokenu.
          </p>
        </div>
      </div>
      <p className="mt-6 font-mono text-[0.7rem] text-fg-subtle">Ilustracja: wagi routera dobrane ręcznie, 8 ekspertów i top-2 dla czytelności.</p>
    </Panel>
  );
}
