import type { Task } from "@/lib/models/task";

export interface StudentFile {
    submissionId: string;
    fileUrl: string;
    fileName: string;
    studentId: string;
    taskId?: string;
    taskTitle?: string;
    submittedAt?: Date;
    type: "file";
}

export interface StudentTextSubmission {
    submissionId: string;
    text: string;
    studentId: string;
    taskId?: string;
    taskTitle?: string;
    submittedAt?: Date;
    type: "text";
}

export interface StudentSubmission {
    studentId: string;
    files: StudentFile[];
    textSubmissions: StudentTextSubmission[];
    isArchived?: boolean;
}

export interface TaskFiles {
    task: Task;
    studentSubmissions: StudentSubmission[];
}
