"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LinkifiedText } from "@/components/ui/linkified-text";
import type { Task } from "@/lib/models/task";
import {
    getTaskTypeColor,
    getTaskTypeIcon,
    getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import { Calendar, Star } from "lucide-react";

interface TaskHeaderProps {
    task: Task;
    isOverdue: boolean;
    isDueSoon: boolean;
    lateSubmissionAllowed: boolean;
    remainingLateDays: number | null;
}

export function TaskHeader({
    task,
    isOverdue,
    isDueSoon,
    lateSubmissionAllowed,
    remainingLateDays,
}: TaskHeaderProps) {
    const TaskIcon = getTaskTypeIcon(task.type);
    const taskColor = getTaskTypeColor(task.type);

    return (
        <Card className="mb-6">
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                        >
                            <TaskIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-xl sm:text-2xl break-words">{task.title}</CardTitle>
                            <CardDescription className="mt-1">
                                {getTaskTypeLabel(task.type)}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={
                            task.status === "published"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : task.status === "closed"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                    >
                        {task.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose max-w-none mb-4">
                    <p className="whitespace-pre-wrap">
                        <LinkifiedText text={task.description} />
                    </p>
                </div>

                {task.type !== "announcement" && (
                    <div className="flex flex-wrap gap-2">
                        {task.dueDate && (
                            <Badge
                                variant="outline"
                                className={
                                    isOverdue
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : isDueSoon
                                            ? "bg-orange-50 text-orange-700 border-orange-200"
                                            : "bg-gray-50 text-gray-700 border-gray-200"
                                }
                            >
                                <Calendar className="h-3 w-3 mr-1" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                {isOverdue && " (Overdue)"}
                                {isDueSoon && !isOverdue && " (Due Soon)"}
                            </Badge>
                        )}
                        {lateSubmissionAllowed && remainingLateDays !== null && (
                            <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200"
                            >
                                <Calendar className="h-3 w-3 mr-1" />
                                Late Submission: {remainingLateDays} day{remainingLateDays !== 1 ? 's' : ''} remaining
                            </Badge>
                        )}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Star className="h-3 w-3 mr-1" />
                            {task.maxPoints} points
                        </Badge>
                    </div>
                )}

                {task.instructions && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                        <h4 className="font-semibold mb-2">Instructions:</h4>
                        <p className="text-sm whitespace-pre-wrap">
                            <LinkifiedText text={task.instructions} />
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
