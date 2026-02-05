"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import { deleteEnrollment } from "@/lib/services/firestore";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { EnrolledBatchCard } from "./enrolled-batch-card";
import { RemoveEnrollmentDialog } from "./remove-enrollment-dialog";

interface EnrolledBatchesSectionProps {
    enrollments: Enrollment[];
    batches: Map<string, Batch>;
    onJoinClick: () => void;
}

export function EnrolledBatchesSection({
    enrollments,
    batches,
    onJoinClick,
}: EnrolledBatchesSectionProps) {
    const { toast } = useToast();
    const [enrollmentToRemove, setEnrollmentToRemove] = useState<Enrollment | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemoveEnrollment = async () => {
        if (!enrollmentToRemove) return;

        if (enrollmentToRemove.status !== "declined" && enrollmentToRemove.status !== "dropped") {
            toast({
                title: "Error",
                description: "Only declined or dropped batches can be removed from your dashboard.",
                variant: "destructive",
            });
            setEnrollmentToRemove(null);
            return;
        }

        setIsRemoving(true);
        try {
            await deleteEnrollment(enrollmentToRemove.id);
            toast({
                title: "Success",
                description: "Batch removed from your dashboard",
            });
            setEnrollmentToRemove(null);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove batch",
                variant: "destructive",
            });
        } finally {
            setIsRemoving(false);
        }
    };

    const validEnrollments = enrollments.filter((enrollment) =>
        batches.has(enrollment.batchId)
    );

    return (
        <>
            <div>
                <h3 className="text-2xl font-bold mb-4">My Batches</h3>
                {validEnrollments.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <h4 className="text-xl font-semibold mb-2">No Batches Yet</h4>
                            <p className="text-muted-foreground mb-4">
                                Join a batch using a class code to start learning
                            </p>
                            <Button onClick={onJoinClick}>
                                <Plus className="h-4 w-4 mr-2" />
                                Join Batch
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {validEnrollments.map((enrollment) => {
                            const batch = batches.get(enrollment.batchId);
                            if (!batch) return null;

                            return (
                                <EnrolledBatchCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    batch={batch}
                                    onRemove={setEnrollmentToRemove}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <RemoveEnrollmentDialog
                enrollment={enrollmentToRemove}
                batch={enrollmentToRemove ? batches.get(enrollmentToRemove.batchId) : undefined}
                isRemoving={isRemoving}
                onClose={() => setEnrollmentToRemove(null)}
                onConfirm={handleRemoveEnrollment}
            />
        </>
    );
}
