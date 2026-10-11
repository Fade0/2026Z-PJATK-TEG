"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Slider, ToggleGroup } from "radix-ui";
import data from "@/data/rag.json";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";

const GRID = data.chunking.grid as Record<string, number[][]>;
const TEXT = data.chunking.text;
const OVERLAPS = [0, 25, 50, 100];
const COLORS = ["var(--color-cat-1)", "var(--color-cat-2)", "var(--color-cat-4)"];
const tint = (i: number) => `color-mix(in oklab, ${COLORS[i % COLORS.length]} 50%, transparent)`;

// Overlap: tekst należy do dwóch chunków, więc tło dzieli się w poziomie: górna połowa w kolorze
// pierwszego chunku, dolna w kolorze drugiego. `clone` powtarza podział w każdej linii łamanego tekstu.
const overlapStyle = (a: number, b: number): React.CSSProperties => ({
  background: `linear-gradient(to bottom, ${tint(a)} 50%, ${tint(b)} 50%)`,
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
});

/**
 * Organizm: podział prawdziwego dokumentu na chunki dla wybranego rozmiaru i overlapu.
 * Granice policzone offline przez RecursiveCharacterTextSplitter (scripts/generate_rag_data.py).
 * Fragmenty wspólne dwóch chunków (overlap) mają tło w dwóch kolorach (góra/dół); chunki pojawiają się po kolei, jak przy cięciu.
 */
export function ChunkingViz() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [size, setSize] = useState(150);
  const [overlap, setOverlap] = useState(50);
  const spans = GRID[`${size}/${overlap}`] ?? GRID[`${size}/0`];

  // segmenty tekstu: dla każdego zakresu znaków lista chunków, które go zawierają
  const segments = useMemo(() => {
    const cuts = new Set([0, TEXT.length]);
    spans.forEach(([s, e]) => (cuts.add(s), cuts.add(e)));
    const pts = [...cuts].sort((a, b) => a - b);
    return pts.slice(0, -1).map((s, i) => {
      const e = pts[i + 1];
      const owners = spans.map(([a, b], j) => (a <= s && e <= b ? j : -1)).filter((j) => j >= 0);
      return { s, e, owners };
    });
  }, [spans]);

  return (
    <div ref={ref} className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex w-full max-w-sm items-center gap-4">
          <span className="w-36 shrink-0 font-mono text-sm text-focus">chunk_size={size}</span>
          <Slider.Root className="relative flex h-5 grow touch-none items-center" min={100} max={800} step={50} value={[size]} onValueChange={([v]) => setSize(v)}>
            <Slider.Track className="relative h-1 grow rounded-full bg-[var(--panel-hi)]">
              <Slider.Range className="absolute h-full rounded-full bg-focus" />
            </Slider.Track>
            <Slider.Thumb aria-label="chunk_size" className="block size-4 rounded-full border-2 border-focus bg-ink-950 outline-none" />
          </Slider.Root>
        </div>
        <ToggleGroup.Root type="single" value={String(overlap)} onValueChange={(v) => v && setOverlap(Number(v))} className="flex flex-wrap items-center gap-2" aria-label="chunk_overlap">
          <span className="mr-1 font-mono text-sm text-fg-subtle">overlap</span>
          {OVERLAPS.map((o) => (
            <ToggleGroup.Item
              key={o}
              value={String(o)}
              className="rounded-full border border-[var(--line-strong)] px-3 py-1 font-mono text-sm text-fg-muted transition-all hover:text-fg data-[state=on]:border-focus data-[state=on]:bg-focus/10 data-[state=on]:text-focus"
            >
              {o}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <Panel className="p-5 md:p-7">
          <p className="mb-3 text-xs uppercase tracking-wider text-fg-subtle">{data.chunking.title}</p>
          <p className="whitespace-pre-wrap text-[0.8rem] leading-7 sm:text-[0.95rem]">
            {segments.map((seg) => {
              const first = seg.owners[0] ?? -1;
              const both = seg.owners.length > 1;
              return (
                <motion.span
                  key={`${size}-${overlap}-${seg.s}`}
                  initial={reduce || !inView ? false : { opacity: 0.15 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: reduce ? 0 : Math.max(0, first) * 0.12 }}
                  className={cn("rounded-sm", both && "text-fg")}
                  style={both ? overlapStyle(seg.owners[0], seg.owners[1]) : first >= 0 ? { boxShadow: `inset 0 -2px 0 ${COLORS[first % COLORS.length]}`, background: `color-mix(in oklab, ${COLORS[first % COLORS.length]} 12%, transparent)` } : undefined}
                >
                  {TEXT.slice(seg.s, seg.e)}
                </motion.span>
              );
            })}
          </p>
        </Panel>

        <Panel className="p-5">
          <p className="text-xs uppercase tracking-wider text-fg-subtle">chunki: {spans.length}</p>
          <ol className="mt-4 space-y-2">
            {spans.map(([s, e], i) => (
              <li key={`${size}-${overlap}-${i}`} className="flex items-center gap-3 font-mono text-xs tabular-nums">
                <span className="w-5 text-fg-subtle">{i + 1}</span>
                <div className="h-2.5 grow rounded-full bg-[var(--panel-hi)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${((e - s) / 800) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20, delay: reduce ? 0 : i * 0.06 }}
                  />
                </div>
                <span className="w-10 text-right text-fg-muted">{e - s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 font-mono text-[0.7rem] text-fg-subtle">
            długość w znakach (skala do 800) · <span className="rounded-sm px-1 text-fg" style={overlapStyle(0, 1)}>tekst w dwóch chunkach</span> = overlap (góra: kolor poprzedniego chunku, dół: następnego)
          </p>
        </Panel>
      </div>
      <p className="font-mono text-[0.7rem] text-fg-subtle">RecursiveCharacterTextSplitter: cięcie po akapitach, potem liniach i spacjach; overlap pojawia się tylko wtedy, gdy akapit trzeba przeciąć</p>
    </div>
  );
}
