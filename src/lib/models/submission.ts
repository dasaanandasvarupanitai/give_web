import { Timestamp } from "firebase/firestore";

export type SubmissionStatus = "draft" | "submitted" | "graded";

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  batchId: string;
  status: SubmissionStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  fileUrls: string[];
  recordingUrl?: string;
  notes?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
}

export interface SubmissionFirestore {
  taskId: string;
  studentId: string;
  batchId: string;
  status: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  fileUrls: string[];
  recordingUrl?: string;
  notes?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: Timestamp;
}

export function submissionFromFirestore(
  id: string,
  data: SubmissionFirestore
): Submission {
  return {
    id,
    taskId: data.taskId ?? "",
    studentId: data.studentId ?? "",
    batchId: data.batchId ?? "",
    status: (data.status as SubmissionStatus) || "draft",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    submittedAt: data.submittedAt?.toDate(),
    fileUrls: data.fileUrls ?? [],
    recordingUrl: data.recordingUrl,
    notes: data.notes,
    grade: data.grade,
    feedback: data.feedback,
    gradedAt: data.gradedAt?.toDate(),
  };
}

export function submissionToFirestore(
  submission: Submission
): SubmissionFirestore {
  const data: SubmissionFirestore = {
    taskId: submission.taskId,
    studentId: submission.studentId,
    batchId: submission.batchId,
    status: submission.status,
    createdAt: Timestamp.fromDate(submission.createdAt),
    updatedAt: Timestamp.fromDate(submission.updatedAt),
    fileUrls: submission.fileUrls,
  };
  
  // Only include optional fields if they're defined
  if (submission.submittedAt !== undefined) {
    data.submittedAt = Timestamp.fromDate(submission.submittedAt);
  }
  if (submission.recordingUrl !== undefined) {
    data.recordingUrl = submission.recordingUrl;
  }
  if (submission.notes !== undefined) {
    data.notes = submission.notes;
  }
  if (submission.grade !== undefined) {
    data.grade = submission.grade;
  }
  if (submission.feedback !== undefined) {
    data.feedback = submission.feedback;
  }
  if (submission.gradedAt !== undefined) {
    data.gradedAt = Timestamp.fromDate(submission.gradedAt);
  }
  
  return data;
}
