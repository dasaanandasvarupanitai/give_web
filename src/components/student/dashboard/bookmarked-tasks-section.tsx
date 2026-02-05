"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Batch } from "@/lib/models/batch";
import type { Task } from "@/lib/models/task";
import type { TaskBookmark } from "@/lib/models/task-bookmark";
import { getTaskTypeColor, getTaskTypeIcon, getTaskTypeLabel } from "@/lib/utils/task-helpers";
import { Bookmark, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookmarkedTasksSectionProps {
    bookmarks: TaskBookmark[];
    bookmarkedTasks: Map<string, Task>;
    batches: Map<string, Batch>;
}

export function BookmarkedTasksSection({
    bookmarks,
    bookmarkedTasks,
    batches,
}: BookmarkedTasksSectionProps) {
    const router = useRouter();

    if (bookmarks.length === 0) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Bookmark className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    Bookmarked Tasks ({bookmarks.length})
                </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookmarks
                    .filter((bookmark) => {
                        // Only show bookmarks where both task and batch exist
                        const task = bookmarkedTasks.get(bookmark.taskId);
                        const batch = batches.get(bookmark.batchId);
                        return task && batch;
                    })
                    .map((bookmark) => {
                        const task = bookmarkedTasks.get(bookmark.taskId);
                        const batch = batches.get(bookmark.batchId);

                        // At this point, both should exist due to filter above
                        if (!task || !batch) {
                            return null;
                        }

                        const TaskIcon = getTaskTypeIcon(task.type);
                        const taskColor = getTaskTypeColor(task.type);

                        return (
                            <Card
                                key={bookmark.id}
                                className="cursor-pointer transition-colors hover:bg-accent"
                                onClick={() => {
                                    if (batch) {
                                        router.push(`/classroom/batches/${batch.id}`);
                                    }
                                }}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div
                                                className="p-2 rounded-lg"
                                                style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                                            >
                                                <TaskIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                                                {batch && (
                                                    <CardDescription className="mt-1">
                                                        {batch.name}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                        <Bookmark className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                            {getTaskTypeLabel(task.type)}
                                        </Badge>
                                        {task.dueDate && (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
            </div>
        </div>
    );
}
