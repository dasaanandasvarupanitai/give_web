import { Timestamp } from "firebase/firestore";

export interface BatchRequest {
  id: string;
  courseId: string;
  courseTitle: string;
  name: string;
  city: string;
  whatsapp: string;
  preferredLanguage: string;
  createdAt: Date;
}

export interface BatchRequestFirestore {
  courseId: string;
  courseTitle: string;
  name: string;
  city: string;
  whatsapp: string;
  preferredLanguage: string;
  createdAt: Timestamp;
}

export function batchRequestFromFirestore(
  id: string,
  data: BatchRequestFirestore
): BatchRequest {
  return {
    id,
    courseId: data.courseId ?? "",
    courseTitle: data.courseTitle ?? "",
    name: data.name ?? "",
    city: data.city ?? "",
    whatsapp: data.whatsapp ?? "",
    preferredLanguage: data.preferredLanguage ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export function batchRequestToFirestore(
  request: Omit<BatchRequest, "id" | "createdAt">
): Omit<BatchRequestFirestore, "createdAt"> {
  return {
    courseId: request.courseId,
    courseTitle: request.courseTitle,
    name: request.name,
    city: request.city,
    whatsapp: request.whatsapp,
    preferredLanguage: request.preferredLanguage,
  };
}
