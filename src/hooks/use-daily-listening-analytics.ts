import type { Batch } from "@/lib/models/batch";
import {
    getBatchById,
    getEnrollmentsByBatch,
    getSubmissionsByBatch,
    getTasksByBatch,
    getUserById,
} from "@/lib/services/firestore";
import { StudentAnalytics } from "@/lib/types/analytics";
import { useEffect, useState } from "react";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

export function useDailyListeningAnalytics(
    batchId: string | undefined,
    isTeacher: boolean,
    appliedDateRange: DateRange
) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!batchId || !isTeacher) return;
        loadAnalytics();
    }, [batchId, isTeacher, appliedDateRange.from, appliedDateRange.to]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load batch, tasks, enrollments, and submissions
            const [batchData, tasks, enrollments, submissions] = await Promise.all([
                getBatchById(batchId!),
                getTasksByBatch(batchId!),
                getEnrollmentsByBatch(batchId!),
                getSubmissionsByBatch(batchId!),
            ]);

            setBatch(batchData);

            // Filter only daily listening tasks
            let dailyListeningTasks = tasks.filter(
                (task) => task.type === "dailyListening"
            );

            // Filter tasks by date range if specified (based on task creation date)
            if (appliedDateRange.from || appliedDateRange.to) {
                dailyListeningTasks = dailyListeningTasks.filter((task) => {
                    const taskDate = new Date(task.createdAt);

                    if (appliedDateRange.from) {
                        const fromDate = new Date(appliedDateRange.from);
                        fromDate.setHours(0, 0, 0, 0);
                        // Exclude tasks created before 12:00 AM of start date
                        if (taskDate < fromDate) return false;
                    }

                    if (appliedDateRange.to) {
                        const toDate = new Date(appliedDateRange.to);
                        toDate.setHours(23, 59, 59, 999);
                        // Include tasks created up to and including 11:59:59 PM of end date
                        if (taskDate > toDate) return false;
                    }

                    return true;
                });
            }

            // Filter only active enrollments
            const activeEnrollments = enrollments.filter(
                (e) => e.status === "active"
            );

            // Load student data and calculate analytics
            const analyticsData = await Promise.all(
                activeEnrollments.map(async (enrollment): Promise<StudentAnalytics | null> => {
                    try {
                        const student = await getUserById(enrollment.studentId);
                        if (!student) {
                            return null;
                        }

                        // Get all submissions for this student for daily listening tasks
                        // Count submissions based on status, not whether files still exist
                        // A submission is valid if it was submitted or graded, regardless of file deletion
                        let studentSubmissions = submissions.filter(
                            (s) =>
                                s.studentId === enrollment.studentId &&
                                dailyListeningTasks.some((task) => task.id === s.taskId) &&
                                (s.status === "submitted" || s.status === "graded")
                        );

                        // Filter by date range if specified
                        if (appliedDateRange.from || appliedDateRange.to) {
                            studentSubmissions = studentSubmissions.filter((s) => {
                                // Use submittedAt if available, otherwise fallback to createdAt
                                // submittedAt is set when status changes to "submitted" or "graded"
                                const submissionDate = s.submittedAt || s.createdAt;
                                if (!submissionDate) return false;

                                const subDate = new Date(submissionDate);

                                if (appliedDateRange.from) {
                                    const fromDate = new Date(appliedDateRange.from);
                                    fromDate.setHours(0, 0, 0, 0);
                                    // Exclude submissions before the start date (before 12:00 AM of start date)
                                    if (subDate < fromDate) return false;
                                }

                                if (appliedDateRange.to) {
                                    const toDate = new Date(appliedDateRange.to);
                                    toDate.setHours(23, 59, 59, 999);
                                    // Include submissions up to and including 11:59:59 PM of end date
                                    if (subDate > toDate) return false;
                                }

                                return true;
                            });
                        }

                        // Count unique tasks submitted (a student might submit multiple times for same task)
                        const uniqueTaskIds = new Set(
                            studentSubmissions.map((s) => s.taskId)
                        );
                        const submittedCount = uniqueTaskIds.size;
                        const totalDailyListeningTasks = dailyListeningTasks.length;
                        const percentage =
                            totalDailyListeningTasks > 0
                                ? Math.round((submittedCount / totalDailyListeningTasks) * 100)
                                : 0;

                        return {
                            student,
                            enrollment,
                            totalDailyListeningTasks,
                            submittedCount,
                            percentage,
                            submissions: studentSubmissions,
                        };
                    } catch (error) {
                        console.error(
                            `Error loading student ${enrollment.studentId}:`,
                            error
                        );
                        return null;
                    }
                })
            );

            // Filter out null values and sort by percentage (descending)
            const validAnalytics = analyticsData
                .filter((a): a is StudentAnalytics => a !== null)
                .sort((a, b) => b.percentage - a.percentage);

            setAnalytics(validAnalytics);
        } catch (error) {
            console.error("Error loading analytics:", error);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return { batch, analytics, loading, error };
}
