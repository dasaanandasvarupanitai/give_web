import { TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { useSubmissionDeleteAll } from "./use-submission-delete-all";
import { useSubmissionDeleteEntire } from "./use-submission-delete-entire";
import { useSubmissionDeleteFile } from "./use-submission-delete-file";
import { useSubmissionDeleteSelected } from "./use-submission-delete-selected";
import { useSubmissionDeleteText } from "./use-submission-delete-text";

interface UseSubmissionHandlersParams {
    tasksWithFiles: TaskFiles[];
    onSuccess: (taskId?: string) => Promise<void>;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionHandlers({
    tasksWithFiles,
    onSuccess,
    toast,
}: UseSubmissionHandlersParams) {
    const {
        fileToDelete,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deleting,
        handleDeleteClick,
        handleDeleteConfirm,
    } = useSubmissionDeleteFile({ onSuccess, toast });

    const {
        textToDelete,
        deleteTextDialogOpen,
        setDeleteTextDialogOpen,
        deletingText,
        handleDeleteTextClick,
        handleDeleteTextConfirm,
    } = useSubmissionDeleteText({ onSuccess, toast });

    const {
        taskToDeleteAll,
        deleteAllDialogOpen,
        setDeleteAllDialogOpen,
        deletingAll,
        handleDeleteAllClick,
        handleDeleteAllConfirm,
    } = useSubmissionDeleteAll({ onSuccess, toast });

    const {
        selectedFiles,
        deleteSelectedDialogOpen,
        setDeleteSelectedDialogOpen,
        deletingSelected,
        handleFileSelect,
        handleSelectAll,
        getSelectedFilesForTask,
        handleDeleteSelectedClick,
        handleDeleteSelectedConfirm,
    } = useSubmissionDeleteSelected({ tasksWithFiles, onSuccess, toast });

    const {
        submissionToDelete,
        deleteSubmissionDialogOpen,
        setDeleteSubmissionDialogOpen,
        deletingSubmission,
        handleDeleteSubmissionClick,
        handleDeleteSubmissionConfirm,
    } = useSubmissionDeleteEntire({ onSuccess, toast });

    const closeDialogs = () => {
        setDeleteDialogOpen(false);
        setDeleteTextDialogOpen(false);
        setDeleteAllDialogOpen(false);
        setDeleteSelectedDialogOpen(false);
        setDeleteSubmissionDialogOpen(false);
    };

    return {
        state: {
            fileToDelete,
            textToDelete,
            taskToDeleteAll,
            submissionToDelete,
            deleteDialogOpen,
            deleteTextDialogOpen,
            deleteAllDialogOpen,
            deleteSelectedDialogOpen,
            deleteSubmissionDialogOpen,
            deleting,
            deletingText,
            deletingAll,
            deletingSelected,
            deletingSubmission,
            selectedFiles,
        },
        handleDeleteClick,
        handleDeleteConfirm,
        handleDeleteTextClick,
        handleDeleteTextConfirm,
        handleDeleteAllClick,
        handleDeleteAllConfirm,
        handleDeleteSubmissionClick,
        handleDeleteSubmissionConfirm,
        handleFileSelect,
        handleSelectAll,
        getSelectedFilesForTask,
        handleDeleteSelectedClick,
        handleDeleteSelectedConfirm,
        closeDialogs,
    };
}
