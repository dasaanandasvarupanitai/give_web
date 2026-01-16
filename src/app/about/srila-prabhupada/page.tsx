"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_HERO_TITLE =
  "His Divine Grace A.C Bhaktivedānta Swāmi Prabhupāda";
const FALLBACK_HERO_SUBTITLE =
  "Founder-Ācārya: International Society for Kṛṣṇa Consciousness (ISKCON)";
const FALLBACK_INTRO =
  "The International Society for Krishna Consciousness (ISKCON) is the spiritual institution founded by His Divine Grace A.C. Bhaktivedanta Swami Prabhupada in July 1966 as a continuation of the Brahma-Madhva-Gaudiya sampradaya. ISKCON was personally directed by its Founder-Acarya Srila Prabhupada until his departure on November 14, 1977. According to Srila Prabhupada's will, ISKCON continued thereafter under the ultimate managing authority of the Governing Body Commission (GBC).";
const FALLBACK_PURPOSES_HTML = `<p>In ISKCON's incorporating document, Srila Prabhupada imparts the "Seven Purposes of ISKCON":</p>
<ol>
  <li>To systematically propagate spiritual knowledge to society at large and to educate all peoples in the techniques of spiritual life in order to check the imbalance of values in life and to achieve real unity and peace in the world.</li>
  <li>To propagate a consciousness of Krishna as it is revealed in the Bhagavad-gita and Srimad Bhagavatam.</li>
  <li>To bring the members of the Society together with each other and nearer to Krishna, the prime entity, and thus to develop the idea, within the members, and humanity, at large, that each soul is part and parcel of the quality of Godhead (Krishna).</li>
  <li>To teach and encourage the Sankirtan movement of congregational chanting of the holy name of God as revealed in the teachings of Lord Sri Chaitanya Mahaprabhu.</li>
  <li>To erect for the members, and for society at large, a holy place of transcendental pastimes, dedicated to the personality of Krishna.</li>
  <li>To bring the members closer together for the purpose of teaching a simpler and more natural way of life.</li>
  <li>With a view towards achieving the aforementioned purposes, to publish and distribute periodicals, magazines, books and other writings.</li>
</ol>`;
const FALLBACK_FINAL =
  "Under Srila Prabhupada's guidance, ISKCON has grown from a small group of disciples assembling in a New York City store front into an international society with scores of centers. At present, there are more than three-hundred ISKCON centers worldwide.";

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

  const heroTitle = page?.heroTitle ?? FALLBACK_HERO_TITLE;
  const heroSubtitle = page?.heroSubtitle ?? FALLBACK_HERO_SUBTITLE;
  const introSection = page?.sections.find((s) => s.id === "prabhupada-intro");
  const introText = introSection?.paragraphs?.[0] ?? FALLBACK_INTRO;
  const purposesSection = page?.sections.find(
    (s) => s.id === "prabhupada-purposes"
  );
  const purposesHtml =
    purposesSection?.paragraphs?.[0] ?? FALLBACK_PURPOSES_HTML;
  const finalSection = page?.sections.find((s) => s.id === "prabhupada-final");
  const finalText = finalSection?.paragraphs?.[0] ?? FALLBACK_FINAL;

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
                <p>{introText}</p>
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
          <div
            className="prose prose-lg max-w-none text-foreground/80 space-y-6 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-6 [&_ol]:space-y-2 [&_li]:mb-2 [&_p]:mb-4"
            dangerouslySetInnerHTML={{ __html: purposesHtml }}
          />
        </AnimatedSection>

        {/* Final Paragraph */}
        <AnimatedSection direction="up" delay={300}>
          <div className="prose prose-lg max-w-none text-foreground/80 space-y-6 mt-12">
            <p>{finalText}</p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
