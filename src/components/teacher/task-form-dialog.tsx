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
import { createTask, updateTask } from "@/lib/services/firestore";
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

const taskTypes: { value: TaskType; label: string; icon: typeof Headphones }[] = [
    { value: "dailyListening", label: "Daily Listening", icon: Headphones },
    { value: "cba", label: "CBA", icon: FileQuestion },
    { value: "oba", label: "OBA", icon: FileText },
    { value: "slokaMemorization", label: "Sloka Memorization", icon: BookOpen },
    { value: "announcement", label: "Announcement", icon: Megaphone },
];

interface TaskFormDialogProps {
    mode: "create" | "edit";
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batchId?: string; // Required for create
    teacherId?: string; // Required for create
    batchName?: string; // Used in description for create
    initialData?: Task; // Required for edit
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
    const { user } = useAuthUser(); // Still valid as a fallback check
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        type: "dailyListening" as TaskType,
        title: "",
        description: "",
        startDate: "",
        dueDate: "",
        maxPoints: "100",
        allowLateSubmission: true,
        lateSubmissionDays: "3",
        instructions: "",
        status: "published" as Task["status"],
    });

    // Reset or fill form when dialog opens or mode/data changes
    useEffect(() => {
        if (open) {
            if (mode === "edit" && initialData) {
                setFormData({
                    type: initialData.type,
                    title: initialData.title,
                    description: initialData.description,
                    startDate: initialData.startDate
                        ? dateFromBangladeshTime(initialData.startDate)
                        : "",
                    dueDate: initialData.dueDate
                        ? dateFromBangladeshTime(initialData.dueDate)
                        : "",
                    maxPoints: initialData.maxPoints.toString(),
                    allowLateSubmission: initialData.allowLateSubmission,
                    lateSubmissionDays: initialData.lateSubmissionDays.toString(),
                    instructions: initialData.instructions || "",
                    status: initialData.status,
                });
            } else if (mode === "create") {
                setFormData({
                    type: "dailyListening",
                    title: "",
                    description: "",
                    startDate: "",
                    dueDate: "",
                    maxPoints: "100",
                    allowLateSubmission: true,
                    lateSubmissionDays: "3",
                    instructions: "",
                    status: "published", // Default for create
                });
            }
        }
    }, [open, mode, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const startDate = formData.startDate
                ? dateToBangladeshTime(formData.startDate, 0, 0, 0, 0)
                : undefined;

            const dueDate =
                formData.type !== "announcement" && formData.dueDate
                    ? dateToBangladeshTime(formData.dueDate, 23, 59, 59, 999)
                    : undefined;

            const maxPoints =
                formData.type === "announcement" ? 0 : parseInt(formData.maxPoints) || 100;

            const allowLateSubmission =
                formData.type === "announcement" ? false : formData.allowLateSubmission;

            const lateSubmissionDays =
                formData.type === "announcement"
                    ? 0
                    : parseInt(formData.lateSubmissionDays) || 3;

            const instructions = formData.instructions.trim() || undefined;

            if (mode === "create") {
                if (!batchId || !teacherId) throw new Error("Missing batch or teacher ID");

                await createTask({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    batchId,
                    teacherId,
                    type: formData.type,
                    status: "published", // Always published on create per original file
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    startDate,
                    dueDate,
                    maxPoints,
                    attachments: [],
                    allowedFileTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
                    allowLateSubmission,
                    lateSubmissionDays,
                    instructions,
                    submissionCount: 0,
                });

                toast({
                    title: "Success",
                    description: "Task created successfully",
                });
            } else {
                // Edit Mode
                if (!initialData?.id) throw new Error("Missing task ID");

                await updateTask(initialData.id, {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    type: formData.type,
                    status: formData.status,
                    startDate,
                    dueDate,
                    maxPoints,
                    allowLateSubmission,
                    lateSubmissionDays,
                    instructions,
                });

                toast({
                    title: "Success",
                    description: "Task updated successfully",
                });
            }

            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : `Failed to ${mode} task`,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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

                        {/* Status (Only shown for Edit in original, but safe to hide/show or just always show if consistent. Original Create sets 'published' hardcoded but original Edit allows changing status. Let's show only in edit to stay EXACTLY same?)
               Actually, Create strictly set it to 'published'. Edit showed the dropdown.
               We can condition this UI block on mode === 'edit'.
            */}
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

                        {/* Start Date */}
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

                        {/* Due Date and Points */}
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
