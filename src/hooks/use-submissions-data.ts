import { TaskFiles } from "@/components/teacher/submissions/submissions-list";
import { Batch } from "@/lib/models/batch";
import { Enrollment } from "@/lib/models/enrollment";
import { User } from "@/lib/models/user";
import { fetchBatchSubmissionsData } from "@/lib/services/submission-processor";
import { useCallback, useEffect, useState } from "react";

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

            const data = await fetchBatchSubmissionsData(batchId);

            setBatch(data.batch);
            setTasksWithFiles(data.tasksWithFiles);
            setStudentsMap(data.studentsMap);
            setEnrollmentsMap(data.enrollmentsMap);
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
