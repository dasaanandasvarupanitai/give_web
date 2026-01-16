"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import type { Testimonial } from "@/lib/models/testimonial";
import {
    createTestimonial,
    deleteTestimonial,
    subscribeTestimonials,
    updateTestimonial
} from "@/lib/services/firestore";
import { deleteFileByUrl, uploadFile } from "@/lib/services/storage";
import { Edit, Loader2, Plus, Trash2, User, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RichTextEditor } from "../ui/rich-text-editor";

export function TestimonialManagement() {
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
        // Subscribe to real-time updates
        const unsubscribe = subscribeTestimonials((testimonialsList) => {
            setTestimonials(testimonialsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid File",
                    description: "Please select an image file",
                    variant: "destructive",
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: "Please select an image smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }

            setSelectedFile(file);

            // Create preview
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

        // For new testimonials, require an image
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

            // Upload new image if one is selected
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

            // Delete old image if updating and new image was uploaded
            if (isEditing && editingId && selectedFile && existingImageUrl) {
                try {
                    await deleteFileByUrl(existingImageUrl);
                } catch (deleteError) {
                    // Log but don't fail - the new image is already uploaded
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
            // Find the testimonial to get its image URL
            const testimonialToDelete = testimonials.find(t => t.id === id);

            // Delete the testimonial
            await deleteTestimonial(id);

            // Delete the image from storage if it exists
            if (testimonialToDelete?.imageUrl) {
                try {
                    await deleteFileByUrl(testimonialToDelete.imageUrl);
                } catch (deleteError) {
                    // Log but don't fail - the testimonial is already deleted
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
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()} className="border border-orange-500">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Testimonial
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
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
                                            onChange={handleFileChange}
                                            className="cursor-pointer border-primary focus-visible:ring-primary"
                                            disabled={isSubmitting}
                                        />
                                        {(selectedFile || imagePreview) && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveFile}
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
                                    onClick={() => handleDialogOpenChange(false)}
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
                        <Card key={testimonial.id}>
                            <div className="relative h-48 w-full">
                                <Image
                                    src={testimonial.imageUrl}
                                    alt={testimonial.name}
                                    fill
                                    className="object-cover"
                                    draggable={false}
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-base font-bold">{testimonial.name}</CardTitle>
                                {testimonial.designation && (
                                    <CardDescription className="font-normal whitespace-pre-line">{testimonial.designation}</CardDescription>
                                )}
                                {testimonial.address && (
                                    <CardDescription className="font-normal">{testimonial.address}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {getPlainText(testimonial.description)}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(testimonial)}
                                        className="border border-orange-500"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(testimonial.id)}
                                        className="border border-orange-500"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

