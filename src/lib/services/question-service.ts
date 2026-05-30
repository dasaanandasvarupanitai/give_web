import { db } from "@/lib/firebase";
import {
  ModerationStatus,
  PublicQuestion,
  publicQuestionFromFirestore,
  PublicQuestionFirestore,
} from "@/lib/models/public-question";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// ==================== Types ====================

export interface SubmitQuestionData {
  name: string;
  country: string;
  whatsappNumber: string;
  question: string;
}

export type SubmitQuestionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const VALID_STATUSES: ModerationStatus[] = ["pending", "approved", "disapproved"];

// ==================== submitQuestion ====================

export async function submitQuestion(
  data: SubmitQuestionData
): Promise<SubmitQuestionResult> {
  try {
    // Generate a simple deterministic ID to prevent duplicates (same phone + question)
    const rawId = `${data.whatsappNumber.trim()}_${data.question.trim().substring(0, 100)}`;
    const id = typeof window !== "undefined" 
      ? btoa(encodeURIComponent(rawId)).replace(/[/+=]/g, "_")
      : Buffer.from(encodeURIComponent(rawId)).toString("base64").replace(/[/+=]/g, "_");

    const docRef = doc(db, "publicQuestions", id);
    await setDoc(docRef, {
      name: data.name,
      country: data.country,
      whatsappNumber: data.whatsappNumber,
      question: data.question,
      createdAt: Timestamp.now(),
      status: "pending",
    });
    return { ok: true, id };
  } catch (err: any) {
    // If it fails due to permissions (unauthenticated update), it means it's a duplicate.
    if (err.code === "permission-denied" || err.message?.includes("Missing or insufficient permissions")) {
      return { ok: true, id: "" };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ==================== updateQuestionStatus ====================

export async function updateQuestionStatus(
  id: string,
  status: ModerationStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  try {
    const ref = doc(db, "publicQuestions", id);
    await updateDoc(ref, { status });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ==================== editQuestion ====================

export async function editQuestion(
  id: string,
  data: Partial<SubmitQuestionData>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ref = doc(db, "publicQuestions", id);
    await updateDoc(ref, data);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ==================== addAnswerToQuestion ====================

export async function addAnswerToQuestion(
  id: string,
  answer: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ref = doc(db, "publicQuestions", id);
    await updateDoc(ref, { answer: answer.trim() || null });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ==================== deleteQuestion ====================

export async function deleteQuestion(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const ref = doc(db, "publicQuestions", id);
    await deleteDoc(ref);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ==================== getPendingQuestionsPage ====================

const PAGE_SIZE = 12;

export async function getPendingQuestionsPage(
  pageSize: number = PAGE_SIZE,
  cursor: QueryDocumentSnapshot | null
): Promise<{ docs: PublicQuestion[]; nextCursor: QueryDocumentSnapshot | null }> {
  const constraints = [
    where("status", "==", "pending"),
    orderBy("createdAt", "asc"),
    limit(pageSize),
    ...(cursor ? [startAfter(cursor)] : []),
  ];

  const q = query(collection(db, "publicQuestions"), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((d) =>
    publicQuestionFromFirestore(d.id, d.data() as PublicQuestionFirestore)
  );

  const nextCursor =
    snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { docs, nextCursor };
}

// ==================== getAllQuestionsByStatus ====================

export async function getAllQuestionsByStatus(
  status: ModerationStatus
): Promise<PublicQuestion[]> {
  const q = query(
    collection(db, "publicQuestions"),
    where("status", "==", status),
    orderBy("createdAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) =>
    publicQuestionFromFirestore(d.id, d.data() as PublicQuestionFirestore)
  );
}

// ==================== getModeratedQuestionsPage ====================

export async function getModeratedQuestionsPage(
  status: "approved" | "disapproved",
  pageSize: number = PAGE_SIZE,
  cursor: QueryDocumentSnapshot | null
): Promise<{ docs: PublicQuestion[]; nextCursor: QueryDocumentSnapshot | null }> {
  const constraints = [
    where("status", "==", status),
    orderBy("createdAt", "asc"),
    limit(pageSize),
    ...(cursor ? [startAfter(cursor)] : []),
  ];

  const q = query(collection(db, "publicQuestions"), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs.map((d) =>
    publicQuestionFromFirestore(d.id, d.data() as PublicQuestionFirestore)
  );

  const nextCursor =
    snapshot.docs.length === pageSize
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { docs, nextCursor };
}
