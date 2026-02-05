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

interface EditStudentForm {
    studentName: string;
    dikshaName: string;
    whatsappNumber: string;
    address: string;
}

interface EditStudentDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isSaving: boolean;
    formData: EditStudentForm;
    onFormChange: (data: EditStudentForm) => void;
    onSave: () => void;
}

export function EditStudentDialog({
    isOpen,
    onOpenChange,
    isSaving,
    formData,
    onFormChange,
    onSave,
}: EditStudentDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90%] max-w-md sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Student Information</DialogTitle>
                    <DialogDescription>
                        Update the student's information. Changes will be saved immediately.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-studentName">
                            Certificate Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="edit-studentName"
                            placeholder="Enter certificate name"
                            value={formData.studentName}
                            onChange={(e) => onFormChange({ ...formData, studentName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-dikshaName">Diksha Name (Optional)</Label>
                        <Input
                            id="edit-dikshaName"
                            placeholder="Enter diksha name"
                            value={formData.dikshaName}
                            onChange={(e) => onFormChange({ ...formData, dikshaName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-whatsappNumber">
                            WhatsApp Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="edit-whatsappNumber"
                            placeholder="Enter WhatsApp number with country code"
                            value={formData.whatsappNumber}
                            onChange={(e) => onFormChange({ ...formData, whatsappNumber: e.target.value })}
                            type="tel"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Example: +1234567890
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-address">Address (Optional)</Label>
                        <Textarea
                            id="edit-address"
                            placeholder="Enter address"
                            value={formData.address}
                            onChange={(e) => onFormChange({ ...formData, address: e.target.value })}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving || !formData.studentName.trim() || !formData.whatsappNumber.trim()}
                        className="w-full sm:w-auto"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
