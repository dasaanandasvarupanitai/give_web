import { db } from "@/lib/firebase";
import {
    Submission,
    SubmissionFirestore,
    submissionFromFirestore,
    submissionToFirestore,
} from "@/lib/models/submission";
import {
    isCountableTaskType,
    recordSubmissionForTally,
    removeSubmissionFromTally,
} from "./student-stats-service";
import {
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

// ==================== Submission Operations ====================

export async function createSubmission(
    submission: Omit<Submission, "id">,
    taskType?: string
): Promise<string> {
    try {
        const submissionRef = doc(collection(db, "submissions"));
        const submissionData: SubmissionFirestore = submissionToFirestore({
            ...submission,
            id: submissionRef.id,
        });

        // Create the submission first (students have permission for this)
        await setDoc(submissionRef, submissionData);
        console.log("Submission created successfully:", submissionRef.id);

        // Register (analytics tally) update — best-effort, must never affect
        // the submission itself. Only daily listening tasks are counted, to
        // match the analytics report exactly.
        if (submissionData.status === "submitted" || submissionData.status === "graded") {
            try {
                let effectiveType = taskType;
                if (!effectiveType) {
                    const taskSnap = await getDoc(doc(db, "tasks", submission.taskId));
                    effectiveType = taskSnap.exists()
                        ? (taskSnap.data().type as string)
                        : undefined;
                }
                if (isCountableTaskType(effectiveType)) {
                    await recordSubmissionForTally(
                        submissionData.batchId,
                        submissionData.studentId
                    );
                }
            } catch (tallyError) {
                console.warn(
                    "[submission-service] Register update skipped (self-heals later):",
                    tallyError
                );
            }
        }

        try {
            const taskRef = doc(db, "tasks", submission.taskId);
            await updateDoc(taskRef, {
                submissionCount: increment(1),
                updatedAt: Timestamp.now(),
            });
            console.log("Task submission count updated successfully");
        } catch (taskUpdateError) {
            console.warn("Could not update task submission count (expected for students):", taskUpdateError);
        }

        return submissionRef.id;
    } catch (error) {
        console.error("Error creating submission:", error);
        throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function updateSubmission(
    id: string,
    submission: Partial<Submission>
): Promise<void> {
    try {
        const submissionRef = doc(db, "submissions", id);
        const updates: Partial<SubmissionFirestore> = {
            updatedAt: Timestamp.now(),
        };

        if (submission.status !== undefined) updates.status = submission.status;
        if (submission.submittedAt !== undefined)
            updates.submittedAt = Timestamp.fromDate(submission.submittedAt);
        if (submission.fileUrls !== undefined) updates.fileUrls = submission.fileUrls;
        // Handle recordingUrl
        if (submission.recordingUrl !== undefined) {
            if (submission.recordingUrl === null) {
                (updates as any).recordingUrl = deleteField();
            } else {
                updates.recordingUrl = submission.recordingUrl;
            }
        }
        // Handle notes
        if (submission.notes !== undefined) {
            if (submission.notes === null) {
                (updates as any).notes = deleteField();
            } else {
                updates.notes = submission.notes;
            }
        }
        if (submission.grade !== undefined) updates.grade = submission.grade;
        if (submission.feedback !== undefined) updates.feedback = submission.feedback;
        if (submission.gradedAt !== undefined)
            updates.gradedAt = Timestamp.fromDate(submission.gradedAt);
        if (submission.isArchived !== undefined)
            updates.isArchived = submission.isArchived;

        await updateDoc(submissionRef, updates);
    } catch (error) {
        throw new Error(`Failed to update submission: ${error}`);
    }
}

export async function getSubmissionByTaskAndStudent(
    taskId: string,
    studentId: string
): Promise<Submission | null> {
    try {
        const q = query(
            collection(db, "submissions"),
            where("taskId", "==", taskId),
            where("studentId", "==", studentId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return submissionFromFirestore(
                doc.id,
                doc.data() as SubmissionFirestore
            );
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to get submission: ${error}`);
    }
}

export function subscribeSubmissionByTaskAndStudent(
    taskId: string,
    studentId: string,
    callback: (submission: Submission | null) => void
): () => void {
    const q = query(
        collection(db, "submissions"),
        where("taskId", "==", taskId),
        where("studentId", "==", studentId),
        limit(1)
    );

    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const submission = submissionFromFirestore(
                doc.id,
                doc.data() as SubmissionFirestore
            );
            callback(submission);
        } else {
            callback(null);
        }
    });
}

export async function deleteSubmission(
    id: string,
    fileUrls?: string[]
): Promise<void> {
    try {
        const submissionRef = doc(db, "submissions", id);

        const submissionDoc = await getDoc(submissionRef);
        if (!submissionDoc.exists()) {
            throw new Error("Submission not found");
        }
        const submissionData = submissionDoc.data() as SubmissionFirestore;

        if (fileUrls && fileUrls.length > 0) {
            const { deleteFileByUrl } = await import("@/lib/services/storage");
            await Promise.allSettled(
                fileUrls.map((url) => deleteFileByUrl(url).catch(() => { }))
            );
        }

        await deleteDoc(submissionRef);

        // Register (analytics tally) update — best-effort, after the record
        // itself is already gone. Needs the task's type to know whether this
        // submission was part of the daily listening count.
        let deletedTaskType: string | undefined;
        try {
            const taskSnap = await getDoc(doc(db, "tasks", submissionData.taskId));
            if (taskSnap.exists()) deletedTaskType = taskSnap.data().type as string;
        } catch (typeError) {
            console.warn("[submission-service] Could not read task type for register:", typeError);
        }
        await removeSubmissionFromTally(
            submissionData.batchId,
            submissionData.taskId,
            submissionData.studentId,
            submissionData.status,
            deletedTaskType
        );

        try {
            const taskRef = doc(db, "tasks", submissionData.taskId);
            await updateDoc(taskRef, {
                submissionCount: increment(-1),
                updatedAt: Timestamp.now(),
            });
        } catch (taskUpdateError) {
            console.warn("Could not update task submission count (expected for students):", taskUpdateError);
        }
    } catch (error) {
        throw new Error(`Failed to delete submission: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
    try {
        const docSnap = await getDoc(doc(db, "submissions", id));
        if (docSnap.exists()) {
            return submissionFromFirestore(docSnap.id, docSnap.data() as SubmissionFirestore);
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to get submission: ${error}`);
    }
}

export async function getSubmissionsByTask(taskId: string): Promise<Submission[]> {
    try {
        const q = query(
            collection(db, "submissions"),
            where("taskId", "==", taskId)
        );
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return submissions;
    } catch (error) {
        throw new Error(`Failed to get submissions: ${error}`);
    }
}

export function subscribeSubmissionsByTask(
    taskId: string,
    callback: (submissions: Submission[]) => void
): () => void {
    const q = query(
        collection(db, "submissions"),
        where("taskId", "==", taskId)
    );

    return onSnapshot(q, (snapshot) => {
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(submissions);
    });
}

export async function getSubmissionsByStudent(
    studentId: string
): Promise<Submission[]> {
    try {
        const q = query(
            collection(db, "submissions"),
            where("studentId", "==", studentId)
        );
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return submissions;
    } catch (error) {
        throw new Error(`Failed to get submissions: ${error}`);
    }
}

export function subscribeSubmissionsByStudent(
    studentId: string,
    callback: (submissions: Submission[]) => void
): () => void {
    const q = query(
        collection(db, "submissions"),
        where("studentId", "==", studentId)
    );

    return onSnapshot(q, (snapshot) => {
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(submissions);
    });
}

export async function getSubmissionsByBatch(
    batchId: string
): Promise<Submission[]> {
    try {
        const q = query(
            collection(db, "submissions"),
            where("batchId", "==", batchId)
        );
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return submissions;
    } catch (error) {
        throw new Error(`Failed to get submissions: ${error}`);
    }
}

/**
 * Reads only the batch's submissions created inside a date window (used for
 * date-range analytics so the full history is not re-read). Callers pad the
 * window and apply the exact filter client-side, so the result is identical
 * to filtering the full history. Requires the (batchId, createdAt) composite
 * index; on failure callers fall back to the full batch read.
 */
export async function getSubmissionsByBatchInRange(
    batchId: string,
    from: Date,
    to: Date
): Promise<Submission[]> {
    try {
        const q = query(
            collection(db, "submissions"),
            where("batchId", "==", batchId),
            where("createdAt", ">=", Timestamp.fromDate(from)),
            where("createdAt", "<=", Timestamp.fromDate(to))
        );
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return submissions;
    } catch (error) {
        throw new Error(`Failed to get submissions: ${error}`);
    }
}

export function subscribeSubmissionsByBatch(
    batchId: string,
    callback: (submissions: Submission[]) => void
): () => void {
    const q = query(
        collection(db, "submissions"),
        where("batchId", "==", batchId)
    );

    return onSnapshot(q, (snapshot) => {
        const submissions = snapshot.docs.map((doc) =>
            submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
        );
        submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(submissions);
    });
}

// ==================== Bounded per-student reads (dashboards) ====================

/** Firestore `in` filters accept at most 30 values per query. */
const SUBMISSION_IN_CHUNK_SIZE = 30;

function chunkIds(ids: string[]): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += SUBMISSION_IN_CHUNK_SIZE) {
        chunks.push(ids.slice(i, i + SUBMISSION_IN_CHUNK_SIZE));
    }
    return chunks;
}

function sortSubmissionsDesc(submissions: Submission[]): Submission[] {
    return submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Live subscription to one student's submissions for an explicit list of
 * tasks only (the dashboard's loaded window) instead of the student's entire
 * history. Real-time behavior is identical to subscribeSubmissionsByStudent
 * for the requested tasks. Equality-only filters need no composite index;
 * if any chunk query fails, onError fires once so the caller can fall back.
 */
export function subscribeSubmissionsByStudentAndTaskIds(
    studentId: string,
    taskIds: string[],
    callback: (submissions: Submission[]) => void,
    onError?: (error: Error) => void
): () => void {
    if (taskIds.length === 0) {
        callback([]);
        return () => { };
    }

    const merged = new Map<string, Submission>();
    let errored = false;

    const unsubs = chunkIds(taskIds).map((chunk) =>
        onSnapshot(
            query(
                collection(db, "submissions"),
                where("studentId", "==", studentId),
                where("taskId", "in", chunk)
            ),
            (snapshot) => {
                for (const taskId of chunk) merged.delete(taskId);
                for (const docSnap of snapshot.docs) {
                    const submission = submissionFromFirestore(
                        docSnap.id,
                        docSnap.data() as SubmissionFirestore
                    );
                    merged.set(submission.taskId, submission);
                }
                callback(sortSubmissionsDesc(Array.from(merged.values())));
            },
            (error) => {
                if (errored) return;
                errored = true;
                onError?.(error);
            }
        )
    );

    return () => unsubs.forEach((unsub) => unsub());
}

/**
 * One-shot version of subscribeSubmissionsByStudentAndTaskIds for manual
 * refreshes.
 */
export async function getSubmissionsByStudentAndTaskIds(
    studentId: string,
    taskIds: string[]
): Promise<Submission[]> {
    if (taskIds.length === 0) return [];
    try {
        const snapshots = await Promise.all(
            chunkIds(taskIds).map((chunk) =>
                getDocs(
                    query(
                        collection(db, "submissions"),
                        where("studentId", "==", studentId),
                        where("taskId", "in", chunk)
                    )
                )
            )
        );
        const submissions = snapshots.flatMap((snapshot) =>
            snapshot.docs.map((doc) =>
                submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
            )
        );
        return sortSubmissionsDesc(submissions);
    } catch (error) {
        throw new Error(`Failed to get submissions: ${error}`);
    }
}
