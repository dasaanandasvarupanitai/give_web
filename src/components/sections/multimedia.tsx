"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from 'embla-carousel-autoplay';
import { BookOpen, Mic, Video } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

const resources = [
  {
    title: 'Video Lectures',
    description: 'Watch pure and uncompromising Harikatha on our YouTube channel.',
    href: 'https://youtube.com/@VaikunthaGunanuvarnana',
    icon: <Video className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Audio Classes',
    description: 'Listen to lectures and kirtans on the go. Available on all major podcast platforms.',
    href: '#',
    icon: <Mic className="h-8 w-8 text-primary" />,
  },
  {
    title: 'Reading Materials',
    description: 'Explore our library of articles, essays, and translations of important Vaiṣṇava texts.',
    href: '#',
    icon: <BookOpen className="h-8 w-8 text-primary" />,
  },
];

export function Multimedia() {
  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  const count = resources.length;
  const isSingle = count === 1;
  const isDouble = count === 2;

  const itemClass = isSingle
    ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
    : isDouble
      ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
      : "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3";

  const contentClass = `-ml-2 md:-ml-4 ${isSingle ? "justify-center" : isDouble ? "md:justify-center" : ""}`;

  return (
    <section
      id="resources"
      className="relative py-16 md:py-24 bg-gradient-to-b from-secondary via-secondary/95 to-background overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">Explore Our Resources</h2>
          <p className="mt-4 text-lg text-secondary-foreground/80">
            Access a wealth of knowledge through our multimedia channels.
          </p>
        </div>
        <Carousel
          plugins={[autoplayPlugin.current]}
          className="w-full"
          opts={{
            align: isSingle ? "center" : "start",
            loop: count > 1,
          }}
        >
          <CarouselContent className={contentClass}>
            {resources.map((resource) => (
              <CarouselItem key={resource.title} className={itemClass}>
                <div className="p-2 sm:p-4 h-full">
                  <Link href={resource.href} target="_blank" rel="noopener noreferrer">
                    <Card className="h-full text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                      <CardHeader className="items-center">
                        {resource.icon}
                        <CardTitle className="font-headline mt-4 text-xl">{resource.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{resource.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
