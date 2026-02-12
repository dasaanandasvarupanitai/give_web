"use client";

import { useMemo } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task, TaskType } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import {
    getTaskDisplayStatus,
    getTaskTypeColor,
    getTaskTypeIcon,
    getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import { Trash2 } from "lucide-react";
import { FileSubmissionCard } from "./file-submission-card";
import { TextSubmissionCard } from "./text-submission-card";

export interface StudentFile {
    submissionId: string;
    fileUrl: string;
    fileName: string;
    studentId: string;
    taskId?: string;
    taskTitle?: string;
    submittedAt?: Date;
    type: "file";
}

export interface StudentTextSubmission {
    submissionId: string;
    text: string;
    studentId: string;
    taskId?: string;
    taskTitle?: string;
    submittedAt?: Date;
    type: "text";
}

export interface StudentSubmission {
    studentId: string;
    files: StudentFile[];
    textSubmissions: StudentTextSubmission[];
}

export interface TaskFiles {
    task: Task;
    studentSubmissions: StudentSubmission[];
}

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
    onDeleteSelected: () => void;
    getSelectedFilesForTask: (taskFiles: TaskFiles) => StudentFile[];
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
    onDeleteSelected,
    getSelectedFilesForTask,
}: SubmissionsListProps) {
    const handleDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-muted/30">
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
                    <AccordionContent className="p-4 bg-card">
                        <Accordion type="multiple" className="w-full space-y-2">
                            {groupedTasks[type].map(({ task, studentSubmissions }) => {
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

                                return (
                                    <AccordionItem
                                        key={task.id}
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
                                                            const studentName =
                                                                enrollment?.dikshaName ||
                                                                enrollment?.studentName ||
                                                                student?.name ||
                                                                "Unknown Student";
                                                            const fileCount = studentSub.files.length;
                                                            const certificateName =
                                                                enrollment?.studentName &&
                                                                    enrollment?.dikshaName &&
                                                                    enrollment.dikshaName !== enrollment.studentName
                                                                    ? enrollment.studentName
                                                                    : null;

                                                            return (
                                                                <AccordionItem
                                                                    key={studentSub.studentId}
                                                                    value={studentSub.studentId}
                                                                    className="border-b"
                                                                >
                                                                    <AccordionTrigger className="hover:no-underline">
                                                                        <div className="flex flex-wrap items-center justify-between w-full gap-2 sm:gap-3">
                                                                            <div className="flex flex-col items-start min-w-0 flex-1">
                                                                                <span className="font-medium text-base break-words">
                                                                                    {studentName}
                                                                                </span>
                                                                                {certificateName && (
                                                                                    <span className="text-sm text-muted-foreground break-words">
                                                                                        Certificate: {certificateName}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="ml-auto flex-shrink-0"
                                                                            >
                                                                                {fileCount + studentSub.textSubmissions.length}{" "}
                                                                                submission
                                                                                {(fileCount +
                                                                                    studentSub.textSubmissions.length) !==
                                                                                    1
                                                                                    ? "s"
                                                                                    : ""}
                                                                            </Badge>
                                                                        </div>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                                                            {/* Render text submissions first for daily listening */}
                                                                            {isDailyListening &&
                                                                                studentSub.textSubmissions.map(
                                                                                    (textSub, index) => (
                                                                                        <TextSubmissionCard
                                                                                            key={`text-${index}`}
                                                                                            text={textSub.text}
                                                                                            submissionId={textSub.submissionId}
                                                                                            studentId={textSub.studentId}
                                                                                            taskTitle={textSub.taskTitle}
                                                                                            submittedAt={textSub.submittedAt}
                                                                                            onPreview={onPreviewText}
                                                                                            onDelete={onDeleteText}
                                                                                        />
                                                                                    )
                                                                                )}

                                                                            {/* Render file submissions */}
                                                                            {studentSub.files.map((file, index) => (
                                                                                <FileSubmissionCard
                                                                                    key={`file-${index}`}
                                                                                    fileName={file.fileName}
                                                                                    fileUrl={file.fileUrl}
                                                                                    submissionId={file.submissionId}
                                                                                    studentId={file.studentId}
                                                                                    taskTitle={file.taskTitle}
                                                                                    submittedAt={file.submittedAt}
                                                                                    isSelected={selectedFiles.has(file.fileUrl)}
                                                                                    onSelect={onSelectFile}
                                                                                    onPreview={onPreview}
                                                                                    onDownload={handleDownload}
                                                                                    onDelete={onDeleteFile}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            );
                                                        })}
                                                    </Accordion>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
