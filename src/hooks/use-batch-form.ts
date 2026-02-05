"use client";

import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import {
    createBatch,
    generateBatchCode,
    getBatchByClassCode,
    updateBatch,
} from "@/lib/services/firestore";
import { useEffect, useState } from "react";

interface UseBatchFormProps {
    open: boolean;
    mode: "create" | "edit";
    initialData?: Batch | null;
    courseGroupId: string;
    teacherId: string;
    onSuccess?: () => void;
    onOpenChange: (open: boolean) => void;
}

export function useBatchForm({
    open,
    mode,
    initialData,
    courseGroupId,
    teacherId,
    onSuccess,
    onOpenChange,
}: UseBatchFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        startDate: "",
        classCode: "",
    });

    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setFormData({
                    name: initialData.name,
                    description: initialData.description,
                    startDate: initialData.startDate
                        ? new Date(initialData.startDate).toISOString().split("T")[0]
                        : "",
                    classCode: "",
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    startDate: "",
                    classCode: "",
                });
            }
        }
    }, [open, mode, initialData]);

    const handleGenerateCode = () => {
        setFormData((prev) => ({ ...prev, classCode: generateBatchCode() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherId || !courseGroupId) return;

        if (!formData.name.trim() || !formData.description.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === "edit" && initialData) {
                await updateBatch(initialData.id, {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    startDate: formData.startDate ? new Date(formData.startDate) : undefined,
                });
                toast({
                    title: "Success",
                    description: "Batch updated successfully",
                });
            } else {
                let batchCode = formData.classCode.trim().toUpperCase();

                if (batchCode) {
                    if (!/^[^\s]{3,20}$/.test(batchCode)) {
                        toast({
                            title: "Invalid Class Code",
                            description: "Class code must be 3-20 characters and cannot contain spaces.",
                            variant: "destructive",
                        });
                        setIsSubmitting(false);
                        return;
                    }

                    const existingBatch = await getBatchByClassCode(batchCode);
                    if (existingBatch) {
                        toast({
                            title: "Class Code Already Exists",
                            description: "This class code is already in use. Please choose a different code.",
                            variant: "destructive",
                        });
                        setIsSubmitting(false);
                        return;
                    }
                } else {
                    batchCode = generateBatchCode();
                }

                await createBatch({
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    courseGroupId: courseGroupId,
                    teacherId: teacherId,
                    classCode: batchCode,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    studentCount: 0,
                    startDate: formData.startDate ? new Date(formData.startDate) : undefined,
                });
                toast({
                    title: "Success",
                    description: `Batch created! Class code: ${batchCode}`,
                });
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save batch",
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
        handleGenerateCode,
    };
}
