import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import {
    getBatchesByCourseGroup,
    getCourseGroups,
    getEnrollmentsByBatch,
    getUserById,
} from "@/lib/services/firestore";
import { GroupData, StudentData } from "@/lib/types/student-management";
import { useEffect, useState } from "react";

export function useStudentData(userId: string | undefined, isTeacher: boolean) {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId && isTeacher) {
            loadAllStudents();
        }
    }, [userId, isTeacher]);

    const loadAllStudents = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const courseGroups = await getCourseGroups(userId);

            // Load all batches for all groups in parallel
            const batchesPromises = courseGroups.map((group) =>
                getBatchesByCourseGroup(group.id).then((batches) => ({
                    group,
                    batches,
                }))
            );
            const groupsWithBatches = await Promise.all(batchesPromises);

            // Load all enrollments for all batches in parallel
            const enrollmentsPromises: Array<
                Promise<{
                    group: CourseGroup;
                    batch: Batch;
                    enrollments: Enrollment[];
                }>
            > = [];

            for (const { group, batches } of groupsWithBatches) {
                for (const batch of batches) {
                    enrollmentsPromises.push(
                        getEnrollmentsByBatch(batch.id).then((enrollments) => ({
                            group,
                            batch,
                            enrollments,
                        }))
                    );
                }
            }

            const batchesWithEnrollments = await Promise.all(enrollmentsPromises);

            // Extract all unique student IDs and load them in parallel
            const studentIdSet = new Set<string>();
            batchesWithEnrollments.forEach(({ enrollments }) => {
                enrollments
                    .filter((e) => e.status === "active")
                    .forEach((e) => studentIdSet.add(e.studentId));
            });

            // Load all students in parallel
            const studentPromises = Array.from(studentIdSet).map((studentId) =>
                getUserById(studentId).then((student) => ({ studentId, student }))
            );
            const studentsResults = await Promise.all(studentPromises);

            // Create a map for quick lookup
            const studentsMap = new Map<string, User>();
            studentsResults.forEach(({ studentId, student }) => {
                if (student) {
                    studentsMap.set(studentId, student);
                }
            });

            // Build the groups data structure
            const groupsData: GroupData[] = [];
            const groupMap = new Map<string, GroupData>();

            for (const { group, batch, enrollments } of batchesWithEnrollments) {
                const activeEnrollments = enrollments.filter(
                    (e) => e.status === "active"
                );

                const studentsData: StudentData[] = [];
                for (const enrollment of activeEnrollments) {
                    const student = studentsMap.get(enrollment.studentId);
                    if (student) {
                        studentsData.push({ student, enrollment });
                    }
                }

                if (studentsData.length > 0) {
                    let groupData = groupMap.get(group.id);
                    if (!groupData) {
                        groupData = { group, batches: [] };
                        groupMap.set(group.id, groupData);
                        groupsData.push(groupData);
                    }
                    groupData.batches.push({ batch, students: studentsData });
                }
            }

            setGroups(groupsData);
        } catch (error) {
            console.error("Failed to load students:", error);
        } finally {
            setLoading(false);
        }
    };

    return { groups, loading, refresh: loadAllStudents };
}
