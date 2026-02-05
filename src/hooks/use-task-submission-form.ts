import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import {
    createSubmission,
    deleteSubmission,
} from "@/lib/services/firestore";
import { uploadFile, uploadFiles } from "@/lib/services/storage";
import { useState } from "react";

interface UseTaskSubmissionFormParams {
    task: Task | null;
    userId: string | undefined;
    submission: Submission | null;
    toast: (params: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

export function useTaskSubmissionForm({
    task,
    userId,
    submission,
    toast,
}: UseTaskSubmissionFormParams) {
    const [notes, setNotes] = useState("");
    const [textSubmission, setTextSubmission] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<Map<number, number>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submissionJustCompleted, setSubmissionJustCompleted] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [activeSubmissionType, setActiveSubmissionType] = useState<"text" | "audio" | "file" | null>(null);

    const resetForm = () => {
        setSelectedFiles([]);
        setNotes("");
        setTextSubmission("");
        setUploadProgress(new Map());
        setAudioBlob(null);
        setIsRecording(false);
    };

    const handleSubmit = async (
        dueDatePassed: boolean,
        lateSubmissionAllowed: boolean,
        gracePeriodPassed: boolean
    ) => {
        if (!task || !userId) return;

        if (dueDatePassed && !submission && !lateSubmissionAllowed) {
            toast({
                title: "Due Date Passed",
                description: "The due date for this task has passed. You can no longer submit.",
                variant: "destructive",
            });
            return;
        }

        if (gracePeriodPassed) {
            toast({
                title: "Grace Period Expired",
                description: "The grace period for editing your submission has expired.",
                variant: "destructive",
            });
            return;
        }

        if (task.type !== "announcement") {
            if (task.type === "dailyListening") {
                if (selectedFiles.length === 0 && !textSubmission.trim() && !audioBlob) {
                    toast({
                        title: "Validation Error",
                        description: "Please add a text submission, upload a file, or record audio",
                        variant: "destructive",
                    });
                    return;
                }
            } else {
                if (selectedFiles.length === 0 && !notes.trim()) {
                    toast({
                        title: "Validation Error",
                        description: "Please add at least one submission (file or notes)",
                        variant: "destructive",
                    });
                    return;
                }
            }
        }

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
                    const fileName = `recording_${Date.now()}.webm`;
                    const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });
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
            setSubmissionJustCompleted(true);

            toast({
                title: "Success",
                description: "Task submitted successfully!",
            });

            resetForm();
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

    const handleDeleteSubmission = async () => {
        if (!submission || !userId) return;

        if (!confirm("Are you sure you want to delete this submission? You can resubmit within the grace period.")) {
            return;
        }

        setIsDeleting(true);
        try {
            const urlsToDelete = [
                ...(submission.fileUrls || []),
                submission.recordingUrl || "",
            ].filter((url) => url && url.trim().length > 0);

            await deleteSubmission(submission.id, urlsToDelete);
            setSubmissionJustCompleted(false);

            toast({
                title: "Success",
                description: "Submission deleted. You can now resubmit.",
            });

            resetForm();
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
        // Form state
        notes,
        setNotes,
        textSubmission,
        setTextSubmission,
        selectedFiles,
        setSelectedFiles,
        uploadProgress,
        setUploadProgress,
        audioBlob,
        setAudioBlob,
        isRecording,
        setIsRecording,
        activeSubmissionType,
        setActiveSubmissionType,

        // Submission state
        isSubmitting,
        isUploading,
        isDeleting,
        submissionJustCompleted,
        setSubmissionJustCompleted,

        // Actions
        handleSubmit,
        handleDeleteSubmission,
        resetForm,
    };
}
