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
