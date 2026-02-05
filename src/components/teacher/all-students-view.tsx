"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuthUser } from "@/hooks/use-auth";
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
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { GroupCollapsible } from "./students/group-collapsible";

interface StudentData {
    student: User;
    enrollment: Enrollment;
}

interface BatchData {
    batch: Batch;
    students: StudentData[];
}

interface GroupData {
    group: CourseGroup;
    batches: BatchData[];
}

export function AllStudentsView({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useAuthUser();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open && user?.uid) {
            loadAllStudents();
        }
    }, [open, user?.uid]);

    const loadAllStudents = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const courseGroups = await getCourseGroups(user.uid);
            const groupsData: GroupData[] = [];

            for (const group of courseGroups) {
                const batches = await getBatchesByCourseGroup(group.id);
                const batchesData: BatchData[] = [];

                for (const batch of batches) {
                    const enrollments = await getEnrollmentsByBatch(batch.id);
                    const activeEnrollments = enrollments.filter(
                        (e) => e.status === "active"
                    );

                    const studentsData: StudentData[] = [];
                    for (const enrollment of activeEnrollments) {
                        const student = await getUserById(enrollment.studentId);
                        if (student) {
                            studentsData.push({ student, enrollment });
                        }
                    }

                    if (studentsData.length > 0) {
                        batchesData.push({ batch, students: studentsData });
                    }
                }

                if (batchesData.length > 0) {
                    groupsData.push({ group, batches: batchesData });
                }
            }

            setGroups(groupsData);
            if (groupsData.length > 0) {
                setExpandedGroups(new Set([groupsData[0].group.id]));
            }
        } catch (error) {
            console.error("Failed to load students:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const toggleBatch = (batchId: string) => {
        const newExpanded = new Set(expandedBatches);
        if (newExpanded.has(batchId)) {
            newExpanded.delete(batchId);
        } else {
            newExpanded.add(batchId);
        }
        setExpandedBatches(newExpanded);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle>All Students</DialogTitle>
                    <DialogDescription>
                        View all students organized by course groups and batches
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No students found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {groups.map((groupData) => (
                            <GroupCollapsible
                                key={groupData.group.id}
                                group={groupData.group}
                                batches={groupData.batches}
                                isExpanded={expandedGroups.has(groupData.group.id)}
                                onToggle={() => toggleGroup(groupData.group.id)}
                                expandedBatches={expandedBatches}
                                onBatchToggle={toggleBatch}
                            />
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
