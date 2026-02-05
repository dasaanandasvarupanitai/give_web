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
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { RefObject } from "react";

interface TestimonialFormData {
    name: string;
    designation: string;
    address: string;
    description: string;
    imageUrl: string;
}

interface TestimonialFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSubmitting: boolean;
    isUploading: boolean;
    uploadProgress: number;
    formData: TestimonialFormData;
    setFormData: (data: TestimonialFormData) => void;
    selectedFile: File | null;
    imagePreview: string | null;
    existingImageUrl: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onSubmit: (e: React.FormEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: () => void;
    onReset: () => void;
}

export function TestimonialFormDialog({
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
}: TestimonialFormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button onClick={() => onReset()} className="border border-orange-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Testimonial
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the testimonial details below."
                                : "Add a new testimonial to display on the homepage."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Enter person's name..."
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Textarea
                                id="designation"
                                placeholder="Enter designation (optional)... Press Enter for new line"
                                value={formData.designation}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                    setFormData({ ...formData, designation: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="Enter address (optional)..."
                                value={formData.address}
                                onChange={(e) =>
                                    setFormData({ ...formData, address: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(val) => setFormData({ ...formData, description: val })}
                                placeholder="Add formatted testimonial description with paragraphs, lists, links, etc..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Student Image *</Label>
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
                                <div
                                    className="relative h-48 w-full rounded-md overflow-hidden border"
                                    onContextMenu={(e) => e.preventDefault()}
                                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                                >
                                    <Image
                                        src={imagePreview || existingImageUrl || ""}
                                        alt="Testimonial preview"
                                        fill
                                        className="object-cover"
                                        draggable={false}
                                        onError={() => {
                                            // Image failed to load
                                        }}
                                    />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Upload an image for the testimonial (max 5MB, JPG/PNG). Images are protected from downloading.
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
