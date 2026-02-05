"use client";

import type { Task } from "@/lib/models/task";
import { TaskFormDialog } from "./task-form-dialog";

interface TaskEditProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated?: () => void;
}

export function TaskEdit({ task, isOpen, onClose, onTaskUpdated }: TaskEditProps) {
    return (
        <TaskFormDialog
            mode="edit"
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
            initialData={task}
            onSuccess={onTaskUpdated}
        />
    );
}
