import { Panel } from "@/components/ui/Panel";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/cn";

// Przykład do policzenia na tablicy: trzy krótkie dokumenty i pytanie „urlop na żądanie”.
// Wartości liczone w kodzie z tych tekstów (tf = liczba wystąpień, idf = ln(N / df)).
const DOCS = [
  { id: "d1", text: "urlop wypoczynkowy to 26 dni w roku" },
  { id: "d2", text: "urlop na żądanie to 4 dni, wniosek o urlop w dniu nieobecności" },
  { id: "d3", text: "wymiana laptopa co 3 lata" },
];
const QUERY = "urlop na żądanie";
const STOP = new Set(["na", "to", "w", "o", "co"]);

const tokens = (s: string) => (s.toLowerCase().match(/[\p{L}\d]+/gu) ?? []).filter((w) => !STOP.has(w));
const TERMS = tokens(QUERY);
const DOC_TOKENS = DOCS.map((d) => tokens(d.text));
const N = DOCS.length;
const DF = TERMS.map((t) => DOC_TOKENS.filter((dt) => dt.includes(t)).length);
const IDF = DF.map((df) => (df ? Math.log(N / df) : 0));
const ROWS = DOCS.map((d, i) => {
  const tf = TERMS.map((t) => DOC_TOKENS[i].filter((w) => w === t).length);
  return { ...d, tf, score: tf.reduce((s, x, j) => s + x * IDF[j], 0) };
});
const BEST = Math.max(...ROWS.map((r) => r.score));

/** Organizm: TF-IDF policzony krok po kroku dla trzech dokumentów i jednego pytania. */
export function TfIdfViz() {
  return (
    <Panel className="overflow-x-auto p-5 md:p-6">
      <p className="text-xs uppercase tracking-wider text-fg-subtle">
        pytanie: <span className="font-mono normal-case text-fg">„{QUERY}”</span> · „na” to stop-słowo · N = {N}
      </p>
      <table className="mt-4 w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-fg-subtle">
            <th className="py-2 pr-4 font-normal">dokument</th>
            {TERMS.map((t) => (
              <th key={t} className="px-3 py-2 text-right font-normal">
                <Tex tex={`\\mathrm{tf}(\\text{${t}})`} />
              </th>
            ))}
            <th className="py-2 pl-3 text-right font-normal">
              <Tex tex="\textstyle\sum \mathrm{tf}\cdot\mathrm{idf}" />
            </th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {ROWS.map((r) => (
            <tr key={r.id} className="border-b border-[var(--line)]">
              <td className="py-2.5 pr-4 font-sans text-fg-muted">
                <span className="mr-2 font-mono text-fg-subtle">{r.id}</span>
                {r.text}
              </td>
              {r.tf.map((x, j) => (
                <td key={j} className={cn("px-3 py-2.5 text-right tabular-nums", x ? "text-fg" : "text-fg-subtle")}>
                  {x}
                </td>
              ))}
              <td className={cn("py-2.5 pl-3 text-right tabular-nums", r.score === BEST ? "text-hit" : "text-fg-muted")}>{r.score.toFixed(3)}</td>
            </tr>
          ))}
          <tr className="text-fg-subtle">
            <td className="py-2.5 pr-4 font-sans">
              <Tex tex="\mathrm{df}" /> → <Tex tex="\mathrm{idf} = \ln(N/\mathrm{df})" />
            </td>
            {TERMS.map((t, j) => (
              <td key={t} className="px-3 py-2.5 text-right tabular-nums text-focus">
                {DF[j]} → {IDF[j].toFixed(3)}
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
      <p className="mt-4 text-sm text-fg-muted">
        „urlop” jest w dwóch dokumentach, więc waży mało; „żądanie” tylko w jednym, więc waży prawie trzy razy więcej. d2 wygrywa, choć „urlop” liczy się w nim dwa razy: w TF-IDF każde powtórzenie dodaje tyle samo.
      </p>
    </Panel>
  );
}
