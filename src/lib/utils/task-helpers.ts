import type { TaskType } from "@/lib/models/task";
import { isTaskStarted } from "@/lib/utils";
import {
  BookOpen,
  FileQuestion,
  FileText,
  Headphones,
  Megaphone,
} from "lucide-react";

export function getTaskTypeIcon(type: TaskType) {
  switch (type) {
    case "dailyListening":
      return Headphones;
    case "cba":
      return FileQuestion;
    case "oba":
      return FileText;
    case "slokaMemorization":
      return BookOpen;
    case "announcement":
      return Megaphone;
    default:
      return FileText;
  }
}

export function getTaskTypeLabel(type: TaskType): string {
  switch (type) {
    case "dailyListening":
      return "Daily Listening";
    case "cba":
      return "CBA";
    case "oba":
      return "OBA";
    case "slokaMemorization":
      return "Sloka Memorization";
    case "announcement":
      return "Announcement";
    default:
      return "Task";
  }
}

export function getTaskTypeColor(type: TaskType): string {
  switch (type) {
    case "dailyListening":
      return "#3b82f6"; // blue
    case "cba":
      return "#a855f7"; // purple
    case "oba":
      return "#f97316"; // orange
    case "slokaMemorization":
      return "#14b8a6"; // teal
    case "announcement":
      return "#f97316"; // orange
    default:
      return "#6b7280"; // gray
  }
}

/**
 * Calculate the display status for a task in the teacher dashboard
 * - "scheduled": Task has startDate in the future (not yet visible to students)
 * - "published": Task is currently visible to students (startDate has passed, but not closed)
 * - "closed": Task is past its deadline (dueDate + grace period/late submission window)
 */
import type { Task } from "@/lib/models/task";

export function getTaskDisplayStatus(task: Task): "scheduled" | "published" | "closed" {
  const now = new Date();

  // Check if task is scheduled (startDate is in the future, using student's local timezone)
  if (!isTaskStarted(task.startDate)) {
    return "scheduled";
  }

  // For announcements, they're either scheduled or published (never closed)
  if (task.type === "announcement") {
    return "published";
  }

  // Check if task is closed (past due date/late submission)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    let deadline: Date;

    if (task.allowLateSubmission && task.lateSubmissionDays > 0) {
      // Late submission allowed: deadline is dueDate + lateSubmissionDays + 1 day at 1:00 AM
      deadline = new Date(dueDate);
      deadline.setDate(deadline.getDate() + task.lateSubmissionDays + 1);
      deadline.setHours(1, 0, 0, 0);
    } else {
      // No late submission: deadline is exactly the due date + 1 hour (1:00 AM next day)
      // This matches the student-facing deadline logic
      deadline = new Date(dueDate);
      deadline.setDate(deadline.getDate() + 1);
      deadline.setHours(1, 0, 0, 0);
    }

    if (now > deadline) {
      return "closed";
    }
  }

  // Task is published (startDate has passed or no startDate, and not closed)
  return "published";
}
