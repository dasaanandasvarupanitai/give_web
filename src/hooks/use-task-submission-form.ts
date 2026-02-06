import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import { useState } from "react";
import { useSubmissionMutations } from "./use-submission-mutations";

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

    const {
        isSubmitting,
        isUploading,
        isDeleting,
        uploadProgress,
        setUploadProgress,
        submitTask,
        deleteTaskSubmission,
    } = useSubmissionMutations({
        task,
        userId,
        submission,
        onSuccess: () => {
            setSubmissionJustCompleted(true);
            resetForm();
        },
        toast,
    });

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

        await submitTask(selectedFiles, audioBlob, notes, textSubmission);
    };

    const handleDeleteSubmission = async () => {
        if (!submission || !userId) return;

        if (!confirm("Are you sure you want to delete this submission? You can resubmit within the grace period.")) {
            return;
        }

        await deleteTaskSubmission(() => {
            setSubmissionJustCompleted(false);
            resetForm();
        });
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
