import { StudentFile, TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { deleteFileByUrl } from "@/lib/services/storage";
import { getSubmissionById, updateSubmission } from "@/lib/services/firestore";
import { useState } from "react";

interface UseSubmissionDeleteSelectedParams {
    tasksWithFiles: TaskFiles[];
    onSuccess: (taskId?: string) => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionDeleteSelected({
    tasksWithFiles,
    onSuccess,
    toast,
}: UseSubmissionDeleteSelectedParams) {
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
    const [deletingSelected, setDeletingSelected] = useState(false);

    const handleFileSelect = (fileUrl: string, checked: boolean) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(fileUrl);
            } else {
                newSet.delete(fileUrl);
            }
            return newSet;
        });
    };

    const handleSelectAll = (taskFiles: TaskFiles, checked: boolean) => {
        setSelectedFiles((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                taskFiles.studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => newSet.add(file.fileUrl));
                });
            } else {
                taskFiles.studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => newSet.delete(file.fileUrl));
                });
            }
            return newSet;
        });
    };

    const getSelectedFilesForTask = (taskFiles: TaskFiles): StudentFile[] => {
        const selected: StudentFile[] = [];
        taskFiles.studentSubmissions.forEach((studentSub) => {
            studentSub.files.forEach((file) => {
                if (selectedFiles.has(file.fileUrl)) {
                    selected.push(file);
                }
            });
        });
        return selected;
    };

    const handleDeleteSelectedClick = () => {
        if (selectedFiles.size > 0) {
            setDeleteSelectedDialogOpen(true);
        }
    };

    const handleDeleteSelectedConfirm = async () => {
        if (selectedFiles.size === 0) return;

        setDeletingSelected(true);
        try {
            const filesBySubmission = new Map<string, { fileUrl: string; fileName: string }[]>();

            tasksWithFiles.forEach(({ studentSubmissions }) => {
                studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => {
                        if (selectedFiles.has(file.fileUrl)) {
                            const existing = filesBySubmission.get(file.submissionId) || [];
                            existing.push({ fileUrl: file.fileUrl, fileName: file.fileName });
                            filesBySubmission.set(file.submissionId, existing);
                        }
                    });
                });
            });

            const deletePromises: Promise<void>[] = [];

            for (const [submissionId, files] of filesBySubmission.entries()) {
                // Read only the submissions being edited, not the whole batch.
                const submission = await getSubmissionById(submissionId);
                if (!submission) continue;

                for (const file of files) {
                    deletePromises.push(deleteFileByUrl(file.fileUrl).then(() => { /* ignore result */ }).catch(() => { /* intentionally empty */ }));
                }

                const updatedFileUrls = submission.fileUrls.filter(
                    (url) => !files.some((f) => f.fileUrl === url)
                );

                if (updatedFileUrls.length !== submission.fileUrls.length) {
                    deletePromises.push(
                        updateSubmission(submissionId, { fileUrls: updatedFileUrls }).catch(() => { /* intentionally empty */ })
                    );
                }
            }

            await Promise.all(deletePromises);

            toast({
                title: "Success",
                description: `${selectedFiles.size} file(s) deleted successfully`,
            });

            setSelectedFiles(new Set());
            await onSuccess();
        } catch (error) {
            console.error("Error deleting selected files:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete selected files",
                variant: "destructive",
            });
        } finally {
            setDeletingSelected(false);
            setDeleteSelectedDialogOpen(false);
        }
    };

    return {
        selectedFiles,
        setSelectedFiles, // Exported to allow reset if needed from parent
        deleteSelectedDialogOpen,
        setDeleteSelectedDialogOpen,
        deletingSelected,
        handleFileSelect,
        handleSelectAll,
        getSelectedFilesForTask,
        handleDeleteSelectedClick,
        handleDeleteSelectedConfirm,
    };
}
