import { Batch } from "@/lib/models/batch";
import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import { TaskBookmark } from "@/lib/models/task-bookmark";
import {
    createTaskBookmark,
    deleteTaskBookmarkByStudentAndTask,
    getBatchById,
    getSubmissionsByStudent,
    getTasksByBatch,
    subscribeSubmissionsByStudent,
    subscribeTaskBookmarksByBatch,
    subscribeTasksByBatch,
} from "@/lib/services/firestore";
import {
    getGracePeriodRemainingMinutes,
    getSubmissionWindowRemainingMinutes,
    isSubmissionWindowOpen,
    isWithinGracePeriod,
} from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

interface UseBatchTasksDataParams {
    batchId: string;
    userId: string | undefined;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useBatchTasksData({ batchId, userId, toast }: UseBatchTasksDataParams) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
    const [bookmarks, setBookmarks] = useState<Map<string, TaskBookmark>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gracePeriodCountdowns, setGracePeriodCountdowns] = useState<Map<string, number>>(new Map());
    const [submissionWindowCountdowns, setSubmissionWindowCountdowns] = useState<Map<string, number | null>>(new Map());

    // Load batch and subscribe to data
    useEffect(() => {
        if (!batchId || !userId) return;

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

        const unsubscribeTasks = subscribeTasksByBatch(batchId, (tasksList) => {
            setTasks(tasksList);
            setLoading(false);
        });

        const unsubscribeSubmissions = subscribeSubmissionsByStudent(userId, (submissionsList) => {
            const submissionMap = new Map<string, Submission>();
            for (const submission of submissionsList) {
                submissionMap.set(submission.taskId, submission);
            }
            setSubmissions(submissionMap);
        });

        const unsubscribeBookmarks = subscribeTaskBookmarksByBatch(batchId, userId, (bookmarksList) => {
            const bookmarkMap = new Map<string, TaskBookmark>();
            for (const bookmark of bookmarksList) {
                bookmarkMap.set(bookmark.taskId, bookmark);
            }
            setBookmarks(bookmarkMap);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeSubmissions();
            unsubscribeBookmarks();
        };
    }, [batchId, userId]);

    // Update grace period countdowns
    useEffect(() => {
        const updateCountdowns = () => {
            const newCountdowns = new Map<string, number>();
            submissions.forEach((submission, taskId) => {
                if (isWithinGracePeriod(submission)) {
                    newCountdowns.set(taskId, getGracePeriodRemainingMinutes(submission));
                }
            });
            setGracePeriodCountdowns(newCountdowns);
        };

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [submissions]);

    // Update submission window countdowns
    useEffect(() => {
        const updateCountdowns = () => {
            const newCountdowns = new Map<string, number | null>();
            tasks.forEach((task) => {
                if (task.dueDate && task.type !== "announcement") {
                    newCountdowns.set(task.id, getSubmissionWindowRemainingMinutes(task.dueDate));
                }
            });
            setSubmissionWindowCountdowns(newCountdowns);
        };

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [tasks]);

    const refreshData = useCallback(async () => {
        if (!batchId || !userId) return;
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

            const submissionsList = await getSubmissionsByStudent(userId);
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
    }, [batchId, userId]);

    const handleToggleBookmark = async (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!userId) {
            toast({
                title: "Error",
                description: "You must be logged in to bookmark assessments",
                variant: "destructive",
            });
            return;
        }

        try {
            if (bookmarks.has(task.id)) {
                await deleteTaskBookmarkByStudentAndTask(userId, task.id);
                toast({ title: "Bookmark removed", description: "Assessment removed from bookmarks" });
            } else {
                await createTaskBookmark({
                    studentId: userId,
                    taskId: task.id,
                    batchId,
                    createdAt: new Date(),
                });
                toast({ title: "Bookmark added", description: "Assessment added to bookmarks" });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update bookmark",
                variant: "destructive",
            });
        }
    };

    return {
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
    };
}

// Task status helper functions
export function getSubmissionStatus(task: Task, submissions: Map<string, Submission>) {
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
}

export function getTaskDisplayStatus(task: Task): "published" | "closed" {
    if (task.type === "announcement") return "published";

    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        let deadline: Date;

        if (task.allowLateSubmission && task.lateSubmissionDays > 0) {
            deadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);
        } else {
            deadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
        }

        if (new Date() > deadline) return "closed";
    }

    return "published";
}

export function isTaskOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date() > task.dueDate;
}

export function isTaskDueSoon(task: Task): boolean {
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
}

export function isLateSubmissionAllowed(task: Task): boolean {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return false;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);
    return now > dueDateDeadline && now <= lateSubmissionDeadline;
}

export function getRemainingLateSubmissionDays(task: Task): number | null {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return null;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);

    if (now > dueDateDeadline && now <= lateSubmissionDeadline) {
        const remainingMs = lateSubmissionDeadline.getTime() - now.getTime();
        return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    }
    return null;
}

export function isTaskClickable(
    task: Task,
    submission: Submission | undefined,
    lateSubmissionAllowed: boolean
): boolean {
    if (task.type === "announcement") return false;

    const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
    const withinGracePeriod = submission ? isWithinGracePeriod(submission) : false;

    const submissionWindowOpen = task.dueDate
        ? isSubmissionWindowOpen(task.dueDate)
        : true;
    const submissionWindowClosed = task.dueDate && !submissionWindowOpen;
    const gracePeriodPassed = submission && !withinGracePeriod && submission.status === "submitted";

    return !(submissionWindowClosed && !isSubmitted && !lateSubmissionAllowed) &&
        !gracePeriodPassed &&
        (!isSubmitted || withinGracePeriod);
}
