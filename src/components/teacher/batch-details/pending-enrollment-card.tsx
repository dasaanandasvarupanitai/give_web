"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import { getUserById, updateEnrollment } from "@/lib/services/firestore";
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
import { useEffect, useState } from "react";
import { EditStudentDialog } from "./edit-student-dialog";

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
    const { toast } = useToast();
    const [student, setStudent] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalValues, setOriginalValues] = useState({
        studentName: "",
        dikshaName: "",
        whatsappNumber: "",
        address: "",
    });
    const [editForm, setEditForm] = useState({
        studentName: enrollment.studentName || "",
        dikshaName: enrollment.dikshaName || "",
        whatsappNumber: enrollment.whatsappNumber || "",
        address: enrollment.address || "",
    });

    useEffect(() => {
        loadStudent();
    }, [enrollment.studentId]);

    const loadStudent = async () => {
        try {
            const studentData = await getUserById(enrollment.studentId);
            setStudent(studentData);
        } catch (error) {
            console.error("Failed to load student:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleEdit = () => {
        const initialValues = {
            studentName: enrollment.studentName || "",
            dikshaName: enrollment.dikshaName || "",
            whatsappNumber: enrollment.whatsappNumber || "",
            address: enrollment.address || "",
        };
        setOriginalValues(initialValues);
        setEditForm(initialValues);
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (!editForm.studentName.trim()) {
            toast({
                title: "Validation Error",
                description: "Certificate name is required",
                variant: "destructive",
            });
            return;
        }

        if (!editForm.whatsappNumber.trim()) {
            toast({
                title: "Validation Error",
                description: "WhatsApp number is required",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const trimmedStudentName = editForm.studentName.trim();
            const trimmedDikshaName = editForm.dikshaName.trim();
            const trimmedWhatsapp = editForm.whatsappNumber.trim();
            const trimmedAddress = editForm.address.trim();

            const updates: Partial<Enrollment> = {};

            const originalStudentName = (originalValues.studentName || "").trim();
            if (trimmedStudentName !== originalStudentName) {
                updates.studentName = trimmedStudentName;
            }

            const originalWhatsapp = (originalValues.whatsappNumber || "").trim();
            if (trimmedWhatsapp !== originalWhatsapp) {
                updates.whatsappNumber = trimmedWhatsapp;
            }

            const originalDikshaName = (originalValues.dikshaName || "").trim();
            if (trimmedDikshaName !== originalDikshaName) {
                updates.dikshaName = trimmedDikshaName || "";
            }

            const originalAddress = (originalValues.address || "").trim();
            if (trimmedAddress !== originalAddress) {
                updates.address = trimmedAddress || "";
            }

            await updateEnrollment(enrollment.id, updates);
            toast({
                title: "Success",
                description: "Student information updated successfully",
            });
            setShowEditDialog(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update student information",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

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
