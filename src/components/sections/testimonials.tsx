"use client";

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Testimonial } from '@/lib/models/testimonial';
import { subscribeTestimonials } from '@/lib/services/firestore';
import Autoplay from 'embla-carousel-autoplay';
import { Loader2, User } from 'lucide-react';
import * as React from 'react';
import { TestimonialCarouselItem } from './testimonials/testimonial-carousel-item';
import { TestimonialDetailDialog } from './testimonials/testimonial-detail-dialog';

export function Testimonials() {
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = React.useState<Testimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = subscribeTestimonials(
      (testimonialsList) => {
        setTestimonials(testimonialsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to testimonials:", error);
        setTestimonials([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  const handleReadMore = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setIsDialogOpen(true);
  };

  return (
    <section
      id="testimonials"
      className="relative py-16 md:py-24 bg-gradient-to-b from-muted/95 via-muted to-background border-t border-border/40 overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Words of Gratitude</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how studying at GIVE has impacted the lives of our community members.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : testimonials.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nothing is added yet.
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          const count = testimonials.length;
          const isSingle = count === 1;
          const isDouble = count === 2;

          const itemClass = isSingle
            ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            : isDouble
              ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              : "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3";

          const contentClass = `-ml-2 md:-ml-4 ${isSingle ? "justify-center" : isDouble ? "md:justify-center" : ""}`;

          return (
            <>
              <Carousel
                plugins={[autoplayPlugin.current]}
                className="w-full"
                opts={{
                  align: isSingle ? "center" : "start",
                  loop: count > 1,
                }}
              >
                <CarouselContent className={contentClass}>
                  {testimonials.map((testimonial) => (
                    <CarouselItem key={testimonial.id} className={itemClass}>
                      <TestimonialCarouselItem
                        testimonial={testimonial}
                        onReadMore={handleReadMore}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>

              <TestimonialDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                testimonial={selectedTestimonial}
              />
            </>
          );
        })()}
      </div>
    </section>
  );
}
