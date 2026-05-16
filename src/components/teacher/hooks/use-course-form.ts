"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@/lib/models/course";
import {
    createCourse,
    deleteCourse,
    updateCourse,
} from "@/lib/services/firestore";
import { deleteFileByUrl, uploadFile } from "@/lib/services/storage";

// Normalize any localhost absolute URLs coming from the editor
function normalizeInternalLinks(html: string): string {
    if (!html) return html;
    return html.replace(/https?:\/\/localhost(?::\d+)?/g, "");
}

export function useCourseForm(courses: Course[]) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageUrl: "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid File",
                    description: "Please select an image file",
                    variant: "destructive",
                });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: "Please select an image smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }

            setSelectedFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getPlainText = (html: string) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent?.trim() ?? "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedDescription = normalizeInternalLinks(formData.description);
        const plainDescription = getPlainText(normalizedDescription);

        if (!formData.title.trim() || !plainDescription) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        if (!isEditing && !selectedFile) {
            toast({
                title: "Validation Error",
                description: "Please upload a course image",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            let imageUrl = existingImageUrl || "";

            if (selectedFile) {
                const timestamp = Date.now();
                const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                const filePath = `courses/${timestamp}_${sanitizedFileName}`;

                try {
                    imageUrl = await uploadFile(selectedFile, filePath, (progress) => {
                        setUploadProgress(progress);
                    });
                } catch (uploadError) {
                    toast({
                        title: "Upload Error",
                        description: uploadError instanceof Error ? uploadError.message : "Failed to upload image. Please try again.",
                        variant: "destructive",
                    });
                    setIsSubmitting(false);
                    setIsUploading(false);
                    return;
                }
            }

            setIsUploading(false);

            if (isEditing && editingId && selectedFile && existingImageUrl) {
                try {
                    await deleteFileByUrl(existingImageUrl);
                } catch (deleteError) {
                    console.warn("Failed to delete old image:", deleteError);
                }
            }

            if (isEditing && editingId) {
                await updateCourse(editingId, {
                    title: formData.title.trim(),
                    description: normalizedDescription.trim(),
                    imageUrl: imageUrl,
                });
                toast({
                    title: "Success",
                    description: "Course updated successfully",
                });
            } else {
                await createCourse({
                    title: formData.title.trim(),
                    description: normalizedDescription.trim(),
                    imageUrl: imageUrl,
                });
                toast({
                    title: "Success",
                    description: "Course created successfully",
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving course:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save course",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (course: Course) => {
        setFormData({
            title: course.title,
            description: course.description,
            imageUrl: course.imageUrl,
        });
        setExistingImageUrl(course.imageUrl);
        setImagePreview(course.imageUrl);
        setSelectedFile(null);
        setEditingId(course.id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course?")) {
            return;
        }

        try {
            const courseToDelete = courses.find(c => c.id === id);
            await deleteCourse(id);

            if (courseToDelete?.imageUrl) {
                try {
                    await deleteFileByUrl(courseToDelete.imageUrl);
                } catch (deleteError) {
                    console.warn("Failed to delete course image:", deleteError);
                }
            }

            toast({
                title: "Success",
                description: "Course deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting course:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete course",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            imageUrl: "",
        });
        setSelectedFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        setIsEditing(false);
        setEditingId(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            resetForm();
        }
    };

    return {
        isDialogOpen,
        isEditing,
        isSubmitting,
        isUploading,
        uploadProgress,
        selectedFile,
        imagePreview,
        existingImageUrl,
        fileInputRef,
        formData,
        setFormData,
        handleFileChange,
        handleRemoveFile,
        handleSubmit,
        handleEdit,
        handleDelete,
        resetForm,
        handleDialogOpenChange,
        getPlainText,
    };
}
