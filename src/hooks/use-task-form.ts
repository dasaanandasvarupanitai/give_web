"use client";

import { useToast } from "@/hooks/use-toast";
import type { Task, TaskType } from "@/lib/models/task";
import { createTask, updateTask } from "@/lib/services/firestore";
import { dateFromBangladeshTime, dateToBangladeshTime } from "@/lib/utils";
import { useEffect, useState } from "react";

interface UseTaskFormProps {
    open: boolean;
    mode: "create" | "edit";
    initialData?: Task;
    batchId?: string;
    teacherId?: string;
    onSuccess?: () => void;
    onOpenChange: (open: boolean) => void;
}

export function useTaskForm({
    open,
    mode,
    initialData,
    batchId,
    teacherId,
    onSuccess,
    onOpenChange,
}: UseTaskFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        type: "dailyListening" as TaskType,
        title: "",
        description: "",
        startDate: "",
        dueDate: "",
        maxPoints: "100",
        allowLateSubmission: true,
        lateSubmissionDays: "3",
        instructions: "",
        status: "published" as Task["status"],
    });

    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setFormData({
                    type: initialData.type,
                    title: initialData.title,
                    description: initialData.description,
                    startDate: initialData.startDate
                        ? dateFromBangladeshTime(initialData.startDate)
                        : "",
                    dueDate: initialData.dueDate
                        ? dateFromBangladeshTime(initialData.dueDate)
                        : "",
                    maxPoints: initialData.maxPoints.toString(),
                    allowLateSubmission: initialData.allowLateSubmission,
                    lateSubmissionDays: initialData.lateSubmissionDays.toString(),
                    instructions: initialData.instructions || "",
                    status: initialData.status,
                });
            } else if (mode === "create") {
                setFormData({
                    type: "dailyListening",
                    title: "",
                    description: "",
                    startDate: "",
                    dueDate: "",
                    maxPoints: "100",
                    allowLateSubmission: true,
                    lateSubmissionDays: "3",
                    instructions: "",
                    status: "published",
                });
            }
        }
    }, [open, mode, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const startDate = formData.startDate
                ? dateToBangladeshTime(formData.startDate, 0, 0, 0, 0)
                : undefined;

            const dueDate =
                formData.type !== "announcement" && formData.dueDate
                    ? dateToBangladeshTime(formData.dueDate, 23, 59, 59, 999)
                    : undefined;

            const maxPoints =
                formData.type === "announcement" ? 0 : parseInt(formData.maxPoints) || 100;

            const allowLateSubmission =
                formData.type === "announcement" ? false : formData.allowLateSubmission;

            const lateSubmissionDays =
                formData.type === "announcement"
                    ? 0
                    : parseInt(formData.lateSubmissionDays) || 3;

            const instructions = formData.instructions.trim() || undefined;

            if (mode === "create") {
                if (!batchId || !teacherId) throw new Error("Missing batch or teacher ID");

                await createTask({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    batchId,
                    teacherId,
                    type: formData.type,
                    status: "published",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    dueDate,
                    maxPoints,
                    attachments: [],
                    allowedFileTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
                    allowLateSubmission,
                    lateSubmissionDays,
                    instructions,
                    submissionCount: 0,
                });

                toast({
                    title: "Success",
                    description: "Task created successfully",
                });
            } else {
                if (!initialData?.id) throw new Error("Missing task ID");

                await updateTask(initialData.id, {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    type: formData.type,
                    status: formData.status,
                    startDate,
                    dueDate,
                    maxPoints,
                    allowLateSubmission,
                    lateSubmissionDays,
                    instructions,
                });

                toast({
                    title: "Success",
                    description: "Task updated successfully",
                });
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : `Failed to ${mode} task`,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        setFormData,
        isSubmitting,
        handleSubmit,
    };
}
