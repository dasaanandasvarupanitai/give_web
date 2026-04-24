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
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { getSubmissionsByTask } from "./submission-service";

// ==================== Task Operations ====================

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
