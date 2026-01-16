"use client";

import { AnimatedSection } from '@/components/layout/animated-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Testimonial } from '@/lib/models/testimonial';
import { subscribeTestimonials } from '@/lib/services/firestore';
import { Loader2, User } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

export default function TestimonialsPage() {
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

    const handleReadMore = (testimonial: Testimonial) => {
        setSelectedTestimonial(testimonial);
        setIsDialogOpen(true);
    };

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
        <div className="bg-background text-foreground">
            <div className="container max-w-screen-2xl py-16 md:py-24">
                <AnimatedSection direction="up">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
                            Words of Gratitude
                        </h1>
                        <p className="sm:text-sm md:text-lg lg:text-lg text-muted-foreground">
                            See how studying at GIVE has impacted the lives of our community members.
                        </p>
                    </div>
                </AnimatedSection>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : testimonials.length === 0 ? (
                    <AnimatedSection direction="up" delay={150}>
                        <Card className="max-w-2xl mx-auto">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <User className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center">
                                    Nothing is added yet.
                                </p>
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                ) : (
                    <>
                        <AnimatedSection direction="up" delay={150}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {testimonials.map((testimonial, index) => (
                                    <AnimatedSection
                                        key={testimonial.id}
                                        direction="up"
                                        delay={200 + index * 50}
                                    >
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
                                                    <CardTitle className="font-headline text-base sm:text-lg font-semibold leading-tight">
                                                        {testimonial.name}
                                                    </CardTitle>
                                                    {testimonial.designation && (
                                                        <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-0.5 leading-tight whitespace-pre-line">
                                                            {testimonial.designation}
                                                        </p>
                                                    )}
                                                    {testimonial.address && (
                                                        <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-tight">
                                                            {testimonial.address}
                                                        </p>
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
                                                    onClick={() => handleReadMore(testimonial)}
                                                >
                                                    Read More
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </AnimatedSection>
                                ))}
                            </div>
                        </AnimatedSection>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="w-[90vw] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 mx-auto">
                                {selectedTestimonial && (
                                    <>
                                        <DialogHeader className="text-left space-y-1.5 sm:space-y-2">
                                            <DialogTitle className="text-base sm:text-xl md:text-2xl font-bold pr-6">
                                                {selectedTestimonial.name}
                                            </DialogTitle>
                                            {(selectedTestimonial.designation || selectedTestimonial.address) && (
                                                <DialogDescription className="text-xs sm:text-base">
                                                    {selectedTestimonial.designation && (
                                                        <span className="font-normal block whitespace-pre-line">
                                                            {selectedTestimonial.designation}
                                                        </span>
                                                    )}
                                                    {selectedTestimonial.address && (
                                                        <span className="font-normal block">
                                                            {selectedTestimonial.address}
                                                        </span>
                                                    )}
                                                </DialogDescription>
                                            )}
                                        </DialogHeader>
                                        <div className="mt-3 sm:mt-6">
                                            <div
                                                className="prose prose-xs sm:prose-base max-w-none text-xs sm:text-base
                          [&_ul]:list-disc [&_ul]:ms-3 sm:[&_ul]:ms-6 [&_ol]:list-decimal [&_ol]:ms-3 sm:[&_ol]:ms-6
                          [&_li]:my-1 sm:[&_li]:my-2 [&_a]:text-primary [&_a]:underline [&_a]:font-medium [&_a]:text-xs sm:[&_a]:text-base
                          [&_strong]:font-bold [&_em]:italic [&_u]:underline
                          [&_p]:mb-2 sm:[&_p]:mb-4 [&_p]:text-xs sm:[&_p]:text-base [&_p]:leading-relaxed
                          [&_h1]:text-lg sm:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 sm:[&_h1]:mb-4
                          [&_h2]:text-base sm:[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-1.5 sm:[&_h2]:mb-3
                          [&_h3]:text-sm sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-1 sm:[&_h3]:mb-2
                          [&_ul.checklist]:list-none [&_ul.checklist]:pl-0 [&_ul.checklist>li]:relative [&_ul.checklist>li]:ps-4 sm:[&_ul.checklist>li]:ps-6 [&_ul.checklist>li]:my-1 sm:[&_ul.checklist>li]:my-2 [&_ul.checklist>li]:before:content-['✔'] [&_ul.checklist>li]:before:text-primary [&_ul.checklist>li]:before:absolute [&_ul.checklist>li]:before:left-0 [&_ul.checklist>li]:before:top-0"
                                                dangerouslySetInnerHTML={{ __html: selectedTestimonial.description }}
                                            />
                                        </div>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>
        </div>
    );
}

