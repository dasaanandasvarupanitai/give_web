"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SrilaPrabhupadaPage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getAboutPage("srila-prabhupada");
      if (mounted && data) {
        setPage(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!page) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  const heroTitle = page.heroTitle;
  const heroSubtitle = page.heroSubtitle;
  const introSection = page.sections.find((s) => s.id === "prabhupada-intro");
  const introParas = introSection?.paragraphs ?? [];
  const purposesSection = page.sections.find(
    (s) => s.id === "prabhupada-purposes"
  );
  const purposesParas = purposesSection?.paragraphs ?? [];
  const finalSection = page.sections.find((s) => s.id === "prabhupada-final");
  const finalParas = finalSection?.paragraphs ?? [];

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        {/* Centered Header */}
        <AnimatedSection direction="up">
          <div className="text-center mb-12">
            <h1 className="text-sm sm:text-lg md:text-3xl font-headline font-bold sm:whitespace-nowrap">
              {heroTitle}
            </h1>
            <h3 className="mt-2 text-xs sm:text-sm md:text-lg text-muted-foreground sm:whitespace-nowrap">
              {heroSubtitle}
            </h3>
          </div>
        </AnimatedSection>

        {/* Text-Image Section: Text left, Image right */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center mb-12">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                {introParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-2 flex justify-center md:justify-end">
            <AnimatedSection direction="right" delay={150}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/45 via-primary/20 to-transparent opacity-75 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/prabhupada-1.jpg"
                    alt="His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Seven Purposes Listing Section */}
        <AnimatedSection direction="up" delay={250}>
          <div className="prose prose-lg max-w-none text-foreground/80 space-y-6 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-6 [&_ol]:space-y-2 [&_li]:mb-2 [&_p]:mb-4">
            {purposesParas.map((p, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        </AnimatedSection>

        {/* Final Paragraph */}
        <AnimatedSection direction="up" delay={300}>
          <div className="prose prose-lg max-w-none text-foreground/80 space-y-6 mt-12">
            {finalParas.map((p, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
