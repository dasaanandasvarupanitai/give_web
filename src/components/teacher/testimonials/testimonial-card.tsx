"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Testimonial } from "@/lib/models/testimonial";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";

interface TestimonialCardProps {
    testimonial: Testimonial;
    onEdit: (testimonial: Testimonial) => void;
    onDelete: (id: string) => void;
    getPlainText: (html: string) => string;
}

export function TestimonialCard({
    testimonial,
    onEdit,
    onDelete,
    getPlainText,
}: TestimonialCardProps) {
    return (
        <Card>
            <div className="relative h-48 w-full">
                <Image
                    src={testimonial.imageUrl}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    draggable={false}
                />
            </div>
            <CardHeader>
                <CardTitle className="text-base font-bold">{testimonial.name}</CardTitle>
                {testimonial.designation && (
                    <CardDescription className="font-normal whitespace-pre-line">{testimonial.designation}</CardDescription>
                )}
                {testimonial.address && (
                    <CardDescription className="font-normal">{testimonial.address}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {getPlainText(testimonial.description)}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(testimonial)}
                        className="border border-orange-500"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(testimonial.id)}
                        className="border border-orange-500"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
