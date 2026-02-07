"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function IskconPage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getAboutPage("iskcon");
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
  const introSection = page.sections.find((s) => s.id === "iskcon-intro");
  const introParas = introSection?.paragraphs ?? [];
  const purposesSection = page.sections.find((s) => s.id === "iskcon-purposes");
  const purposesParas = purposesSection?.paragraphs ?? [];
  const growthSection = page.sections.find((s) => s.id === "iskcon-growth");
  const growthParas = growthSection?.paragraphs ?? [];

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">
            <AnimatedSection direction="left">
              <div className="prose prose-lg max-w-none text-foreground/80 space-y-4">
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
                  {heroTitle}
                </h1>
                {introParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
            </AnimatedSection>
            <AnimatedSection direction="right" delay={150}>
              <div className="relative rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 flex justify-center items-center">
                <Image
                  src="/iskcon_logo_new-min.jpg"
                  alt="ISKCON Logo"
                  width={200}
                  height={200}
                  className="h-auto w-auto max-w-full rounded-lg object-contain"
                />
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection direction="up" delay={250}>
            <div className="prose prose-lg max-w-none mx-auto text-foreground/80 space-y-6">
              <h2 className="font-headline text-2xl font-bold text-foreground">
                The Seven Purposes of ISKCON
              </h2>
              <div
                className="[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-6 [&_ol]:space-y-4 [&_li]:mb-1 [&_p]:mb-4"
              >
                {purposesParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
              <div>
                {growthParas.map((p, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
              <p className="pt-4">
                Source:{" "}
                <Link
                  href="http://www.gbc.iskcon.org/what-is-iskcon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.gbc.iskcon.org/what-is-iskcon
                </Link>
              </p>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
