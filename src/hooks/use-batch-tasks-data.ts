import { Batch } from "@/lib/models/batch";
import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import { TaskBookmark } from "@/lib/models/task-bookmark";
import {
    createTaskBookmark,
    deleteTaskBookmarkByStudentAndTask,
    getBatchById,
    getSubmissionsByStudent,
    getSubmissionsByStudentAndTaskIds,
    getTasksByIds,
    getTasksByBatchPaged,
    subscribeSubmissionsByStudent,
    subscribeSubmissionsByStudentAndTaskIds,
    subscribeTaskBookmarksByBatch,
    subscribeTasksByBatchPaged,
    TASKS_PAGE_SIZE,
    type PagedTasksSnapshot,
} from "@/lib/services/firestore";
import {
    getGracePeriodRemainingMinutes,
    getSubmissionWindowRemainingMinutes,
    isTaskStarted,
    isWithinGracePeriod,
} from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseBatchTasksDataParams {
    batchId: string;
    userId: string | undefined;
    showBookmarkedOnly: boolean;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useBatchTasksData({ batchId, userId, showBookmarkedOnly, toast }: UseBatchTasksDataParams) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [pagedInfo, setPagedInfo] = useState<Omit<PagedTasksSnapshot, "tasks"> | null>(null);
    const [visibleLimit, setVisibleLimit] = useState(TASKS_PAGE_SIZE);
    // Bookmarked tasks outside the loaded window, fetched on demand so the
    // "Show Bookmarked" filter still reaches them.
    const [bookmarkedExtraTasks, setBookmarkedExtraTasks] = useState<Task[]>([]);
    // Falls back to the full-history submissions subscription if the bounded
    // query ever fails (e.g. a missing index) — same behavior, more reads.
    const [submissionsLegacy, setSubmissionsLegacy] = useState(false);
    const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
    const [bookmarks, setBookmarks] = useState<Map<string, TaskBookmark>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gracePeriodCountdowns, setGracePeriodCountdowns] = useState<Map<string, number>>(new Map());
    const [submissionWindowCountdowns, setSubmissionWindowCountdowns] = useState<Map<string, number | null>>(new Map());

    // Load batch and subscribe to bookmarks
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

        const unsubscribeBookmarks = subscribeTaskBookmarksByBatch(batchId, userId, (bookmarksList) => {
            const bookmarkMap = new Map<string, TaskBookmark>();
            for (const bookmark of bookmarksList) {
                bookmarkMap.set(bookmark.taskId, bookmark);
            }
            setBookmarks(bookmarkMap);
        });

        return () => {
            unsubscribeBookmarks();
        };
    }, [batchId, userId]);

    // Subscribe to tasks in pages: pinned tasks are always included, other
    // tasks newest-first up to visibleLimit ("Load More" increases it).
    useEffect(() => {
        if (!batchId || !userId) return;

        const unsubscribeTasks = subscribeTasksByBatchPaged(
            batchId,
            { pageSize: visibleLimit, includeFutureTasks: false },
            (snapshot) => {
                setTasks(snapshot.tasks);
                setPagedInfo({
                    hasMore: snapshot.hasMore,
                    totalTasks: snapshot.totalTasks,
                    startedTasks: snapshot.startedTasks,
                    legacyMode: snapshot.legacyMode,
                });
                setLoading(false);
            }
        );

        return () => {
            unsubscribeTasks();
        };
    }, [batchId, userId, visibleLimit]);

    // Fetch bookmarked tasks that are older than the loaded window when the
    // "Show Bookmarked" filter is active.
    useEffect(() => {
        if (!showBookmarkedOnly) {
            setBookmarkedExtraTasks([]);
            return;
        }
        const windowIds = new Set(tasks.map((t) => t.id));
        const missingIds = Array.from(bookmarks.keys()).filter((id) => !windowIds.has(id));
        if (missingIds.length === 0) {
            setBookmarkedExtraTasks([]);
            return;
        }
        let cancelled = false;
        getTasksByIds(missingIds)
            .then((extraTasks) => {
                if (!cancelled) {
                    setBookmarkedExtraTasks(
                        extraTasks.filter((t) => isTaskStarted(t.startDate))
                    );
                }
            })
            .catch((err) => {
                console.error("Failed to load bookmarked tasks outside the loaded window:", err);
                if (!cancelled) setBookmarkedExtraTasks([]);
            });
        return () => {
            cancelled = true;
        };
    }, [showBookmarkedOnly, tasks, bookmarks]);

    // Submissions scoped to the tasks currently visible on the dashboard
    // (loaded window + pinned + bookmarked extras) instead of the student's
    // entire history. Same real-time behavior for everything rendered.
    const visibleTaskIds = useMemo(() => {
        const ids = new Set(tasks.map((t) => t.id));
        if (showBookmarkedOnly) {
            for (const t of bookmarkedExtraTasks) ids.add(t.id);
        }
        return Array.from(ids);
    }, [tasks, showBookmarkedOnly, bookmarkedExtraTasks]);
    const visibleTaskIdsKey = visibleTaskIds.join(",");

    useEffect(() => {
        if (!userId) return;

        const apply = (submissionsList: Submission[]) => {
            const submissionMap = new Map<string, Submission>();
            for (const submission of submissionsList) {
                submissionMap.set(submission.taskId, submission);
            }
            setSubmissions(submissionMap);
        };

        if (submissionsLegacy) {
            const unsubscribe = subscribeSubmissionsByStudent(userId, apply);
            return () => {
                unsubscribe();
            };
        }

        // Before the task list arrives there is nothing to scope the query to;
        // wait instead of falling back to the full-history subscription.
        if (visibleTaskIds.length === 0) return;

        const unsubscribe = subscribeSubmissionsByStudentAndTaskIds(
            userId,
            visibleTaskIds,
            apply,
            (error) => {
                console.error(
                    "[use-batch-tasks-data] Bounded submissions query failed, falling back to full history:",
                    error
                );
                setSubmissionsLegacy(true);
            }
        );
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, visibleTaskIdsKey, submissionsLegacy]);

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

            const paged = await getTasksByBatchPaged(batchId, {
                pageSize: visibleLimit,
                includeFutureTasks: false,
            });
            setTasks(paged.tasks);
            setPagedInfo({
                hasMore: paged.hasMore,
                totalTasks: paged.totalTasks,
                startedTasks: paged.startedTasks,
                legacyMode: paged.legacyMode,
            });

            const submissionsList = submissionsLegacy
                ? await getSubmissionsByStudent(userId)
                : await getSubmissionsByStudentAndTaskIds(userId, visibleTaskIds);
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
    }, [batchId, userId, visibleLimit, visibleTaskIdsKey, submissionsLegacy]);

    const loadMoreTasks = useCallback(() => {
        setVisibleLimit((current) => current + TASKS_PAGE_SIZE);
    }, []);

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
        pagedInfo,
        bookmarkedExtraTasks,
        submissions,
        bookmarks,
        loading,
        error,
        gracePeriodCountdowns,
        submissionWindowCountdowns,
        refreshData,
        loadMoreTasks,
        handleToggleBookmark,
    };
}
