"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import * as React from "react";

const heroImages = [
  {
    src: "/govardhan.png",
    alt: "Goverdhan",
  },
  {
    src: "/mayapur.jpg",
    alt: "Mayapur Dham",
  },
  {
    src: "/ekacakra.jpg",
    alt: "Ekacakra Dham",
  },
  {
    src: "/puri-dham.jpg",
    alt: "Puri Dham",
  },
  {
    src: "/vrindavan.jpg",
    alt: "Vrindavan Dham",
  },
];

export function Hero() {
  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] md:h-[70vh] flex flex-col justify-between text-center text-white overflow-hidden [&_[role='region']]:h-full [&_[role='region']>div]:h-full [&_[role='region']>div>div]:h-full">
      <div className="absolute inset-0 w-full h-full">
        <Carousel
          plugins={[autoplayPlugin.current]}
          className="w-full h-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent className="-ml-0 h-full [&>div]:h-full">
            {heroImages.map((image, index) => (
              <CarouselItem key={index} className="pl-0 basis-full h-full">
                <div className="relative w-full h-full min-h-full">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                    data-ai-hint={image.alt}
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="absolute inset-0 bg-black/50 z-10" />
      {/* Top section - Title */}
      <div className="relative z-20 w-full px-4 pt-12 md:pt-16">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-base sm:text-lg md:text-4xl lg:text-5xl font-headline font-bold tracking-tight text-shadow-lg">
            <span className="whitespace-nowrap">Gaura-vāṇī Institute for Vaiṣṇava Education</span>
            <br />
            <span>(GIVE)</span>
          </h1>
        </div>
      </div>
      {/* Bottom section - Quote */}
      <div className="relative z-20 w-full px-4 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="text-lg md:text-xl text-white/95 text-shadow font-semibold">
            "Love of God is the highest perfection of life. This is our philosophy."
          </p>
          <p className="text-sm md:text-base text-right text-white/80 text-shadow">
            - Evening Darsana, August 11, 1976, Tehran
          </p>
        </div>
      </div>
    </section>
  );
}
