import { db } from "@/lib/firebase";
import {
    Submission,
    SubmissionFirestore,
    submissionFromFirestore,
    submissionToFirestore,
} from "@/lib/models/submission";
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
    submission: Omit<Submission, "id">
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
