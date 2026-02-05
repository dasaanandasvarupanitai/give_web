"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StudentData } from "@/lib/types/student-management";

interface StudentCardProps {
    studentData: StudentData;
}

export function StudentCard({ studentData }: StudentCardProps) {
    const { student, enrollment } = studentData;
    const initial = (enrollment.dikshaName || enrollment.studentName || student.name || "?")
        .charAt(0)
        .toUpperCase();

    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-medium text-sm">{initial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                            {enrollment.dikshaName || enrollment.studentName || student.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {student.email}
                        </p>
                        {enrollment.studentName &&
                            enrollment.studentName !==
                            (enrollment.dikshaName || student.name) && (
                                <p className="text-xs text-muted-foreground truncate">
                                    Certificate: {enrollment.studentName}
                                </p>
                            )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
