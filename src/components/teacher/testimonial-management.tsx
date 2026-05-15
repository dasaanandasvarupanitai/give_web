"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Testimonial } from "@/lib/models/testimonial";
import {
    createTestimonial,
    deleteTestimonial,
    subscribeTestimonials,
    updateTestimonial
} from "@/lib/services/firestore";
import { deleteFileByUrl, uploadFile } from "@/lib/services/storage";
import { Loader2, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TestimonialCard } from "./testimonials/testimonial-card";
import { TestimonialFormDialog } from "./testimonials/testimonial-form-dialog";

export function TestimonialManagement({ enabled = true }: { enabled?: boolean }) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
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
        name: "",
        designation: "",
        address: "",
        description: "",
        imageUrl: "",
    });

    useEffect(() => {
        if (!enabled) return;
        const unsubscribe = subscribeTestimonials((testimonialsList) => {
            setTestimonials(testimonialsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [enabled]);

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

        if (!formData.name.trim() || !formData.description.trim()) {
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
                description: "Please upload a testimonial image",
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
                const filePath = `testimonials/${timestamp}_${sanitizedFileName}`;

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
                await updateTestimonial(editingId, {
                    name: formData.name.trim(),
                    designation: formData.designation.trim(),
                    address: formData.address.trim(),
                    description: formData.description.trim(),
                    imageUrl: imageUrl,
                });
                toast({
                    title: "Success",
                    description: "Testimonial updated successfully",
                });
            } else {
                await createTestimonial({
                    name: formData.name.trim(),
                    designation: formData.designation.trim(),
                    address: formData.address.trim(),
                    description: formData.description.trim(),
                    imageUrl: imageUrl,
                });
                toast({
                    title: "Success",
                    description: "Testimonial created successfully",
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save testimonial",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (testimonial: Testimonial) => {
        setFormData({
            name: testimonial.name,
            designation: testimonial.designation,
            address: testimonial.address,
            description: testimonial.description,
            imageUrl: testimonial.imageUrl,
        });
        setExistingImageUrl(testimonial.imageUrl);
        setImagePreview(testimonial.imageUrl);
        setSelectedFile(null);
        setEditingId(testimonial.id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this testimonial?")) {
            return;
        }

        try {
            const testimonialToDelete = testimonials.find(t => t.id === id);
            await deleteTestimonial(id);

            if (testimonialToDelete?.imageUrl) {
                try {
                    await deleteFileByUrl(testimonialToDelete.imageUrl);
                } catch (deleteError) {
                    console.warn("Failed to delete testimonial image:", deleteError);
                }
            }

            toast({
                title: "Success",
                description: "Testimonial deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete testimonial",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            designation: "",
            address: "",
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Testimonials</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage testimonials displayed on the homepage
                    </p>
                </div>
                <TestimonialFormDialog
                    isOpen={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    isEditing={isEditing}
                    isSubmitting={isSubmitting}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    formData={formData}
                    setFormData={setFormData}
                    selectedFile={selectedFile}
                    imagePreview={imagePreview}
                    existingImageUrl={existingImageUrl}
                    fileInputRef={fileInputRef}
                    onSubmit={handleSubmit}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                    onReset={resetForm}
                />
            </div>

            {testimonials.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No testimonials added yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial) => (
                        <TestimonialCard
                            key={testimonial.id}
                            testimonial={testimonial}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            getPlainText={getPlainText}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
