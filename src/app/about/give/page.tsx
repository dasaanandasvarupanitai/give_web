"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function GivePage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true; 
    (async () => {
      const data = await getAboutPage("give");
      if (mounted && data) {
        setPage(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = page?.heroTitle;
  const introSection = page?.sections.find((s) => s.id === "intro");
  const introParas = introSection?.paragraphs ?? [];
  const bioSection = page?.sections.find((s) => s.id === "bio");
  const bioParas = bioSection?.paragraphs ?? [];

  if (!page) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
                  {heroTitle}
                </h1>
                {introParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-2 flex justify-center md:justify-end">
            <AnimatedSection direction="right" delay={150}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/35 via-primary/5 to-transparent opacity-70 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/hg_Mani_Gopal_Dasa.jpg"
                    alt="HG Mani Gopal Das"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
        <AnimatedSection direction="up" delay={250}>
          <div
            className="mt-12 prose prose-lg max-w-none text-foreground/80 space-y-6 [&_span]:!text-inherit [&_span]:!leading-inherit [&_span]:!font-normal [&_p]:!text-inherit [&_p]:!leading-relaxed"
            style={{ textAlign: "justify" }}
          >
            {bioParas.map((p, idx) => (
              <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
