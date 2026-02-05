"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Eye, FileText, Trash2 } from "lucide-react";

interface FileSubmissionCardProps {
    fileName: string;
    fileUrl: string;
    submissionId: string;
    studentId: string;
    taskTitle?: string;
    submittedAt?: Date;
    isSelected: boolean;
    onSelect: (fileUrl: string, checked: boolean) => void;
    onPreview: (fileUrl: string, fileName: string) => void;
    onDownload: (fileUrl: string, fileName: string) => void;
    onDelete: (submissionId: string, fileUrl: string, fileName: string, studentId: string) => void;
}

export function FileSubmissionCard({
    fileName,
    fileUrl,
    submissionId,
    studentId,
    taskTitle,
    submittedAt,
    isSelected,
    onSelect,
    onPreview,
    onDownload,
    onDelete,
}: FileSubmissionCardProps) {
    return (
        <div
            className={`flex flex-col p-3 bg-muted rounded-lg border gap-2 w-full ${isSelected ? "ring-2 ring-primary" : ""
                }`}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                        onSelect(fileUrl, checked === true)
                    }
                    className="flex-shrink-0"
                />
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span
                    className="text-sm break-words"
                    title={fileName}
                >
                    {fileName}
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
                    onClick={() => onPreview(fileUrl, fileName)}
                    title="Preview file"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDownload(fileUrl, fileName)}
                    title="Download file"
                >
                    <Download className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(submissionId, fileUrl, fileName, studentId)}
                    title="Delete file"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
