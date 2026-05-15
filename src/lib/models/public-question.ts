import { Timestamp } from "firebase/firestore";

export type ModerationStatus = "pending" | "approved" | "disapproved";

/** Runtime model (used in React state) */
export interface PublicQuestion {
  id: string;
  name: string;
  country: string;
  whatsappNumber: string;
  question: string;
  answer?: string;
  createdAt: Date;
  status: ModerationStatus;
}

/** Firestore wire format */
export interface PublicQuestionFirestore {
  name: string;
  country: string;
  whatsappNumber: string;
  question: string;
  answer?: string;
  createdAt: Timestamp;
  status: string;
}

export function publicQuestionFromFirestore(
  id: string,
  data: PublicQuestionFirestore
): PublicQuestion {
  return {
    id,
    name: data.name ?? "",
    country: data.country ?? "",
    whatsappNumber: data.whatsappNumber ?? "",
    question: data.question ?? "",
    answer: data.answer ?? undefined,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    status: (["pending", "approved", "disapproved"].includes(data.status)
      ? data.status
      : "pending") as ModerationStatus,
  };
}

export function publicQuestionToFirestore(
  q: Omit<PublicQuestion, "id">
): PublicQuestionFirestore {
  return {
    name: q.name,
    country: q.country,
    whatsappNumber: q.whatsappNumber,
    question: q.question,
    createdAt: Timestamp.fromDate(q.createdAt),
    status: q.status,
  };
}
