"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { ChevronDown, ChevronRight, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";

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
            // Expand first group by default
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
                            <Card key={groupData.group.id}>
                                <Collapsible
                                    open={expandedGroups.has(groupData.group.id)}
                                    onOpenChange={() => toggleGroup(groupData.group.id)}
                                >
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {expandedGroups.has(groupData.group.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                    <CardTitle className="text-lg">
                                                        {groupData.group.name}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription>
                                                    {groupData.batches.length} batch
                                                    {groupData.batches.length !== 1 ? "es" : ""}
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="pt-0">
                                            <div className="space-y-2 pl-6">
                                                {groupData.batches.map((batchData) => (
                                                    <Collapsible
                                                        key={batchData.batch.id}
                                                        open={expandedBatches.has(batchData.batch.id)}
                                                        onOpenChange={() =>
                                                            toggleBatch(batchData.batch.id)
                                                        }
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <div className="cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        {expandedBatches.has(batchData.batch.id) ? (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        )}
                                                                        <span className="font-medium">
                                                                            {batchData.batch.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {batchData.students.length} student
                                                                        {batchData.students.length !== 1 ? "s" : ""}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <div className="pl-6 pt-2 space-y-2">
                                                                {batchData.students.map((studentData) => (
                                                                    <Card key={studentData.enrollment.id}>
                                                                        <CardContent className="py-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                                    <span className="text-primary font-medium">
                                                                                        {studentData.student.name
                                                                                            .charAt(0)
                                                                                            .toUpperCase()}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <p className="font-medium">
                                                                                        {studentData.student.name}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground">
                                                                                        {studentData.student.email}
                                                                                    </p>
                                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                                        Enrolled:{" "}
                                                                                        {new Date(
                                                                                            studentData.enrollment.enrolledAt
                                                                                        ).toLocaleDateString()}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                ))}
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

