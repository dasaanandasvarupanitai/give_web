"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Testimonial } from "@/lib/models/testimonial";
import { subscribeTestimonials } from "@/lib/services/firestore";
import { Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { TestimonialCard } from "./testimonials/testimonial-card";
import { TestimonialFormDialog } from "./testimonials/testimonial-form-dialog";
import { useTestimonialForm } from "./hooks/use-testimonial-form";

export function TestimonialManagement({ enabled = true }: { enabled?: boolean }) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!enabled) return;
        const unsubscribe = subscribeTestimonials((testimonialsList) => {
            setTestimonials(testimonialsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [enabled]);

    const {
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
    } = useTestimonialForm(testimonials);

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
