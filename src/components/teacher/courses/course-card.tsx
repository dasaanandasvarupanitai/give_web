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
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";

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
    return (
        <Card>
            <div className="relative h-48 w-full">
                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                />
            </div>
            <CardHeader>
                <CardTitle className="text-base">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{getPlainText(course.description)}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(course)}
                        className="border border-orange-500"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(course.id)}
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
