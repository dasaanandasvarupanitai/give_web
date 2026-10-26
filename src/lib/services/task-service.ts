import { db } from "@/lib/firebase";
import {
    Task,
    TaskFirestore,
    taskFromFirestore,
    taskToFirestore,
} from "@/lib/models/task";
import { isTaskStarted } from "@/lib/utils";
import {
    TaskBookmark,
    TaskBookmarkFirestore,
    taskBookmarkFromFirestore,
    taskBookmarkToFirestore,
} from "@/lib/models/task-bookmark";
import {
    collection,
    deleteDoc,
    doc,
    documentId,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
    type QueryConstraint,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getSubmissionsByTask } from "./submission-service";

// ==================== Task Operations ====================

/**
 * Number of non-pinned tasks loaded initially and per "Load More" click
 * on the student and teacher dashboards.
 */
export const TASKS_PAGE_SIZE = 10;

/**
 * Server-side safety margin for the "started" cutoff used by the paged
 * window query. The client-side isTaskStarted() check remains the final
 * visibility authority (it derives visibility from the Bangladesh calendar
 * date in the user's local timezone), so this margin only guarantees the
 * query never excludes a task the client would consider started — even for
 * browsers in timezones ahead of Bangladesh.
 */
const TASKS_START_CUTOFF_MARGIN_MS = 14 * 60 * 60 * 1000;

/** Result of the paged task subscription used by the dashboards. */
export interface PagedTasksSnapshot {
    /** Tasks ready to render: pinned first (always), then the loaded window. */
    tasks: Task[];
    /**
     * True when more tasks exist beyond the loaded window and "Load More"
     * should be shown. Always false in legacy mode (everything is loaded).
     */
    hasMore: boolean;
    /** Total number of tasks in the batch (from a server count query). */
    totalTasks: number;
    /**
     * Tasks that have started (visible to students). Only meaningful in
     * paged mode; equals tasks.length in legacy mode.
     */
    startedTasks: number;
    /**
     * True when the optimized paged queries could not be used (e.g. the
     * composite index is not deployed yet, or tasks missing `startDate`
     * were detected) and the full task list was loaded instead — identical
     * to the pre-pagination behavior.
     */
    legacyMode: boolean;
}

function sortTasksPinnedFirst(tasks: Task[]): void {
    tasks.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const aDate = a.startDate || a.createdAt;
        const bDate = b.startDate || b.createdAt;
        return bDate.getTime() - aDate.getTime();
    });
}

function taskFromSnapshotDoc(doc: QueryDocumentSnapshot): Task {
    return taskFromFirestore(doc.id, doc.data() as TaskFirestore);
}

/**
 * Counts total / started / future tasks for a batch in 3 cheap aggregate
 * queries. The difference `total - started - future` exposes tasks whose
 * `startDate` field is missing entirely — those are "always visible" in the
 * legacy client-side logic and cannot be queried with a startDate-ordered
 * window, so callers fall back to the full list when any exist.
 * The started/future split uses the exact current time (no margin) so the
 * started count matches what the client-side visibility check displays.
 * Returns null when the count queries themselves fail.
 */
async function fetchTaskCounts(
    batchId: string
): Promise<{ total: number; started: number; future: number } | null> {
    try {
        const now = Timestamp.now();
        const col = collection(db, "tasks");
        const [totalSnap, startedSnap, futureSnap] = await Promise.all([
            getCountFromServer(query(col, where("batchId", "==", batchId))),
            getCountFromServer(
                query(col, where("batchId", "==", batchId), where("startDate", "<=", now))
            ),
            getCountFromServer(
                query(col, where("batchId", "==", batchId), where("startDate", ">", now))
            ),
        ]);
        return {
            total: totalSnap.data().count,
            started: startedSnap.data().count,
            future: futureSnap.data().count,
        };
    } catch (error) {
        console.error("[task-service] Task count queries failed:", error);
        return null;
    }
}

