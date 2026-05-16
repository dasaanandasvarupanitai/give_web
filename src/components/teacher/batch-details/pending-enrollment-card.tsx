"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import type { Enrollment } from "@/lib/models/enrollment";
import {
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Edit,
    Loader2,
    MapPin,
    Phone,
    User as UserIcon,
    XCircle,
} from "lucide-react";
import { EditStudentDialog } from "./edit-student-dialog";
import { useEnrollmentCard } from "../hooks/use-enrollment-card";

interface PendingEnrollmentCardProps {
    enrollment: Enrollment;
    onApprove: () => void;
    onDecline: () => void;
}

export function PendingEnrollmentCard({
    enrollment,
    onApprove,
    onDecline,
}: PendingEnrollmentCardProps) {
    const {
        student,
        loading,
        showDetails,
        setShowDetails,
        showEditDialog,
        setShowEditDialog,
        isSaving,
        editForm,
        setEditForm,
        handleEdit,
        handleSaveEdit,
    } = useEnrollmentCard(enrollment);

    if (loading) {
        return (
            <Card>
                <CardContent className="py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!student) {
        return null;
    }

    const displayName = enrollment.dikshaName || enrollment.studentName || student.name;
    const hasAdditionalInfo = enrollment.studentName || enrollment.dikshaName || enrollment.whatsappNumber || enrollment.address;

    return (
        <Card>
            <CardContent className="py-4">
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-medium">
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{displayName}</p>
                                {enrollment.dikshaName && enrollment.studentName && enrollment.dikshaName !== enrollment.studentName && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        Certificate: {enrollment.studentName}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    Requested {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEdit}
                                className="bg-background hover:bg-accent border border-orange-500"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </Button>
                            {hasAdditionalInfo && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="bg-background hover:bg-accent border border-orange-500"
                                >
                                    {showDetails ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-1" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-1" />
                                            Details
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={onDecline} className="bg-background hover:bg-accent border border-orange-500">
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline
                            </Button>
                            <Button size="sm" onClick={onApprove} className="bg-primary hover:bg-primary/90 border border-orange-500">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    </div>

                    {showDetails && hasAdditionalInfo && (
                        <div className="pt-3 border-t space-y-2">
                            {enrollment.studentName && (
                                <div className="flex items-start gap-2 text-sm">
                                    <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium text-muted-foreground">Certificate Name:</span>
                                        <span className="ml-2">{enrollment.studentName}</span>
                                    </div>
                                </div>
                            )}
                            {enrollment.dikshaName && (
                                <div className="flex items-start gap-2 text-sm">
                                    <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium text-muted-foreground">Diksha Name:</span>
                                        <span className="ml-2">{enrollment.dikshaName}</span>
                                    </div>
                                </div>
                            )}
                            {enrollment.whatsappNumber && (
                                <div className="flex items-start gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium text-muted-foreground">WhatsApp:</span>
                                        <span className="ml-2">{enrollment.whatsappNumber}</span>
                                    </div>
                                </div>
                            )}
                            {enrollment.address && (
                                <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium text-muted-foreground">Address:</span>
                                        <span className="ml-2 whitespace-pre-wrap">{enrollment.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            <EditStudentDialog
                isOpen={showEditDialog}
                onOpenChange={setShowEditDialog}
                isSaving={isSaving}
                formData={editForm}
                onFormChange={setEditForm}
                onSave={handleSaveEdit}
            />
        </Card>
    );
}
