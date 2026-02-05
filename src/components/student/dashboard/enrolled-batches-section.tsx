"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import { deleteEnrollment } from "@/lib/services/firestore";
import {
    AlertCircle,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    Plus,
    School,
    Trash2,
    XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const router = useRouter();
    const { toast } = useToast();
    const [enrollmentToRemove, setEnrollmentToRemove] = useState<Enrollment | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const getStatusBadge = (status: Enrollment["status"]) => {
        switch (status) {
            case "pending":
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Pending
                    </Badge>
                );
            case "active":
                return (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm">
                        <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Active
                    </Badge>
                );
            case "completed":
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                        <School className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Completed
                    </Badge>
                );
            case "dropped":
                return (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs sm:text-sm">
                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Dropped
                    </Badge>
                );
            case "declined":
                return (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm">
                        <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        Declined
                    </Badge>
                );
        }
    };

    const handleRemoveEnrollment = async () => {
        if (!enrollmentToRemove) return;

        // Safety check: Only allow removal of declined or dropped enrollments
        // This prevents accidental deletion of active, pending, or completed batches
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
            console.error("Error removing enrollment:", error);
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
                            // At this point, batch should always exist due to filter above
                            if (!batch) {
                                return null;
                            }

                            const canRemove = enrollment.status === "declined" || enrollment.status === "dropped";

                            return (
                                <Card key={enrollment.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
                                                    {batch.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-base sm:text-lg truncate">{batch.name}</CardTitle>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-start sm:self-auto">
                                                {getStatusBadge(enrollment.status)}
                                                {canRemove && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEnrollmentToRemove(enrollment);
                                                        }}
                                                        title="Remove from dashboard"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {batch.description && (
                                            <div className="mb-4">
                                                <ExpandableDescription text={batch.description} maxLines={2} className="text-sm" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                                <span className="break-words">
                                                    <span className="hidden sm:inline">Enrolled: </span>
                                                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        {enrollment.status === "active" && (
                                            <Button
                                                variant="outline"
                                                className="w-full mt-4 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600"
                                                onClick={() => router.push(`/classroom/batches/${batch.id}`)}
                                            >
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                View Assessments
                                            </Button>
                                        )}
                                        {enrollment.status === "pending" && (
                                            <p className="text-sm text-orange-600 mt-4 text-center">
                                                Waiting for approval
                                            </p>
                                        )}
                                        {canRemove && (
                                            <p className="text-sm text-muted-foreground mt-4 text-center">
                                                You can remove this batch from your dashboard
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Remove Enrollment Confirmation Dialog */}
            <AlertDialog open={enrollmentToRemove !== null} onOpenChange={(open) => {
                if (!open) {
                    setEnrollmentToRemove(null);
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Batch from Dashboard?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <strong>
                                {enrollmentToRemove && batches.get(enrollmentToRemove.batchId)?.name}
                            </strong>{" "}
                            (Status: <span className="capitalize">{enrollmentToRemove?.status}</span>) from your dashboard?
                            This will permanently remove the enrollment record. You can join this batch again later using the class code if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEnrollmentToRemove(null)}
                            disabled={isRemoving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveEnrollment}
                            disabled={isRemoving}
                        >
                            {isRemoving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
