import {
  countEnrollmentsByStatus,
  getBatchesByCourseGroup,
  getCourseGroups,
  getEnrollmentsByBatch,
} from "@/lib/services/firestore";
import { useEffect, useState } from "react";

export interface TeacherStats {
  courseGroups: number;
  batches: number;
  students: number;
  pendingEnrollments: number;
}

export function useTeacherStats(userId: string | undefined, isTeacher: boolean) {
  const [stats, setStats] = useState<TeacherStats>({
    courseGroups: 0,
    batches: 0,
    students: 0,
    pendingEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isTeacher) return;
    loadStats();
  }, [userId, isTeacher]);

  const loadStats = async () => {
    if (!userId) return;

    try {
      const courseGroups = await getCourseGroups(userId);

      // Counts only need the number of active/pending enrollments per batch,
      // so use exact aggregate count queries (1 cheap read each) instead of
      // downloading every enrollment document. Per-batch fallback to reading
      // the documents keeps the totals identical if a count query fails.
      const batchesPerGroup = await Promise.all(
        courseGroups.map((cg) => getBatchesByCourseGroup(cg.id))
      );
      const batches = batchesPerGroup.flat();

      const countResults = await Promise.all(
        batches.map(async (batch) => {
          const [active, pending] = await Promise.all([
            countEnrollmentsByStatus(batch.id, "active"),
            countEnrollmentsByStatus(batch.id, "pending"),
          ]);

          if (active === null || pending === null) {
            const enrollments = await getEnrollmentsByBatch(batch.id);
            return {
              active: enrollments.filter((e) => e.status === "active").length,
              pending: enrollments.filter((e) => e.status === "pending").length,
            };
          }
          return { active, pending };
        })
      );

      setStats({
        courseGroups: courseGroups.length,
        batches: batches.length,
        students: countResults.reduce((sum, c) => sum + c.active, 0),
        pendingEnrollments: countResults.reduce((sum, c) => sum + c.pending, 0),
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: loadStats };
}
