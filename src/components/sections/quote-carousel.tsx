"use client";

import Autoplay from "embla-carousel-autoplay";
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Quote } from "@/lib/models/quote";
import { subscribeQuotes } from "@/lib/services/firestore";
import { Loader2, MessageSquare } from "lucide-react";

export function QuoteCarousel() {
  const [quotes, setQuotes] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = subscribeQuotes(
      (quotesList) => {
        setQuotes(quotesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to quotes:", error);
        setQuotes([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  return (
    <section className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 overflow-hidden">
      {/* subtle background accents, distinct band after Prabhupada section */}
      <div className="pointer-events-none absolute -top-24 left-0 h-64 w-64 -translate-x-1/3 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative container max-w-screen-2xl px-4 sm:px-6">
        <div className="mb-6 sm:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">
            Ācārya Vākya
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nothing is added yet.
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          const count = quotes.length;
          const isSingle = count === 1;
          const isDouble = count === 2;

          const itemClass = isSingle
            ? "pl-2 md:pl-4 basis-full md:basis-1/2"
            : isDouble
              ? "pl-2 md:pl-4 basis-full md:basis-1/2"
              : "pl-2 md:pl-4 basis-full md:basis-1/2";

          const contentClass = `-ml-2 md:-ml-4 ${isSingle ? "justify-center" : isDouble ? "md:justify-center md:gap-0 lg:gap-0" : ""}`;

          return (
            <Carousel
              plugins={[autoplayPlugin.current]}
              className="w-full"
              opts={{
                align: isSingle ? "center" : "start",
                loop: count > 1,
              }}
            >
              <CarouselContent className={contentClass}>
                {quotes.map((item) => (
                  <CarouselItem key={item.id} className={itemClass}>
                    <div className="p-2 sm:p-4 h-full">
                      <div className="relative bg-white p-1 border border-primary h-full min-h-[200px] sm:min-h-[250px] shadow-[0_0_15px_rgba(255,102,0,0.2)]">
                        <div className="border border-primary p-3 sm:p-5 h-full">
                          <div className="flex flex-col h-full">
                            <p className="text-base sm:text-lg md:text-xl font-body font-semibold text-card-foreground/90 text-center flex-grow pt-2 sm:pt-4">
                              "{item.quote}"
                            </p>
                            <div className="mt-4 sm:mt-6 text-left">
                              {item.date && (
                                <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-normal font-body">
                                  {item.date}
                                </p>
                              )}
                              <p className="text-sm sm:text-base font-normal text-primary font-body">
                                — {item.author}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          );
        })()}
      </div>
    </section>
  );
}
