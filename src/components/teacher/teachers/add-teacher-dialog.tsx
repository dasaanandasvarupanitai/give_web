"use client";

import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";

interface AddTeacherDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
    onEmailChange: (email: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isAdding: boolean;
}

export function AddTeacherDialog({
    isOpen,
    onOpenChange,
    email,
    onEmailChange,
    onSubmit,
    isAdding
}: AddTeacherDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>
                            Enter the email address of the teacher to add. They will
                            have access to the Teacher Dashboard once they log in.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="teacher@example.com"
                                value={email}
                                onChange={(e) => onEmailChange(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isAdding}>
                            {isAdding ? "Adding..." : "Add Teacher"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
