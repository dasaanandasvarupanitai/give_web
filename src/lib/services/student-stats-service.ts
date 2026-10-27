import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getCountFromServer,
    increment,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

/**
 * The "register" (batchStudentStats): one small document per batch+student
 * holding how many DISTINCT daily tasks that student has a counted submission
 * for. It exists so all-time analytics reads ~1 line per student instead of
 * re-reading every submission in the batch.
 *
 * Safety rules:
 * - The register NEVER touches submission documents. It is written on
 *   submission create/delete only, and every update is best-effort: a failed
 *   register write is logged and ignored so student flows can never break.
 * - Counts can always be rebuilt exactly from the submission history
 *   (recount functions below), which also powers the manual "Recount" button
 *   and automatic self-healing.
 */

const TALLY_COLLECTION = "batchStudentStats";

/**
 * Register version: v1 counted submissions of ALL task types, which did not
 * match the daily-listening report's definition. v2 counts only daily
 * listening tasks. Lines without this version are ignored (and rewritten by
 * the recount paths), so stale v1 data can never be shown as truth.
 */
const TALLY_VERSION = 2;

/** The register's ONLY purpose is the daily listening report — it counts
 * submissions for daily listening tasks exclusively. */
const COUNTED_TASK_TYPE = "dailyListening";

/** The register only tracks this task type; call this before incrementing. */
export function isCountableTaskType(taskType: string | undefined): boolean {
    return taskType === COUNTED_TASK_TYPE;
}

/** Analytics counts only these statuses. Every submission is created as
 * "submitted" and grading keeps it in this set, so in practice all
 * submissions count — the guard keeps the register genuine if a "draft"
 * status is ever introduced. */
function countsForAnalytics(status: string | undefined): boolean {
    return status === "submitted" || status === "graded";
}

function tallyDocRef(batchId: string, studentId: string) {
    return doc(db, TALLY_COLLECTION, `${batchId}_${studentId}`);
}

/**
 * Best-effort +1 when a counted submission document is created.
 * merge:true creates the line if it does not exist yet.
 * IMPORTANT: callers must only call this for daily listening submissions —
 * use isCountableTaskType() to check.
 */
export async function recordSubmissionForTally(
    batchId: string,
    studentId: string
): Promise<void> {
    try {
        await setDoc(
            tallyDocRef(batchId, studentId),
            {
                batchId,
                studentId,
                submittedCount: increment(1),
                version: TALLY_VERSION,
                updatedAt: Timestamp.now(),
            },
            { merge: true }
        );
    } catch (error) {
        console.warn(
            "[student-stats] Tally increment failed (self-heals on next recount):",
            error
        );
    }
}

/**
 * Best-effort -1 after a submission document is deleted — but only when the
 * deleted one was counted AND no other submission for the same task remains
 * (protects against double-submission races distorting the count).
 * taskType must be the deleted submission's task's type.
 */
export async function removeSubmissionFromTally(
    batchId: string,
    taskId: string,
    studentId: string,
    deletedStatus: string | undefined,
    taskType: string | undefined
): Promise<void> {
    try {
        if (!countsForAnalytics(deletedStatus)) return;
        if (!isCountableTaskType(taskType)) return;

        const remaining = await getCountFromServer(
            query(
                collection(db, "submissions"),
                where("taskId", "==", taskId),
                where("studentId", "==", studentId)
            )
        );
        if (remaining.data().count > 0) return;

        const ref = tallyDocRef(batchId, studentId);
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) return; // no line yet; a later recount will create it

        await updateDoc(ref, {
            submittedCount: increment(-1),
            version: TALLY_VERSION,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.warn(
            "[student-stats] Tally decrement failed (self-heals on next recount):",
            error
        );
    }
}

/**
 * Reads the register lines for the given students. Only current-version
 * lines are returned — anything older is treated as missing so it gets
 * recounted with the correct definition.
 * Map<studentId, submittedCount>.
 */
export async function getStudentTallies(
    batchId: string,
    studentIds: string[]
): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (studentIds.length === 0) return result;

    const chunks: string[][] = [];
    for (let i = 0; i < studentIds.length; i += 30) {
        chunks.push(studentIds.slice(i, i + 30));
    }

    const snapshots = await Promise.all(
        chunks.map((chunk) =>
            getDocs(
                query(
                    collection(db, TALLY_COLLECTION),
                    where("batchId", "==", batchId),
                    where("studentId", "in", chunk)
                )
            )
        )
    );

    for (const snapshot of snapshots) {
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const studentId = data.studentId as string;
            const version = typeof data.version === "number" ? data.version : 1;
            const count = typeof data.submittedCount === "number" ? data.submittedCount : 0;
            if (studentId && version === TALLY_VERSION) result.set(studentId, count);
        }
    }
    return result;
}

/** Writes one register line directly (used by recounts / self-healing). */
export async function writeStudentTally(
    batchId: string,
    studentId: string,
    submittedCount: number
): Promise<void> {
    await setDoc(
        tallyDocRef(batchId, studentId),
        { batchId, studentId, submittedCount, version: TALLY_VERSION, updatedAt: Timestamp.now() },
        { merge: true }
    );
}

/**
 * Recounts one student straight from their submission history (the ground
 * truth) and rewrites their register line. When allowedTaskIds is given,
 * only submissions for those tasks count — matching the report's task set
 * exactly. Returns the exact count.
 */
export async function recountStudentFromHistory(
    batchId: string,
    studentId: string,
    allowedTaskIds?: Set<string>
): Promise<number> {
    const snapshot = await getDocs(
        query(
            collection(db, "submissions"),
            where("batchId", "==", batchId),
            where("studentId", "==", studentId)
        )
    );
    const countedTaskIds = new Set<string>();
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (!countsForAnalytics(data.status as string)) continue;
        if (allowedTaskIds && !allowedTaskIds.has(data.taskId as string)) continue;
        countedTaskIds.add(data.taskId as string);
    }
    const count = countedTaskIds.size;
    await writeStudentTally(batchId, studentId, count);
    return count;
}

/**
 * Recounts every given student from a single batch-wide pass over the
 * submission history (one full read instead of one read per student) and
 * rewrites all their register lines. Used for first-time backfill and the
 * manual "Recount" button. allowedTaskIds restricts the count to the
 * report's task set.
 */
export async function recountBatchTallies(
    batchId: string,
    studentIds: string[],
    allowedTaskIds?: Set<string>
): Promise<Map<string, number>> {
    const snapshot = await getDocs(
        query(collection(db, "submissions"), where("batchId", "==", batchId))
    );

    const countedByStudent = new Map<string, Set<string>>();
    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const studentId = data.studentId as string;
        if (!studentId || !countsForAnalytics(data.status as string)) continue;
        if (allowedTaskIds && !allowedTaskIds.has(data.taskId as string)) continue;
        let set = countedByStudent.get(studentId);
        if (!set) {
            set = new Set<string>();
            countedByStudent.set(studentId, set);
        }
        set.add(data.taskId as string);
    }

    const result = new Map<string, number>();
    for (const studentId of studentIds) {
        const count = countedByStudent.get(studentId)?.size ?? 0;
        result.set(studentId, count);
    }

    await Promise.all(
        Array.from(result.entries()).map(([studentId, count]) =>
            writeStudentTally(batchId, studentId, count)
        )
    );

    return result;
}
