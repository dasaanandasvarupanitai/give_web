"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function JayapatakaSwamiPage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getAboutPage("jayapataka-swami");
      if (mounted && data) {
        setPage(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = page?.heroTitle;
  const sections = page?.sections ?? [];

  const topSection = sections.find((s) => s.id === "jayapataka-letter"); // Corrected ID from user DB dump

  const paragraphs = topSection?.paragraphs ?? [];
  const greeting = paragraphs[0]; // First para is greeting
  const bodyParas = paragraphs.slice(1, -1); // Middle paras are body
  const closing = paragraphs[paragraphs.length - 1]; // Last para is closing

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                <h1 className="text-3xl md:text-5xl font-headline font-bold text-foreground mb-8">
                  {heroTitle}
                </h1>
                {(() => {
                  // Logic to handle single-block content (legacy data fix)
                  let displayParagraphs = paragraphs;

                  // If we have one giant blob, let's try to split it for better formatting
                  if (displayParagraphs.length === 1) {
                    let text = displayParagraphs[0];
                    const chunks: string[] = [];

                    // 1. My dear spiritual son...
                    const part1Marker = "My dear spiritual son Mani Gopal dasa";
                    if (text.includes(part1Marker)) {
                      const split1 = text.split("Please accept my blessings");
                      chunks.push(split1[0].trim()); // Line 1
                      text = "Please accept my blessings" + (split1[1] || "");
                    }

                    // 2. Please accept my blessings...
                    const part2Marker = "Please accept my blessings. All glories to Srila Prabhupada.";
                    if (text.includes(part2Marker)) {
                      const split2 = text.split("I am very glad to hear");
                      chunks.push(split2[0].trim()); // Line 2
                      text = "I am very glad to hear" + (split2[1] || "");
                    }

                    // 3. I am very glad...
                    const part3Marker = "I am very glad to hear";
                    if (text.startsWith(part3Marker)) {
                      const split3 = text.split("Your idea of having Bhakti sastri");
                      // Handle potential casing or leading space issue
                      if (split3.length === 1) {
                        // Try with leading space as seen in user request
                        const split3b = text.split(" Your idea of having Bhakti sastri");
                        if (split3b.length > 1) {
                          chunks.push(split3b[0].trim());
                          text = "Your idea of having Bhakti sastri" + (split3b[1] || "");
                        } else {
                          chunks.push(text);
                          text = "";
                        }
                      } else {
                        chunks.push(split3[0].trim());
                        text = "Your idea of having Bhakti sastri" + (split3[1] || "");
                      }
                    }

                    // 4. Your idea...
                    if (text.startsWith("Your idea of having Bhakti sastri")) {
                      const split4 = text.split("Studying Srila Prabhupada's books");
                      chunks.push(split4[0].trim());
                      text = "Studying Srila Prabhupada's books" + (split4[1] || "");
                    }

                    // 5. Studying...
                    if (text.startsWith("Studying Srila Prabhupada's books")) {
                      const split5 = text.split("Your well-wisher always");
                      chunks.push(split5[0].trim());
                      if (split5[1]) {
                        // 6. Signature
                        chunks.push("Your well-wisher always" + split5[1]);
                      }
                    }

                    if (chunks.length > 0) {
                      displayParagraphs = chunks;
                    }
                  }

                  return displayParagraphs.map((p, idx) => {
                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    const isLast = idx === displayParagraphs.length - 1;

                    // Increase base text size (REVERTED as per user request to use default)
                    const baseClasses = "leading-relaxed";

                    // Apply specific styles
                    if (isFirst) {
                      return <div key={idx} className={`${baseClasses} font-bold`} dangerouslySetInnerHTML={{ __html: p }} />;
                    }
                    if (isSecond) {
                      return <div key={idx} className={`${baseClasses} italic mb-6`} dangerouslySetInnerHTML={{ __html: p }} />;
                    }
                    if (isLast && displayParagraphs.length > 2) {
                      // Signature styling
                      return (
                        <div key={idx} className={`${baseClasses} font-bold mt-8 border-t pt-4 inline-block`} dangerouslySetInnerHTML={{ __html: p.replace("Jayapataka Swami", "<br/>Jayapataka Swami") }} />
                      );
                    }
                    return <div key={idx} className={`${baseClasses} mb-4`} dangerouslySetInnerHTML={{ __html: p }} />;
                  });
                })()}
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-2 flex justify-center md:justify-end">
            <AnimatedSection direction="right" delay={150}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary/45 via-primary/20 to-transparent opacity-75 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/JayapatakaSwamiGM.jpg"
                    alt="His Holiness Jayapatākā Swami"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </div>
  );
}
