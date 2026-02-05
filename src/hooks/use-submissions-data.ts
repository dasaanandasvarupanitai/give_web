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
import { useCallback, useEffect, useState } from "react";
import { TaskFiles } from "@/components/teacher/submissions/submissions-list";

function getFileNameFromUrl(url: string): string {
    try {
        if (!url || typeof url !== "string") return "file";

        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/(?:o|b\/[^\/]+\/o)\/(.+?)(?:\?|$)/);

        if (pathMatch && pathMatch[1]) {
            const decodedPath = decodeURIComponent(pathMatch[1]);
            const parts = decodedPath.split("/");
            return parts[parts.length - 1] || "file";
        }

        const fallbackMatch = urlObj.pathname.match(/\/([^\/]+)$/);
        if (fallbackMatch) {
            return decodeURIComponent(fallbackMatch[1]);
        }

        return "file";
    } catch {
        return "file";
    }
}

interface UseSubmissionsDataParams {
    batchId: string;
    isTeacher: boolean;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

export function useSubmissionsData({ batchId, isTeacher, toast }: UseSubmissionsDataParams) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [tasksWithFiles, setTasksWithFiles] = useState<TaskFiles[]>([]);
    const [studentsMap, setStudentsMap] = useState<Map<string, User>>(new Map());
    const [enrollmentsMap, setEnrollmentsMap] = useState<Map<string, Enrollment>>(new Map());
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            const [batchData, tasks, submissions, enrollments] = await Promise.all([
                getBatchById(batchId),
                getTasksByBatch(batchId, true),
                getSubmissionsByBatch(batchId),
                getEnrollmentsByBatch(batchId),
            ]);

            setBatch(batchData);

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
                    };
                    taskFiles.studentSubmissions.push(studentSubmission);
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

                if (isDailyListening && submission.recordingUrl) {
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

                if (isDailyListening && submission.notes && submission.notes.trim()) {
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
                taskFiles.studentSubmissions = taskFiles.studentSubmissions.filter(
                    (s) => s.files.length > 0 || s.textSubmissions.length > 0
                );
            });

            // Load student info
            const studentsMapLocal = new Map<string, User>();
            await Promise.all(
                Array.from(uniqueStudentIds).map(async (studentId) => {
                    try {
                        const student = await getUserById(studentId);
                        if (student) studentsMapLocal.set(studentId, student);
                    } catch { }
                })
            );
            setStudentsMap(studentsMapLocal);

            // Build enrollment map
            const enrollmentMap = new Map<string, Enrollment>();
            enrollments
                .filter((e) => e.status === "active")
                .forEach((enrollment) => {
                    if (enrollment.studentId && !enrollmentMap.has(enrollment.studentId)) {
                        enrollmentMap.set(enrollment.studentId, enrollment);
                    }
                });
            setEnrollmentsMap(enrollmentMap);

            // Sort by student name
            taskFilesMap.forEach((taskFiles) => {
                taskFiles.studentSubmissions.sort((a, b) => {
                    const studentA = studentsMapLocal.get(a.studentId);
                    const studentB = studentsMapLocal.get(b.studentId);
                    const enrollmentA = enrollmentMap.get(a.studentId);
                    const enrollmentB = enrollmentMap.get(b.studentId);
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

            const finalTasksWithFiles = Array.from(taskFilesMap.values()).sort(
                (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
            );

            setTasksWithFiles(finalTasksWithFiles);
        } catch (error) {
            console.error("Error loading submissions:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error ? error.message : "Failed to load submissions.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [batchId, toast]);

    useEffect(() => {
        if (!batchId || !isTeacher) return;
        loadData();
    }, [batchId, isTeacher, loadData]);

    return {
        batch,
        tasksWithFiles,
        studentsMap,
        enrollmentsMap,
        loading,
        refresh: loadData,
    };
}

export function getFileType(fileName: string): "pdf" | "video" | "audio" | "image" | "other" {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const videoExts = ["mp4", "webm", "mov", "m4v", "avi", "mkv"];
    const audioExts = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    if (ext === "pdf") return "pdf";
    if (videoExts.includes(ext)) return "video";
    if (audioExts.includes(ext)) return "audio";
    if (imageExts.includes(ext)) return "image";
    return "other";
}