function mergePagedTasks(
    pinned: Task[],
    windowTasks: Task[],
    windowFetched: number,
    pageSize: number,
    includeFutureTasks: boolean,
    counts: { total: number; started: number }
): PagedTasksSnapshot {
    const pinnedIds = new Set(pinned.map((t) => t.id));
    const other = windowTasks.filter((t) => !pinnedIds.has(t.id));
    // The window query's cutoff is generous (see TASKS_START_CUTOFF_MARGIN_MS);
    // the client-side visibility check stays the source of truth, exactly as
    // in the legacy full-list path.
    const visiblePinned = includeFutureTasks
        ? pinned
        : pinned.filter((t) => isTaskStarted(t.startDate));
    const visibleOther = includeFutureTasks
        ? other
        : other.filter((t) => isTaskStarted(t.startDate));
    const tasks = [...visiblePinned, ...visibleOther];
    sortTasksPinnedFirst(tasks);
    return {
        tasks,
        hasMore: windowFetched >= pageSize,
        totalTasks: counts.total,
        startedTasks: counts.started,
        legacyMode: false,
    };
}

function pagedWindowQuery(
    batchId: string,
    pageSize: number,
    includeFutureTasks: boolean,
    cutoff: Timestamp
) {
    const constraints: QueryConstraint[] = [where("batchId", "==", batchId)];
    if (!includeFutureTasks) {
        // Students only see started tasks; teachers manage scheduled
        // (future) tasks too, which the date-descending order naturally
        // surfaces first — matching the legacy client-side sort.
        constraints.push(where("startDate", "<=", cutoff));
    }
    constraints.push(orderBy("startDate", "desc"), limit(pageSize));
    return query(collection(db, "tasks"), ...constraints);
}

/**
 * Real-time subscription for the dashboards: pinned tasks are always loaded
 * (regardless of age), other tasks are loaded newest-first in pages of
 * `pageSize`. Increasing `pageSize` loads more. Falls back to the legacy
 * full-list subscription whenever the optimized queries cannot run, so
 * behavior never regresses.
 */
export function subscribeTasksByBatchPaged(
    batchId: string,
    options: { pageSize: number; includeFutureTasks: boolean },
    callback: (snapshot: PagedTasksSnapshot) => void
): () => void {
    let cancelled = false;
    let legacyUnsubscribe: (() => void) | null = null;
    let unsubs: (() => void)[] = [];
    const state: {
        pinned: Task[] | null;
        window: Task[] | null;
        windowFetched: number;
        counts: { total: number; started: number } | null;
        legacy: boolean;
    } = {
        pinned: null,
        window: null,
        windowFetched: 0,
        counts: null,
        legacy: false,
    };

    const startLegacy = (reason: string) => {
        if (cancelled || state.legacy) return;
        state.legacy = true;
        unsubs.forEach((u) => u());
        unsubs = [];
        console.warn(
            `[task-service] Using full task list for batch ${batchId} (${reason}). ` +
                `Deploy the (batchId, startDate) composite index and run the startDate backfill to enable pagination.`
        );
        legacyUnsubscribe = subscribeTasksByBatch(
            batchId,
            (tasks) => {
                callback({
                    tasks,
                    hasMore: false,
                    totalTasks: tasks.length,
                    startedTasks: tasks.length,
                    legacyMode: true,
                });
            },
            options.includeFutureTasks
        );
    };

    const emit = () => {
        if (cancelled || state.legacy) return;
        if (!state.pinned || !state.window || !state.counts) return;
        callback(
            mergePagedTasks(
                state.pinned,
                state.window,
                state.windowFetched,
                options.pageSize,
                options.includeFutureTasks,
                state.counts
            )
        );
    };

    (async () => {
        const cutoff = Timestamp.fromMillis(Date.now() + TASKS_START_CUTOFF_MARGIN_MS);
        const counts = await fetchTaskCounts(batchId);
        if (cancelled) return;
        if (!counts) {
            startLegacy("count queries failed");
            return;
        }
        if (counts.total > counts.started + counts.future) {
            startLegacy(
                `${counts.total - counts.started - counts.future} task(s) missing startDate`
            );
            return;
        }
        state.counts = { total: counts.total, started: counts.started };

        unsubs.push(
            onSnapshot(
                query(
                    collection(db, "tasks"),
                    where("batchId", "==", batchId),
                    where("isPinned", "==", true)
                ),
                (snap) => {
                    state.pinned = snap.docs.map(taskFromSnapshotDoc);
                    emit();
                },
                (error) => {
                    console.error("[task-service] Pinned tasks query failed:", error);
                    startLegacy("pinned tasks query failed");
                }
            )
        );

        unsubs.push(
            onSnapshot(
                pagedWindowQuery(batchId, options.pageSize, options.includeFutureTasks, cutoff),
                (snap) => {
                    state.window = snap.docs.map(taskFromSnapshotDoc);
                    state.windowFetched = snap.size;
                    emit();
                },
                (error) => {
                    console.error("[task-service] Paged tasks query failed:", error);
                    startLegacy("paged tasks query failed");
                }
            )
        );
    })();

    return () => {
        cancelled = true;
        unsubs.forEach((u) => u());
        if (legacyUnsubscribe) legacyUnsubscribe();
    };
}

