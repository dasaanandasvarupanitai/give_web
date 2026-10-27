import { TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { Batch } from "@/lib/models/batch";
import { Enrollment } from "@/lib/models/enrollment";
import { Task } from "@/lib/models/task";
import { User } from "@/lib/models/user";
import {
    buildTaskFiles,
} from "@/lib/services/submission-processor";
import {
    getBatchById,
    getEnrollmentsByBatch,
    getSubmissionsByTask,
    getTasksByBatch,
    getUserById,
} from "@/lib/services/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseSubmissionsDataParams {
    batchId: string;
    isTeacher: boolean;
    toast: (params: { title: string; description: string; variant?: "destructive" }) => void;
}

/**
 * Loads the submissions page in two cheap stages:
 * 1. Base data up front: batch, tasks, enrollments (small collections).
 * 2. Each task's submissions load only when the teacher opens that task,
 *    and only that task is re-read after its own deletions — never the
 *    whole batch again.
 */
export function useSubmissionsData({ batchId, isTeacher, toast }: UseSubmissionsDataParams) {
    const [batch, setBatch] = useState<Batch | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadedTaskFiles, setLoadedTaskFiles] = useState<Map<string, TaskFiles>>(new Map());
    const [loadingTaskIds, setLoadingTaskIds] = useState<Set<string>>(new Set());
    const [studentsMap, setStudentsMap] = useState<Map<string, User>>(new Map());
    const [enrollmentsMap, setEnrollmentsMap] = useState<Map<string, Enrollment>>(new Map());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const tasksRef = useRef<Task[]>([]);
    const studentsRef = useRef<Map<string, User>>(new Map());
    const enrollmentsRef = useRef<Map<string, Enrollment>>(new Map());
    const loadedTaskFilesRef = useRef<Map<string, TaskFiles>>(new Map());

    const loadBaseData = useCallback(async () => {
        const [batchData, tasksData, enrollmentsData] = await Promise.all([
            getBatchById(batchId),
            getTasksByBatch(batchId, true),
            getEnrollmentsByBatch(batchId),
        ]);
        setBatch(batchData);
        setTasks(tasksData);
        tasksRef.current = tasksData;

        const enrollmentsMap = new Map<string, Enrollment>();
        enrollmentsData
            .filter((e) => e.status === "active")
            .forEach((enrollment) => {
                if (enrollment.studentId && !enrollmentsMap.has(enrollment.studentId)) {
                    enrollmentsMap.set(enrollment.studentId, enrollment);
                }
            });
        setEnrollmentsMap(enrollmentsMap);
        enrollmentsRef.current = enrollmentsMap;
    }, [batchId]);

    useEffect(() => {
        if (!batchId || !isTeacher) return;
        setLoading(true);
        loadBaseData()
            .catch((error) => {
                console.error("Error loading submissions:", error);
                toast({
                    title: "Error",
                    description:
                        error instanceof Error ? error.message : "Failed to load submissions.",
                    variant: "destructive",
                });
            })
            .finally(() => setLoading(false));
    }, [batchId, isTeacher, loadBaseData, toast]);

    /**
     * Loads (or force-reloads) one task's submissions plus any student info
     * they introduce, and rebuilds that task's display entry with exactly
     * the same logic the old full-batch load used.
     */
    const loadTaskSubmissions = useCallback(async (taskId: string) => {
        const task = tasksRef.current.find((t) => t.id === taskId);
        if (!task) return;

        setLoadingTaskIds((prev) => new Set(prev).add(taskId));
        try {
            const submissions = await getSubmissionsByTask(taskId);

            const studentIds = Array.from(
                new Set(submissions.map((s) => s.studentId).filter(Boolean))
            );
            const missingStudentIds = studentIds.filter(
                (id) => !studentsRef.current.has(id)
            );
            if (missingStudentIds.length > 0) {
                const students = await Promise.all(
                    missingStudentIds.map((id) =>
                        getUserById(id).catch(() => null)
                    )
                );
                students.forEach((student) => {
                    if (student) studentsRef.current.set(student.id, student);
                });
                setStudentsMap(new Map(studentsRef.current));
            }

            const entry = buildTaskFiles(
                task,
                submissions,
                studentsRef.current,
                enrollmentsRef.current
            );
            const next = new Map(loadedTaskFilesRef.current);
            if (entry) next.set(taskId, entry);
            else next.delete(taskId);
            loadedTaskFilesRef.current = next;
            setLoadedTaskFiles(next);
        } catch (error) {
            console.error(`Error loading submissions for task ${taskId}:`, error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to load this task's submissions.",
                variant: "destructive",
            });
        } finally {
            setLoadingTaskIds((prev) => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
            });
        }
    }, [toast]);

    /**
     * Re-reads only the tasks that are currently open on screen. Used after
     * deletions (the affected task rebuilds itself) and by the manual
     * refresh button.
     */
    const refresh = useCallback(async (taskId?: string) => {
        if (taskId) {
            await loadTaskSubmissions(taskId);
            return;
        }
        setRefreshing(true);
        try {
            await loadBaseData();
            const loadedIds = Array.from(loadedTaskFilesRef.current.keys());
            await Promise.all(loadedIds.map((id) => loadTaskSubmissions(id)));
        } finally {
            setRefreshing(false);
        }
    }, [loadBaseData, loadTaskSubmissions]);

    // Display list: all tasks (newest first), with submissions attached for
    // the ones already loaded.
    const tasksWithFiles = useMemo<TaskFiles[]>(() => {
        return [...tasks]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((task) => loadedTaskFiles.get(task.id))
            .filter((entry): entry is TaskFiles => !!entry);
    }, [tasks, loadedTaskFiles]);

    return {
        batch,
        tasks,
        tasksWithFiles,
        loadingTaskIds,
        studentsMap,
        enrollmentsMap,
        loading,
        refreshing,
        refresh,
        loadTaskSubmissions,
    };
}
