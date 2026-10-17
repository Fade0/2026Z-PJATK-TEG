import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { PROJECT_TOPICS } from "@/content/course";

/** Molekuła: lista zagadnień projektu z linkiem do pełnych zasad (/projekt/). */
export function ProjectTopics() {
  return (
    <Panel className="p-6">
      <p className="text-xs uppercase tracking-wider text-fg-subtle">12 zagadnień · w projekcie min. 8 (w trójce 10)</p>
      <ol className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {PROJECT_TOPICS.map((t, i) => (
          <li key={t} className="grid grid-cols-[1.75rem_1fr] items-baseline text-fg-muted">
            <span className="font-mono text-sm tabular-nums text-brand-300">{String(i + 1).padStart(2, "0")}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <Link href="/projekt/" className="group inline-flex items-center gap-2 text-sm font-medium text-brand-300 hover:text-fg">
          Zasady i przykładowe projekty <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Panel>
  );
}
