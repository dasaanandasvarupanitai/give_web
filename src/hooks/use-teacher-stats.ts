import {
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
      let totalBatches = 0;
      let totalStudents = 0;
      let pendingEnrollments = 0;

      for (const cg of courseGroups) {
        const batches = await getBatchesByCourseGroup(cg.id);
        totalBatches += batches.length;

        for (const batch of batches) {
          const enrollments = await getEnrollmentsByBatch(batch.id);
          totalStudents += enrollments.filter((e) => e.status === "active").length;
          pendingEnrollments += enrollments.filter((e) => e.status === "pending").length;
        }
      }

      setStats({
        courseGroups: courseGroups.length,
        batches: totalBatches,
        students: totalStudents,
        pendingEnrollments,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: loadStats };
}
