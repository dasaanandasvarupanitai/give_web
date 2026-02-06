import { Submission } from "@/lib/models/submission";
import { Task } from "@/lib/models/task";
import { isSubmissionWindowOpen, isWithinGracePeriod } from "@/lib/utils";

/**
 * Determines the display status, label, and color for a task based on its submission status.
 */
export function getSubmissionStatus(task: Task, submissions: Map<string, Submission>) {
    if (task.type === "announcement") {
        return { status: "announcement", label: "Announcement", color: "blue" };
    }

    const submission = submissions.get(task.id);
    if (!submission) {
        return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
    switch (submission.status) {
        case "draft":
            return { status: "draft", label: "Draft", color: "orange" };
        case "submitted":
            return { status: "submitted", label: "Submitted", color: "orange" };
        case "graded":
            return { status: "graded", label: "Graded", color: "blue" };
        default:
            return { status: "not_submitted", label: "Not Submitted", color: "gray" };
    }
}

/**
 * Determines if a task is published or closed based on due date and late submission policy.
 */
export function getTaskDisplayStatus(task: Task): "published" | "closed" {
    if (task.type === "announcement") return "published";

    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        let deadline: Date;

        if (task.allowLateSubmission && task.lateSubmissionDays > 0) {
            deadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);
        } else {
            deadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
        }

        if (new Date() > deadline) return "closed";
    }

    return "published";
}

/**
 * Checks if a task is overdue.
 */
export function isTaskOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date() > task.dueDate;
}

/**
 * Checks if a task is due within the next 3 days.
 */
export function isTaskDueSoon(task: Task): boolean {
    if (!task.dueDate) return false;
    const daysUntilDue = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
}

/**
 * Checks if late submission is currently allowed for the task.
 */
export function isLateSubmissionAllowed(task: Task): boolean {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return false;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);
    return now > dueDateDeadline && now <= lateSubmissionDeadline;
}

/**
 * Gets the number of remaining days for late submission.
 */
export function getRemainingLateSubmissionDays(task: Task): number | null {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return null;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + task.lateSubmissionDays, 23, 59, 59, 999);

    if (now > dueDateDeadline && now <= lateSubmissionDeadline) {
        const remainingMs = lateSubmissionDeadline.getTime() - now.getTime();
        return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    }
    return null;
}

/**
 * Determines if a task card is clickable/interactive.
 */
export function isTaskClickable(
    task: Task,
    submission: Submission | undefined,
    lateSubmissionAllowed: boolean
): boolean {
    if (task.type === "announcement") return false;

    const isSubmitted = submission?.status === "submitted" || submission?.status === "graded";
    const withinGracePeriod = submission ? isWithinGracePeriod(submission) : false;

    const submissionWindowOpen = task.dueDate
        ? isSubmissionWindowOpen(task.dueDate)
        : true;
    const submissionWindowClosed = task.dueDate && !submissionWindowOpen;
    const gracePeriodPassed = submission && !withinGracePeriod && submission.status === "submitted";

    return !(submissionWindowClosed && !isSubmitted && !lateSubmissionAllowed) &&
        !gracePeriodPassed &&
        (!isSubmitted || withinGracePeriod);
}
