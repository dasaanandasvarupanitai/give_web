"use client";

import { AnimatedSection } from '@/components/layout/animated-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course } from "@/lib/models/course";
import { subscribeCourses } from "@/lib/services/firestore";
import { BookOpen, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

export default function CoursesPage() {
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

    return (
        <div className="bg-background text-foreground">
            <div className="container max-w-screen-2xl py-16 md:py-24">
                <AnimatedSection direction="up">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
                            Our Courses
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Deepen your understanding of Vaiṣṇava philosophy and practice with our structured courses.
                        </p>
                    </div>
                </AnimatedSection>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : courses.length === 0 ? (
                    <AnimatedSection direction="up" delay={150}>
                        <Card className="max-w-2xl mx-auto">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center">
                                    No courses added yet.
                                </p>
                            </CardContent>
                        </Card>
                    </AnimatedSection>
                ) : (
                    <AnimatedSection direction="up" delay={150}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course, index) => (
                                <AnimatedSection
                                    key={course.id}
                                    direction="up"
                                    delay={200 + index * 50}
                                >
                                    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                                        <div className="relative h-48 w-full flex-shrink-0">
                                            <Image
                                                src={course.imageUrl}
                                                alt={course.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <CardHeader className="min-h-[4.5rem] flex items-start flex-shrink-0">
                                            <CardTitle className="font-headline text-lg sm:text-xl line-clamp-2">
                                                {course.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardFooter className="mt-auto flex-shrink-0">
                                            <Button
                                                asChild
                                                className="w-full text-sm sm:text-base"
                                            >
                                                <Link
                                                    href={`/courses/${course.id}`}
                                                >
                                                    Learn More
                                                </Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </AnimatedSection>
                            ))}
                        </div>
                    </AnimatedSection>
                )}
            </div>
        </div>
    );
}

