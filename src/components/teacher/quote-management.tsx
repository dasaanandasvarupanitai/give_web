"use client";

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Quote } from "@/lib/models/quote";
import {
    createQuote,
    deleteQuote,
    subscribeQuotes,
    updateQuote
} from "@/lib/services/firestore";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { QuoteCard } from "./quotes/quote-card";
import { QuoteFormDialog } from "./quotes/quote-form-dialog";

export function QuoteManagement({ enabled = true }: { enabled?: boolean }) {
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
        if (!enabled) return;
        const unsubscribe = subscribeQuotes((quotesList) => {
            setQuotes(quotesList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [enabled]);

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
                <QuoteFormDialog
                    isOpen={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    isEditing={isEditing}
                    isSubmitting={isSubmitting}
                    formData={formData}
                    onFormChange={setFormData}
                    onSubmit={handleSubmit}
                    onReset={resetForm}
                />
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
                        <QuoteCard
                            key={quote.id}
                            quote={quote}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
