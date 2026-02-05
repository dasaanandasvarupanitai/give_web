"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { RefObject } from "react";

interface CourseFormData {
    title: string;
    description: string;
    imageUrl: string;
}

interface CourseFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSubmitting: boolean;
    isUploading: boolean;
    uploadProgress: number;
    formData: CourseFormData;
    setFormData: (data: CourseFormData) => void;
    selectedFile: File | null;
    imagePreview: string | null;
    existingImageUrl: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: () => void;
    onReset: () => void;
}

export function CourseFormDialog({
    isOpen,
    onOpenChange,
    isEditing,
    isSubmitting,
    isUploading,
    uploadProgress,
    formData,
    setFormData,
    selectedFile,
    imagePreview,
    existingImageUrl,
    fileInputRef,
    onSubmit,
    onFileChange,
    onRemoveFile,
    onReset,
}: CourseFormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button onClick={() => onReset()} className="border border-orange-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Course" : "Add Course"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the course details below."
                                : "Add a new course to display on the homepage."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter course title..."
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(val) => setFormData({ ...formData, description: val })}
                                placeholder="Add formatted course details, modules, links, and buttons..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Course Image *</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    ref={fileInputRef}
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="cursor-pointer border-primary focus-visible:ring-primary"
                                    disabled={isSubmitting}
                                />
                                {(selectedFile || imagePreview) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={onRemoveFile}
                                        disabled={isSubmitting}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            {isUploading && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Uploading...</span>
                                        <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {(imagePreview || (isEditing && existingImageUrl)) && (
                                <div className="relative h-48 w-full rounded-md overflow-hidden border">
                                    <Image
                                        src={imagePreview || existingImageUrl || ""}
                                        alt="Course preview"
                                        fill
                                        className="object-cover"
                                        onError={() => {
                                            // Image failed to load
                                        }}
                                    />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload an image for the course (max 5MB, JPG/PNG)
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="border border-orange-500"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="border border-orange-500">
                            {isSubmitting && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
