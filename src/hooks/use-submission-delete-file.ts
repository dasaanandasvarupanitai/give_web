import { deleteFileByUrl } from "@/lib/services/storage";
import { getSubmissionsByBatch, updateSubmission } from "@/lib/services/firestore";
import { useState } from "react";

interface UseSubmissionDeleteFileParams {
    batchId: string;
    onSuccess: () => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionDeleteFile({ batchId, onSuccess, toast }: UseSubmissionDeleteFileParams) {
    const [fileToDelete, setFileToDelete] = useState<{
        submissionId: string;
        fileUrl: string;
        fileName: string;
        studentId: string;
    } | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClick = (
        submissionId: string,
        fileUrl: string,
        fileName: string,
        studentId: string
    ) => {
        setFileToDelete({ submissionId, fileUrl, fileName, studentId });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!fileToDelete) return;

        setDeleting(true);
        try {
            const fileExisted = await deleteFileByUrl(fileToDelete.fileUrl);

            const submissions = await getSubmissionsByBatch(batchId);
            const submission = submissions.find((s) => s.id === fileToDelete.submissionId);

            if (submission) {
                const updates: Record<string, unknown> = {};

                if (submission.fileUrls && submission.fileUrls.length > 0) {
                    const updatedFileUrls = submission.fileUrls.filter(
                        (url) => url !== fileToDelete.fileUrl
                    );
                    if (updatedFileUrls.length !== submission.fileUrls.length) {
                        updates.fileUrls = updatedFileUrls;
                    }
                }

                if (submission.recordingUrl === fileToDelete.fileUrl) {
                    updates.recordingUrl = null;
                }

                if (Object.keys(updates).length > 0) {
                    await updateSubmission(fileToDelete.submissionId, updates as Parameters<typeof updateSubmission>[1]);
                }
            }

            toast({
                title: "Success",
                description: fileExisted
                    ? "File deleted successfully"
                    : "File reference removed (file was already deleted from storage)",
            });

            await onSuccess();
        } catch (error) {
            console.error("Error deleting file:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete file",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
            setFileToDelete(null);
        }
    };

    return {
        fileToDelete,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deleting,
        handleDeleteClick,
        handleDeleteConfirm,
    };
}
