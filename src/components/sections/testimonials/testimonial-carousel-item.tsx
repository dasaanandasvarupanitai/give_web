"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Testimonial } from '@/lib/models/testimonial';
import Image from 'next/image';

interface TestimonialCarouselItemProps {
    testimonial: Testimonial;
    onReadMore: (testimonial: Testimonial) => void;
}

export function TestimonialCarouselItem({ testimonial, onReadMore }: TestimonialCarouselItemProps) {
    // Strip HTML tags for preview text
    const stripHtml = (html: string): string => {
        if (typeof window === 'undefined') {
            // Server-side: use regex
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        }
        // Client-side: use DOM
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div className="p-2 sm:p-4 h-full">
            <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <CardHeader className="min-h-[4.5rem] flex flex-row items-start gap-3 flex-shrink-0 p-4">
                    <div
                        className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full overflow-hidden"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                        <Image
                            src={testimonial.imageUrl}
                            alt={testimonial.name}
                            fill
                            className="object-cover"
                            draggable={false}
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                        <CardTitle className="font-headline text-base sm:text-lg font-semibold leading-tight">{testimonial.name}</CardTitle>
                        {testimonial.designation && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5 leading-tight whitespace-pre-line">{testimonial.designation}</p>
                        )}
                        {testimonial.address && (
                            <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-tight">{testimonial.address}</p>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col pt-2 pb-2">
                    <p className="text-sm sm:text-base text-muted-foreground line-clamp-4">
                        {stripHtml(testimonial.description)}
                    </p>
                </CardContent>
                <CardFooter className="mt-auto flex-shrink-0 pt-2">
                    <Button
                        variant="outline"
                        className="w-full text-sm sm:text-base border-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => onReadMore(testimonial)}
                    >
                        Read More
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
