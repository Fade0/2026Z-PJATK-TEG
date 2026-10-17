"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { Callout } from "@/components/molecules/Callout";
import { cn } from "@/lib/cn";

type Head = { layer: number; head: number; kind: string; w: number[][] };
const data = raw.gpt2 as { tokens: string[]; heads: Head[]; layers: number; headsPerLayer: number };
const NOTE: Record<string, string> = {
  content: "ostatni token „·of” bierze większość wagi z „·E”, „iff”, „el” i „·Tower”, czyli z nazwy obiektu, o którego miasto chodzi w zdaniu.",
  prev: "prawie każdy token bierze wartość głównie z tokenu bezpośrednio przed nim. Tak model składa słowa z kawałków („·E” + „iff” + „el”).",
  first: "większość wagi trafia na pierwszy token „The”. To zjawisko nazywa się attention sink: gdy głowa nie znajduje w kontekście nic istotnego do przekazania, odkłada wagę na pierwszym tokenie, a jego wartość V niewiele zmienia w wyniku. Softmax musi gdzieś rozdzielić sumę 1.",
};
const T = data.tokens.length;
const label = (t: string) => t.replace(/ /g, "·");

/** Organizm: wagi atencji GPT-2 dla zdania z przykładu; wybór tokenu-zapytania i głowy, maska przyczynowa. Dane: scripts/llm_internals_data.py. */
export function AttentionViz() {
  const [h, setH] = useState(0);
  const [q, setQ] = useState(T - 1);
  const reduce = useReducedMotion();
  const head = data.heads[h];
  const row = head.w[q];

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <ToggleGroup.Root
        type="single"
        value={String(h)}
        onValueChange={(v) => v && setH(Number(v))}
        aria-label="Głowa atencji"
        className="flex w-fit flex-wrap gap-1.5 rounded-xl border border-[var(--line)] p-1"
      >
        {data.heads.map((x, k) => (
          <ToggleGroup.Item key={k} value={String(k)} className="rounded-lg px-3 py-1.5 text-sm text-fg-muted data-[state=on]:bg-brand-500 data-[state=on]:text-white">
            warstwa {x.layer + 1} · głowa {x.head + 1}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <p className="mt-6 text-xs uppercase tracking-wider text-fg-subtle">Kliknięcie tokenu wybiera zapytanie (Q). Wysokość słupka = waga, z jaką bierze wartość (V) innego tokenu</p>
      <div className="mt-3 overflow-x-auto pb-2">
        <div className="grid min-w-[36rem] gap-1" style={{ gridTemplateColumns: `repeat(${T}, minmax(0, 1fr))` }}>
          {data.tokens.map((t, k) => {
            const masked = k > q;
            return (
              <div key={k} className="flex flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center rounded-md bg-[var(--panel-hi)]">
                  {!masked && (
                    <motion.div
                      className={cn("w-3/5 rounded-t", k === q ? "bg-focus" : "bg-gradient-to-t from-brand-500 to-cyan-400")}
                      initial={false}
                      animate={{ height: `${Math.max(row[k], 0.01) * 100}%` }}
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 20 }}
                    />
                  )}
                  {masked && <span className="mb-2 font-mono text-[0.65rem] text-miss">maska</span>}
                </div>
                <span className="font-mono text-[0.7rem] tabular-nums text-fg-subtle">{masked ? "—" : Math.round(row[k] * 100)}</span>
                <button
                  onClick={() => setQ(k)}
                  className={cn(
                    "w-full truncate rounded-[var(--radius-chip)] border px-1 py-1 font-mono text-xs md:text-sm",
                    k === q ? "border-focus bg-focus/15 text-focus" : "border-[var(--line)] text-fg-muted hover:text-fg",
                  )}
                  aria-pressed={k === q}
                  aria-label={`Zapytanie: ${label(t)}`}
                >
                  {label(t)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Callout className="mt-6 mb-2">
        <span className="text-fg">Zauważ:</span> w warstwie {head.layer + 1}, głowa {head.head + 1} {NOTE[head.kind]}
      </Callout>
      <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <div className="overflow-x-auto">
          <p className="font-mono text-sm">P = softmax(Q · Kᵀ / √d + maska)</p>
          <p className="mb-2 text-xs uppercase tracking-wider text-fg-subtle">ta sama macierz P co wyżej; wiersz = zapytanie, kolumna = klucz</p>
          <div className="grid w-max gap-px" style={{ gridTemplateColumns: `5.5rem repeat(${T}, 1.15rem)` }}>
            {head.w.map((r, i) => (
              <div key={i} className="contents">
                <button onClick={() => setQ(i)} className={cn("truncate pr-2 text-right font-mono text-[0.7rem]", i === q ? "text-focus" : "text-fg-subtle")}>
                  {label(data.tokens[i])}
                </button>
                {r.map((v, j) => (
                  <span
                    key={j}
                    className={cn("aspect-square rounded-[2px]", j > i ? "bg-miss/10" : "bg-cyan-400", i === q && "outline outline-1 outline-focus/70")}
                    style={j > i ? undefined : { opacity: 0.08 + 0.92 * Math.sqrt(v) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <ul className="space-y-2 text-sm text-fg-muted">
          <li>
            <span className="text-fg">Maska przyczynowa:</span> token widzi tylko siebie i tokeny wcześniejsze. Różowy trójkąt nad przekątną to tokeny późniejsze: ich wagi są zerowane, więc model uczy się przewidywać następny token bez podglądania.
          </li>
          <li>
            <span className="text-fg">Wiele głów:</span> model ma {data.layers} warstw po {data.headsPerLayer} głów. Każda ma własne macierze W_Q, W_K, W_V i uczy się innego wzorca: jedna patrzy na poprzedni token, inna na rzeczownik, do którego odnosi się bieżące słowo.
          </li>
          <li>
            Wagi w wierszu sumują się do 1 (softmax z iloczynów skalarnych Q·K podzielonych przez √d).
          </li>
        </ul>
      </div>
    </Panel>
  );
}
