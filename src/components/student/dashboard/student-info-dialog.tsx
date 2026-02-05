"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface StudentInfoDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    studentName: string;
    dikshaName: string;
    whatsappNumber: string;
    address: string;
    onStudentNameChange: (value: string) => void;
    onDikshaNameChange: (value: string) => void;
    onWhatsappNumberChange: (value: string) => void;
    onAddressChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
}

export function StudentInfoDialog({
    isOpen,
    onOpenChange,
    isLoading,
    studentName,
    dikshaName,
    whatsappNumber,
    address,
    onStudentNameChange,
    onDikshaNameChange,
    onWhatsappNumberChange,
    onAddressChange,
    onSubmit,
    onCancel,
}: StudentInfoDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !isLoading) {
                onOpenChange(false);
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
                            onChange={(e) => onStudentNameChange(e.target.value)}
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
                            onChange={(e) => onDikshaNameChange(e.target.value)}
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
                            onChange={(e) => onWhatsappNumberChange(e.target.value)}
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
                            onChange={(e) => onAddressChange(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={isLoading || !studentName.trim() || !whatsappNumber.trim()}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? (
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
    );
}