/**
 * One-shot version of subscribeTasksByBatchPaged for manual refreshes.
 */
export async function getTasksByBatchPaged(
    batchId: string,
    options: { pageSize: number; includeFutureTasks: boolean }
): Promise<PagedTasksSnapshot> {
    try {
        const cutoff = Timestamp.fromMillis(Date.now() + TASKS_START_CUTOFF_MARGIN_MS);
        const counts = await fetchTaskCounts(batchId);
        if (!counts || counts.total > counts.started + counts.future) {
            const tasks = await getTasksByBatch(batchId, options.includeFutureTasks);
            return {
                tasks,
                hasMore: false,
                totalTasks: tasks.length,
                startedTasks: tasks.length,
                legacyMode: true,
            };
        }

        const [pinnedSnap, windowSnap] = await Promise.all([
            getDocs(
                query(
                    collection(db, "tasks"),
                    where("batchId", "==", batchId),
                    where("isPinned", "==", true)
                )
            ),
            getDocs(
                pagedWindowQuery(batchId, options.pageSize, options.includeFutureTasks, cutoff)
            ),
        ]);

        return mergePagedTasks(
            pinnedSnap.docs.map(taskFromSnapshotDoc),
            windowSnap.docs.map(taskFromSnapshotDoc),
            windowSnap.size,
            options.pageSize,
            options.includeFutureTasks,
            { total: counts.total, started: counts.started }
        );
    } catch (error) {
        console.error("[task-service] Paged task fetch failed, falling back:", error);
        const tasks = await getTasksByBatch(batchId, options.includeFutureTasks);
        return {
            tasks,
            hasMore: false,
            totalTasks: tasks.length,
            startedTasks: tasks.length,
            legacyMode: true,
        };
    }
}

/**
 * Fetches tasks by explicit ids (used to resolve bookmarked tasks that are
 * outside the currently loaded window). Ids are queried in chunks of 30,
 * the Firestore `in` limit.
 */
export async function getTasksByIds(ids: string[]): Promise<Task[]> {
    if (ids.length === 0) return [];
    try {
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 30) {
            chunks.push(ids.slice(i, i + 30));
        }
        const snaps = await Promise.all(
            chunks.map((chunk) =>
                getDocs(query(collection(db, "tasks"), where(documentId(), "in", chunk)))
            )
        );
        const tasks = snaps.flatMap((snap) => snap.docs.map(taskFromSnapshotDoc));
        tasks.sort((a, b) => {
            const aDate = a.startDate || a.createdAt;
            const bDate = b.startDate || b.createdAt;
            return bDate.getTime() - aDate.getTime();
        });
        return tasks;
    } catch (error) {
        throw new Error(`Failed to get tasks by ids: ${error}`);
    }
}

