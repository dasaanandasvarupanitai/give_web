import { Timestamp } from "firebase/firestore";

export type TaskStatus = "draft" | "published" | "closed";
export type TaskType =
  | "dailyListening"
  | "cba"
  | "oba"
  | "slokaMemorization"
  | "announcement";

export interface Task {
  id: string;
  title: string;
  description: string;
  batchId: string;
  teacherId: string;
  type: TaskType;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  startDate?: Date; // Date when task becomes visible to students (12:00 AM)
  dueDate?: Date;
  maxPoints: number;
  attachments: string[];
  allowedFileTypes: string[];
  allowLateSubmission: boolean;
  lateSubmissionDays: number;
  instructions?: string;
  submissionCount: number;
}

export interface TaskFirestore {
  title: string;
  description: string;
  batchId: string;
  teacherId: string;
  type: string;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startDate?: Timestamp; // Date when task becomes visible to students (12:00 AM)
  dueDate?: Timestamp;
  maxPoints: number;
  attachments: string[];
  allowedFileTypes: string[];
  allowLateSubmission: boolean;
  lateSubmissionDays: number;
  instructions?: string;
  submissionCount: number;
}

export function taskFromFirestore(id: string, data: TaskFirestore): Task {
  return {
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    batchId: data.batchId ?? "",
    teacherId: data.teacherId ?? "",
    type: parseTaskType(data.type),
    status: (data.status as TaskStatus) || "draft",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    startDate: data.startDate?.toDate(),
    dueDate: data.dueDate?.toDate(),
    maxPoints: data.maxPoints ?? 100,
    attachments: data.attachments ?? [],
    allowedFileTypes:
      data.allowedFileTypes ?? ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    allowLateSubmission: data.allowLateSubmission ?? true,
    lateSubmissionDays: data.lateSubmissionDays ?? 3,
    instructions: data.instructions,
    submissionCount: data.submissionCount ?? 0,
  };
}

export function taskToFirestore(task: Task): TaskFirestore {
  const data: TaskFirestore = {
    title: task.title,
    description: task.description,
    batchId: task.batchId,
    teacherId: task.teacherId,
    type: task.type,
    status: task.status,
    createdAt: Timestamp.fromDate(task.createdAt),
    updatedAt: Timestamp.fromDate(task.updatedAt),
    maxPoints: task.maxPoints,
    attachments: task.attachments,
    allowedFileTypes: task.allowedFileTypes,
    allowLateSubmission: task.allowLateSubmission,
    lateSubmissionDays: task.lateSubmissionDays,
    submissionCount: task.submissionCount,
  };
  
  // Only include optional fields if they're defined
  if (task.startDate !== undefined) {
    data.startDate = Timestamp.fromDate(task.startDate);
  }
  if (task.dueDate !== undefined) {
    data.dueDate = Timestamp.fromDate(task.dueDate);
  }
  if (task.instructions !== undefined) {
    data.instructions = task.instructions;
  }
  
  return data;
}

function parseTaskType(typeString: string | undefined): TaskType {
  if (!typeString) return "dailyListening";

  switch (typeString) {
    case "dailyListening":
      return "dailyListening";
    case "cba":
      return "cba";
    case "oba":
      return "oba";
    case "slokaMemorization":
      return "slokaMemorization";
    case "announcement":
      return "announcement";
    // Backward compatibility
    case "assignment":
      return "oba";
    case "quiz":
      return "cba";
    case "material":
      return "dailyListening";
    default:
      return "dailyListening";
  }
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  return new Date().isAfter(task.dueDate);
}

export function isTaskDueSoon(task: Task): boolean {
  if (!task.dueDate) return false;
  const daysUntilDue = Math.ceil(
    (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilDue <= 3 && daysUntilDue >= 0;
}
