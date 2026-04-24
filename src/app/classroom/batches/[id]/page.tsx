"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useBatchTasksData } from "@/hooks/use-batch-tasks-data";
import {
  getSubmissionStatus,
  getTaskDisplayStatus,
  getRemainingLateSubmissionDays,
  isLateSubmissionAllowed,
  isTaskClickable,
  isTaskDueSoon,
  isTaskOverdue,
} from "@/lib/utils/task-status";
import { isWithinGracePeriod } from "@/lib/utils";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Calendar,
  Loader2,
  Pin,
  RefreshCw,
  Star,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function BatchTasksPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const batchId = params.id as string;

  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const {
    batch,
    tasks,
    submissions,
    bookmarks,
    loading,
    error,
    gracePeriodCountdowns,
    submissionWindowCountdowns,
    refreshData,
    handleToggleBookmark,
  } = useBatchTasksData({ batchId, userId: user?.uid, toast });

  const isTaskBookmarked = (taskId: string) => bookmarks.has(taskId);

  const filteredTasks = showBookmarkedOnly
    ? tasks.filter((task) => isTaskBookmarked(task.id))
    : tasks;

  const getTaskStatusBadge = (displayStatus: "published" | "closed") => {
    switch (displayStatus) {
      case "published":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Published
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Closed
          </Badge>
        );
    }
  };

  if (loading && !batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Batch</h2>
          <p className="text-muted-foreground mb-4">{error || "Batch not found"}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Classroom
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
              {batch.name} - Assessments
            </h1>
          </div>
          <Button variant="outline" onClick={refreshData} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Batch Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              {batch.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{batch.name}</h3>
              {batch.description && (
                <div className="mb-2">
                  <ExpandableDescription text={batch.description} maxLines={3} className="text-sm text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {showBookmarkedOnly ? "Bookmarked Assessments" : "Assessments"} ({filteredTasks.length})
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant={showBookmarkedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${showBookmarkedOnly ? "fill-current" : ""}`} />
              {showBookmarkedOnly ? "Show All" : "Show Bookmarked"}
            </Button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {showBookmarkedOnly
                  ? "No bookmarked assessments yet. Click the bookmark icon on any assessment to bookmark it."
                  : "No assessments available yet"}
              </p>
            </CardContent>
          </Card>
        ) : (() => {
          const pinnedTasks = filteredTasks.filter((t) => t.isPinned);
          const otherTasks = filteredTasks.filter((t) => !t.isPinned);

          const renderTaskCard = (task: typeof filteredTasks[0]) => {
            const submissionStatus = getSubmissionStatus(task, submissions);
            const displayStatus = getTaskDisplayStatus(task);
            const TaskIcon = getTaskTypeIcon(task.type);
            const taskColor = getTaskTypeColor(task.type);
            const isOverdue = isTaskOverdue(task);
            const isDueSoon = isTaskDueSoon(task);
            const submission = submissions.get(task.id);
            const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
            const withinGracePeriod = submission ? isWithinGracePeriod(submission) : false;
            const gracePeriodRemaining = gracePeriodCountdowns.get(task.id) || 0;
            const lateSubmissionAllowed = isLateSubmissionAllowed(task);
            const remainingLateDays = getRemainingLateSubmissionDays(task);

            const localDueDateDeadline = task.dueDate
              ? (() => {
                const dueDate = new Date(task.dueDate);
                return new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1, 1, 0, 0, 0);
              })()
              : null;
            const dueDatePassed = localDueDateDeadline && task.type !== "announcement" && new Date() > localDueDateDeadline;
            const submissionWindowOpen = task.dueDate && task.type !== "announcement"
              ? new Date() <= new Date(localDueDateDeadline!.getTime())
              : true;

            const clickable = isTaskClickable(task, submission, lateSubmissionAllowed);

            return (
              <Card
                key={task.id}
                className={`transition-colors ${clickable ? "cursor-pointer hover:bg-accent" : ""} ${task.type === "announcement" || isSubmitted ? "opacity-75" : ""}`}
                onClick={() => {
                  if (clickable) {
                    router.push(`/classroom/tasks/${task.id}`);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${taskColor}20`, color: taskColor }}>
                        <TaskIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          <LinkifiedText text={task.description} />
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-accent z-10 relative"
                        onClick={(e) => handleToggleBookmark(task, e)}
                        title={isTaskBookmarked(task.id) ? "Remove bookmark" : "Bookmark assessment"}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${isTaskBookmarked(task.id) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <Badge
                        variant="outline"
                        className={
                          submissionStatus.color === "gray"
                            ? "bg-gray-50 text-gray-700 border-gray-200"
                            : submissionStatus.color === "orange"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {submissionStatus.label}
                      </Badge>
                      {getTaskStatusBadge(displayStatus)}
                    </div>
                  </div>
                </CardHeader>
                {task.type !== "announcement" && (
                  <CardContent>
                    {withinGracePeriod && submission?.status === "submitted" && (
                      <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm font-semibold text-orange-900">Grace Period Active</p>
                        <p className="text-xs text-orange-700 mt-1">
                          You can edit or delete your submission. {gracePeriodRemaining} minute
                          {gracePeriodRemaining !== 1 ? "s" : ""} remaining.
                        </p>
                      </div>
                    )}
                    {dueDatePassed && submissionWindowOpen && !isSubmitted && !lateSubmissionAllowed && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-900">Grace Period</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          The submission window has closed.
                          {(() => {
                            const remaining = submissionWindowCountdowns.get(task.id);
                            if (remaining !== null && remaining !== undefined && remaining > 0) {
                              const hours = Math.floor(remaining / 60);
                              const minutes = remaining % 60;
                              return (
                                <span className="block mt-1 font-semibold">
                                  Time remaining:{" "}
                                  {hours > 0
                                    ? `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`
                                    : `${minutes} minute${minutes !== 1 ? "s" : ""}`}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </p>
                      </div>
                    )}
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
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Calendar className="h-3 w-3 mr-1" />
                          Late Submission: {remainingLateDays} day{remainingLateDays !== 1 ? "s" : ""} remaining
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Star className="h-3 w-3 mr-1" />
                        {task.maxPoints} points
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {getTaskTypeLabel(task.type)}
                      </Badge>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          };

          return (
            <div className="space-y-6">
              {pinnedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Pin className="h-4 w-4 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">
                      Pinned ({pinnedTasks.length})
                    </h3>
                  </div>
                  <div className="grid gap-4 border-l-2 border-yellow-300 pl-4">
                    {pinnedTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}

              {otherTasks.length > 0 && (
                <div>
                  {pinnedTasks.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Other Assessments ({otherTasks.length})
                      </h3>
                    </div>
                  )}
                  <div className="grid gap-4">
                    {otherTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
