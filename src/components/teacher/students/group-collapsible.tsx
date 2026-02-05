"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BatchCollapsible } from "./batch-collapsible";

interface StudentData {
    student: User;
    enrollment: Enrollment;
}

interface BatchData {
    batch: Batch;
    students: StudentData[];
}

interface GroupCollapsibleProps {
    group: CourseGroup;
    batches: BatchData[];
    isExpanded: boolean;
    onToggle: () => void;
    expandedBatches: Set<string>;
    onBatchToggle: (batchId: string) => void;
}

export function GroupCollapsible({
    group,
    batches,
    isExpanded,
    onToggle,
    expandedBatches,
    onBatchToggle,
}: GroupCollapsibleProps) {
    return (
        <Card>
            <Collapsible open={isExpanded} onOpenChange={onToggle}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                <CardTitle className="text-lg">{group.name}</CardTitle>
                            </div>
                            <CardDescription>
                                {batches.length} batch{batches.length !== 1 ? "es" : ""}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-2 pl-6">
                            {batches.map((batchData) => (
                                <BatchCollapsible
                                    key={batchData.batch.id}
                                    batch={batchData.batch}
                                    students={batchData.students}
                                    isExpanded={expandedBatches.has(batchData.batch.id)}
                                    onToggle={() => onBatchToggle(batchData.batch.id)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
