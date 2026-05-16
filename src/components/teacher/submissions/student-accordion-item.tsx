"use client";

import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import { Trash2 } from "lucide-react";
import { FileSubmissionCard } from "./file-submission-card";
import { TextSubmissionCard } from "./text-submission-card";
import type { StudentSubmission } from "./types";

interface StudentAccordionItemProps {
    studentSub: StudentSubmission;
    enrollment?: Enrollment;
    student?: User;
    isDailyListening: boolean;
    selectedFiles: Set<string>;
    onSelectFile: (fileUrl: string, checked: boolean) => void;
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
    onDownload: (fileUrl: string, fileName: string) => void;
}

export function StudentAccordionItem({
    studentSub,
    enrollment,
    student,
    isDailyListening,
    selectedFiles,
    onSelectFile,
    onPreview,
    onPreviewText,
    onDeleteFile,
    onDeleteText,
    onDeleteSubmission,
    onDownload,
}: StudentAccordionItemProps) {
    const fileCount = studentSub.files.length;
    const studentName =
        enrollment?.dikshaName ||
        enrollment?.studentName ||
        student?.name ||
        "Unknown Student";
    const certificateName =
        enrollment?.studentName &&
            enrollment?.dikshaName &&
            enrollment.dikshaName !== enrollment.studentName
            ? enrollment.studentName
            : null;

    return (
        <AccordionItem
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
                    {studentSub.isArchived && (
                        <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                            Archived
                        </Badge>
                    )}
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="flex justify-end pt-2 pb-4 border-b mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Get the first available submission ID from either files or text
                            const subId = studentSub.files[0]?.submissionId || studentSub.textSubmissions[0]?.submissionId;
                            if (subId) {
                                onDeleteSubmission(
                                    subId,
                                    studentName,
                                    studentSub.files.map(f => f.fileUrl)
                                );
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Entire Submission & Allow Resubmit
                    </Button>
                </div>
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
                            onDownload={onDownload}
                            onDelete={onDeleteFile}
                        />
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
