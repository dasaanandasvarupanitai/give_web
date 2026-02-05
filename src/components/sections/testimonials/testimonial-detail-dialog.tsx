"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Testimonial } from '@/lib/models/testimonial';

interface TestimonialDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    testimonial: Testimonial | null;
}

export function TestimonialDetailDialog({ open, onOpenChange, testimonial }: TestimonialDetailDialogProps) {
    if (!testimonial) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6 mx-auto">
                <>
                    <DialogHeader className="text-left space-y-1.5 sm:space-y-2">
                        <DialogTitle className="text-base sm:text-xl md:text-2xl font-bold pr-6">{testimonial.name}</DialogTitle>
                        {(testimonial.designation || testimonial.address) && (
                            <DialogDescription className="text-xs sm:text-base">
                                {testimonial.designation && (
                                    <span className="font-normal block whitespace-pre-line">{testimonial.designation}</span>
                                )}
                                {testimonial.address && (
                                    <span className="font-normal block">{testimonial.address}</span>
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
                            dangerouslySetInnerHTML={{ __html: testimonial.description }}
                        />
                    </div>
                </>
            </DialogContent>
        </Dialog>
    );
}
