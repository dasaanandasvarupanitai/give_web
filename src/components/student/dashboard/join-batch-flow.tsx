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
import type { Enrollment } from "@/lib/models/enrollment";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { EnrollmentSuccessDialog } from "./enrollment-success-dialog";
import { StudentInfoDialog } from "./student-info-dialog";
import { useJoinBatch } from "../hooks/use-join-batch";

interface JoinBatchFlowProps {
    enrollments: Enrollment[];
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function JoinBatchFlow({ enrollments, isOpen: externalIsOpen, onOpenChange: externalOnOpenChange }: JoinBatchFlowProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isJoinDialogOpen = externalIsOpen ?? internalIsOpen;
    const setIsJoinDialogOpen = externalOnOpenChange ?? setInternalIsOpen;

    const {
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
    } = useJoinBatch(enrollments, externalOnOpenChange ?? setInternalIsOpen);

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
