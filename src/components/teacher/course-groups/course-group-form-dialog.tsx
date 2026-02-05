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
import { Loader2, Plus } from "lucide-react";

interface CourseGroupFormData {
    name: string;
    description: string;
}

interface CourseGroupFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSubmitting: boolean;
    formData: CourseGroupFormData;
    onFormChange: (data: CourseGroupFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function CourseGroupFormDialog({
    isOpen,
    onOpenChange,
    isEditing,
    isSubmitting,
    formData,
    onFormChange,
    onSubmit,
    onCancel,
}: CourseGroupFormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course Group
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? "Edit Course Group" : "Create Course Group"}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the course group details"
                                : "Create a new course group to organize your courses"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Course Group Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., ISKCON Disciple Course"
                                value={formData.name}
                                onChange={(e) =>
                                    onFormChange({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what this course group covers..."
                                value={formData.description}
                                onChange={(e) =>
                                    onFormChange({ ...formData, description: e.target.value })
                                }
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {isEditing ? "Updating..." : "Creating..."}
                                </>
                            ) : isEditing ? (
                                "Update"
                            ) : (
                                "Create"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
