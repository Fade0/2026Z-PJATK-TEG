"use client";

import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { useNarrow } from "@/lib/useMediaQuery";

type Tr = {
  corpus: string;
  chars: number;
  vocab: number;
  params: number;
  config: { layers: number; dim: number; heads: number; context: number; batch: number };
  uniformLoss: number;
  curve: { step: number; loss: number }[];
  samples: { step: number; text: string }[];
};
const data = raw.training as Tr;
const LAYOUT = {
  wide: { w: 1000, h: 380, pad: { l: 60, r: 20, t: 20, b: 48 }, font: 22 },
  narrow: { w: 560, h: 380, pad: { l: 50, r: 14, t: 20, b: 48 }, font: 24 },
};
const MAXSTEP = data.curve[data.curve.length - 1].step;
const YMAX = Math.ceil(data.uniformLoss);
const fmt = (n: number, d = 2) => n.toFixed(d).replace(".", ",");
// epoka = jedno przejście przez część treningową (90% tekstu)
const epoch = (step: number) => (step * data.config.batch * data.config.context) / (0.9 * data.chars);

/** Organizm: trening małego GPT na znakach: krzywa loss i próbka tekstu w wybranym kroku. Dane: scripts/llm_internals_data.py. */
export function TrainingViz() {
  const st = useStepper(data.samples.length, { autoplay: false });
  const i = st.step;
  const L = useNarrow() ? LAYOUT.narrow : LAYOUT.wide;
  const cur = data.samples[i];
  const X = (s: number) => L.pad.l + (s / MAXSTEP) * (L.w - L.pad.l - L.pad.r);
  const Y = (v: number) => L.pad.t + (1 - v / YMAX) * (L.h - L.pad.t - L.pad.b);
  const pts = data.curve.filter((p) => p.step <= cur.step);
  const path = pts.map((p, k) => `${k ? "L" : "M"}${X(p.step).toFixed(1)},${Y(p.loss).toFixed(1)}`).join(" ");
  const ghost = data.curve.map((p, k) => `${k ? "L" : "M"}${X(p.step).toFixed(1)},${Y(p.loss).toFixed(1)}`).join(" ");
  const loss = pts[pts.length - 1].loss;

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <StickySteps stepper={st} slider label={`krok ${cur.step} · epoka ${fmt(epoch(cur.step), 1)}`} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <svg viewBox={`0 0 ${L.w} ${L.h}`} className="h-auto w-full overflow-visible" role="img" aria-label={`Krzywa loss, krok ${cur.step}, loss ${fmt(loss)}`}>
            {Array.from({ length: YMAX + 1 }, (_, v) => (
              <g key={v}>
                <line x1={L.pad.l} x2={L.w - L.pad.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
                <text x={L.pad.l - 10} y={Y(v)} dy="0.35em" textAnchor="end" fontSize={L.font} fill="var(--color-fg-subtle)" className="font-mono">
                  {v}
                </text>
              </g>
            ))}
            <line x1={L.pad.l} x2={L.w - L.pad.r} y1={Y(data.uniformLoss)} y2={Y(data.uniformLoss)} stroke="var(--color-miss)" strokeDasharray="6 6" opacity={0.6} />
            <text x={L.w - L.pad.r} y={Y(data.uniformLoss) - 8} textAnchor="end" fontSize={L.font} fill="var(--color-miss)">
              losowe zgadywanie: ln {data.vocab} ≈ {fmt(data.uniformLoss)}
            </text>
            <path d={ghost} fill="none" stroke="var(--line-strong)" strokeWidth={2} />
            <path d={path} fill="none" stroke="var(--color-cyan-400)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={X(cur.step)} cy={Y(loss)} r={L.font / 2.2} fill="var(--color-focus)" style={{ transition: "cx .3s, cy .3s" }} />
            {[0, MAXSTEP / 2, MAXSTEP].map((s) => (
              <text key={s} x={X(s)} y={L.h - 12} textAnchor="middle" fontSize={L.font} fill="var(--color-fg-subtle)" className="font-mono">
                {s}
              </text>
            ))}
          </svg>
          <p className="mt-2 font-mono text-sm tabular-nums text-fg-muted">
            loss (walidacja): <span className="text-focus">{fmt(loss)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-fg-subtle">Próbka po {cur.step} krokach (prompt „Litwo! ”, T = 0,8)</p>
          <pre className="mt-3 min-h-40 whitespace-pre-wrap rounded-xl border border-[var(--line)] bg-ink-950 p-4 font-mono text-sm leading-relaxed text-fg">
            <span className="text-focus">Litwo! </span>
            {cur.text.slice("Litwo! ".length)}
          </pre>
        </div>
      </div>
      <p className="mt-6 text-sm text-fg-muted">
        Czerwona linia: model, który każdy z {data.vocab} znaków zgaduje z prawdopodobieństwem 1/{data.vocab}, ma entropię krzyżową −ln(1/{data.vocab}) = ln {data.vocab} ≈ {fmt(data.uniformLoss)}. Mniej więcej tyle wynosi loss na starcie; wszystko poniżej oznacza, że model nauczył się czegoś o tekście. Jeden krok to paczka {data.config.batch} fragmentów po {data.config.context} znaków; epoka to jedno przejście przez cały tekst treningowy. Po ok. 3000 krokach loss na walidacji zaczyna rosnąć, choć na danych treningowych dalej spada: model uczy się tekstu treningowego na pamięć (przeuczenie). Dlatego próbki z końca brzmią najlepiej, ale model gorzej przewiduje tekst, którego nie widział.
      </p>
      <p className="mt-2 font-mono text-[0.7rem] text-fg-subtle">
        Prawdziwy trening na CPU: {data.corpus}, {Math.round(data.chars / 1000)} tys. znaków, tokeny = znaki ({data.vocab}). Model: {data.config.layers} warstwy, wymiar {data.config.dim}, {data.config.heads} głów, kontekst {data.config.context}, {Math.round(data.params / 1000)} tys. parametrów. Loss = średnia entropia krzyżowa następnego znaku.
      </p>
    </Panel>
  );
}
