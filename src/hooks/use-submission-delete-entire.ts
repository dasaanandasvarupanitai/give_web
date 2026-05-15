import { deleteSubmission } from "@/lib/services/firestore";
import { Submission } from "@/lib/models/submission";
import { useState } from "react";

interface UseSubmissionDeleteEntireParams {
    onSuccess: () => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionDeleteEntire({ onSuccess, toast }: UseSubmissionDeleteEntireParams) {
    const [submissionToDelete, setSubmissionToDelete] = useState<{
        submissionId: string;
        studentName: string;
        fileUrls: string[];
        recordingUrl?: string;
    } | null>(null);
    const [deleteSubmissionDialogOpen, setDeleteSubmissionDialogOpen] = useState(false);
    const [deletingSubmission, setDeletingSubmission] = useState(false);

    const handleDeleteSubmissionClick = (
        submissionId: string,
        studentName: string,
        fileUrls: string[],
        recordingUrl?: string
    ) => {
        setSubmissionToDelete({ submissionId, studentName, fileUrls, recordingUrl });
        setDeleteSubmissionDialogOpen(true);
    };

    const handleDeleteSubmissionConfirm = async () => {
        if (!submissionToDelete) return;

        setDeletingSubmission(true);
        try {
            const urlsToDelete = [
                ...submissionToDelete.fileUrls,
                submissionToDelete.recordingUrl || "",
            ].filter((url) => url && url.trim().length > 0);

            await deleteSubmission(submissionToDelete.submissionId, urlsToDelete);

            toast({
                title: "Success",
                description: `Submission for ${submissionToDelete.studentName} has been completely removed. They can now resubmit.`,
            });

            await onSuccess();
        } catch (error) {
            console.error("Error deleting entire submission:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete submission",
                variant: "destructive",
            });
        } finally {
            setDeletingSubmission(false);
            setDeleteSubmissionDialogOpen(false);
            setSubmissionToDelete(null);
        }
    };

    return {
        submissionToDelete,
        deleteSubmissionDialogOpen,
        setDeleteSubmissionDialogOpen,
        deletingSubmission,
        handleDeleteSubmissionClick,
        handleDeleteSubmissionConfirm,
    };
}
