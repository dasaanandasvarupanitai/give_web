import { updateSubmission } from "@/lib/services/firestore";
import { useState } from "react";

interface UseSubmissionDeleteTextParams {
    onSuccess: () => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionDeleteText({ onSuccess, toast }: UseSubmissionDeleteTextParams) {
    const [textToDelete, setTextToDelete] = useState<{
        submissionId: string;
        studentId: string;
    } | null>(null);
    const [deleteTextDialogOpen, setDeleteTextDialogOpen] = useState(false);
    const [deletingText, setDeletingText] = useState(false);

    const handleDeleteTextClick = (submissionId: string, studentId: string) => {
        setTextToDelete({ submissionId, studentId });
        setDeleteTextDialogOpen(true);
    };

    const handleDeleteTextConfirm = async () => {
        if (!textToDelete) return;

        setDeletingText(true);
        try {
            await updateSubmission(textToDelete.submissionId, { notes: null as unknown as string });

            toast({
                title: "Success",
                description: "Text submission deleted successfully",
            });

            await onSuccess();
        } catch (error) {
            console.error("Error deleting text submission:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete text submission",
                variant: "destructive",
            });
        } finally {
            setDeletingText(false);
            setDeleteTextDialogOpen(false);
            setTextToDelete(null);
        }
    };

    return {
        textToDelete,
        deleteTextDialogOpen,
        setDeleteTextDialogOpen,
        deletingText,
        handleDeleteTextClick,
        handleDeleteTextConfirm,
    };
}
