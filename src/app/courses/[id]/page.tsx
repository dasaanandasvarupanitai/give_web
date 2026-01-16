"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Course } from "@/lib/models/course";
import { getCourseById } from "@/lib/services/firestore";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Normalize any localhost absolute URLs saved from the editor back to relative/internal links
function normalizeInternalLinks(html: string): string {
    if (!html) return html;

    // Strip localhost origin (with optional port) so "/about/give" etc. work in any environment
    return html.replace(/https?:\/\/localhost(?::\d+)?/g, "");
}

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;

        const loadCourse = async () => {
            try {
                setLoading(true);
                const courseData = await getCourseById(courseId);
                if (courseData) {
                    setCourse(courseData);
                } else {
                    setError("Course not found");
                }
            } catch (err) {
                console.error("Error loading course:", err);
                setError(err instanceof Error ? err.message : "Failed to load course");
            } finally {
                setLoading(false);
            }
        };

        loadCourse();
    }, [courseId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        {error || "The course you're looking for doesn't exist."}
                    </p>
                    <Button onClick={() => router.push("/")}>Go to Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>

            <Card className="overflow-hidden">
                <div className="relative h-64 md:h-96 w-full">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                    />
                </div>
                <CardContent className="p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-headline font-bold mb-6">
                        {course.title}
                    </h1>
                    <div
                        className="prose prose-lg max-w-none
                       [&_ul]:list-disc [&_ul]:ms-6 [&_ol]:list-decimal [&_ol]:ms-6
                       [&_li]:my-2 [&_a]:text-primary [&_a]:underline [&_a]:font-medium
                       [&_strong]:font-bold [&_em]:italic [&_u]:underline
                       [&_p]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4
                       [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3
                       [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2
                       [&_ul.checklist]:list-none [&_ul.checklist]:pl-0 [&_ul.checklist>li]:relative [&_ul.checklist>li]:ps-6 [&_ul.checklist>li]:my-2 [&_ul.checklist>li]:before:content-['✔'] [&_ul.checklist>li]:before:text-primary [&_ul.checklist>li]:before:absolute [&_ul.checklist>li]:before:left-0 [&_ul.checklist>li]:before:top-0"
                        dangerouslySetInnerHTML={{ __html: normalizeInternalLinks(course.description) }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

