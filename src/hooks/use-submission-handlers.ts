import { deleteFileByUrl } from "@/lib/services/storage";
import { getSubmissionsByBatch, updateSubmission } from "@/lib/services/firestore";
import { useState } from "react";
import { Task } from "@/lib/models/task";
import { TaskFiles, StudentFile } from "@/components/teacher/submissions/submissions-list";

interface DeleteState {
    fileToDelete: {
        submissionId: string;
        fileUrl: string;
        fileName: string;
        studentId: string;
    } | null;
    textToDelete: {
        submissionId: string;
        studentId: string;
    } | null;
    taskToDeleteAll: Task | null;
    deleteDialogOpen: boolean;
    deleteTextDialogOpen: boolean;
    deleteAllDialogOpen: boolean;
    deleteSelectedDialogOpen: boolean;
    deleting: boolean;
    deletingText: boolean;
    deletingAll: boolean;
    deletingSelected: boolean;
    selectedFiles: Set<string>;
}

interface UseSubmissionHandlersParams {
    batchId: string;
    tasksWithFiles: TaskFiles[];
    onSuccess: () => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionHandlers({
    batchId,
    tasksWithFiles,
    onSuccess,
    toast,
}: UseSubmissionHandlersParams) {
    const [state, setState] = useState<DeleteState>({
        fileToDelete: null,
        textToDelete: null,
        taskToDeleteAll: null,
        deleteDialogOpen: false,
        deleteTextDialogOpen: false,
        deleteAllDialogOpen: false,
        deleteSelectedDialogOpen: false,
        deleting: false,
        deletingText: false,
        deletingAll: false,
        deletingSelected: false,
        selectedFiles: new Set(),
    });

    // Single file delete
    const handleDeleteClick = (
        submissionId: string,
        fileUrl: string,
        fileName: string,
        studentId: string
    ) => {
        setState((prev) => ({
            ...prev,
            fileToDelete: { submissionId, fileUrl, fileName, studentId },
            deleteDialogOpen: true,
        }));
    };

    const handleDeleteConfirm = async () => {
        if (!state.fileToDelete) return;

        setState((prev) => ({ ...prev, deleting: true }));
        try {
            const fileExisted = await deleteFileByUrl(state.fileToDelete.fileUrl);

            const submissions = await getSubmissionsByBatch(batchId);
            const submission = submissions.find((s) => s.id === state.fileToDelete!.submissionId);

            if (submission) {
                const updates: Record<string, unknown> = {};

                if (submission.fileUrls && submission.fileUrls.length > 0) {
                    const updatedFileUrls = submission.fileUrls.filter(
                        (url) => url !== state.fileToDelete!.fileUrl
                    );
                    if (updatedFileUrls.length !== submission.fileUrls.length) {
                        updates.fileUrls = updatedFileUrls;
                    }
                }

                if (submission.recordingUrl === state.fileToDelete.fileUrl) {
                    updates.recordingUrl = null;
                }

                if (Object.keys(updates).length > 0) {
                    await updateSubmission(state.fileToDelete.submissionId, updates as Parameters<typeof updateSubmission>[1]);
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
            setState((prev) => ({
                ...prev,
                deleting: false,
                deleteDialogOpen: false,
                fileToDelete: null,
            }));
        }
    };

    // Text delete
    const handleDeleteTextClick = (submissionId: string, studentId: string) => {
        setState((prev) => ({
            ...prev,
            textToDelete: { submissionId, studentId },
            deleteTextDialogOpen: true,
        }));
    };

    const handleDeleteTextConfirm = async () => {
        if (!state.textToDelete) return;

        setState((prev) => ({ ...prev, deletingText: true }));
        try {
            await updateSubmission(state.textToDelete.submissionId, { notes: null as unknown as string });

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
            setState((prev) => ({
                ...prev,
                deletingText: false,
                deleteTextDialogOpen: false,
                textToDelete: null,
            }));
        }
    };

    // Delete all for a task
    const handleDeleteAllClick = (task: Task) => {
        setState((prev) => ({
            ...prev,
            taskToDeleteAll: task,
            deleteAllDialogOpen: true,
        }));
    };

    const handleDeleteAllConfirm = async () => {
        if (!state.taskToDeleteAll) return;

        setState((prev) => ({ ...prev, deletingAll: true }));
        try {
            const submissions = await getSubmissionsByBatch(batchId);
            const taskSubmissions = submissions.filter((s) => s.taskId === state.taskToDeleteAll!.id);

            const deletePromises: Promise<void>[] = [];
            let filesDeleted = 0;
            let textSubmissionsDeleted = 0;

            for (const submission of taskSubmissions) {
                const fileUrls = Array.isArray(submission.fileUrls) ? submission.fileUrls : [];

                for (const fileUrl of fileUrls) {
                    deletePromises.push(
                        deleteFileByUrl(fileUrl)
                            .then((existed) => {
                                if (existed) filesDeleted++;
                            })
                            .catch(() => { /* intentionally empty */ })
                    );
                }

                if (submission.recordingUrl) {
                    deletePromises.push(
                        deleteFileByUrl(submission.recordingUrl)
                            .then((existed) => {
                                if (existed) filesDeleted++;
                            })
                            .catch(() => { /* intentionally empty */ })
                    );
                }

                if (submission.notes && submission.notes.trim()) {
                    textSubmissionsDeleted++;
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
                description: `All submissions for "${state.taskToDeleteAll.title}" deleted`,
            });

            await onSuccess();
        } catch (error) {
            console.error("Error deleting all files:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete all files",
                variant: "destructive",
            });
        } finally {
            setState((prev) => ({
                ...prev,
                deletingAll: false,
                deleteAllDialogOpen: false,
                taskToDeleteAll: null,
            }));
        }
    };

    // Multi-select handlers
    const handleFileSelect = (fileUrl: string, checked: boolean) => {
        setState((prev) => {
            const newSet = new Set(prev.selectedFiles);
            if (checked) {
                newSet.add(fileUrl);
            } else {
                newSet.delete(fileUrl);
            }
            return { ...prev, selectedFiles: newSet };
        });
    };

    const handleSelectAll = (taskFiles: TaskFiles, checked: boolean) => {
        setState((prev) => {
            const newSet = new Set(prev.selectedFiles);
            if (checked) {
                taskFiles.studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => newSet.add(file.fileUrl));
                });
            } else {
                taskFiles.studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => newSet.delete(file.fileUrl));
                });
            }
            return { ...prev, selectedFiles: newSet };
        });
    };

    const getSelectedFilesForTask = (taskFiles: TaskFiles): StudentFile[] => {
        const selected: StudentFile[] = [];
        taskFiles.studentSubmissions.forEach((studentSub) => {
            studentSub.files.forEach((file) => {
                if (state.selectedFiles.has(file.fileUrl)) {
                    selected.push(file);
                }
            });
        });
        return selected;
    };

    const handleDeleteSelectedClick = () => {
        setState((prev) => ({ ...prev, deleteSelectedDialogOpen: true }));
    };

    const handleDeleteSelectedConfirm = async () => {
        if (state.selectedFiles.size === 0) return;

        setState((prev) => ({ ...prev, deletingSelected: true }));
        try {
            const submissions = await getSubmissionsByBatch(batchId);
            const filesBySubmission = new Map<string, { fileUrl: string; fileName: string }[]>();

            tasksWithFiles.forEach(({ studentSubmissions }) => {
                studentSubmissions.forEach((studentSub) => {
                    studentSub.files.forEach((file) => {
                        if (state.selectedFiles.has(file.fileUrl)) {
                            const existing = filesBySubmission.get(file.submissionId) || [];
                            existing.push({ fileUrl: file.fileUrl, fileName: file.fileName });
                            filesBySubmission.set(file.submissionId, existing);
                        }
                    });
                });
            });

            const deletePromises: Promise<void>[] = [];

            for (const [submissionId, files] of filesBySubmission.entries()) {
                const submission = submissions.find((s) => s.id === submissionId);
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
                description: `${state.selectedFiles.size} file(s) deleted successfully`,
            });

            setState((prev) => ({ ...prev, selectedFiles: new Set() }));
            await onSuccess();
        } catch (error) {
            console.error("Error deleting selected files:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete selected files",
                variant: "destructive",
            });
        } finally {
            setState((prev) => ({
                ...prev,
                deletingSelected: false,
                deleteSelectedDialogOpen: false,
            }));
        }
    };

    const closeDialogs = () => {
        setState((prev) => ({
            ...prev,
            deleteDialogOpen: false,
            deleteTextDialogOpen: false,
            deleteAllDialogOpen: false,
            deleteSelectedDialogOpen: false,
            fileToDelete: null,
            textToDelete: null,
            taskToDeleteAll: null,
        }));
    };

    return {
        state,
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteTextClick,
        handleDeleteTextConfirm,
        handleDeleteAllClick,
        handleDeleteAllConfirm,
        handleFileSelect,
        handleSelectAll,
        getSelectedFilesForTask,
        handleDeleteSelectedClick,
        handleDeleteSelectedConfirm,
        closeDialogs,
    };
}
