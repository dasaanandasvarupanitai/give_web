"use client";

import { TaskEdit } from "@/components/teacher/task-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/models/task";
import { deleteTask, updateTask } from "@/lib/services/firestore";
import {
    getTaskDisplayStatus,
    getTaskTypeColor,
    getTaskTypeIcon,
} from "@/lib/utils/task-helpers";
import { Edit, Loader2, Pin, PinOff, Trash2 } from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
    task: Task;
    submissionCount: number;
}

export function TaskCard({ task, submissionCount }: TaskCardProps) {
    const { user } = useAuthUser();
    const { toast } = useToast();
    const TaskIcon = getTaskTypeIcon(task.type);
    const taskColor = getTaskTypeColor(task.type);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPinning, setIsPinning] = useState(false);

    // All users viewing this component (teachers) can edit tasks
    const canEdit = true;

    // Calculate display status for teacher dashboard
    const displayStatus = getTaskDisplayStatus(task);

    const handleTogglePin = async () => {
        setIsPinning(true);
        try {
            await updateTask(task.id, { isPinned: !task.isPinned });
            toast({
                title: task.isPinned ? "Task unpinned" : "Task pinned",
                description: task.isPinned ? "Task removed from top" : "Task will appear at top of list",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update task",
                variant: "destructive",
            });
        } finally {
            setIsPinning(false);
        }
    };

    const handleDelete = async () => {
        if (!canEdit) return;

        setIsDeleting(true);
        try {
            await deleteTask(task.id);
            toast({
                title: "Success",
                description: "Task deleted successfully",
            });
            setIsDeleteDialogOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete task",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                        >
                            <TaskIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-medium break-words">{task.title}</p>
                                {task.isPinned && (
                                    <Badge variant="outline" className="flex-shrink-0 bg-yellow-50 text-yellow-700 border-yellow-300">
                                        <Pin className="h-3 w-3 mr-1" />
                                        Pinned
                                    </Badge>
                                )}
                                <Badge
                                    variant="outline"
                                    className={`flex-shrink-0 ${displayStatus === "scheduled"
                                        ? "bg-gray-50 text-gray-700 border-gray-200"
                                        : displayStatus === "published"
                                            ? "bg-orange-50 text-orange-700 border-orange-200"
                                            : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                >
                                    {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                <LinkifiedText text={task.description} />
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-2 sm:mb-0">
                                {task.dueDate && (
                                    <span className="whitespace-nowrap">
                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                                {task.maxPoints > 0 && <span className="whitespace-nowrap">{task.maxPoints} points</span>}
                                <span className="whitespace-nowrap">{submissionCount} submissions</span>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTogglePin}
                                    disabled={isPinning}
                                    className={`h-8 px-3 sm:px-2 sm:h-8 flex-1 sm:flex-initial border ${task.isPinned ? "border-yellow-500 text-yellow-700 hover:text-yellow-800" : "border-orange-500 sm:border-border"}`}
                                    title={task.isPinned ? "Unpin task" : "Pin task to top"}
                                >
                                    {isPinning ? (
                                        <Loader2 className="h-4 w-4 animate-spin sm:mr-0 mr-2" />
                                    ) : task.isPinned ? (
                                        <PinOff className="h-4 w-4 sm:mr-0 mr-2" />
                                    ) : (
                                        <Pin className="h-4 w-4 sm:mr-0 mr-2" />
                                    )}
                                    <span className="sm:hidden">{task.isPinned ? "Unpin" : "Pin"}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditDialogOpen(true)}
                                    className="h-8 px-3 sm:px-2 sm:h-8 flex-1 sm:flex-initial border border-orange-500 sm:border-border"
                                >
                                    <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                                    <span className="sm:hidden">Edit</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className="h-8 px-3 sm:px-2 sm:h-8 text-destructive hover:text-destructive flex-1 sm:flex-initial border border-orange-500 sm:border-border"
                                >
                                    <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                                    <span className="sm:hidden">Delete</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <TaskEdit
                task={task}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onTaskUpdated={() => setIsEditDialogOpen(false)}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{task.title}"? This action cannot be undone.
                            {submissionCount > 0 && (
                                <span className="block mt-2 text-destructive">
                                    Warning: This task has {submissionCount} submission{submissionCount !== 1 ? 's' : ''}. Deleting it will remove all associated submissions.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
