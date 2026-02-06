import { db } from "@/lib/firebase";
import {
    Batch,
    BatchFirestore,
    batchFromFirestore,
    batchToFirestore,
} from "@/lib/models/batch";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";

// ==================== Batch Operations ====================

export async function createBatch(batch: Omit<Batch, "id">): Promise<string> {
    try {
        const batchRef = doc(collection(db, "batches"));
        const batchData: BatchFirestore = batchToFirestore({
            ...batch,
            id: batchRef.id,
        });

        const batchWrite = writeBatch(db);
        batchWrite.set(batchRef, batchData);

        // Update course group batch count
        const courseGroupRef = doc(db, "courseGroups", batch.courseGroupId);
        batchWrite.update(courseGroupRef, {
            batchCount: increment(1),
            updatedAt: Timestamp.now(),
        });

        await batchWrite.commit();
        return batchRef.id;
    } catch (error) {
        throw new Error(`Failed to create batch: ${error}`);
    }
}

export async function updateBatch(id: string, batch: Partial<Batch>): Promise<void> {
    try {
        const batchRef = doc(db, "batches", id);
        const updates: Partial<BatchFirestore> = {
            updatedAt: Timestamp.now(),
        };

        if (batch.name !== undefined) updates.name = batch.name;
        if (batch.description !== undefined) updates.description = batch.description;
        if (batch.startDate !== undefined)
            updates.startDate = Timestamp.fromDate(batch.startDate);
        if (batch.endDate !== undefined)
            updates.endDate = Timestamp.fromDate(batch.endDate);
        if (batch.schedule !== undefined) updates.schedule = batch.schedule;
        if (batch.location !== undefined) updates.location = batch.location;
        if (batch.logoUrl !== undefined) updates.logoUrl = batch.logoUrl;
        if (batch.isActive !== undefined) updates.isActive = batch.isActive;

        await updateDoc(batchRef, updates);
    } catch (error) {
        throw new Error(`Failed to update batch: ${error}`);
    }
}

export async function deleteBatch(id: string, courseGroupId: string): Promise<void> {
    try {
        const batchWrite = writeBatch(db);

        // Delete batch
        const batchRef = doc(db, "batches", id);
        batchWrite.delete(batchRef);

        // Update course group batch count
        const courseGroupRef = doc(db, "courseGroups", courseGroupId);
        batchWrite.update(courseGroupRef, {
            batchCount: increment(-1),
            updatedAt: Timestamp.now(),
        });

        await batchWrite.commit();
    } catch (error) {
        throw new Error(`Failed to delete batch: ${error}`);
    }
}

export async function getBatchesByCourseGroup(
    courseGroupId: string
): Promise<Batch[]> {
    try {
        const q = query(
            collection(db, "batches"),
            where("courseGroupId", "==", courseGroupId),
            where("isActive", "==", true)
        );
        const snapshot = await getDocs(q);
        const batches = snapshot.docs.map((doc) =>
            batchFromFirestore(doc.id, doc.data() as BatchFirestore)
        );
        batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return batches;
    } catch (error) {
        throw new Error(`Failed to get batches: ${error}`);
    }
}

export function subscribeBatchesByCourseGroup(
    courseGroupId: string,
    callback: (batches: Batch[]) => void
): () => void {
    const q = query(
        collection(db, "batches"),
        where("courseGroupId", "==", courseGroupId),
        where("isActive", "==", true)
    );

    return onSnapshot(q, (snapshot) => {
        const batches = snapshot.docs.map((doc) =>
            batchFromFirestore(doc.id, doc.data() as BatchFirestore)
        );
        batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(batches);
    });
}

// Validates class code and returns minimal info needed for enrollment
export async function validateClassCode(classCode: string): Promise<{
    batchId: string;
    courseGroupId: string;
} | null> {
    try {
        const q = query(
            collection(db, "batches"),
            where("classCode", "==", classCode),
            where("isActive", "==", true),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data() as BatchFirestore;
            return {
                batchId: doc.id,
                courseGroupId: data.courseGroupId,
            };
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to validate class code: ${error}`);
    }
}

// Keep this for teacher/admin use only
export async function getBatchByClassCode(classCode: string): Promise<Batch | null> {
    try {
        const q = query(
            collection(db, "batches"),
            where("classCode", "==", classCode),
            where("isActive", "==", true),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return batchFromFirestore(doc.id, doc.data() as BatchFirestore);
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to get batch by class code: ${error}`);
    }
}

export async function getBatchById(id: string): Promise<Batch | null> {
    try {
        const docRef = doc(db, "batches", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return batchFromFirestore(docSnap.id, docSnap.data() as BatchFirestore);
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to get batch: ${error}`);
    }
}

// ==================== Helper Functions ====================

/**
 * Generate a random batch code (6 characters alphanumeric)
 */
export function generateBatchCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
