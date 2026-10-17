"use client";

import { useState } from "react";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";

const data = raw.gpt2 as { tokens: string[]; ids: number[]; emb: number[][]; emb8: number[][]; ropePairs: number[]; d: number };
// para i obraca się o kąt pozycja · θ_i, θ_i = 10000^(−2i/d)
const theta = (i: number) => Math.pow(10000, (-2 * i) / data.d);
const THETA = data.ropePairs.map(theta);
const R = 62;
const fmt = (x: number, n = 2) => x.toFixed(n).replace(".", ",").replace(/^-/, "−");
const label = (t: string) => t.replace(/ /g, "·");

function Dial({ x, y, a, i }: { x: number; y: number; a: number; i: number }) {
  const s = R / Math.max(Math.hypot(x, y), 1e-6);
  const xr = x * Math.cos(a) - y * Math.sin(a);
  const yr = x * Math.sin(a) + y * Math.cos(a);
  const P = (u: number, v: number) => [100 + u * s, 100 - v * s];
  const [x0, y0] = P(x, y);
  const [x1, y1] = P(xr, yr);
  return (
    <figure className="text-center">
      <svg viewBox="0 0 200 200" className="mx-auto h-auto w-full max-w-40" role="img" aria-label={`Para ${i + 1}: obrót o ${fmt((a * 180) / Math.PI, 0)} stopni`}>
        <circle cx={100} cy={100} r={R} fill="none" stroke="var(--line-strong)" />
        <line x1={100} y1={100} x2={x0} y2={y0} stroke="var(--color-fg-subtle)" strokeWidth={3} strokeDasharray="4 4" />
        <line x1={100} y1={100} x2={x1} y2={y1} stroke="var(--color-focus)" strokeWidth={4} strokeLinecap="round" style={{ transition: "all .25s" }} />
        <circle cx={x1} cy={y1} r={6} fill="var(--color-focus)" style={{ transition: "all .25s" }} />
      </svg>
      <figcaption className="font-mono text-xs text-fg-muted">
        para {data.ropePairs[i] + 1}: θ = {fmt(THETA[i], 3)}
      </figcaption>
    </figure>
  );
}

/** Organizm: RoPE na wektorze tokenu z przykładu (pozycja = miejsce w zdaniu): 4 pary liczb, kąt = pozycja · θ, wzory z cos i sin. Dane: scripts/llm_internals_data.py. */
export function RopeViz() {
  const [tok, setTok] = useState(data.tokens.indexOf(" Tower"));
  const pos = tok;
  const v = data.emb[tok];
  const rows = THETA.map((th, i) => {
    const [x, y] = [v[2 * i], v[2 * i + 1]];
    const a = pos * th;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return { x, y, a, c, s, xr: x * c - y * s, yr: x * s + y * c };
  });

  const v8 = data.emb8[tok];
  const rot8 = v8.map((_, k) => {
    const i = k >> 1;
    const a = pos * theta(i);
    const [x, y] = [v8[2 * i], v8[2 * i + 1]];
    return k % 2 ? x * Math.sin(a) + y * Math.cos(a) : x * Math.cos(a) - y * Math.sin(a);
  });

  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <p className="text-xs uppercase tracking-wider text-fg-subtle">Token ze zdania; jego pozycja m to numer w zdaniu, licząc od 0</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.tokens.map((t, i) => (
          <button
            key={i}
            onClick={() => setTok(i)}
            aria-pressed={i === tok}
            className={cn("rounded-[var(--radius-chip)] border px-2 py-1 font-mono text-sm whitespace-pre", i === tok ? "border-focus bg-focus/15 text-focus" : "border-[var(--line)] text-fg-muted hover:text-fg")}
          >
            {label(t)}
            <sub className="ml-1 text-fg-subtle">{i}</sub>
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs uppercase tracking-wider text-fg-subtle">
        Obrót o kąt m · θ dla m = {pos}: 4 z {data.d / 2} par (przerywana linia: przed obrotem)
      </p>
      <div className="mt-3 grid grid-cols-2 items-center gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        {rows.map((r, i) => (
          <Dial key={i} x={r.x} y={r.y} a={r.a} i={i} />
        ))}
        <span className="col-span-2 text-center font-mono text-2xl text-fg-subtle md:col-span-1">…</span>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[34rem] font-mono text-sm tabular-nums">
          <thead className="text-left text-xs text-fg-subtle">
            <tr>
              <th className="py-1 font-normal">para (z {data.d / 2})</th>
              <th className="font-normal">(x, y) bez pozycji</th>
              <th className="font-normal">kąt m·θ</th>
              <th className="font-normal">cos, sin</th>
              <th className="font-normal text-focus">(x cos − y sin, x sin + y cos)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--line)]">
                <td className="py-1.5 text-fg-subtle">{data.ropePairs[i] + 1}</td>
                <td>
                  ({fmt(r.x)}, {fmt(r.y)})
                </td>
                <td>{fmt(r.a)} rad</td>
                <td className="text-fg-muted">
                  {fmt(r.c)}, {fmt(r.s)}
                </td>
                <td className="text-focus">
                  ({fmt(r.xr)}, {fmt(r.yr)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-2 overflow-x-auto font-mono text-sm tabular-nums">
        <p className="text-xs uppercase tracking-wider text-fg-subtle">Pierwsze 8 z {data.d} liczb wektora „{label(data.tokens[tok])}”</p>
        <p className="whitespace-nowrap">
          <span className="inline-block w-24 text-fg-subtle">bez pozycji</span>[{v8.map((x) => fmt(x)).join("; ")}; …]
        </p>
        <p className="whitespace-nowrap text-focus">
          <span className="inline-block w-24 text-fg-subtle">po obrocie</span>[{rot8.map((x) => fmt(x)).join("; ")}; …]
        </p>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-fg-muted">
        <li>
          Wektor ma {data.d} liczb, czyli {data.d / 2} par. Każda para obraca się z inną prędkością θ: pierwsze pary szybko (rozróżniają sąsiednie pozycje), ostatnie bardzo wolno (rozróżniają dalekie). Tarcze i tabela pokazują 4 pary z różnych miejsc wektora, a wiersze niżej pierwsze 8 liczb, czyli pary 1–4.
        </li>
        <li>Obrót nie zmienia długości wektora, tylko jego kierunek. Gdy dwa tokeny przesuną się o tyle samo, oba obrócą się o ten sam kąt, więc ich iloczyn skalarny zależy tylko od odległości między nimi.</li>
        <li>W modelu obraca się wektory zapytań i kluczy w atencji (o nich w następnej sekcji), tu dla czytelności obrót jest pokazany na embeddingu. GPT-2 jest starszy i zamiast obrotu dodaje wyuczony wektor pozycji; RoPE stosują Llama, Qwen, Gemma i większość nowych modeli.</li>
      </ul>
    </Panel>
  );
}
