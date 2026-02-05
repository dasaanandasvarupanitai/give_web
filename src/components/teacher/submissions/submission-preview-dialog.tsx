"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface PreviewFile {
    url: string;
    name: string;
    type: "pdf" | "video" | "audio" | "image" | "other" | "text";
    text?: string;
}

interface SubmissionPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: PreviewFile | null;
}

export function SubmissionPreviewDialog({
    open,
    onOpenChange,
    file,
}: SubmissionPreviewDialogProps) {
    if (!file) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[96vw] sm:w-[90vw] max-w-4xl p-2 sm:p-4">
                <DialogHeader className="p-0">
                    <DialogTitle className="text-base sm:text-lg">Preview</DialogTitle>
                </DialogHeader>
                <div className="mt-2 w-full max-h-[80vh]">
                    {file.type === "pdf" && (
                        <div className="w-full h-[70vh] sm:h-[75vh]">
                            <object
                                data={`${file.url}#toolbar=0&navpanes=0&scrollbar=1`}
                                type="application/pdf"
                                className="w-full h-full rounded border"
                                aria-label="PDF preview"
                            >
                                <iframe
                                    src={`${file.url}#toolbar=0&navpanes=0&scrollbar=1`}
                                    className="w-full h-full rounded border"
                                    title="PDF preview"
                                />
                            </object>
                        </div>
                    )}
                    {file.type === "video" && (
                        <video
                            controls
                            className="w-full max-h-[75vh] rounded border bg-black"
                            src={file.url}
                        />
                    )}
                    {file.type === "audio" && (
                        <audio controls className="w-full" src={file.url} />
                    )}
                    {file.type === "image" && (
                        <img
                            src={file.url}
                            alt="preview"
                            className="max-h-[75vh] w-full object-contain rounded border"
                        />
                    )}
                    {file.type === "text" && file.text && (
                        <div className="w-full max-h-[75vh] overflow-y-auto p-4 bg-muted rounded border">
                            <p className="whitespace-pre-wrap text-sm">{file.text}</p>
                        </div>
                    )}
                    {file.type === "other" && file.url && (
                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")}
                            >
                                Open in new tab
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
