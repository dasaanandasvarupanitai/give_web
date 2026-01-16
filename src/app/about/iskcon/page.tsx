"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const FALLBACK_TITLE = "What is ISKCON?";
const FALLBACK_INTRO =
  "The International Society for Krishna Consciousness (ISKCON) is the spiritual institution founded by His Divine Grace A.C. Bhaktivedanta Swami Prabhupada in July 1966 as a continuation of the Brahma-Madhva-Gaudiya sampradaya. ISKCON was personally directed by its Founder-Acarya Srila Prabhupada until his departure on November 14, 1977. According to Srila Prabhupada’s will, ISKCON continued thereafter under the ultimate managing authority of the Governing Body Commission (GBC).";
const FALLBACK_PURPOSES_HTML = `<p>In ISKCON’s incorporating document, Srila Prabhupada imparts the “Seven Purposes of ISKCON”:</p>
<ol>
  <li>To systematically propagate spiritual knowledge to society at large and to educate all peoples in the techniques of spiritual life in order to check the imbalance of values in life and to achieve real unity and peace in the world.</li>
  <li>To propagate a consciousness of Krishna as it is revealed in the Bhagavad-gita and Srimad Bhagavatam.</li>
  <li>To bring the members of the Society together with each other and nearer to Krishna, the prime entity, and thus to develop the idea, within the members, and humanity, at large, that each soul is part and parcel of the quality of Godhead (Krishna).</li>
  <li>To teach and encourage the Sankirtan movement of congregational chanting of the holy name of God as revealed in the teachings of Lord Sri Chaitanya Mahaprabhu.</li>
  <li>To erect for the members, and for society at large, a holy place of transcendental pastimes, dedicated to the personality of Krishna.</li>
  <li>To bring the members closer together for the purpose of teaching a simpler and more natural way of life.</li>
  <li>With a view towards achieving the aforementioned purposes, to publish and distribute periodicals, magazines, books and other writings.</li>
</ol>`;
const FALLBACK_GROWTH =
  "Under Srila Prabhupada’s guidance, ISKCON has grown from a small group of disciples assembling in a New York City store front into an international society with scores of centers. At present, there are more than three-hundred ISKCON centers worldwide.";

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

  const heroTitle = page?.heroTitle ?? FALLBACK_TITLE;
  const introSection = page?.sections.find((s) => s.id === "iskcon-intro");
  const introText = introSection?.paragraphs?.[0] ?? FALLBACK_INTRO;
  const purposesSection = page?.sections.find(
    (s) => s.id === "iskcon-purposes"
  );
  const purposesHtml =
    purposesSection?.paragraphs?.[0] ?? FALLBACK_PURPOSES_HTML;
  const growthSection = page?.sections.find((s) => s.id === "iskcon-growth");
  const growthText = growthSection?.paragraphs?.[0] ?? FALLBACK_GROWTH;

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
                <p>{introText}</p>
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
                dangerouslySetInnerHTML={{ __html: purposesHtml }}
              />
              <p>{growthText}</p>
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
