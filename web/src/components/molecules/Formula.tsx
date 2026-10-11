import { Panel } from "@/components/ui/Panel";
import { Tex } from "@/components/ui/Tex";

/**
 * Molekuła: wzór w panelu, pod nim objaśnienie symboli (symbol w LaTeX-u → opis).
 */
export function Formula({ tex, legend = [], title }: { tex: string; legend?: [string, string][]; title?: string }) {
  return (
    <Panel className="p-5 md:p-6">
      {title && <p className="mb-2 text-xs uppercase tracking-wider text-fg-subtle">{title}</p>}
      <Tex tex={tex} display className="text-lg text-fg md:text-xl" />
      {legend.length > 0 && (
        <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-[var(--line)] pt-4 text-sm text-fg-muted sm:grid-cols-[auto_1fr]">
          {legend.map(([sym, text]) => (
            <div key={sym} className="contents">
              <dt className="text-fg">
                <Tex tex={sym} />
              </dt>
              <dd className="mb-1 sm:mb-0">{text}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}
