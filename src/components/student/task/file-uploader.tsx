"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef } from "react";

interface FileUploaderProps {
    selectedFiles: File[];
    onFilesSelected: (files: File[]) => void;
    onFileRemoved: (index: number) => void;
    uploadProgress: Map<number, number>;
    isUploading: boolean;
    disabled: boolean;
    activeSubmissionType: 'text' | 'audio' | 'file' | null;
    taskType: string;
}

export function FileUploader({
    selectedFiles,
    onFilesSelected,
    onFileRemoved,
    uploadProgress,
    isUploading,
    disabled,
    activeSubmissionType,
    taskType
}: FileUploaderProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            // Validate file sizes (max 500MB per file)
            const maxSize = 500 * 1024 * 1024; // 500MB
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            files.forEach((file) => {
                if (file.size > maxSize) {
                    invalidFiles.push(file.name);
                } else {
                    validFiles.push(file);
                }
            });

            if (invalidFiles.length > 0) {
                toast({
                    title: "File Size Error",
                    description: `The following files exceed 500MB limit: ${invalidFiles.join(", ")}`,
                    variant: "destructive",
                });
            }

            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>File Upload</CardTitle>
                <CardDescription>
                    {taskType === "slokaMemorization"
                        ? "Upload the recorded videos (Max 500MB per file)"
                        : "Upload files: PDF, documents, pictures, videos, or audio (Max 500MB per file)"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled ||
                        (taskType === "dailyListening" && activeSubmissionType === 'text') ||
                        (taskType === "dailyListening" && activeSubmissionType === 'audio')
                    }
                />
                <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-orange-500"
                    disabled={disabled ||
                        isUploading ||
                        (taskType === "dailyListening" && activeSubmissionType === 'text') ||
                        (taskType === "dailyListening" && activeSubmissionType === 'audio')
                    }
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Select Files
                        </>
                    )}
                </Button>
                {taskType === "dailyListening" && activeSubmissionType === 'text' && (
                    <p className="text-sm text-muted-foreground mt-2">
                        File upload is disabled because text submission is active. Clear the text to enable file upload.
                    </p>
                )}
                {taskType === "dailyListening" && activeSubmissionType === 'audio' && (
                    <p className="text-sm text-muted-foreground mt-2">
                        File upload is disabled because audio recording is active. Remove the audio recording to enable file upload.
                    </p>
                )}

                {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => {
                            const progress = uploadProgress.get(index);
                            const isUploadingFile = isUploading && progress !== undefined && progress < 100;
                            const isFinalizing = isUploading && progress === 100;

                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm truncate block">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </span>
                                            {isUploadingFile && progress !== undefined && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                                        <div
                                                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-1 block">
                                                        Uploading... {Math.round(progress)}%
                                                    </span>
                                                </div>
                                            )}
                                            {isFinalizing && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-secondary rounded-full h-1.5">
                                                        <div className="bg-primary h-1.5 rounded-full animate-pulse w-full" />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-1 block">
                                                        Finalizing upload...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onFileRemoved(index)}
                                        disabled={isUploadingFile}
                                        className="flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
