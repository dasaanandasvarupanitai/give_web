"use client";

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BatchData } from "@/lib/types/student-management";
import { downloadBatchAsExcel } from "@/lib/utils/export-students";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { StudentCard } from "./student-card";

interface BatchListItemProps {
    batchData: BatchData;
    isExpanded: boolean;
    onToggle: () => void;
}

export function BatchListItem({
    batchData,
    isExpanded,
    onToggle,
}: BatchListItemProps) {
    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <div className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm sm:text-base">
                                {batchData.batch.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {batchData.students.length} student
                                {batchData.students.length !== 1 ? "s" : ""}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadBatchAsExcel(batchData);
                                }}
                                className="border border-orange-500 h-7 sm:h-8 px-2 sm:px-3"
                            >
                                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="text-xs sm:text-sm">Download</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-4 sm:pl-6 pt-3 space-y-2">
                    {batchData.students.map((studentData) => (
                        <StudentCard
                            key={studentData.enrollment.id}
                            studentData={studentData}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
