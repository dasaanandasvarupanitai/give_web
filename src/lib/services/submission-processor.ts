import { TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { Enrollment } from "@/lib/models/enrollment";
import { Task } from "@/lib/models/task";
import { User } from "@/lib/models/user";
import { Submission } from "@/lib/models/submission";
import { getFileNameFromUrl } from "@/lib/utils/file-helpers";

/**
 * Builds one task's display structure (files, text submissions, archive
 * flags) from that task's submission documents. Shared by the submissions
 * page's per-task loading and its post-delete rebuilds, so both paths always
 * produce identical output.
 */
export function buildTaskFiles(
    task: Task,
    submissions: Submission[],
    studentsMap: Map<string, User>,
    enrollmentsMap: Map<string, Enrollment>
): TaskFiles | null {
    if (task.type === "announcement") return null;

    const taskFiles: TaskFiles = { task, studentSubmissions: [] };

    submissions.forEach((submission) => {
        if (submission.taskId !== task.id) return;

        let studentSubmission = taskFiles.studentSubmissions.find(
            (s) => s.studentId === submission.studentId
        );

        if (!studentSubmission) {
            studentSubmission = {
                studentId: submission.studentId,
                files: [],
                textSubmissions: [],
                isArchived: false,
            };
            taskFiles.studentSubmissions.push(studentSubmission);
        }

        if (submission.isArchived) {
            studentSubmission.isArchived = true;
        }

        const submissionTime = submission.submittedAt || submission.createdAt;
        const isDailyListening = task.type === "dailyListening";

        if (submission.fileUrls && Array.isArray(submission.fileUrls)) {
            submission.fileUrls.forEach((fileUrl) => {
                if (fileUrl && typeof fileUrl === "string" && fileUrl.trim()) {
                    const fileName = getFileNameFromUrl(fileUrl);
                    studentSubmission!.files.push({
                        submissionId: submission.id,
                        fileUrl,
                        fileName,
                        studentId: submission.studentId,
                        submittedAt: submissionTime,
                        type: "file",
                        ...(isDailyListening && {
                            taskId: submission.taskId,
                            taskTitle: task.title,
                        }),
                    });
                }
            });
        }

        if (submission.recordingUrl) {
            const fileName = getFileNameFromUrl(submission.recordingUrl);
            studentSubmission.files.push({
                submissionId: submission.id,
                fileUrl: submission.recordingUrl,
                fileName,
                studentId: submission.studentId,
                submittedAt: submissionTime,
                type: "file",
                taskId: submission.taskId,
                taskTitle: task.title,
            });
        }

        if (submission.notes && submission.notes.trim()) {
            studentSubmission.textSubmissions.push({
                submissionId: submission.id,
                text: submission.notes,
                studentId: submission.studentId,
                submittedAt: submissionTime,
                type: "text",
                taskId: submission.taskId,
                taskTitle: task.title,
            });
        }
    });

    // Remove empty entries (no files, no text, not archived)
    taskFiles.studentSubmissions = taskFiles.studentSubmissions.filter((s) => {
        const submission = submissions.find(
            (rawSub) => rawSub.studentId === s.studentId
        );
        return s.files.length > 0 || s.textSubmissions.length > 0 || submission?.isArchived;
    });

    // Sort by student name
    taskFiles.studentSubmissions.sort((a, b) => {
        const enrollmentA = enrollmentsMap.get(a.studentId);
        const enrollmentB = enrollmentsMap.get(b.studentId);
        const studentA = studentsMap.get(a.studentId);
        const studentB = studentsMap.get(b.studentId);
        const nameA =
            enrollmentA?.dikshaName ||
            enrollmentA?.studentName ||
            studentA?.name ||
            "Unknown";
        const nameB =
            enrollmentB?.dikshaName ||
            enrollmentB?.studentName ||
            studentB?.name ||
            "Unknown";
        return nameA.localeCompare(nameB);
    });

    return taskFiles;
}
