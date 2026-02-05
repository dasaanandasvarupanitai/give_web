"use client";

import { GroupListItem } from "@/components/teacher/students/group-list-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/hooks/use-auth";
import { useStudentData } from "@/hooks/use-student-data";
import { useTeacher } from "@/hooks/use-teacher";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AllStudentsPage() {
    const { user } = useAuthUser();
    const { isTeacher, initializing } = useTeacher();
    const router = useRouter();

    const { groups, loading } = useStudentData(user?.uid, isTeacher);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

    // Expand first group by default when data loads
    useEffect(() => {
        if (groups.length > 0 && expandedGroups.size === 0) {
            setExpandedGroups(new Set([groups[0].group.id]));
        }
    }, [groups, expandedGroups.size]);

    useEffect(() => {
        if (!initializing && (!user || !isTeacher)) {
            router.push("/teacher");
            return;
        }
    }, [user, isTeacher, initializing, router]);

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
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                            All Students
                        </h1>
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
                        <GroupListItem
                            key={groupData.group.id}
                            groupData={groupData}
                            isExpanded={expandedGroups.has(groupData.group.id)}
                            onToggle={() => toggleGroup(groupData.group.id)}
                            expandedBatches={expandedBatches}
                            onToggleBatch={toggleBatch}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
