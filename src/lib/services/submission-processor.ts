import { TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { Batch } from "@/lib/models/batch";
import { Enrollment } from "@/lib/models/enrollment";
import { User } from "@/lib/models/user";
import {
    getBatchById,
    getEnrollmentsByBatch,
    getSubmissionsByBatch,
    getTasksByBatch,
    getUserById,
} from "@/lib/services/firestore";
import { getFileNameFromUrl } from "@/lib/utils/file-helpers";

export async function fetchBatchSubmissionsData(batchId: string) {
    const [batch, tasks, submissions, enrollments] = await Promise.all([
        getBatchById(batchId),
        getTasksByBatch(batchId, true),
        getSubmissionsByBatch(batchId),
        getEnrollmentsByBatch(batchId),
    ]);

    const taskFilesMap = new Map<string, TaskFiles>();

    tasks.forEach((task) => {
        if (task.type === "announcement") return;
        taskFilesMap.set(task.id, { task, studentSubmissions: [] });
    });

    const uniqueStudentIds = new Set<string>();

    submissions.forEach((submission) => {
        const taskFiles = taskFilesMap.get(submission.taskId);
        if (!taskFiles) return;

        if (submission.studentId) {
            uniqueStudentIds.add(submission.studentId);
        }

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
        const isDailyListening = taskFiles.task.type === "dailyListening";

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
                            taskTitle: taskFiles.task.title,
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
                taskTitle: taskFiles.task.title,
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
                taskTitle: taskFiles.task.title,
            });
        }
    });

    // Remove empty submissions
    taskFilesMap.forEach((taskFiles) => {
        taskFiles.studentSubmissions = taskFiles.studentSubmissions.filter((s) => {
            // Check if this student has any actual submission records for this task
            const submission = submissions.find(
                (rawSub) => rawSub.taskId === taskFiles.task.id && rawSub.studentId === s.studentId
            );
            return s.files.length > 0 || s.textSubmissions.length > 0 || submission?.isArchived;
        });
    });

    // Load student info
    const studentsMap = new Map<string, User>();
    await Promise.all(
        Array.from(uniqueStudentIds).map(async (studentId) => {
            try {
                const student = await getUserById(studentId);
                if (student) studentsMap.set(studentId, student);
            } catch { }
        })
    );

    // Build enrollment map
    const enrollmentsMap = new Map<string, Enrollment>();
    enrollments
        .filter((e) => e.status === "active")
        .forEach((enrollment) => {
            if (enrollment.studentId && !enrollmentsMap.has(enrollment.studentId)) {
                enrollmentsMap.set(enrollment.studentId, enrollment);
            }
        });

    // Sort by student name
    taskFilesMap.forEach((taskFiles) => {
        taskFiles.studentSubmissions.sort((a, b) => {
            const studentA = studentsMap.get(a.studentId);
            const studentB = studentsMap.get(b.studentId);
            const enrollmentA = enrollmentsMap.get(a.studentId);
            const enrollmentB = enrollmentsMap.get(b.studentId);
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
    });

    const tasksWithFiles = Array.from(taskFilesMap.values()).sort(
        (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
    );

    return { batch, tasksWithFiles, studentsMap, enrollmentsMap };
}
