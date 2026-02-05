"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import type { Batch } from "@/lib/models/batch";
import { Check, Copy, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BatchCardProps {
    batch: Batch;
    onEdit: (batch: Batch) => void;
    onDelete: (id: string, courseGroupId: string) => void;
    onCopyCode: (code: string) => void;
}

export function BatchCard({ batch, onEdit, onDelete, onCopyCode }: BatchCardProps) {
    const router = useRouter();
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopyCode = () => {
        onCopyCode(batch.classCode);
        setCopiedCode(batch.classCode);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg">{batch.name}</CardTitle>
                        {batch.description && (
                            <CardDescription className="mt-1">
                                <ExpandableDescription text={batch.description} maxLines={2} />
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex gap-1 self-start sm:self-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(batch)}
                            className="border border-orange-500"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(batch.id, batch.courseGroupId)}
                            className="text-destructive hover:text-destructive border border-orange-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Class Code:</span>
                        <div className="flex items-center gap-2">
                            <code className="text-sm font-mono break-all">{batch.classCode}</code>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={handleCopyCode}
                            >
                                {copiedCode === batch.classCode ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span>{batch.studentCount} students</span>
                        {batch.startDate && (
                            <span>
                                Starts {new Date(batch.startDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        className="w-full border border-orange-500"
                        onClick={() => router.push(`/teacher/batches/${batch.id}`)}
                    >
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