export async function createTask(task: Omit<Task, "id">): Promise<string> {
    try {
        const taskRef = doc(collection(db, "tasks"));
        const taskData: TaskFirestore = taskToFirestore({
            ...task,
            id: taskRef.id,
        });
        await setDoc(taskRef, taskData);
        return taskRef.id;
    } catch (error) {
        throw new Error(`Failed to create task: ${error}`);
    }
}

export async function bulkCreateTasks(tasks: Omit<Task, "id">[]): Promise<void> {
    try {
        const batchWrite = writeBatch(db);

        for (const task of tasks) {
            const taskRef = doc(collection(db, "tasks"));
            const taskData: TaskFirestore = taskToFirestore({
                ...task,
                id: taskRef.id,
            });
            batchWrite.set(taskRef, taskData);
        }

        await batchWrite.commit();
    } catch (error) {
        throw new Error(`Failed to bulk create tasks: ${error}`);
    }
}

export async function updateTask(id: string, task: Partial<Task>): Promise<void> {
    try {
        const taskRef = doc(db, "tasks", id);
        const updates: Partial<TaskFirestore> = {
            updatedAt: Timestamp.now(),
        };

        if (task.title !== undefined) updates.title = task.title;
        if (task.description !== undefined) updates.description = task.description;
        if (task.status !== undefined) updates.status = task.status;
        if (task.startDate !== undefined)
            updates.startDate = Timestamp.fromDate(task.startDate);
        if (task.dueDate !== undefined)
            updates.dueDate = Timestamp.fromDate(task.dueDate);
        if (task.maxPoints !== undefined) updates.maxPoints = task.maxPoints;
        if (task.attachments !== undefined) updates.attachments = task.attachments;
        if (task.allowLateSubmission !== undefined)
            updates.allowLateSubmission = task.allowLateSubmission;
        if (task.lateSubmissionDays !== undefined)
            updates.lateSubmissionDays = task.lateSubmissionDays;
        if (task.instructions !== undefined) updates.instructions = task.instructions;
        if (task.submissionCount !== undefined)
            updates.submissionCount = task.submissionCount;
        if (task.isPinned !== undefined)
            updates.isPinned = task.isPinned;

        await updateDoc(taskRef, updates);
    } catch (error) {
        throw new Error(`Failed to update task: ${error}`);
    }
}

/**
 * Recalculates and updates the submission count for a task.
 * This is useful when the count might be out of sync (e.g., when students create submissions).
 * Only teachers can call this function.
 */
export async function recalculateTaskSubmissionCount(taskId: string): Promise<number> {
    try {
        const submissions = await getSubmissionsByTask(taskId);
        const count = submissions.length;

        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            submissionCount: count,
            updatedAt: Timestamp.now(),
        });

        return count;
    } catch (error) {
        throw new Error(`Failed to recalculate submission count: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function deleteTask(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
        throw new Error(`Failed to delete task: ${error}`);
    }
}

export async function getTasksByBatch(
    batchId: string,
    includeFutureTasks: boolean = false
): Promise<Task[]> {
    try {
        const q = query(
            collection(db, "tasks"),
            where("batchId", "==", batchId)
        );
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs
            .map((doc) => taskFromFirestore(doc.id, doc.data() as TaskFirestore))
            .filter((task) => {
                if (includeFutureTasks) return true;
                return isTaskStarted(task.startDate);
            });
        tasks.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            const aDate = a.startDate || a.createdAt;
            const bDate = b.startDate || b.createdAt;
            return bDate.getTime() - aDate.getTime();
        });
        return tasks;
    } catch (error) {
        throw new Error(`Failed to get tasks: ${error}`);
    }
}

export function subscribeTasksByBatch(
    batchId: string,
    callback: (tasks: Task[]) => void,
    includeFutureTasks: boolean = false
): () => void {
    const q = query(
        collection(db, "tasks"),
        where("batchId", "==", batchId)
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs
            .map((doc) => taskFromFirestore(doc.id, doc.data() as TaskFirestore))
            .filter((task) => {
                if (includeFutureTasks) return true;
                return isTaskStarted(task.startDate);
            });
        tasks.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            const aDate = a.startDate || a.createdAt;
            const bDate = b.startDate || b.createdAt;
            return bDate.getTime() - aDate.getTime();
        });
        callback(tasks);
    });
}

export async function getTaskById(id: string): Promise<Task | null> {
    try {
        const docRef = doc(db, "tasks", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return taskFromFirestore(docSnap.id, docSnap.data() as TaskFirestore);
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to get task: ${error}`);
    }
}

