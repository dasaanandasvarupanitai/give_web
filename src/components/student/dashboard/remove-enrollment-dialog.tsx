"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import { Loader2, Trash2 } from "lucide-react";

interface RemoveEnrollmentDialogProps {
    enrollment: Enrollment | null;
    batch: Batch | undefined;
    isRemoving: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function RemoveEnrollmentDialog({
    enrollment,
    batch,
    isRemoving,
    onClose,
    onConfirm,
}: RemoveEnrollmentDialogProps) {
    return (
        <AlertDialog open={enrollment !== null} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Batch from Dashboard?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove{" "}
                        <strong>{batch?.name}</strong>{" "}
                        (Status: <span className="capitalize">{enrollment?.status}</span>) from your dashboard?
                        This will permanently remove the enrollment record. You can join this batch again later using the class code if needed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isRemoving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
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
    );
}
