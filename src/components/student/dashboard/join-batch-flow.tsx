"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment } from "@/lib/models/enrollment";
import {
    createEnrollment,
    validateClassCode
} from "@/lib/services/firestore";
import { assignStudentRole } from "@/lib/user-roles";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Plus
} from "lucide-react";
import { useState } from "react";

interface JoinBatchFlowProps {
    enrollments: Enrollment[];
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function JoinBatchFlow({ enrollments, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }: JoinBatchFlowProps) {
    const { user } = useAuthUser();
    const { toast } = useToast();

    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isJoinDialogOpen = externalIsOpen ?? internalIsOpen;
    const setIsJoinDialogOpen = externalOnOpenChange ?? setInternalIsOpen;
    const [isJoining, setIsJoining] = useState(false);
    const [classCode, setClassCode] = useState("");
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successBatchName, setSuccessBatchName] = useState("");

    // Information collection dialog state
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [validatedBatchInfo, setValidatedBatchInfo] = useState<{ batchId: string; courseGroupId: string; classCode: string } | null>(null);
    const [studentName, setStudentName] = useState("");
    const [dikshaName, setDikshaName] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [address, setAddress] = useState("");

    const handleJoinBatch = async () => {
        if (!user?.uid || !user?.email) {
            toast({
                title: "Error",
                description: "You must be logged in to join a batch",
                variant: "destructive",
            });
            return;
        }

        if (!classCode.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter a class code",
                variant: "destructive",
            });
            return;
        }

        setIsJoining(true);
        try {
            // Validate class code (returns only batchId and courseGroupId - no batch details)
            const batchInfo = await validateClassCode(classCode.trim().toUpperCase());

            if (!batchInfo) {
                toast({
                    title: "Error",
                    description: "Invalid class code. Please check the code and try again.",
                    variant: "destructive",
                });
                setIsJoining(false);
                return;
            }

            // Check if already enrolled (only check active or pending enrollments)
            // Allow rejoining if status is "dropped" or "declined"
            const isAlreadyEnrolled = enrollments.some(
                (e) => e.batchId === batchInfo.batchId &&
                    (e.status === "active" || e.status === "pending" || e.status === "completed")
            );

            if (isAlreadyEnrolled) {
                const existingEnrollment = enrollments.find(e => e.batchId === batchInfo.batchId);
                let message = "You are already enrolled in this batch.";
                if (existingEnrollment?.status === "pending") {
                    message = "You have a pending enrollment request for this batch.";
                } else if (existingEnrollment?.status === "completed") {
                    message = "You have already completed this batch.";
                }
                toast({
                    title: "Already Enrolled",
                    description: message,
                    variant: "destructive",
                });
                setIsJoining(false);
                return;
            }

            // Store validated batch info and show information collection dialog
            setValidatedBatchInfo({
                ...batchInfo,
                classCode: classCode.trim().toUpperCase(),
            });
            setIsJoinDialogOpen(false);
            setShowInfoDialog(true);
        } catch (error) {
            console.error("Error validating class code:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to validate class code",
                variant: "destructive",
            });
        } finally {
            setIsJoining(false);
        }
    };

    const handleSubmitEnrollmentInfo = async () => {
        if (!user?.uid || !user?.email || !validatedBatchInfo) {
            toast({
                title: "Error",
                description: "Missing required information",
                variant: "destructive",
            });
            return;
        }

        if (!studentName.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your name",
                variant: "destructive",
            });
            return;
        }

        if (!whatsappNumber.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your WhatsApp number",
                variant: "destructive",
            });
            return;
        }

        setIsJoining(true);
        try {
            // Create enrollment request with student information
            console.log("Creating enrollment for batch:", validatedBatchInfo.batchId);
            const enrollmentId = await createEnrollment({
                studentId: user.uid,
                batchId: validatedBatchInfo.batchId,
                courseGroupId: validatedBatchInfo.courseGroupId,
                status: "pending",
                enrolledAt: new Date(),
                classCode: validatedBatchInfo.classCode,
                studentName: studentName.trim(),
                dikshaName: dikshaName.trim() || undefined,
                whatsappNumber: whatsappNumber.trim(),
                address: address.trim() || undefined,
            }, user.email || "");

            console.log("Enrollment created with ID:", enrollmentId);

            // Assign student role if not already assigned
            await assignStudentRole(user.uid, user.email);

            // Reset form
            setStudentName("");
            setDikshaName("");
            setWhatsappNumber("");
            setAddress("");
            setClassCode("");
            setValidatedBatchInfo(null);
            setShowInfoDialog(false);

            // Show success dialog and toast
            setSuccessBatchName(`Class Code: ${validatedBatchInfo.classCode}`);

            // Show toast notification
            toast({
                title: "Request Sent",
                description: `Your enrollment request for class code "${validatedBatchInfo.classCode}" has been sent. Waiting for teacher approval.`,
            });

            // Show success dialog
            setShowSuccessDialog(true);
        } catch (error) {
            console.error("Error creating enrollment:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create enrollment",
                variant: "destructive",
            });
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Join Batch
                    </CardTitle>
                    <CardDescription>
                        Enter class code to join a batch
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Join Batch
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90%] max-w-md sm:max-w-lg left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] mx-auto">
                            <DialogHeader>
                                <DialogTitle>Join Batch</DialogTitle>
                                <DialogDescription>
                                    Enter the class code provided by your teacher to join a batch.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="classCode">Class Code</Label>
                                    <Input
                                        id="classCode"
                                        placeholder="Enter class code"
                                        value={classCode}
                                        onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                                        className="uppercase"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsJoinDialogOpen(false);
                                        setClassCode("");
                                    }}
                                    className="w-full sm:w-auto"
                                    disabled={isJoining}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleJoinBatch}
                                    disabled={isJoining}
                                    className="w-full sm:w-auto"
                                >
                                    {isJoining ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        "Join Batch"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Student Information Collection Dialog */}
            <Dialog open={showInfoDialog} onOpenChange={(open) => {
                if (!open && !isJoining) {
                    setShowInfoDialog(false);
                    setValidatedBatchInfo(null);
                    setStudentName("");
                    setDikshaName("");
                    setWhatsappNumber("");
                    setAddress("");
                }
            }}>
                <DialogContent className="w-[90%] max-w-md sm:max-w-2xl left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Student Information</DialogTitle>
                        <DialogDescription>
                            Please provide your information for enrollment. This information will be used for certificates and communication.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="studentName">
                                Full Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="studentName"
                                placeholder="Enter your full name (as it should appear on certificate)"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This name will be used on your completion certificate
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dikshaName">Diksha Name (Optional)</Label>
                            <Input
                                id="dikshaName"
                                placeholder="Enter your diksha name if you have one"
                                value={dikshaName}
                                onChange={(e) => setDikshaName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsappNumber">
                                WhatsApp Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="whatsappNumber"
                                placeholder="Enter your WhatsApp number with country code"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                type="tel"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Example: +1234567890
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Textarea
                                id="address"
                                placeholder="Enter your address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowInfoDialog(false);
                                setValidatedBatchInfo(null);
                                setStudentName("");
                                setDikshaName("");
                                setWhatsappNumber("");
                                setAddress("");
                            }}
                            disabled={isJoining}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitEnrollmentInfo}
                            disabled={isJoining || !studentName.trim() || !whatsappNumber.trim()}
                            className="w-full sm:w-auto"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Enrollment Request"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-orange-600" />
                            </div>
                            <AlertDialogTitle>Request Sent Successfully!</AlertDialogTitle>
                        </div>
                        <div className="text-sm text-muted-foreground pt-2">
                            <p className="mb-4">
                                Your enrollment request for <strong>{successBatchName}</strong> has been sent successfully.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
                                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                            <li>Your request is now pending approval</li>
                                            <li>The teacher will review your request</li>
                                            <li>You will be able to access the batch once approved</li>
                                            <li>Check back later for updates on your enrollment status</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => {
                            setShowSuccessDialog(false);
                            // Reload the page to refresh enrollment data and prevent freezing
                            window.location.reload();
                        }}>
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
