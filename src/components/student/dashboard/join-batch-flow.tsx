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
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment } from "@/lib/models/enrollment";
import {
    createEnrollment,
    validateClassCode
} from "@/lib/services/firestore";
import { assignStudentRole } from "@/lib/user-roles";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { EnrollmentSuccessDialog } from "./enrollment-success-dialog";
import { StudentInfoDialog } from "./student-info-dialog";

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

    const resetInfoForm = () => {
        setStudentName("");
        setDikshaName("");
        setWhatsappNumber("");
        setAddress("");
        setValidatedBatchInfo(null);
    };

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
            console.log("Creating enrollment for batch:", validatedBatchInfo.batchId);
            await createEnrollment({
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

            await assignStudentRole(user.uid, user.email);

            resetInfoForm();
            setClassCode("");
            setShowInfoDialog(false);
            setSuccessBatchName(`Class Code: ${validatedBatchInfo.classCode}`);

            toast({
                title: "Request Sent",
                description: `Your enrollment request for class code "${validatedBatchInfo.classCode}" has been sent. Waiting for teacher approval.`,
            });

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

    const handleInfoDialogCancel = () => {
        setShowInfoDialog(false);
        resetInfoForm();
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

            <StudentInfoDialog
                isOpen={showInfoDialog}
                onOpenChange={setShowInfoDialog}
                isLoading={isJoining}
                studentName={studentName}
                dikshaName={dikshaName}
                whatsappNumber={whatsappNumber}
                address={address}
                onStudentNameChange={setStudentName}
                onDikshaNameChange={setDikshaName}
                onWhatsappNumberChange={setWhatsappNumber}
                onAddressChange={setAddress}
                onSubmit={handleSubmitEnrollmentInfo}
                onCancel={handleInfoDialogCancel}
            />

            <EnrollmentSuccessDialog
                isOpen={showSuccessDialog}
                onClose={() => setShowSuccessDialog(false)}
                batchName={successBatchName}
            />
        </>
    );
}
