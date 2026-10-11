import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/cn";

/**
 * Atom: wzór w LaTeX-u, renderowany przez KaTeX do HTML w czasie builda (bez JS w przeglądarce).
 * `display` — wzór w osobnym wierszu, wyśrodkowany; bez niego wzór w linii tekstu.
 */
export function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: display, throwOnError: true, output: "html" });
  return <span className={cn(display && "block overflow-x-auto overflow-y-hidden py-1", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
