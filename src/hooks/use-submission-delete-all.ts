import { Task } from "@/lib/models/task";
import { deleteFileByUrl } from "@/lib/services/storage";
import { getSubmissionsByTask, updateSubmission } from "@/lib/services/firestore";
import { useState } from "react";

interface UseSubmissionDeleteAllParams {
    onSuccess: (taskId?: string) => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionDeleteAll({ onSuccess, toast }: UseSubmissionDeleteAllParams) {
    const [taskToDeleteAll, setTaskToDeleteAll] = useState<Task | null>(null);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);

    const handleDeleteAllClick = (task: Task) => {
        setTaskToDeleteAll(task);
        setDeleteAllDialogOpen(true);
    };

    const handleDeleteAllConfirm = async () => {
        if (!taskToDeleteAll) return;

        setDeletingAll(true);
        try {
            // Only this task's submissions are needed — never the whole batch.
            const taskSubmissions = await getSubmissionsByTask(taskToDeleteAll.id);

            const deletePromises: Promise<void>[] = [];

            for (const submission of taskSubmissions) {
                const fileUrls = Array.isArray(submission.fileUrls) ? submission.fileUrls : [];

                for (const fileUrl of fileUrls) {
                    deletePromises.push(
                        deleteFileByUrl(fileUrl)
                            .then(() => { /* ignore result */ })
                            .catch(() => { /* intentionally empty */ })
                    );
                }

                if (submission.recordingUrl) {
                    deletePromises.push(
                        deleteFileByUrl(submission.recordingUrl)
                            .then(() => { /* ignore result */ })
                            .catch(() => { /* intentionally empty */ })
                    );
                }

                const updates: Record<string, unknown> = {};
                if (fileUrls.length > 0) updates.fileUrls = [];
                if (submission.recordingUrl) updates.recordingUrl = null;
                if (submission.notes && submission.notes.trim()) updates.notes = null;

                if (Object.keys(updates).length > 0) {
                    deletePromises.push(updateSubmission(submission.id, updates as Parameters<typeof updateSubmission>[1]).catch(() => { /* intentionally empty */ }));
                }
            }

            await Promise.all(deletePromises);

            toast({
                title: "Success",
                description: `All submissions for "${taskToDeleteAll.title}" deleted`,
            });

            await onSuccess(taskToDeleteAll.id);
        } catch (error) {
            console.error("Error deleting all files:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete all files",
                variant: "destructive",
            });
        } finally {
            setDeletingAll(false);
            setDeleteAllDialogOpen(false);
            setTaskToDeleteAll(null);
        }
    };

    return {
        taskToDeleteAll,
        deleteAllDialogOpen,
        setDeleteAllDialogOpen,
        deletingAll,
        handleDeleteAllClick,
        handleDeleteAllConfirm,
    };
}
