"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import {
    getTaskDisplayStatus,
    getTaskTypeColor,
    getTaskTypeIcon,
    getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import { Trash2 } from "lucide-react";
import { StudentAccordionItem } from "./student-accordion-item";
import type { StudentFile, StudentSubmission, TaskFiles } from "./types";

interface TaskAccordionItemProps {
    task: Task;
    studentSubmissions: StudentSubmission[];
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
}

export function TaskAccordionItem({
    task,
    studentSubmissions,
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
}: TaskAccordionItemProps) {
    const TaskIcon = getTaskTypeIcon(task.type);
    const taskColor = getTaskTypeColor(task.type);
    const isDailyListening = task.type === "dailyListening";
    const totalFiles = studentSubmissions.reduce(
        (sum, s) => sum + s.files.length,
        0
    );
    const totalTextSubmissions = studentSubmissions.reduce(
        (sum, s) => sum + s.textSubmissions.length,
        0
    );
    const totalSubmissions = studentSubmissions.length;
    const displayStatus = getTaskDisplayStatus(task);

    const handleDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AccordionItem
            value={task.id}
            className="border rounded-lg px-4 mb-2"
        >
            <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{
                            backgroundColor: `${taskColor}20`,
                            color: taskColor,
                        }}
                    >
                        <TaskIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="font-semibold text-lg break-words mb-1">
                            {task.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {getTaskTypeLabel(task.type)} • {enrollmentsMap.size} student
                            {enrollmentsMap.size !== 1 ? "s" : ""} • {totalSubmissions}{" "}
                            submission
                            {totalSubmissions !== 1 ? "s" : ""}
                            {isDailyListening && totalTextSubmissions > 0 && (
                                <span>
                                    {" "}
                                    ({totalTextSubmissions} text
                                    {totalTextSubmissions !== 1 ? "s" : ""}, {totalFiles} file
                                    {totalFiles !== 1 ? "s" : ""})
                                </span>
                            )}
                            <Badge
                                variant="outline"
                                className={`ml-2 ${displayStatus === "scheduled"
                                    ? "bg-gray-50 text-gray-700 border-gray-200"
                                    : displayStatus === "published"
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    }`}
                            >
                                {displayStatus.charAt(0).toUpperCase() +
                                    displayStatus.slice(1)}
                            </Badge>
                        </div>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6">
                {studentSubmissions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>No student submissions for this task.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Action buttons for bulk operations */}
                        {totalFiles > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                                {(() => {
                                    const selectedForTask = getSelectedFilesForTask({
                                        task,
                                        studentSubmissions,
                                    });
                                    const allSelected =
                                        selectedForTask.length > 0 &&
                                        selectedForTask.length === totalFiles;
                                    return (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectAll(
                                                        { task, studentSubmissions },
                                                        !allSelected
                                                    );
                                                }}
                                            >
                                                {allSelected ? "Deselect All" : "Select All"}
                                            </Button>
                                            {selectedForTask.length > 0 && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteSelected();
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Selected ({selectedForTask.length})
                                                </Button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Student submissions */}
                        <Accordion type="multiple" className="w-full">
                            {studentSubmissions.map((studentSub) => {
                                const student = studentsMap.get(studentSub.studentId);
                                const enrollment = enrollmentsMap.get(studentSub.studentId);
                                return (
                                    <StudentAccordionItem
                                        key={studentSub.studentId}
                                        studentSub={studentSub}
                                        enrollment={enrollment}
                                        student={student}
                                        isDailyListening={isDailyListening}
                                        selectedFiles={selectedFiles}
                                        onSelectFile={onSelectFile}
                                        onPreview={onPreview}
                                        onPreviewText={onPreviewText}
                                        onDeleteFile={onDeleteFile}
                                        onDeleteText={onDeleteText}
                                        onDeleteSubmission={onDeleteSubmission}
                                        onDownload={handleDownload}
                                    />
                                );
                            })}
                        </Accordion>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>
    );
}
