"use client";

import { useMemo, useState } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enrollment } from "@/lib/models/enrollment";
import type { TaskType } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import { getTaskTypeLabel } from "@/lib/utils/task-helpers";
import { Eraser } from "lucide-react";
import { CleanupStorageDialog } from "./cleanup-storage-dialog";
import { TaskAccordionItem } from "./task-accordion-item";
import type { StudentFile, TaskFiles } from "./types";
import { useParams } from "next/navigation";

export type { StudentFile, StudentTextSubmission, StudentSubmission, TaskFiles } from "./types";

interface SubmissionsListProps {
    tasksWithFiles: TaskFiles[];
    enrollmentsMap: Map<string, Enrollment>;
    studentsMap: Map<string, User>;
    selectedFiles: Set<string>;
    onSelectFile: (fileUrl: string, checked: boolean) => void;
    onSelectAll: (taskFiles: TaskFiles, checked: boolean) => void;
    onPreview: (fileUrl: string, fileName: string) => void;
    onPreviewText: (text: string, title?: string) => void;
    onDeleteFile: (
        submissionId: string,
        fileUrl: string,
        fileName: string,
        studentId: string
    ) => void;
    onDeleteText: (submissionId: string, studentId: string) => void;
    onDeleteSubmission: (
        submissionId: string,
        studentName: string,
        fileUrls: string[]
    ) => void;
    onDeleteSelected: () => void;
    getSelectedFilesForTask: (taskFiles: TaskFiles) => StudentFile[];
    onRefresh: () => void;
}

export function SubmissionsList({
    tasksWithFiles,
    enrollmentsMap,
    studentsMap,
    selectedFiles,
    onSelectFile,
    onSelectAll,
    onPreview,
    onPreviewText,
    onDeleteFile,
    onDeleteText,
    onDeleteSubmission,
    onDeleteSelected,
    getSelectedFilesForTask,
    onRefresh,
}: SubmissionsListProps) {
    const params = useParams();
    const batchId = params.id as string;
    const [cleanupType, setCleanupType] = useState<TaskType | null>(null);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, TaskFiles[]> = {};
        tasksWithFiles.forEach((item) => {
            const type = item.task.type;
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
        });
        return groups;
    }, [tasksWithFiles]);

    const sortedTypes = useMemo(() => {
        return Object.keys(groupedTasks).sort((a, b) => {
            const labelA = getTaskTypeLabel(a as TaskType);
            const labelB = getTaskTypeLabel(b as TaskType);
            return labelA.localeCompare(labelB);
        }) as TaskType[];
    }, [groupedTasks]);

    return (
        <Accordion type="multiple" className="w-full space-y-6">
            {sortedTypes.map((type) => (
                <AccordionItem
                    key={type}
                    value={type}
                    className="border rounded-lg px-0 mb-0 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between w-full bg-muted/30 pr-2 sm:pr-4">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">
                                    {getTaskTypeLabel(type)}
                                </span>
                                <Badge variant="secondary" className="ml-2">
                                    {groupedTasks[type].length} task
                                    {groupedTasks[type].length !== 1 ? "s" : ""}
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground hidden sm:flex z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCleanupType(type);
                            }}
                        >
                            <Eraser className="h-4 w-4 mr-2" />
                            Cleanup Storage
                        </Button>
                    </div>
                    <AccordionContent className="p-4 bg-card">
                        <div className="sm:hidden pb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-destructive border-destructive"
                                onClick={() => setCleanupType(type)}
                            >
                                <Eraser className="h-4 w-4 mr-2" />
                                Cleanup Storage
                            </Button>
                        </div>
                        <Accordion type="multiple" className="w-full space-y-2">
                            {groupedTasks[type].map(({ task, studentSubmissions }) => (
                                <TaskAccordionItem
                                    key={task.id}
                                    task={task}
                                    studentSubmissions={studentSubmissions}
                                    enrollmentsMap={enrollmentsMap}
                                    studentsMap={studentsMap}
                                    selectedFiles={selectedFiles}
                                    onSelectFile={onSelectFile}
                                    onSelectAll={onSelectAll}
                                    onPreview={onPreview}
                                    onPreviewText={onPreviewText}
                                    onDeleteFile={onDeleteFile}
                                    onDeleteText={onDeleteText}
                                    onDeleteSubmission={onDeleteSubmission}
                                    onDeleteSelected={onDeleteSelected}
                                    getSelectedFilesForTask={getSelectedFilesForTask}
                                />
                            ))}
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>
            ))}
            {cleanupType && (
                <CleanupStorageDialog
                    open={!!cleanupType}
                    onOpenChange={(open) => !open && setCleanupType(null)}
                    batchId={batchId}
                    taskType={cleanupType}
                    onSuccess={onRefresh}
                />
            )}
        </Accordion>
    );
}
