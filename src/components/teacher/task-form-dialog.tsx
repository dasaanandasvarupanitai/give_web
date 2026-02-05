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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTaskForm } from "@/hooks/use-task-form";
import type { Task, TaskType } from "@/lib/models/task";
import { Headphones, Loader2 } from "lucide-react";
import { TaskTypeSelector, taskTypes } from "./tasks/task-type-selector";

interface TaskFormDialogProps {
    mode: "create" | "edit";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batchId?: string;
    teacherId?: string;
    batchName?: string;
    initialData?: Task;
    onSuccess?: () => void;
}

export function TaskFormDialog({
    mode,
    open,
    onOpenChange,
    batchId,
    teacherId,
    batchName,
    initialData,
    onSuccess,
}: TaskFormDialogProps) {
    const { formData, setFormData, isSubmitting, handleSubmit } = useTaskForm({
        open,
        mode,
        initialData,
        batchId,
        teacherId,
        onSuccess,
        onOpenChange,
    });

    const selectedTaskType = taskTypes.find((t) => t.value === formData.type);
    const TaskIcon = selectedTaskType?.icon || Headphones;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {mode === "create" ? "Create Task" : "Edit Task"}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === "create"
                                ? `Create a new task for ${batchName}`
                                : "Update task details"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Task Type *</Label>
                            <TaskTypeSelector
                                selectedType={formData.type}
                                onTypeChange={(type) => setFormData({ ...formData, type })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Task Title *</Label>
                            <Input
                                id="title"
                                placeholder="Enter task title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                className="bg-gray-100"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter task description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                className="bg-gray-100"
                                rows={3}
                                required
                            />
                        </div>

                        {mode === "edit" && (
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status *</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as Task["status"],
                                        })
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="start-date">
                                {mode === "create" ? "Start Date *" : "Start Date"}
                            </Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                className="bg-gray-100"
                                required={mode === "create"}
                                min={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
                            />
                            <p className="text-xs text-muted-foreground">
                                Task will be visible to students starting at 12:00 AM on this date
                                {mode === "edit" ? ". Leave empty to make it visible immediately." : ""}
                            </p>
                        </div>

                        {formData.type !== "announcement" && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="due-date">Due Date</Label>
                                        <Input
                                            id="due-date"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) =>
                                                setFormData({ ...formData, dueDate: e.target.value })
                                            }
                                            className="bg-gray-100"
                                            min={formData.startDate || undefined}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Submissions accepted until 11:59 PM on this date
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="points">Max Points</Label>
                                        <Input
                                            id="points"
                                            type="number"
                                            min="0"
                                            value={formData.maxPoints}
                                            onChange={(e) =>
                                                setFormData({ ...formData, maxPoints: e.target.value })
                                            }
                                            className="bg-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="late-submission">Allow Late Submission</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Students can submit after due date
                                            </p>
                                        </div>
                                        <Switch
                                            id="late-submission"
                                            checked={formData.allowLateSubmission}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, allowLateSubmission: checked })
                                            }
                                        />
                                    </div>
                                    {formData.allowLateSubmission && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="late-days">Days After Due Date</Label>
                                            <Input
                                                id="late-days"
                                                type="number"
                                                min="0"
                                                value={formData.lateSubmissionDays}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        lateSubmissionDays: e.target.value,
                                                    })
                                                }
                                                className="bg-gray-100"
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
                            <Textarea
                                id="instructions"
                                placeholder="Enter any specific instructions for students"
                                value={formData.instructions}
                                onChange={(e) =>
                                    setFormData({ ...formData, instructions: e.target.value })
                                }
                                className="bg-gray-100"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {mode === "create" ? "Creating..." : "Updating..."}
                                </>
                            ) : (
                                <>
                                    <TaskIcon className="h-4 w-4 mr-2" />
                                    {mode === "create" ? "Create Task" : "Update Task"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
