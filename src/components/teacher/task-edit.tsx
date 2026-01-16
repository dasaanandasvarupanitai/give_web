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
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Task, TaskType } from "@/lib/models/task";
import { updateTask } from "@/lib/services/firestore";
import { dateFromBangladeshTime, dateToBangladeshTime } from "@/lib/utils";
import {
    BookOpen,
    FileQuestion,
    FileText,
    Headphones,
    Loader2,
    Megaphone,
} from "lucide-react";
import { useEffect, useState } from "react";

interface TaskEditProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated?: () => void;
}

const taskTypes: { value: TaskType; label: string; icon: typeof Headphones }[] = [
    { value: "dailyListening", label: "Daily Listening", icon: Headphones },
    { value: "cba", label: "CBA", icon: FileQuestion },
    { value: "oba", label: "OBA", icon: FileText },
    { value: "slokaMemorization", label: "Sloka Memorization", icon: BookOpen },
    { value: "announcement", label: "Announcement", icon: Megaphone },
];

export function TaskEdit({ task, isOpen, onClose, onTaskUpdated }: TaskEditProps) {
    const { user } = useAuthUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        type: task.type,
        title: task.title,
        description: task.description,
        startDate: task.startDate
            ? dateFromBangladeshTime(task.startDate)
            : "",
        dueDate: task.dueDate
            ? dateFromBangladeshTime(task.dueDate)
            : "",
        maxPoints: task.maxPoints.toString(),
        allowLateSubmission: task.allowLateSubmission,
        lateSubmissionDays: task.lateSubmissionDays.toString(),
        instructions: task.instructions || "",
        status: task.status,
    });

    // Update form data when task changes
    useEffect(() => {
        if (task) {
            setFormData({
                type: task.type,
                title: task.title,
                description: task.description,
                startDate: task.startDate
                    ? dateFromBangladeshTime(task.startDate)
                    : "",
                dueDate: task.dueDate
                    ? dateFromBangladeshTime(task.dueDate)
                    : "",
                maxPoints: task.maxPoints.toString(),
                allowLateSubmission: task.allowLateSubmission,
                lateSubmissionDays: task.lateSubmissionDays.toString(),
                instructions: task.instructions || "",
                status: task.status,
            });
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;

        if (!formData.title.trim() || !formData.description.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Set start date to 12:00 AM in Bangladesh timezone (UTC+6)
            const startDate = formData.startDate
                ? dateToBangladeshTime(formData.startDate, 0, 0, 0, 0)
                : undefined;

            await updateTask(task.id, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                type: formData.type,
                status: formData.status,
                startDate: startDate,
                dueDate:
                    formData.type !== "announcement" && formData.dueDate
                        ? dateToBangladeshTime(formData.dueDate, 23, 59, 59, 999)
                        : undefined,
                maxPoints:
                    formData.type === "announcement" ? 0 : parseInt(formData.maxPoints) || 100,
                allowLateSubmission:
                    formData.type === "announcement" ? false : formData.allowLateSubmission,
                lateSubmissionDays:
                    formData.type === "announcement"
                        ? 0
                        : parseInt(formData.lateSubmissionDays) || 3,
                instructions: formData.instructions.trim() || undefined,
            });

            toast({
                title: "Success",
                description: "Task updated successfully",
            });

            onClose();
            onTaskUpdated?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedTaskType = taskTypes.find((t) => t.value === formData.type);
    const TaskIcon = selectedTaskType?.icon || Headphones;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update task details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Task Type Selection */}
                        <div className="grid gap-2">
                            <Label>Task Type *</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {taskTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isSelected = formData.type === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: type.value })}
                                            className={`p-3 border rounded-lg text-left transition-colors ${isSelected
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:bg-muted"
                                                }`}
                                        >
                                            <Icon className="h-5 w-5 mb-2" />
                                            <p className="text-sm font-medium">{type.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Basic Information */}
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

                        {/* Status */}
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status *</Label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value as Task["status"] })
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        {/* Start Date - When task becomes visible to students */}
                        <div className="grid gap-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                                className="bg-gray-100"
                            />
                            <p className="text-xs text-muted-foreground">
                                Task will be visible to students starting at 12:00 AM on this date. Leave empty to make it visible immediately.
                            </p>
                        </div>

                        {/* Due Date and Points (not for announcements) */}
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

                                {/* Late Submission Settings */}
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

                        {/* Instructions */}
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
                            onClick={onClose}
                            className="bg-gray-200 hover:bg-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <TaskIcon className="h-4 w-4 mr-2" />
                                    Update Task
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

