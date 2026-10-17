"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Etapy schematu; `lit` w props to indeks z tej listy (bloki: BLOCK0 … BLOCK0 + 3). */
export const STAGES = ["tekst", "tokenizacja", "embedding", "blok 1", "blok 2", "blok …", "blok N", "wyjście", "token"] as const;
export const BLOCK0 = 3;

function Box({ lit, href, className, children }: { lit?: boolean; href?: string; className?: string; children: React.ReactNode }) {
  const cls = cn(
    "flex shrink-0 flex-col justify-center rounded-xl border px-3 py-2.5 text-center text-sm transition-[border-color,background-color,box-shadow] duration-300",
    lit ? "border-focus bg-focus/10 text-fg shadow-[0_0_24px_-4px_var(--color-focus)]" : "border-[var(--line)] bg-[var(--panel)] text-fg-muted",
    href && "hover:border-brand-400 hover:text-fg",
    className,
  );
  return href ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <div className={cls}>{children}</div>
  );
}

function Arrow({ lit }: { lit?: boolean }) {
  return <ArrowRight aria-hidden className={cn("size-4 shrink-0 rotate-90 self-center transition-colors xl:rotate-0", lit ? "text-focus" : "text-fg-subtle")} />;
}

function Block({ n, lit, moe, links }: { n: string; lit: boolean; moe?: boolean; links?: boolean }) {
  const part = (label: string, href: string, color: string) =>
    links ? (
      <a href={href} className={cn("rounded-md border px-2 py-1 text-xs hover:text-fg", color)}>
        {label}
      </a>
    ) : (
      <span className={cn("rounded-md border px-2 py-1 text-xs", color)}>{label}</span>
    );
  return (
    <Box lit={lit} className="min-w-[7.5rem] gap-1.5">
      <span className="font-mono text-[0.7rem] uppercase tracking-wider text-fg-subtle">{n}</span>
      {part("atencja", "#atencja", "border-cat-1/40 text-cat-1")}
      {moe ? (
        <span className="rounded-md border border-hit/40 px-1.5 py-1 text-xs text-hit">
          router
          <span className="mt-1 grid grid-cols-4 gap-0.5">
            {[0, 1, 2, 3].map((e) => (
              <i key={e} className={cn("h-2 rounded-sm", e === 1 || e === 2 ? "bg-hit" : "bg-hit/20")} />
            ))}
          </span>
        </span>
      ) : (
        part("MLP", "#blok", "border-cat-2/40 text-cat-2")
      )}
    </Box>
  );
}

/**
 * Molekuła: schemat modelu dekodera od tekstu do następnego tokenu.
 * `lit`: podświetlony etap (indeks w STAGES) albo -1; `links`: etapy prowadzą do sekcji strony; `moe`: eksperci zamiast MLP.
 */
export function NetworkDiagram({
  lit = -1,
  links,
  moe,
  input = "The Eiffel Tower is located in the city of",
  output = "Paris",
}: {
  lit?: number;
  links?: boolean;
  moe?: boolean;
  input?: React.ReactNode;
  output?: React.ReactNode;
}) {
  const at = (i: number) => lit === i;
  const h = (id: string) => (links ? `#${id}` : undefined);
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex flex-col items-stretch gap-2 xl:w-max xl:flex-row xl:items-stretch">
        <Box lit={at(0)} className="font-mono text-xs xl:max-w-[12rem]">
          {input}
        </Box>
        <Arrow lit={lit > 0} />
        <Box lit={at(1)} href={h("tokenizacja")}>
          Tokenizacja
          <span className="text-xs text-fg-subtle">tekst → ID</span>
        </Box>
        <Arrow lit={lit > 1} />
        <Box lit={at(2)} href={h("pozycja")}>
          Embedding
          <span className="text-xs text-fg-subtle">+ pozycja</span>
        </Box>
        <Arrow lit={lit > 2} />
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-[var(--line-strong)] p-2 xl:flex xl:flex-row">
          {["blok 1", "blok 2", "⋯", "blok N"].map((n, i) =>
            n === "⋯" ? (
              <span
                key={n}
                className={cn(
                  "grid place-items-center self-stretch rounded-xl border px-2 py-1 font-mono text-lg transition-[border-color,background-color,box-shadow] duration-300",
                  at(BLOCK0 + i) ? "border-focus bg-focus/10 text-focus shadow-[0_0_24px_-4px_var(--color-focus)]" : "border-transparent text-fg-subtle",
                )}
              >
                ⋯
              </span>
            ) : (
              <Block key={n} n={n} lit={at(BLOCK0 + i)} moe={moe} links={links} />
            ),
          )}
        </div>
        <Arrow lit={lit > BLOCK0 + 3} />
        <Box lit={at(BLOCK0 + 4)} href={h("generowanie")}>
          Warstwa wyjściowa
          <span className="text-xs text-fg-subtle">logity → softmax</span>
        </Box>
        <Arrow lit={lit > BLOCK0 + 4} />
        <Box lit={at(BLOCK0 + 5)} className="min-w-16 font-mono">
          {output}
        </Box>
      </div>
    </div>
  );
}
