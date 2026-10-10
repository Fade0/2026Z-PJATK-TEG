"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ToggleGroup } from "radix-ui";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";

// Liczby z model card Gemma 4 (ai.google.dev/gemma/docs/core/model_card_4).
const MODELS = {
  E2B: { eff: 2.3, total: 5.1, layers: 35 },
  E4B: { eff: 4.5, total: 8, layers: 42 },
} as const;
type M = keyof typeof MODELS;
const ROWS = 6;

function Toggle<T extends string>({ value, set, items, label }: { value: T; set: (v: T) => void; items: [T, string][]; label: string }) {
  return (
    <ToggleGroup.Root type="single" value={value} onValueChange={(v) => v && set(v as T)} aria-label={label} className="flex w-fit flex-wrap gap-1.5 rounded-xl border border-[var(--line)] p-1">
      {items.map(([v, l]) => (
        <ToggleGroup.Item key={v} value={v} className="rounded-lg px-3 py-1.5 text-sm text-fg-muted data-[state=on]:bg-brand-500 data-[state=on]:text-white">
          {l}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

function Ple() {
  const [m, setM] = useState<M>("E4B");
  const [off, setOff] = useState<"in" | "out">("in");
  const reduce = useReducedMotion();
  const x = MODELS[m];
  const inAcc = off === "in" ? x.total : x.eff;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 20 };
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Toggle value={m} set={setM} items={[["E2B", "E2B"], ["E4B", "E4B"]]} label="Model" />
        <Toggle value={off} set={setOff} items={[["in", "wszystko na akceleratorze"], ["out", "tabele PLE poza akceleratorem"]]} label="Gdzie leżą tabele PLE" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_14rem]">
        <div className="rounded-xl border border-brand-500/40 p-3">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-brand-300">akcelerator (GPU / NPU)</p>
          <ul className="space-y-1.5">
            {Array.from({ length: ROWS }, (_, i) => {
              const n = i === ROWS - 1 ? x.layers : i === ROWS - 2 ? "…" : i + 1;
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-8 text-right font-mono text-xs tabular-nums text-fg-subtle">{n}</span>
                  <span className="flex-1 rounded-md border border-cat-1/40 px-2 py-1 text-xs text-cat-1">warstwa: atencja + MLP</span>
                  <span className="text-fg-subtle">+</span>
                  <motion.span layout={!reduce} transition={spring} className={cn("w-20 shrink-0 rounded-md border px-2 py-1 text-center font-mono text-xs", off === "in" ? "border-focus/50 bg-focus/10 text-focus" : "border-dashed border-focus/50 text-focus/80")}>
                    PLE[{n}]
                  </motion.span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={cn("flex flex-col justify-center rounded-xl border p-3 transition-colors", off === "out" ? "border-focus/50 bg-focus/5" : "border-[var(--line)] opacity-50")}>
          <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">pamięć RAM / szybki dysk</p>
          <p className="mt-2 text-sm text-fg-muted">
            {off === "out" ? "Tabele PLE: dla każdego tokenu odczytuje się mały wektor na każdą warstwę i dosyła do akceleratora." : "Nieużywana."}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex justify-between text-xs text-fg-subtle">
          <span>Parametry w pamięci akceleratora</span>
          <span className="font-mono tabular-nums">
            <span className="text-focus">{inAcc.toString().replace(".", ",")} mld</span> / {x.total.toString().replace(".", ",")} mld
          </span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full bg-[var(--panel-hi)]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" initial={false} animate={{ width: `${(inAcc / x.total) * 100}%` }} transition={spring} />
        </div>
      </div>
    </div>
  );
}

/** Organizm: modele Gemma „E”: tabele Per-Layer Embeddings na akceleratorze albo poza nim. */
export function GemmaEViz() {
  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <Ple />
      <p className="mt-6 font-mono text-[0.7rem] text-fg-subtle">Liczby parametrów: model card Gemma 4. Schemat warstw uproszczony: pokazano 6 z {MODELS.E4B.layers} warstw.</p>
    </Panel>
  );
}
