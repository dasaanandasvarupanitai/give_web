"use client";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StudentListCard } from "./student-list-card";

interface StudentData {
    student: User;
    enrollment: Enrollment;
}

interface BatchCollapsibleProps {
    batch: Batch;
    students: StudentData[];
    isExpanded: boolean;
    onToggle: () => void;
}

export function BatchCollapsible({
    batch,
    students,
    isExpanded,
    onToggle,
}: BatchCollapsibleProps) {
    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <div className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{batch.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {students.length} student{students.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-6 pt-2 space-y-2">
                    {students.map((studentData) => (
                        <StudentListCard
                            key={studentData.enrollment.id}
                            student={studentData.student}
                            enrollment={studentData.enrollment}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
