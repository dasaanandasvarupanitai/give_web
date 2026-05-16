"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Course } from "@/lib/models/course";
import { subscribeCourses } from "@/lib/services/firestore";
import { BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CourseCard } from "./courses/course-card";
import { CourseFormDialog } from "./courses/course-form-dialog";
import { useCourseForm } from "./hooks/use-course-form";

export function CourseManagement({ enabled = true }: { enabled?: boolean }) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!enabled) return;
        const unsubscribe = subscribeCourses((coursesList) => {
            setCourses(coursesList);
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
    } = useCourseForm(courses);

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
                    <h3 className="text-lg font-semibold">Courses</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage courses displayed on the homepage
                    </p>
                </div>
                <CourseFormDialog
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

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No courses added yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
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
