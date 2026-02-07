"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SrilaBhaktisiddhantaPage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getAboutPage("srila-bhaktisiddhanta");
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
  const firstSection = page.sections.find((s) => s.id === "bhaktisiddhanta-1");
  const firstIntroParas = firstSection?.paragraphs ?? [];
  const secondSection = page.sections.find(
    (s) => s.id === "bhaktisiddhanta-2"
  );
  const secondParas = secondSection?.paragraphs ?? [];
  const thirdSection = page.sections.find(
    (s) => s.id === "bhaktisiddhanta-3"
  );
  const longBioParas = thirdSection?.paragraphs ?? [];

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        {/* First section: Image on left, text on right */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2 flex justify-center md:justify-start order-2 md:order-1">
            <AnimatedSection direction="left">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/35 via-primary/5 to-transparent opacity-70 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/Srila-Bhaktisidhanta-01.jpg"
                    alt="Srila Bhaktisiddhanta Sarasvati Thakura"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6 order-1 md:order-2">
            <AnimatedSection direction="right" delay={150}>
              <div>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
                  {heroTitle}
                </h1>
                {firstIntroParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Second section: Image on right, text on left */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mt-12 items-center">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                {secondParas.map((p, idx) => (
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
                    src="/Srila-Bhaktisidhanta-02.jpg"
                    alt="Srila Bhaktisiddhanta Sarasvati Thakura"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
        <div className="mt-12">
          <AnimatedSection direction="up" delay={250} rootMargin="0px 0px 200px 0px" threshold={0.01}>
            <div
              className="prose prose-lg max-w-none text-foreground/80 space-y-6"
              style={{ textAlign: 'justify' }}
            >
              {longBioParas.map((p, idx) => (
                <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div >
  );
}
