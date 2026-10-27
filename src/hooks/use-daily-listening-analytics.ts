import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
    getBatchById,
    getEnrollmentsByBatch,
    getStudentTallies,
    getSubmissionsByBatch,
    getSubmissionsByBatchInRange,
    getTasksByBatch,
    getUserById,
    recountBatchTallies,
    recountStudentFromHistory,
} from "@/lib/services/firestore";
import { StudentAnalytics } from "@/lib/types/analytics";
import { useEffect, useState } from "react";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

/** One day of padding around the requested range: the scoped query reads by
 * creation date, while the exact report filter uses submittedAt (which can
 * differ by moments). Padding guarantees nothing reportable is missed; the
 * exact client-side filter still decides every number. */
const RANGE_PAD_MS = 24 * 60 * 60 * 1000;

/** Above this many students without a register line, backfill everyone in
 * one batch-wide pass instead of one read-heavy recount per student. */
const BULK_BACKFILL_THRESHOLD = 5;

const SAMPLED_VERIFICATION_COUNT = 3;

function pickRandomStudents(studentIds: string[], count: number): string[] {
    const pool = [...studentIds];
    const picked: string[] = [];
    while (pool.length > 0 && picked.length < count) {
        picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picked;
}

export function useDailyListeningAnalytics(
    batchId: string | undefined,
    isTeacher: boolean,
    appliedDateRange: DateRange
) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
    const [autoCorrections, setAutoCorrections] = useState(0);
    const [recounting, setRecounting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!batchId || !isTeacher) return;
        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchId, isTeacher, appliedDateRange.from, appliedDateRange.to]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const [batchData, tasks, enrollments] = await Promise.all([
                getBatchById(batchId!),
                getTasksByBatch(batchId!),
                getEnrollmentsByBatch(batchId!),
            ]);
            setBatch(batchData);

            // Filter only daily listening tasks
            let dailyListeningTasks = tasks.filter(
                (task) => task.type === "dailyListening"
            );

            // Filter tasks by date range if specified (based on task start date)
            if (appliedDateRange.from || appliedDateRange.to) {
                dailyListeningTasks = dailyListeningTasks.filter((task) => {
                    const taskDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);

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

            const hasRange = !!(appliedDateRange.from || appliedDateRange.to);
            const activeEnrollments = enrollments.filter(
                (e) => e.status === "active"
            );
            const activeStudentIds = activeEnrollments.map((e) => e.studentId);
            let corrections = 0;

            // The register's definition of truth is exactly this report's task
            // set: only daily listening tasks count, nothing else.
            const allowedTaskIds = new Set(
                dailyListeningTasks.map((task) => task.id)
            );

            // Source of per-student submission data:
            // - Date range: read only the range's submissions (padded), exact
            //   filter applied below — identical to filtering the full history.
            // - All time: the register (1 line per student), self-healed and
            //   spot-verified against the real history.
            let rangeSubmissions: Submission[] | null = null;
            const tallyCounts = new Map<string, number>();

            if (hasRange) {
                const from = appliedDateRange.from
                    ? new Date(appliedDateRange.from.getTime() - RANGE_PAD_MS)
                    : new Date(0);
                const to = appliedDateRange.to
                    ? new Date(appliedDateRange.to.getTime() + RANGE_PAD_MS)
                    : new Date(Date.now() + RANGE_PAD_MS);
                try {
                    rangeSubmissions = await getSubmissionsByBatchInRange(batchId!, from, to);
                } catch (scopedError) {
                    console.warn(
                        "[analytics] Scoped submissions query failed, reading full history instead:",
                        scopedError
                    );
                    rangeSubmissions = await getSubmissionsByBatch(batchId!);
                }
            } else {
                let tallies = await getStudentTallies(batchId!, activeStudentIds);

                // Self-healing: students without a register line get counted
                // from their real history now.
                const missing = activeStudentIds.filter((id) => !tallies.has(id));
                if (missing.length > BULK_BACKFILL_THRESHOLD) {
                    tallies = await recountBatchTallies(
                        batchId!,
                        activeStudentIds,
                        allowedTaskIds
                    );
                } else {
                    for (const studentId of missing) {
                        tallies.set(
                            studentId,
                            await recountStudentFromHistory(batchId!, studentId, allowedTaskIds)
                        );
                    }
                }

                // Sanity guard: a total can never exceed the number of tasks.
                const maxPossible = dailyListeningTasks.length;
                for (const [studentId, count] of tallies) {
                    if (count > maxPossible) {
                        tallies.set(
                            studentId,
                            await recountStudentFromHistory(batchId!, studentId, allowedTaskIds)
                        );
                        corrections++;
                    }
                }

                // Genuine-count spot check: recount a few random students
                // straight from their history on every load. Catches any
                // silent drift; corrected values are always the real ones.
                const sampleIds = pickRandomStudents(
                    activeStudentIds,
                    Math.min(SAMPLED_VERIFICATION_COUNT, activeStudentIds.length)
                );
                for (const studentId of sampleIds) {
                    const truth = await recountStudentFromHistory(
                        batchId!,
                        studentId,
                        allowedTaskIds
                    );
                    if (truth !== tallies.get(studentId)) {
                        tallies.set(studentId, truth);
                        corrections++;
                    }
                }

                for (const [studentId, count] of tallies) {
                    tallyCounts.set(studentId, count);
                }
            }
            setAutoCorrections(corrections);

            // Load student data and calculate analytics
            const analyticsData = await Promise.all(
                activeEnrollments.map(async (enrollment): Promise<StudentAnalytics | null> => {
                    try {
                        const student = await getUserById(enrollment.studentId);
                        if (!student) {
                            return null;
                        }

                        let studentSubmissions: Submission[] = [];
                        let submittedCount: number;

                        if (rangeSubmissions) {
                            // Get all submissions for this student for daily listening tasks
                            // Count submissions based on status, not whether files still exist
                            // A submission is valid if it was submitted or graded, regardless of file deletion
                            studentSubmissions = rangeSubmissions.filter(
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
                            submittedCount = new Set(
                                studentSubmissions.map((s) => s.taskId)
                            ).size;
                        } else {
                            submittedCount = tallyCounts.get(enrollment.studentId) ?? 0;
                        }

                        const totalDailyListeningTasks = dailyListeningTasks.length;
                        // Exact value, intentionally not rounded — the display
                        // layer formats it (see formatPercentage).
                        const percentage =
                            totalDailyListeningTasks > 0
                                ? (submittedCount / totalDailyListeningTasks) * 100
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

    /**
     * Recounts every student straight from the full submission history and
     * rewrites the register, then reloads the report. Manual, heavy, and
     * always behind a confirmation in the UI.
     */
    const recountAll = async () => {
        if (!batchId) return;
        try {
            setRecounting(true);
            setError(null);
            const [tasks, enrollments] = await Promise.all([
                getTasksByBatch(batchId),
                getEnrollmentsByBatch(batchId),
            ]);
            const activeStudentIds = enrollments
                .filter((e) => e.status === "active")
                .map((e) => e.studentId);
            const allowedTaskIds = new Set(
                tasks.filter((t) => t.type === "dailyListening").map((t) => t.id)
            );
            await recountBatchTallies(batchId, activeStudentIds, allowedTaskIds);
            await loadAnalytics();
        } catch (error) {
            console.error("Error recounting analytics:", error);
            setError(error instanceof Error ? error : new Error("Recount failed"));
        } finally {
            setRecounting(false);
        }
    };

    return { batch, analytics, autoCorrections, recounting, loading, error, recountAll };
}
