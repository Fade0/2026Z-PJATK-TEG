"use client";

import { StepControls } from "@/components/molecules/StepControls";
import type { Stepper } from "@/lib/useStepper";
import { cn } from "@/lib/cn";

/**
 * Molekuła: StepControls przyklejone pod nawigacją, dopóki widać panel animacji.
 * Dla wysokich animacji: przyciski i opis kroku zostają w kadrze przy przewijaniu.
 * Opis kroku ma stałą wysokość dwóch linii, żeby pasek nie skakał. Bez backdrop-filter (patrz Panel): tło nieprzezroczyste.
 */
export function StickySteps({ stepper, label, slider, className }: { stepper: Stepper; label?: React.ReactNode; slider?: boolean; className?: string }) {
  return (
    <div ref={stepper.ref} className={cn("sticky top-[5.5rem] z-20 -mx-2 rounded-xl [&_p[aria-live]]:flex [&_p[aria-live]]:min-h-8 [&_p[aria-live]]:items-center [&_p[aria-live]]:gap-1.5 border border-[var(--line)] bg-ink-900 px-2 py-2 sm:-mx-3 sm:px-3", className)}>
      <StepControls stepper={stepper} label={label != null && <span className="text-brand-300">{label}</span>} slider={slider} />
    </div>
  );
}
