"use client";

import { motion, useReducedMotion } from "motion/react";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { cn } from "@/lib/cn";

type Num = number | null;
type Qkv = { layer: number; head: number; d: number; dh: number; heads: number } & Record<"X" | "Wq" | "Wk" | "Wv" | "Q" | "K" | "V" | "S" | "P" | "O", Num[][]>;
const g = raw.gpt2 as unknown as { tokens: string[]; qkv: Qkv };
const q = g.qkv;
const T = g.tokens.length;
const tl = (t: string) => t.replace(/ /g, "·");

type Kind = "input" | "weight" | "out";
const KIND: Record<Kind, string> = {
  input: "border-brand-400/60",
  weight: "border-hit/60 border-dashed",
  out: "border-focus/60",
};

/** Mała macierz jako mapa ciepła; dodatnie niebieskie, ujemne różowe, null = zamaskowane. */
function Mat({ m, rows, more, prob }: { m: Num[][]; rows?: boolean; more?: boolean; prob?: boolean }) {
  const max = prob ? 1 : Math.max(...m.flat().map((v) => Math.abs(v ?? 0)), 1e-6);
  const cols = m[0].length;
  return (
    <div className="grid max-w-full gap-px" style={{ gridTemplateColumns: `${rows ? "3.8rem " : ""}repeat(${cols}, minmax(0, 0.95rem))${more ? " 0.8rem" : ""}` }}>
      {m.map((r, i) => (
        <div key={i} className="contents">
          {rows && <span className="truncate pr-1 text-right font-mono text-[0.65rem] leading-none self-center text-fg-subtle">{tl(g.tokens[i])}</span>}
          {r.map((v, j) => (
            <span
              key={j}
              title={v == null ? "maska" : String(v)}
              className={cn("aspect-square rounded-[2px]", v == null ? "bg-miss/15" : (v ?? 0) >= 0 ? "bg-cyan-400" : "bg-cat-4")}
              style={v == null ? undefined : { opacity: 0.1 + 0.9 * Math.sqrt(Math.abs(v) / max) }}
            />
          ))}
          {more && <span className="text-center font-mono text-[0.65rem] leading-none self-center text-fg-subtle">…</span>}
        </div>
      ))}
    </div>
  );
}

function Card({ show, now, kind, title, shape, children }: { show: boolean; now: boolean; kind: Kind; title: React.ReactNode; shape: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0.12 }}
      transition={reduce ? { duration: 0 } : { duration: 0.35 }}
      className={cn("min-w-0 rounded-xl border p-3", KIND[kind], now && "shadow-[0_0_24px_-6px_var(--color-focus)]")}
    >
      <p className="font-mono text-sm text-fg">{title}</p>
      <p className="mb-2 font-mono text-[0.7rem] text-fg-subtle">{shape}</p>
      <div className="min-w-0">{children}</div>
    </motion.div>
  );
}

const STEPS = [
  "X: stan tokenów na wejściu warstwy, wiersz na token. Zależy od tekstu.",
  "W_Q, W_K, W_V: wagi z treningu. Te same dla każdego tekstu.",
  "Q = X·W_Q, K = X·W_K, V = X·W_V: każdy token dostaje zapytanie, klucz i wartość.",
  "S = Q·Kᵀ / √d: podobieństwo zapytania każdego tokenu do kluczy wszystkich tokenów.",
  "P = softmax(S) w każdym wierszu; przyszłe tokeny zamaskowane.",
  "O = P·V: każdy token dostaje średnią wartości ważoną przez P.",
];

/** Organizm: atencja jednej głowy GPT-2 krok po kroku: X, wagi W, Q/K/V, wyniki, softmax, suma ważona. Dane: scripts/llm_internals_data.py. */
export function QkvViz() {
  const st = useStepper(STEPS.length, { autoplay: false });
  const s = st.step;
  const sh = (i: number) => s >= i;
  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <StickySteps stepper={st} label={STEPS[s]} />
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-fg-muted">
        <span className="flex items-center gap-2">
          <i className="h-3 w-5 rounded border border-brand-400/60" /> zależy od tekstu
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-5 rounded border border-dashed border-hit/60" /> stałe, wyuczone w treningu
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-5 rounded border border-focus/60" /> wynik obliczeń
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card show={sh(0)} now={s === 0} kind="input" title="X" shape={`${T} × ${q.d}`}>
          <Mat m={q.X} rows more />
        </Card>
        <Card show={sh(1)} now={s === 1} kind="weight" title="W_Q, W_K, W_V" shape={`każda ${q.d} × ${q.dh}`}>
          <div className="flex flex-wrap gap-4">
            {(["Wq", "Wk", "Wv"] as const).map((k) => (
              <div key={k}>
                <p className="mb-1 font-mono text-xs text-hit">W_{k[1].toUpperCase()}</p>
                <Mat m={q[k]} more />
                <p className="font-mono text-[0.65rem] text-fg-subtle">⋮</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {(
          [
            ["Q", "zapytanie (query): czego ten token szuka we wcześniejszych tokenach"],
            ["K", "klucz (key): po czym inne tokeny mogą go znaleźć"],
            ["V", "wartość (value): co przekaże, gdy zostanie wybrany"],
          ] as const
        ).map(([k, d]) => (
          <Card key={k} show={sh(2)} now={s === 2} kind="out" title={`${k} = X · W_${k}`} shape={`${T} × ${q.dh}`}>
            <Mat m={q[k]} rows more />
            <p className="mt-2 text-xs text-fg-muted">{d}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card show={sh(3)} now={s === 3} kind="out" title={`S = Q · Kᵀ / √${q.dh}`} shape={`${T} × ${T}`}>
          <Mat m={q.S} rows />
        </Card>
        <Card show={sh(4)} now={s === 4} kind="out" title="P = softmax(S)" shape="każdy wiersz sumuje się do 1">
          <Mat m={q.P.map((r, i) => r.map((v, j) => (j > i ? null : v)))} rows prob />
        </Card>
        <Card show={sh(5)} now={s === 5} kind="out" title="O = P · V" shape={`${T} × ${q.dh}`}>
          <Mat m={q.O} rows more />
        </Card>
      </div>

      <p className="mt-6 text-sm text-fg-muted">
        To jedna głowa: warstwa {q.layer + 1}, głowa {q.head + 1}. Warstwa ma {q.heads} takich głów, każda z własnymi W_Q, W_K, W_V. Ich wyniki O ({q.heads} × {q.dh} = {q.d} liczb na token) skleja się i mnoży przez kolejną wyuczoną macierz W_O. Wynik dodaje się do stanu tokenu. Kolory: niebieski = dodatnie, różowy = ujemne, jasność = wartość bezwzględna; pokazany jest tylko fragment kolumn.
      </p>
    </Panel>
  );
}
