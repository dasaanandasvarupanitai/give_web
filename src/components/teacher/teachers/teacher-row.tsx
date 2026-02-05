"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface Teacher {
    email: string;
    isActive: boolean;
    createdAt?: any;
}

interface TeacherRowProps {
    teacher: Teacher;
    onRemove: (email: string) => void;
}

export function TeacherRow({ teacher, onRemove }: TeacherRowProps) {
    return (
        <div className="flex flex-row items-center justify-between gap-3 p-3 border rounded-lg">
            <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{teacher.email}</p>
                {teacher.createdAt && (
                    <p className="text-sm text-muted-foreground">
                        Added:{" "}
                        {teacher.createdAt?.toDate
                            ? teacher.createdAt.toDate().toLocaleDateString()
                            : teacher.createdAt instanceof Date
                                ? teacher.createdAt.toLocaleDateString()
                                : "N/A"}
                    </p>
                )}
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(teacher.email)}
                className="text-destructive hover:text-destructive flex-shrink-0"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
