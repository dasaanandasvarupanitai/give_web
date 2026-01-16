"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Course } from "@/lib/models/course";
import { subscribeCourses } from "@/lib/services/firestore";
import Autoplay from 'embla-carousel-autoplay';
import { BookOpen, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

function CourseImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  if (hasError || !imgSrc) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover"
      onError={() => {
        setHasError(true);
      }}
      loading="lazy"
      unoptimized={imgSrc.includes('firebasestorage')}
    />
  );
}

export function Courses() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = subscribeCourses(
      (coursesList) => {
        setCourses(coursesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to courses:", error);
        setCourses([]);
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
    <section
      id="courses"
      className="relative py-12 sm:py-16 md:py-24 bg-gradient-to-b from-secondary via-secondary/95 to-background overflow-hidden"
    >
      <div className="relative container max-w-screen-2xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-secondary-foreground">Our Courses</h2>
          <p className="mt-4 text-base sm:text-lg text-secondary-foreground/80">
            Deepen your understanding of Vaiṣṇava philosophy and practice with our structured courses.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No courses added yet.
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          const count = courses.length;
          const isSingle = count === 1;
          const isDouble = count === 2;

          const itemClass = isSingle
            ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            : isDouble
              ? "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              : "pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3";

          const contentClass = `-ml-2 md:-ml-4 ${isSingle ? "justify-center" : isDouble ? "md:justify-center" : ""}`;

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
                {courses.map((course) => (
                  <CarouselItem key={course.id} className={itemClass}>
                    <div className="p-2 sm:p-4 h-full">
                      <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                        <div className="relative h-48 w-full flex-shrink-0 bg-muted">
                          <CourseImage src={course.imageUrl} alt={course.title} />
                        </div>
                        <CardHeader className="min-h-[4.5rem] flex items-start flex-shrink-0">
                          <CardTitle className="font-headline text-lg sm:text-xl line-clamp-2">{course.title}</CardTitle>
                        </CardHeader>
                        <CardFooter className="mt-auto flex-shrink-0">
                          <Button
                            asChild
                            className="w-full text-sm sm:text-base"
                          >
                            <Link
                              href={`/courses/${course.id}`}
                              rel="noopener noreferrer"
                            >
                              Learn More
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
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
