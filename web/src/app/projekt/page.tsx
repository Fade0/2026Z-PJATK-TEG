import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { SiteNav } from "@/components/site/SiteNav";
import { HeroTitle } from "@/components/lesson/HeroTitle";
import { Markdown } from "@/components/molecules/Markdown";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = { title: "Projekt" };

// Treść = projekt/README.md czytany w czasie builda (ten sam plik co na GitHubie).
const README = fs.readFileSync(path.join(process.cwd(), "..", "projekt", "README.md"), "utf8");

export default function ProjectPage() {
  return (
    <>
      <SiteNav />
      <main className="px-6 pb-32 pt-36">
        <div className="mx-auto max-w-4xl">
          <HeroTitle
            eyebrow="Projekt w parach · prezentacje 23.01.2027"
            lines={["Projekt", "semestralny"]}
            accentLine={1}
            lead="Własny system oparty na LLM: co najmniej 8 z 12 zagadnień z zajęć (w zespole 3-osobowym 10) i prezentacja na ostatnich zajęciach."
          />
          <Reveal delay={0.8} className="mt-8">
            <Markdown source={README} baseDir="projekt" slides />
          </Reveal>
        </div>
      </main>
    </>
  );
}