// ==================== Task Bookmark Operations ====================

export async function createTaskBookmark(
    bookmark: Omit<TaskBookmark, "id">
): Promise<string> {
    try {
        const existingBookmark = await getTaskBookmarkByStudentAndTask(
            bookmark.studentId,
            bookmark.taskId
        );
        if (existingBookmark) {
            return existingBookmark.id;
        }

        const bookmarkRef = doc(collection(db, "taskBookmarks"));
        const bookmarkData: TaskBookmarkFirestore = taskBookmarkToFirestore({
            ...bookmark,
            id: bookmarkRef.id,
        });
        await setDoc(bookmarkRef, bookmarkData);
        return bookmarkRef.id;
    } catch (error) {
        throw new Error(`Failed to create task bookmark: ${error}`);
    }
}

export async function deleteTaskBookmark(bookmarkId: string): Promise<void> {
    try {
        const bookmarkRef = doc(db, "taskBookmarks", bookmarkId);
        await deleteDoc(bookmarkRef);
    } catch (error) {
        throw new Error(`Failed to delete task bookmark: ${error}`);
    }
}

export async function deleteTaskBookmarkByStudentAndTask(
    studentId: string,
    taskId: string
): Promise<void> {
    try {
        const bookmark = await getTaskBookmarkByStudentAndTask(studentId, taskId);
        if (bookmark) {
            await deleteTaskBookmark(bookmark.id);
        }
    } catch (error) {
        throw new Error(`Failed to delete task bookmark: ${error}`);
    }
}

export async function getTaskBookmarkByStudentAndTask(
    studentId: string,
    taskId: string
): Promise<TaskBookmark | null> {
    try {
        const q = query(
            collection(db, "taskBookmarks"),
            where("studentId", "==", studentId),
            where("taskId", "==", taskId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return taskBookmarkFromFirestore(
            doc.id,
            doc.data() as TaskBookmarkFirestore
        );
    } catch (error) {
        throw new Error(`Failed to get task bookmark: ${error}`);
    }
}

export async function getTaskBookmarksByStudent(
    studentId: string
): Promise<TaskBookmark[]> {
    try {
        const q = query(
            collection(db, "taskBookmarks"),
            where("studentId", "==", studentId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) =>
            taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
        );
    } catch (error) {
        throw new Error(`Failed to get task bookmarks: ${error}`);
    }
}

export function subscribeTaskBookmarksByStudent(
    studentId: string,
    callback: (bookmarks: TaskBookmark[]) => void
): () => void {
    const q = query(
        collection(db, "taskBookmarks"),
        where("studentId", "==", studentId)
    );

    return onSnapshot(q, (snapshot) => {
        const bookmarks = snapshot.docs.map((doc) =>
            taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
        );
        callback(bookmarks);
    });
}

export async function getTaskBookmarksByBatch(
    batchId: string,
    studentId: string
): Promise<TaskBookmark[]> {
    try {
        const q = query(
            collection(db, "taskBookmarks"),
            where("studentId", "==", studentId),
            where("batchId", "==", batchId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) =>
            taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
        );
    } catch (error) {
        throw new Error(`Failed to get task bookmarks: ${error}`);
    }
}

export function subscribeTaskBookmarksByBatch(
    batchId: string,
    studentId: string,
    callback: (bookmarks: TaskBookmark[]) => void
): () => void {
    const q = query(
        collection(db, "taskBookmarks"),
        where("studentId", "==", studentId),
        where("batchId", "==", batchId)
    );

    return onSnapshot(q, (snapshot) => {
        const bookmarks = snapshot.docs.map((doc) =>
            taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
        );
        callback(bookmarks);
    });
}
