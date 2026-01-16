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
import type { Batch } from "@/lib/models/batch";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import { TaskBookmark } from "@/lib/models/task-bookmark";
import {
  createTaskBookmark,
  deleteTaskBookmarkByStudentAndTask,
  getBatchById,
  getSubmissionsByStudent,
  getTasksByBatch,
  subscribeSubmissionsByStudent,
  subscribeTaskBookmarksByBatch,
  subscribeTasksByBatch
} from "@/lib/services/firestore";
import {
  getGracePeriodRemainingMinutes,
  getSubmissionWindowRemainingMinutes,
  isSubmissionWindowOpen,
  isWithinGracePeriod
} from "@/lib/utils";
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
  RefreshCw,
  Star
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchTasksPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [bookmarks, setBookmarks] = useState<Map<string, TaskBookmark>>(new Map());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gracePeriodCountdowns, setGracePeriodCountdowns] = useState<Map<string, number>>(new Map());
  const [submissionWindowCountdowns, setSubmissionWindowCountdowns] = useState<Map<string, number | null>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    if (!batchId || !user?.uid) return;

    // Load batch
    getBatchById(batchId)
      .then((batchData) => {
        if (!batchData) {
          setError("Batch not found");
          setLoading(false);
          return;
        }
        setBatch(batchData);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Subscribe to tasks
    const unsubscribeTasks = subscribeTasksByBatch(batchId, (tasksList) => {
      setTasks(tasksList);
      setLoading(false);
    });

    // Subscribe to submissions
    const unsubscribeSubmissions = subscribeSubmissionsByStudent(user.uid, (submissionsList) => {
      const submissionMap = new Map<string, Submission>();
      for (const submission of submissionsList) {
        submissionMap.set(submission.taskId, submission);
      }
      setSubmissions(submissionMap);
    });

    // Subscribe to bookmarks
    const unsubscribeBookmarks = subscribeTaskBookmarksByBatch(
      batchId,
      user.uid,
      (bookmarksList) => {
        const bookmarkMap = new Map<string, TaskBookmark>();
        for (const bookmark of bookmarksList) {
          bookmarkMap.set(bookmark.taskId, bookmark);
        }
        setBookmarks(bookmarkMap);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeSubmissions();
      unsubscribeBookmarks();
    };
  }, [batchId, user?.uid]);

  // Update grace period countdowns for all submissions (15-minute grace period)
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = new Map<string, number>();
      submissions.forEach((submission, taskId) => {
        if (isWithinGracePeriod(submission)) {
          const remaining = getGracePeriodRemainingMinutes(submission);
          newCountdowns.set(taskId, remaining);
        }
      });
      setGracePeriodCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000); // Update every second

    return () => clearInterval(interval);
  }, [submissions]);

  // Update submission window countdowns for all tasks (grace period disabled - closes at due date)
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = new Map<string, number | null>();
      tasks.forEach((task) => {
        if (task.dueDate && task.type !== "announcement") {
          const remaining = getSubmissionWindowRemainingMinutes(task.dueDate);
          newCountdowns.set(task.id, remaining);
        }
      });
      setSubmissionWindowCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000); // Update every second

    return () => clearInterval(interval);
  }, [tasks]);

  const refreshData = async () => {
    if (!batchId || !user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const batchData = await getBatchById(batchId);
      if (!batchData) {
        setError("Batch not found");
        return;
      }
      setBatch(batchData);

      const tasksList = await getTasksByBatch(batchId);
      setTasks(tasksList);

      const submissionsList = await getSubmissionsByStudent(user.uid);
      const submissionMap = new Map<string, Submission>();
      for (const submission of submissionsList) {
        submissionMap.set(submission.taskId, submission);
      }
      setSubmissions(submissionMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (task: Task) => {
    // Announcements don't have submissions, so don't show status
    if (task.type === "announcement") {
      return { status: "announcement", label: "Announcement", color: "blue" };
    }

    const submission = submissions.get(task.id);
    if (!submission) {
      return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
    switch (submission.status) {
      case "draft":
        return { status: "draft", label: "Draft", color: "orange" };
      case "submitted":
        return { status: "submitted", label: "Submitted", color: "orange" };
      case "graded":
        return { status: "graded", label: "Graded", color: "blue" };
      default:
        return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
  };

  /**
   * Calculate the display status for a task on the student side
   * - "published": Task is currently visible and open (not closed)
   * - "closed": Task is past its deadline (dueDate + grace period/late submission window)
   * Note: Students can't see "scheduled" tasks (they're filtered out), so we only need published/closed
   */
  const getTaskDisplayStatus = (task: Task): "published" | "closed" => {
    const now = new Date();

    // For announcements, they're always published (never closed)
    if (task.type === "announcement") {
      return "published";
    }

    // Check if task is closed (past due date/late submission)
    // Uses per-user timezone: deadline is 11:59:59 PM on due date in user's local timezone
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      let deadline: Date;

      if (task.allowLateSubmission && task.lateSubmissionDays > 0) {
        // Late submission allowed: deadline is dueDate + lateSubmissionDays (11:59:59 PM on last day in user's local timezone)
        const year = dueDate.getFullYear();
        const month = dueDate.getMonth();
        const day = dueDate.getDate();
        deadline = new Date(year, month, day + task.lateSubmissionDays, 23, 59, 59, 999);
      } else {
        // No late submission: deadline is 11:59:59 PM on due date in user's local timezone (grace period disabled)
        // To re-enable 2-hour grace period, uncomment the following lines:
        // const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
        // const localDeadline = new Date(year, month, day, 23, 59, 59, 999);
        // deadline = new Date(localDeadline.getTime() + gracePeriodMs);
        const year = dueDate.getFullYear();
        const month = dueDate.getMonth();
        const day = dueDate.getDate();
        deadline = new Date(year, month, day, 23, 59, 59, 999);
      }

      if (now > deadline) {
        return "closed";
      }
    }

    // Task is published (visible to students and not closed)
    return "published";
  };

  const getTaskStatusBadge = (task: Task) => {
    const displayStatus = getTaskDisplayStatus(task);

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

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    return new Date() > task.dueDate;
  };

  const isTaskDueSoon = (task: Task) => {
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil(
      (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  // Helper function to check if late submission is currently allowed
  // Uses per-user timezone: deadline is 11:59:59 PM on due date in user's local timezone
  const isLateSubmissionAllowed = (task: Task): boolean => {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    // Calculate deadlines in user's local timezone
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth();
    const day = dueDate.getDate();
    const dueDateDeadline = new Date(year, month, day, 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(year, month, day + task.lateSubmissionDays, 23, 59, 59, 999);
    return now > dueDateDeadline && now <= lateSubmissionDeadline;
  };

  const isTaskBookmarked = (taskId: string) => {
    return bookmarks.has(taskId);
  };

  const handleToggleBookmark = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    e.preventDefault(); // Prevent any default behavior
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to bookmark assessments",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isTaskBookmarked(task.id)) {
        await deleteTaskBookmarkByStudentAndTask(user.uid, task.id);
        toast({
          title: "Bookmark removed",
          description: "Assessment removed from bookmarks",
        });
      } else {
        await createTaskBookmark({
          studentId: user.uid,
          taskId: task.id,
          batchId: batchId,
          createdAt: new Date(),
        });
        toast({
          title: "Bookmark added",
          description: "Assessment added to bookmarks",
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = showBookmarkedOnly
    ? tasks.filter((task) => isTaskBookmarked(task.id))
    : tasks;

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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">{batch.name} - Assessments</h1>
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
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => {
              const submissionStatus = getSubmissionStatus(task);
              const TaskIcon = getTaskTypeIcon(task.type);
              const taskColor = getTaskTypeColor(task.type);
              const isOverdue = isTaskOverdue(task);
              const isDueSoon = isTaskDueSoon(task);
              const submission = submissions.get(task.id);
              const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
              const withinGracePeriod = submission ? isWithinGracePeriod(submission) : false;
              const gracePeriodRemaining = gracePeriodCountdowns.get(task.id) || 0;
              const lateSubmissionAllowed = isLateSubmissionAllowed(task);

              // Calculate remaining late submission days
              // Uses per-user timezone: deadlines calculated in user's local timezone
              const getRemainingLateSubmissionDays = (): number | null => {
                if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") {
                  return null;
                }
                const now = new Date();
                const dueDate = new Date(task.dueDate);
                // Calculate deadlines in user's local timezone
                const year = dueDate.getFullYear();
                const month = dueDate.getMonth();
                const day = dueDate.getDate();
                const dueDateDeadline = new Date(year, month, day, 23, 59, 59, 999);
                const lateSubmissionDeadline = new Date(year, month, day + task.lateSubmissionDays, 23, 59, 59, 999);

                if (now > dueDateDeadline && now <= lateSubmissionDeadline) {
                  const remainingMs = lateSubmissionDeadline.getTime() - now.getTime();
                  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                  return Math.max(0, remainingDays);
                }
                return null;
              };
              const remainingLateDays = getRemainingLateSubmissionDays();

              // Allow clicking if:
              // 1. Task is not announcement
              // 2. Submission window is open (grace period disabled - closes at due date) OR late submission is allowed OR within grace period (if submitted)
              // Uses per-user timezone: compares against 11:59:59 PM on due date in user's local timezone
              const localDueDateDeadline = task.dueDate ? (() => {
                const dueDate = new Date(task.dueDate);
                const year = dueDate.getFullYear();
                const month = dueDate.getMonth();
                const day = dueDate.getDate();
                return new Date(year, month, day, 23, 59, 59, 999);
              })() : null;
              const dueDatePassed = localDueDateDeadline && task.type !== "announcement" && new Date() > localDueDateDeadline;
              const submissionWindowOpen = task.dueDate && task.type !== "announcement"
                ? isSubmissionWindowOpen(task.dueDate)
                : true;
              const submissionWindowClosed = task.dueDate && task.type !== "announcement" && !submissionWindowOpen;
              const gracePeriodPassed = submission && !withinGracePeriod && submission.status === "submitted";

              // Can't click if:
              // - Submission window is closed AND no submission exists AND late submission is not allowed
              // - Grace period passed (submission exists but grace period expired)
              const isClickable = task.type !== "announcement" &&
                !(submissionWindowClosed && !isSubmitted && !lateSubmissionAllowed) &&
                !gracePeriodPassed &&
                (!isSubmitted || withinGracePeriod);

              return (
                <Card
                  key={task.id}
                  className={`transition-colors ${isClickable ? "cursor-pointer hover:bg-accent" : ""} ${task.type === "announcement" || isSubmitted ? "opacity-75" : ""
                    }`}
                  onClick={() => {
                    if (isClickable) {
                      router.push(`/classroom/tasks/${task.id}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div
                        className="flex items-start gap-3 flex-1"
                        onClick={(e) => {
                          if (!isClickable) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                        >
                          <TaskIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            <LinkifiedText text={task.description} />
                          </CardDescription>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-accent z-10 relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleToggleBookmark(task, e);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onMouseUp={(e) => {
                            e.stopPropagation();
                          }}
                          title={isTaskBookmarked(task.id) ? "Remove bookmark" : "Bookmark assessment"}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${isTaskBookmarked(task.id)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                              }`}
                          />
                        </Button>
                        <Badge
                          variant="outline"
                          className={`${submissionStatus.color === "gray"
                            ? "bg-gray-50 text-gray-700 border-gray-200"
                            : submissionStatus.color === "orange"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : submissionStatus.color === "green"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                        >
                          {submissionStatus.label}
                        </Badge>
                        {getTaskStatusBadge(task)}
                      </div>
                    </div>
                  </CardHeader>
                  {task.type !== "announcement" && (
                    <CardContent>
                      {withinGracePeriod && submission?.status === "submitted" && (
                        <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm font-semibold text-orange-900">
                            Grace Period Active
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            You can edit or delete your submission. {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining.
                          </p>
                        </div>
                      )}
                      {dueDatePassed && submissionWindowOpen && !isSubmitted && !lateSubmissionAllowed && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-900">
                            Grace Period
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            The submission window has closed.
                            {(() => {
                              const remaining = submissionWindowCountdowns.get(task.id);
                              if (remaining !== null && remaining !== undefined && remaining > 0) {
                                const hours = Math.floor(remaining / 60);
                                const minutes = remaining % 60;
                                return (
                                  <span className="block mt-1 font-semibold">
                                    Time remaining: {hours > 0
                                      ? `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
                                      : `${minutes} minute${minutes !== 1 ? 's' : ''}`}
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
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
