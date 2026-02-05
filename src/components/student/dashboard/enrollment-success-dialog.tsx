"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface EnrollmentSuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    batchName: string;
}

export function EnrollmentSuccessDialog({
    isOpen,
    onClose,
    batchName,
}: EnrollmentSuccessDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                            Your enrollment request for <strong>{batchName}</strong> has been sent successfully.
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
                        onClose();
                        window.location.reload();
                    }}>
                        Got it
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
