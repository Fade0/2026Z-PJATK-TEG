import { COURSE } from "@/content/course";

/** Organizm: stopka z nazwą kursu, wspólna dla wszystkich stron (renderowana w layout.tsx). */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)] px-6 py-4 text-center text-xs text-fg-subtle">
      {COURSE.name} · {COURSE.school} {COURSE.term} · {COURSE.instructor}
    </footer>
  );
}
