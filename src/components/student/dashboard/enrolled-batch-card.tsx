"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import {
    AlertCircle,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    School,
    Trash2,
    XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrolledBatchCardProps {
    enrollment: Enrollment;
    batch: Batch;
    onRemove: (enrollment: Enrollment) => void;
}

export function EnrolledBatchCard({ enrollment, batch, onRemove }: EnrolledBatchCardProps) {
    const router = useRouter();
    const canRemove = enrollment.status === "declined" || enrollment.status === "dropped";

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

    return (
        <Card>
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
                                    onRemove(enrollment);
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
}
