import { db } from "@/lib/firebase";
import {
    Enrollment,
    EnrollmentFirestore,
    enrollmentFromFirestore,
    enrollmentToFirestore,
} from "@/lib/models/enrollment";
import { assignStudentRole } from "@/lib/user-roles";
import {
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    increment,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

// ==================== Enrollment Operations ====================

export async function createEnrollment(
    enrollment: Omit<Enrollment, "id">,
    userEmail: string
): Promise<string> {
    try {
        const enrollmentRef = doc(collection(db, "enrollments"));
        const enrollmentData: EnrollmentFirestore = enrollmentToFirestore({
            ...enrollment,
            id: enrollmentRef.id,
        });

        // Only create the enrollment document
        // Don't update batch student count or create membership index yet
        // These will be created when the enrollment is approved (status changes to "active")
        await setDoc(enrollmentRef, enrollmentData);

        // Promote user to student role if needed
        await assignStudentRole(enrollment.studentId, userEmail);

        return enrollmentRef.id;
    } catch (error) {
        throw new Error(`Failed to create enrollment: ${error}`);
    }
}

export async function updateEnrollment(
    id: string,
    enrollment: Partial<Enrollment>
): Promise<void> {
    try {
        const enrollmentRef = doc(db, "enrollments", id);
        const enrollmentDoc = await getDoc(enrollmentRef);

        if (!enrollmentDoc.exists()) {
            throw new Error("Enrollment not found");
        }

        const currentData = enrollmentDoc.data() as EnrollmentFirestore;
        const currentStatus = currentData.status;
        const updates: Partial<EnrollmentFirestore> = {};

        if (enrollment.status !== undefined) updates.status = enrollment.status;
        if (enrollment.completedAt !== undefined)
            updates.completedAt = Timestamp.fromDate(enrollment.completedAt);
        if (enrollment.droppedAt !== undefined)
            updates.droppedAt = Timestamp.fromDate(enrollment.droppedAt);
        if (enrollment.notes !== undefined) updates.notes = enrollment.notes;
        if (enrollment.studentName !== undefined) updates.studentName = enrollment.studentName;
        // Handle dikshaName (empty string means clear field)
        if (enrollment.dikshaName !== undefined) {
            if (enrollment.dikshaName === "") {
                (updates as any).dikshaName = deleteField();
            } else {
                updates.dikshaName = enrollment.dikshaName;
            }
        }
        if (enrollment.whatsappNumber !== undefined) updates.whatsappNumber = enrollment.whatsappNumber;
        // Handle address (empty string means clear field)
        if (enrollment.address !== undefined) {
            if (enrollment.address === "") {
                (updates as any).address = deleteField();
            } else {
                updates.address = enrollment.address;
            }
        }

        const batchWrite = writeBatch(db);
        batchWrite.update(enrollmentRef, updates);

        // If status changed to "active" (approved), create membership index and update student count
        if (enrollment.status === "active" && currentStatus !== "active") {
            const memberRef = doc(
                db,
                "batches",
                currentData.batchId,
                "members",
                currentData.studentId
            );
            batchWrite.set(memberRef, {
                enrolledAt: Timestamp.now(),
            });

            // Update batch student count
            const batchRef = doc(db, "batches", currentData.batchId);
            batchWrite.update(batchRef, {
                studentCount: increment(1),
                updatedAt: Timestamp.now(),
            });
        }

        // If status changed to "dropped", remove membership index and decrement student count
        if (enrollment.status === "dropped" && currentStatus !== "dropped") {
            const memberRef = doc(
                db,
                "batches",
                currentData.batchId,
                "members",
                currentData.studentId
            );
            batchWrite.delete(memberRef);

            // Update batch student count (only if was previously active)
            if (currentStatus === "active") {
                const batchRef = doc(db, "batches", currentData.batchId);
                batchWrite.update(batchRef, {
                    studentCount: increment(-1),
                    updatedAt: Timestamp.now(),
                });
            }
        }

        await batchWrite.commit();
    } catch (error) {
        throw new Error(`Failed to update enrollment: ${error}`);
    }
}

export async function deleteEnrollment(
    enrollmentId: string
): Promise<void> {
    try {
        const enrollmentRef = doc(db, "enrollments", enrollmentId);
        const enrollmentDoc = await getDoc(enrollmentRef);

        if (!enrollmentDoc.exists()) {
            throw new Error("Enrollment not found");
        }

        const enrollmentData = enrollmentDoc.data() as EnrollmentFirestore;

        // Safety check: Only allow deletion of declined or dropped enrollments
        if (enrollmentData.status !== "declined" && enrollmentData.status !== "dropped") {
            throw new Error(`Cannot delete enrollment with status "${enrollmentData.status}". Only declined or dropped enrollments can be removed.`);
        }

        await deleteDoc(enrollmentRef);
    } catch (error) {
        throw new Error(`Failed to delete enrollment: ${error}`);
    }
}

export async function getEnrollmentsByStudent(
    studentId: string
): Promise<Enrollment[]> {
    try {
        const q = query(
            collection(db, "enrollments"),
            where("studentId", "==", studentId)
        );
        const snapshot = await getDocs(q);
        const enrollments = snapshot.docs.map((doc) =>
            enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
        );
        enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        return enrollments;
    } catch (error) {
        throw new Error(`Failed to get enrollments: ${error}`);
    }
}

export function subscribeEnrollmentsByStudent(
    studentId: string,
    callback: (enrollments: Enrollment[]) => void
): () => void {
    const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", studentId)
    );

    return onSnapshot(q, (snapshot) => {
        const enrollments = snapshot.docs.map((doc) =>
            enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
        );
        enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        callback(enrollments);
    });
}

export async function getEnrollmentsByBatch(
    batchId: string
): Promise<Enrollment[]> {
    try {
        const q = query(
            collection(db, "enrollments"),
            where("batchId", "==", batchId)
        );
        const snapshot = await getDocs(q);
        const enrollments = snapshot.docs.map((doc) =>
            enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
        );
        enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        return enrollments;
    } catch (error) {
        throw new Error(`Failed to get enrollments: ${error}`);
    }
}

export function subscribeEnrollmentsByBatch(
    batchId: string,
    callback: (enrollments: Enrollment[]) => void
): () => void {
    const q = query(
        collection(db, "enrollments"),
        where("batchId", "==", batchId)
    );

    return onSnapshot(q, (snapshot) => {
        const enrollments = snapshot.docs.map((doc) =>
            enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
        );
        enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
        callback(enrollments);
    });
}
