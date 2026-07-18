"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Course } from "@/lib/models/course";
import { Edit, Trash2, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { subscribeBatchRequestsByCourse } from "@/lib/services/firestore";
import { CourseRequestsDialog } from "@/components/admin/course-requests-dialog";

interface CourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (id: string) => void;
    getPlainText: (html: string) => string;
}

export function CourseCard({
    course,
    onEdit,
    onDelete,
    getPlainText,
}: CourseCardProps) {
    const [requestCount, setRequestCount] = useState(0);
    const [isRequestsOpen, setIsRequestsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeBatchRequestsByCourse(course.id, (data) => {
            setRequestCount(data.length);
        });
        return () => unsubscribe();
    }, [course.id]);

    return (
        <Card className="flex flex-col h-full justify-between">
            <div>
                <div className="relative h-48 w-full">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                    />
                </div>
                <CardHeader>
                    <CardTitle className="text-base font-headline font-semibold">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{getPlainText(course.description)}</CardDescription>
                </CardHeader>
            </div>
            <div>
                <CardContent className="pt-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEdit(course)}
                                className="flex-1 border border-orange-500"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDelete(course.id)}
                                className="flex-1 border border-orange-500 text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRequestsOpen(true)}
                            className="w-full border border-primary text-primary hover:bg-primary/10 flex items-center justify-center gap-2"
                        >
                            <Users className="h-4 w-4" />
                            Requests ({requestCount})
                        </Button>
                    </div>
                </CardContent>
            </div>
            <CourseRequestsDialog
                course={course}
                isOpen={isRequestsOpen}
                onOpenChange={setIsRequestsOpen}
            />
        </Card>
    );
}

