"use client";

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";

interface StudentListCardProps {
    student: User;
    enrollment: Enrollment;
}

export function StudentListCard({ student, enrollment }: StudentListCardProps) {
    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-medium">
                            {student.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
