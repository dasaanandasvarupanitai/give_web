import { Timestamp } from "firebase/firestore";

export interface TaskBookmark {
  id: string;
  studentId: string;
  taskId: string;
  batchId: string;
  createdAt: Date;
}

export interface TaskBookmarkFirestore {
  studentId: string;
  taskId: string;
  batchId: string;
  createdAt: Timestamp;
}

export function taskBookmarkFromFirestore(
  id: string,
  data: TaskBookmarkFirestore
): TaskBookmark {
  return {
    id,
    studentId: data.studentId,
    taskId: data.taskId,
    batchId: data.batchId,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export function taskBookmarkToFirestore(
  bookmark: TaskBookmark
): TaskBookmarkFirestore {
  return {
    studentId: bookmark.studentId,
    taskId: bookmark.taskId,
    batchId: bookmark.batchId,
    createdAt: Timestamp.fromDate(bookmark.createdAt),
  };
}
