import { AnimatedSection } from "@/components/layout/animated-section";
import { Courses } from "@/components/sections/courses";
import { Hero } from "@/components/sections/hero";
import { Prabhupada } from "@/components/sections/prabhupada";
import { QuoteCarousel } from "@/components/sections/quote-carousel";
import { Testimonials } from "@/components/sections/testimonials";

export default function Home() {
  return (
    <>
      <AnimatedSection variant="fade" delay={200}>
        <Hero />
      </AnimatedSection>
      <AnimatedSection variant="fade" delay={200}>
        <Prabhupada />
      </AnimatedSection>
      <AnimatedSection direction="right" delay={150}>
        <QuoteCarousel />
      </AnimatedSection>
      <AnimatedSection direction="left" delay={200}>
        <Courses />
      </AnimatedSection>
      <AnimatedSection direction="up" delay={250}>
        <Testimonials />
      </AnimatedSection>
    </>
  );
}
