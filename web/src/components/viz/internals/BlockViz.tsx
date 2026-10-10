"use client";

import { ArrowDown } from "lucide-react";
import raw from "@/data/llm-internals.json";
import { Panel } from "@/components/ui/Panel";
import { StickySteps } from "@/components/molecules/StickySteps";
import { useStepper } from "@/lib/useStepper";
import { cn } from "@/lib/cn";

const d = (raw.gpt2 as { d: number }).d;

// kolejne elementy bloku; `add` = dodanie do strumienia (połączenie residualne)
const PARTS: { name: string; sub?: string; color?: string; add?: boolean; text: string }[] = [
  { name: "wejście x", sub: `${d} liczb na token`, text: "Stan każdego tokenu po poprzednim bloku (w pierwszym bloku: embedding z pozycją)." },
  { name: "LayerNorm", text: "Normalizacja: liczby w wektorze tokenu sprowadza się do średniej 0 i wariancji 1, potem skaluje wyuczonymi wagami. Dzięki temu wartości nie rosną z warstwy na warstwę i trening jest stabilny." },
  { name: "atencja", sub: "wiele głów", color: "border-cat-1/50 text-cat-1", text: "Jedyny element, w którym tokeny wymieniają informacje (poprzednia sekcja)." },
  { name: "x + atencja", add: true, text: "Połączenie residualne: wynik atencji dodaje się do x, nie zastępuje go. Informacja z wejścia przechodzi dalej bez zmian, a warstwa dopisuje tylko poprawkę." },
  { name: "LayerNorm", text: "Druga normalizacja, przed MLP." },
  { name: "MLP", sub: `${d} → ${4 * d} → ${d}, GELU`, color: "border-cat-2/50 text-cat-2", text: "Dwie warstwy liniowe z nieliniowością pomiędzy, osobno dla każdego tokenu. Tu leży około 2/3 parametrów modelu; badania traktują MLP jako pamięć faktów (np. „Eiffel Tower → Paris”)." },
  { name: "x + MLP", add: true, text: "Drugie połączenie residualne. Wynik idzie do następnego bloku, który ma identyczną budowę, ale inne wagi." },
];

const LAYERS = [
  { when: "Niższe warstwy", what: "forma i części mowy", ex: "„located” to czasownik w formie imiesłowu, „ E” + „iff” + „el” to jedno słowo" },
  { when: "Środkowe warstwy", what: "składnia i relacje", ex: "„of” łączy się z „the city”; „is located” odnosi się do „Tower”" },
  { when: "Wyższe warstwy", what: "znaczenie i wiedza", ex: "„Eiffel Tower” to obiekt w Paryżu; pytanie dotyczy nazwy miasta" },
];

/** Organizm: budowa jednego bloku transformera krok po kroku (LayerNorm, atencja, residual, MLP) i specjalizacja warstw. */
export function BlockViz() {
  const st = useStepper(PARTS.length, { autoplay: false });
  const s = st.step;
  return (
    <Panel className="p-4 sm:p-6 md:p-8">
      <StickySteps stepper={st} label={PARTS[s].name} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_1fr] lg:items-start">
        <ol className="relative flex flex-col items-stretch gap-1 border-l-2 border-dashed border-[var(--line-strong)] pl-4" aria-label="Elementy bloku">
          {PARTS.map((p, i) => (
            <li key={i} className="flex flex-col items-center">
              {i > 0 && <ArrowDown aria-hidden className={cn("mb-1 size-3.5", i <= s ? "text-focus" : "text-fg-subtle")} />}
              <button
                type="button"
                onClick={() => st.go(i)}
                aria-current={i === s ? "step" : undefined}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-center text-sm transition-colors",
                  p.add ? "rounded-full" : "",
                  i === s ? "border-focus bg-focus/10 text-focus" : p.color ?? "border-[var(--line)] text-fg-muted",
                  i > s && "opacity-40",
                )}
              >
                {p.add ? "⊕ " : ""}
                {p.name}
                {p.sub && <span className="block font-mono text-[0.7rem] text-fg-subtle">{p.sub}</span>}
              </button>
            </li>
          ))}
        </ol>
        <div>
          <p className="text-lg">{PARTS[s].name}</p>
          <p className="mt-2 text-fg-muted">{PARTS[s].text}</p>
          <p className="mt-6 text-sm text-fg-subtle">Przerywana linia po lewej to strumień residualny: omija atencję i MLP, a ich wyniki są do niego dodawane w punktach ⊕.</p>
        </div>
      </div>

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        <p className="text-xs uppercase tracking-wider text-fg-subtle">Bloki mają tę samą budowę, ale uczą się różnych rzeczy</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {LAYERS.map((l, i) => (
            <div key={l.when} className="rounded-xl border border-[var(--line)] p-4">
              <p className="font-mono text-xs text-brand-300">{String(i + 1).padStart(2, "0")} · {l.when}</p>
              <p className="mt-2 font-medium">{l.what}</p>
              <p className="mt-1 text-sm text-fg-muted">{l.ex}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-fg-muted">
          Tak wyszło w badaniach modelu BERT z 2019 r.: proste klasyfikatory odczytywały części mowy najlepiej z niższych warstw, strukturę zdania ze środkowych, a odniesienia zaimków i role semantyczne z wyższych. Podział nie jest ostry, ale kierunek od formy do znaczenia powtarza się też w modelach typu GPT.
        </p>
      </div>
    </Panel>
  );
}
