"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBatchForm } from "@/hooks/use-batch-form";
import type { Batch } from "@/lib/models/batch";
import { Loader2 } from "lucide-react";

interface BatchFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "create" | "edit";
    initialData?: Batch | null;
    courseGroupId: string;
    courseGroupName?: string;
    teacherId: string;
    onSuccess?: () => void;
}

export function BatchFormDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    courseGroupId,
    courseGroupName,
    teacherId,
    onSuccess,
}: BatchFormDialogProps) {
    const {
        formData,
        setFormData,
        isSubmitting,
        handleSubmit,
        handleGenerateCode,
    } = useBatchForm({
        open,
        mode,
        initialData,
        courseGroupId,
        teacherId,
        onSuccess,
        onOpenChange,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl w-[90vw] sm:w-full max-h-[90vh] sm:max-h-[95vh] overflow-y-auto p-4 sm:p-6">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="text-left space-y-1.5 sm:space-y-2">
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl">
                            {mode === "edit" ? "Edit Batch" : "Create Batch"}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {mode === "edit"
                                ? "Update the batch details"
                                : "Create a new batch for students to join"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:gap-5 py-4 sm:py-6">
                        {courseGroupName && (
                            <div className="p-3 sm:p-4 bg-muted rounded-lg">
                                <p className="text-xs sm:text-sm text-muted-foreground">Course Group</p>
                                <p className="font-medium text-sm sm:text-base mt-1">{courseGroupName}</p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="batch-name" className="text-sm sm:text-base">Batch Name *</Label>
                            <Input
                                id="batch-name"
                                placeholder="e.g., Batch 1 - Morning"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="text-sm sm:text-base"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="batch-description" className="text-sm sm:text-base">Description *</Label>
                            <Textarea
                                id="batch-description"
                                placeholder="Describe the batch, schedule, and any special instructions..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={4}
                                className="text-sm sm:text-base resize-none"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="start-date" className="text-sm sm:text-base">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                className="text-sm sm:text-base"
                            />
                        </div>
                        {mode === "create" && (
                            <div className="grid gap-2">
                                <Label htmlFor="class-code" className="text-sm sm:text-base">
                                    Class Code (Optional)
                                    <span className="text-xs text-muted-foreground ml-1 sm:ml-2 block sm:inline">
                                        Leave empty to auto-generate
                                    </span>
                                </Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        id="class-code"
                                        placeholder="e.g., BATCH-1, CLASS_2024!"
                                        value={formData.classCode}
                                        onChange={(e) =>
                                            setFormData({ ...formData, classCode: e.target.value.toUpperCase() })
                                        }
                                        maxLength={20}
                                        className="flex-1 text-sm sm:text-base"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleGenerateCode}
                                        className="border border-orange-500 text-sm sm:text-base whitespace-nowrap"
                                    >
                                        Generate
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    3-20 characters. Must be unique.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border border-orange-500 w-full sm:w-auto text-sm sm:text-base"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="border border-orange-500 w-full sm:w-auto text-sm sm:text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === "edit" ? "Updating..." : "Creating..."}
                                </>
                            ) : mode === "edit" ? (
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
