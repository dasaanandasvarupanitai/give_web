"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_TITLE =
  "HG Mani Gopal Das";
const FALLBACK_INTRO =
  "Born to a religious family, originally hailing from Barrackpore, North Calcutta; Mani Gopal Das came in contact with Krishna consciousness in 1992 by the inspiration of his parents. He started to give classes on Bhagavad Gita when he was only eight. He received spiritual initiation, at the age of eleven, in January 1997 in the line of Brahma-Madhva-Gaudiya parampara from His Holiness Jayapataka Swami Maharaja, a dedicated disciple of HDG A.C Bhaktivedanta Swami Prabhupada, the Founder-Acarya of International Society for Krishna Consciousness.";
const FALLBACK_P1 =
  "Academically, he holds a master’s degree in International Relations from a renowned university. He completed Bhakti Sastri, Bhakti Vaibhava, Bhakti Vedanta, TTC 1 and 2, BSTTC, IDCTTC and Spiritual Leadership Course. He is also qualified in the deity worship training and yajna samskara courses. Mani Gopal Das got many years of experience in the field of youth preaching in different colleges and universities, delivering speeches in various educational institutions and organisations on the teachings of Bhagavad Gita and other ancient Vedic literatures. He is an accomplished congregational preacher as well, who counselled numerous grihasthas in Krishna conscious family life. What made him truly distinct is his uncompromising yet pragmatic approach in presenting Krishna consciousness based on Srila Prabhupada’s teachings. He is well-known amidst his preaching circle mainly for his strong adherence and unwavering allegiance to the teachings of Srila Prabhupada and traditional vaisnava culture and yet caring personal demeanor. He is an adept sastric teacher for presenting the philosophy in unadulterated yet heart-touching way.";
const FALLBACK_P2 =
  "Currently he is serving at the office of his spiritual master in Sridham Mayapur as well as teaching sastric courses in different places through online and onsite. With his spiritual master’s blessings, he is heading the Gaura-vāṇī Institute for Vaiṣṇava Education, affiliated to ISKCON Ministry of Education and an authorised exam center under ISKCON Board of Examinations. Additionally, he is one of the core admin members in the globally renowned online repository of Srila Prabhupada’s teachings – Vanipedia; Prabhupada Network Team (Mayapur) and member of ISKCON Teachers’ Board in Ministry of Education, ISKCON.";

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

  const heroTitle = page?.heroTitle ?? FALLBACK_TITLE;
  const introSection = page?.sections.find((s) => s.id === "intro");
  const introText = introSection?.paragraphs?.[0] ?? FALLBACK_INTRO;
  const bioSection = page?.sections.find((s) => s.id === "bio");
  const bioParas = bioSection?.paragraphs ?? [FALLBACK_P1, FALLBACK_P2];

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
                <p>{introText}</p>
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
            className="mt-12 prose prose-lg max-w-none text-foreground/80 space-y-6"
            style={{ textAlign: "justify" }}
          >
            {bioParas.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
