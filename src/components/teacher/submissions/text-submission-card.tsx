"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Trash2 } from "lucide-react";

interface TextSubmissionCardProps {
    text: string;
    submissionId: string;
    studentId: string;
    taskTitle?: string;
    submittedAt?: Date;
    onPreview: (text: string, title?: string) => void;
    onDelete: (submissionId: string, studentId: string) => void;
}

export function TextSubmissionCard({
    text,
    submissionId,
    studentId,
    taskTitle,
    submittedAt,
    onPreview,
    onDelete,
}: TextSubmissionCardProps) {
    return (
        <div
            className="flex flex-col p-3 bg-muted rounded-lg border gap-2 w-full"
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium break-words">
                    Text Submission
                </span>
            </div>
            {taskTitle && (
                <div className="flex items-center gap-1">
                    <Badge
                        variant="outline"
                        className="text-xs"
                    >
                        {taskTitle}
                    </Badge>
                </div>
            )}
            <div className="text-sm text-muted-foreground line-clamp-3 break-words">
                {text}
            </div>
            {submittedAt && (
                <div className="text-xs text-muted-foreground">
                    Submitted:{" "}
                    {submittedAt.toLocaleString(
                        undefined,
                        {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        }
                    )}
                </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0 self-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPreview(text)}
                    title="View full text"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(submissionId, studentId)}
                    title="Delete text submission"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
