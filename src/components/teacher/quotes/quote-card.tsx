"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Quote } from "@/lib/models/quote";
import { Edit, Trash2 } from "lucide-react";

interface QuoteCardProps {
    quote: Quote;
    onEdit: (quote: Quote) => void;
    onDelete: (id: string) => void;
}

export function QuoteCard({ quote, onEdit, onDelete }: QuoteCardProps) {
    return (
        <Card>
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
                        onClick={() => onEdit(quote)}
                        className="border border-orange-500"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(quote.id)}
                        className="border border-orange-500"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
