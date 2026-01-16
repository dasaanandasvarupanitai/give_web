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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Quote } from "@/lib/models/quote";
import {
    createQuote,
    deleteQuote,
    subscribeQuotes,
    updateQuote
} from "@/lib/services/firestore";
import { Edit, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function QuoteManagement() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        quote: "",
        author: "",
        date: "",
    });

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = subscribeQuotes((quotesList) => {
            setQuotes(quotesList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.quote.trim() || !formData.author.trim()) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditing && editingId) {
                await updateQuote(editingId, {
                    quote: formData.quote.trim(),
                    author: formData.author.trim(),
                    date: formData.date.trim() || undefined,
                });
                toast({
                    title: "Success",
                    description: "Quote updated successfully",
                });
            } else {
                await createQuote({
                    quote: formData.quote.trim(),
                    author: formData.author.trim(),
                    date: formData.date.trim() || undefined,
                });
                toast({
                    title: "Success",
                    description: "Quote created successfully",
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving quote:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save quote",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (quote: Quote) => {
        setFormData({
            quote: quote.quote,
            author: quote.author,
            date: quote.date || "",
        });
        setEditingId(quote.id);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quote?")) {
            return;
        }

        try {
            await deleteQuote(id);
            toast({
                title: "Success",
                description: "Quote deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting quote:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete quote",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            quote: "",
            author: "",
            date: "",
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            resetForm();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Quotes</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage quotes displayed in the quote carousel
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()} className="border border-orange-500">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Quote
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
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
                                            setFormData({ ...formData, quote: e.target.value })
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
                                            setFormData({ ...formData, author: e.target.value })
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
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleDialogOpenChange(false)}
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
            </div>

            {quotes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No quotes added yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quotes.map((quote) => (
                        <Card key={quote.id}>
                            <CardHeader>
                                <CardTitle className="text-base line-clamp-2">
                                    {quote.quote.substring(0, 60)}...
                                </CardTitle>
                                <CardDescription>— {quote.author}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(quote)}
                                        className="border border-orange-500"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(quote.id)}
                                        className="border border-orange-500"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

