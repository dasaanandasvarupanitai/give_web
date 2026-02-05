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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";

interface QuoteFormData {
    quote: string;
    author: string;
    date: string;
}

interface QuoteFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isEditing: boolean;
    isSubmitting: boolean;
    formData: QuoteFormData;
    onFormChange: (data: QuoteFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
}

export function QuoteFormDialog({
    isOpen,
    onOpenChange,
    isEditing,
    isSubmitting,
    formData,
    onFormChange,
    onSubmit,
    onReset,
}: QuoteFormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button onClick={onReset} className="border border-orange-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Quote
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Quote" : "Add Quote"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Update the quote details below."
                                : "Add a new quote to display in the quote carousel."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quote">Quote *</Label>
                            <Textarea
                                id="quote"
                                placeholder="Enter the quote text..."
                                value={formData.quote}
                                onChange={(e) =>
                                    onFormChange({ ...formData, quote: e.target.value })
                                }
                                required
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="author">Author *</Label>
                            <Input
                                id="author"
                                placeholder="Enter author name..."
                                value={formData.author}
                                onChange={(e) =>
                                    onFormChange({ ...formData, author: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date (Optional)</Label>
                            <Input
                                id="date"
                                placeholder="e.g., Lecture, Śrīmad-Bhāgavatam 1.10.4, Māyāpura, June 19, 1973"
                                value={formData.date}
                                onChange={(e) =>
                                    onFormChange({ ...formData, date: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                            className="border border-orange-500"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="border border-orange-500">
                            {isSubmitting && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
