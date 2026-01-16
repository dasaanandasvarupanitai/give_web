"use client";

import { Button } from "@/components/ui/button";
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
import { useAuthUser } from "@/hooks/use-auth";
import { useTeacher } from "@/hooks/use-teacher";
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
import { ArrowLeft, ChevronDown, ChevronRight, Download, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

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

export default function AllStudentsPage() {
    const { user } = useAuthUser();
    const { isTeacher, initializing } = useTeacher();
    const router = useRouter();
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!initializing && (!user || !isTeacher)) {
            router.push("/teacher");
            return;
        }
        if (user?.uid) {
            loadAllStudents();
        }
    }, [user?.uid, isTeacher, initializing, router]);

    const loadAllStudents = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const courseGroups = await getCourseGroups(user.uid);

            // Load all batches for all groups in parallel
            const batchesPromises = courseGroups.map(group =>
                getBatchesByCourseGroup(group.id).then(batches => ({ group, batches }))
            );
            const groupsWithBatches = await Promise.all(batchesPromises);

            // Load all enrollments for all batches in parallel
            const enrollmentsPromises: Array<Promise<{
                group: CourseGroup;
                batch: Batch;
                enrollments: Enrollment[];
            }>> = [];

            for (const { group, batches } of groupsWithBatches) {
                for (const batch of batches) {
                    enrollmentsPromises.push(
                        getEnrollmentsByBatch(batch.id).then(enrollments => ({
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
            const studentPromises = Array.from(studentIdSet).map(studentId =>
                getUserById(studentId).then(student => ({ studentId, student }))
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

    const downloadBatchAsExcel = (batchData: BatchData) => {
        // Prepare data for Excel (excluding Google name)
        const rows = batchData.students.map((studentData) => {
            const enrollment = studentData.enrollment;
            return {
                "Email": studentData.student.email || "",
                "Certificate Name": enrollment.studentName || "",
                "Diksha Name": enrollment.dikshaName || "",
                "WhatsApp Number": enrollment.whatsappNumber || "",
                "Address": enrollment.address || "",
                "Enrolled Date": new Date(enrollment.enrolledAt).toLocaleDateString(),
            };
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows);

        // Auto-size columns based on content
        const columnWidths = [
            { wch: 35 }, // Email
            { wch: 25 }, // Certificate Name
            { wch: 30 }, // Diksha Name
            { wch: 20 }, // WhatsApp Number
            { wch: 20 }, // Address
            { wch: 15 }, // Enrolled Date
        ];
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        // Generate Excel file and download
        XLSX.writeFile(workbook, `${batchData.batch.name}_students.xlsx`);
    };

    if (initializing || loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/teacher")}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">All Students</h1>
                        <p className="text-muted-foreground">
                            View all students organized by course groups and batches
                        </p>
                    </div>
                </div>
            </div>

            {groups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground">No students found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
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
                                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                                )}
                                                <CardTitle className="text-lg">
                                                    {groupData.group.name}
                                                </CardTitle>
                                            </div>
                                            <CardDescription className="text-sm sm:text-base">
                                                {groupData.batches.length} batch
                                                {groupData.batches.length !== 1 ? "es" : ""}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3 sm:space-y-2 pl-4 sm:pl-6">
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
                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    {expandedBatches.has(batchData.batch.id) ? (
                                                                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                                                    )}
                                                                    <span className="font-medium text-sm sm:text-base">
                                                                        {batchData.batch.name}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                                                        {batchData.students.length} student
                                                                        {batchData.students.length !== 1 ? "s" : ""}
                                                                    </span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            downloadBatchAsExcel(batchData);
                                                                        }}
                                                                        className="border border-orange-500 h-7 sm:h-8 px-2 sm:px-3"
                                                                    >
                                                                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                                        <span className="text-xs sm:text-sm">Download</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <div className="pl-4 sm:pl-6 pt-3 space-y-2">
                                                            {batchData.students.map((studentData) => (
                                                                <Card key={studentData.enrollment.id}>
                                                                    <CardContent className="py-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                                <span className="text-primary font-medium text-sm">
                                                                                    {(studentData.enrollment.dikshaName ||
                                                                                        studentData.enrollment.studentName ||
                                                                                        studentData.student.name)
                                                                                        .charAt(0)
                                                                                        .toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-sm sm:text-base truncate">
                                                                                    {studentData.enrollment.dikshaName ||
                                                                                        studentData.enrollment.studentName ||
                                                                                        studentData.student.name}
                                                                                </p>
                                                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                                                    {studentData.student.email}
                                                                                </p>
                                                                                {studentData.enrollment.studentName &&
                                                                                    studentData.enrollment.studentName !==
                                                                                    (studentData.enrollment.dikshaName ||
                                                                                        studentData.student.name) && (
                                                                                        <p className="text-xs text-muted-foreground truncate">
                                                                                            Certificate: {studentData.enrollment.studentName}
                                                                                        </p>
                                                                                    )}
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
        </div>
    );
}

