"use client";

import { useState } from "react";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment } from "@/lib/models/enrollment";
import {
    createEnrollment,
    validateClassCode
} from "@/lib/services/firestore";
import { assignStudentRole } from "@/lib/user-roles";

export function useJoinBatch(enrollments: Enrollment[], onOpenChange: ((open: boolean) => void) | undefined) {
    const { user } = useAuthUser();
    const { toast } = useToast();

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
            onOpenChange?.(false);
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

    return {
        isJoining,
        classCode,
        setClassCode,
        showSuccessDialog,
        setShowSuccessDialog,
        successBatchName,
        showInfoDialog,
        setShowInfoDialog,
        studentName,
        setStudentName,
        dikshaName,
        setDikshaName,
        whatsappNumber,
        setWhatsappNumber,
        address,
        setAddress,
        handleJoinBatch,
        handleSubmitEnrollmentInfo,
        handleInfoDialogCancel,
    };
}
