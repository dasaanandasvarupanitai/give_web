import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import { createSubmission, deleteSubmission } from "@/lib/services/firestore";
import { uploadFile, uploadFiles } from "@/lib/services/storage";
import { useState } from "react";

interface UseSubmissionMutationsParams {
    task: Task | null;
    userId: string | undefined;
    submission: Submission | null;
    onSuccess: () => void;
    toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

export function useSubmissionMutations({
    task,
    userId,
    submission,
    onSuccess,
    toast,
}: UseSubmissionMutationsParams) {
    const [uploadProgress, setUploadProgress] = useState<Map<number, number>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const submitTask = async (
        selectedFiles: File[],
        audioBlob: Blob | null,
        notes: string,
        textSubmission: string
    ) => {
        if (!task || !userId) return;

        setIsSubmitting(true);
        setIsUploading(true);
        setUploadProgress(new Map());

        try {
            let fileUrls: string[] = [];
            let recordingUrl: string | undefined;

            if (selectedFiles.length > 0 && task.type !== "announcement") {
                const basePath = `submissions/${task.id}/${userId}`;
                try {
                    fileUrls = await uploadFiles(selectedFiles, basePath, (fileIndex, progress) => {
                        setUploadProgress((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(fileIndex, progress);
                            return newMap;
                        });
                    });
                } catch (uploadError) {
                    toast({
                        title: "Upload Error",
                        description: uploadError instanceof Error ? uploadError.message : "Failed to upload files.",
                        variant: "destructive",
                    });
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            }

            if (task.type === "dailyListening" && audioBlob) {
                try {
                    // Determine extension based on mime type
                    let extension = "webm";
                    if (audioBlob.type.includes("mp4")) {
                        extension = "mp4";
                    } else if (audioBlob.type.includes("ogg")) {
                        extension = "ogg";
                    }

                    const fileName = `recording_${Date.now()}.${extension}`;
                    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || `audio/${extension}` });
                    const basePath = `submissions/${task.id}/${userId}`;
                    recordingUrl = await uploadFile(audioFile, `${basePath}/${fileName}`);
                } catch (uploadError) {
                    toast({
                        title: "Upload Error",
                        description: uploadError instanceof Error ? uploadError.message : "Failed to upload audio.",
                        variant: "destructive",
                    });
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            }

            setIsUploading(false);

            const submissionNotes =
                task.type === "dailyListening"
                    ? textSubmission.trim() || undefined
                    : notes.trim() || undefined;

            const submissionData: Omit<Submission, "id"> = {
                taskId: task.id,
                studentId: userId,
                batchId: task.batchId,
                status: "submitted",
                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date(),
                fileUrls,
                recordingUrl,
                notes: submissionNotes,
            };

            await createSubmission(submissionData);
            onSuccess();

            toast({
                title: "Success",
                description: "Task submitted successfully!",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to submit task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
        }
    };

    const deleteTaskSubmission = async (onDeleteSuccess: () => void) => {
        if (!submission || !userId) return;

        setIsDeleting(true);
        try {
            const urlsToDelete = [
                ...(submission.fileUrls || []),
                submission.recordingUrl || "",
            ].filter((url) => url && url.trim().length > 0);

            await deleteSubmission(submission.id, urlsToDelete);
            onDeleteSuccess();

            toast({
                title: "Success",
                description: "Submission deleted. You can now resubmit.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete submission",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        isSubmitting,
        isUploading,
        isDeleting,
        uploadProgress,
        setUploadProgress,
        submitTask,
        deleteTaskSubmission,
    };
}
