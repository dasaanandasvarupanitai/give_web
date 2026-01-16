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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { TaskType } from "@/lib/models/task";
import { createTask } from "@/lib/services/firestore";
import { dateToBangladeshTime } from "@/lib/utils";
import {
  BookOpen,
  FileQuestion,
  FileText,
  Headphones,
  Loader2,
  Megaphone,
  Plus,
} from "lucide-react";
import { useState } from "react";

interface TaskCreationProps {
  batch: Batch;
  onTaskCreated?: () => void;
}

const taskTypes: { value: TaskType; label: string; icon: typeof Headphones }[] = [
  { value: "dailyListening", label: "Daily Listening", icon: Headphones },
  { value: "cba", label: "CBA", icon: FileQuestion },
  { value: "oba", label: "OBA", icon: FileText },
  { value: "slokaMemorization", label: "Sloka Memorization", icon: BookOpen },
  { value: "announcement", label: "Announcement", icon: Megaphone },
];

export function TaskCreation({ batch, onTaskCreated }: TaskCreationProps) {
  const { user } = useAuthUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  });

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

      await createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        batchId: batch.id,
        teacherId: user.uid,
        type: formData.type,
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: startDate,
        dueDate:
          formData.type !== "announcement" && formData.dueDate
            ? dateToBangladeshTime(formData.dueDate, 23, 59, 59, 999)
            : undefined,
        maxPoints:
          formData.type === "announcement" ? 0 : parseInt(formData.maxPoints) || 100,
        attachments: [],
        allowedFileTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
        allowLateSubmission:
          formData.type === "announcement" ? false : formData.allowLateSubmission,
        lateSubmissionDays:
          formData.type === "announcement"
            ? 0
            : parseInt(formData.lateSubmissionDays) || 3,
        instructions: formData.instructions.trim() || undefined,
        submissionCount: 0,
      });

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      onTaskCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
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
    });
  };

  const selectedTaskType = taskTypes.find((t) => t.value === formData.type);
  const TaskIcon = selectedTaskType?.icon || Headphones;

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Create a new task for {batch.name}
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

            {/* Start Date - When task becomes visible to students */}
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="bg-gray-100"
                required
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Task will be visible to students starting at 12:00 AM on this date
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
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <TaskIcon className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
