import { db } from "@/lib/firebase";
import {
  BatchRequest,
  BatchRequestFirestore,
  batchRequestFromFirestore,
  batchRequestToFirestore,
} from "@/lib/models/batch-request";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";

/**
 * Create a new future batch request
 */
export async function createBatchRequest(
  request: Omit<BatchRequest, "id" | "createdAt">
): Promise<string> {
  try {
    const requestRef = doc(collection(db, "futureBatchRequests"));
    const firestoreData: BatchRequestFirestore = {
      ...batchRequestToFirestore(request),
      createdAt: Timestamp.now(),
    };
    await setDoc(requestRef, firestoreData);
    return requestRef.id;
  } catch (error) {
    console.error("Error creating batch request:", error);
    throw new Error(`Failed to create batch request: ${error}`);
  }
}

/**
 * Delete a batch request (admin utility)
 */
export async function deleteBatchRequest(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "futureBatchRequests", id));
  } catch (error) {
    console.error("Error deleting batch request:", error);
    throw new Error(`Failed to delete batch request: ${error}`);
  }
}

/**
 * Subscribe to all future batch requests (ordered by createdAt descending)
 */
export function subscribeBatchRequests(
  callback: (requests: BatchRequest[]) => void
): () => void {
  const q = query(collection(db, "futureBatchRequests"));

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((doc) =>
        batchRequestFromFirestore(doc.id, doc.data() as BatchRequestFirestore)
      );
      // Sort in memory by createdAt descending
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(requests);
    },
    (error) => {
      console.error("Error subscribing to batch requests:", error);
      callback([]);
    }
  );
}

/**
 * Subscribe to future batch requests for a specific course
 */
export function subscribeBatchRequestsByCourse(
  courseId: string,
  callback: (requests: BatchRequest[]) => void
): () => void {
  const q = query(
    collection(db, "futureBatchRequests"),
    where("courseId", "==", courseId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((doc) =>
        batchRequestFromFirestore(doc.id, doc.data() as BatchRequestFirestore)
      );
      // Sort in memory by createdAt descending
      requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(requests);
    },
    (error) => {
      console.error(`Error subscribing to batch requests for course ${courseId}:`, error);
      callback([]);
    }
  );
}
