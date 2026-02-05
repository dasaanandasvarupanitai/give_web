"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { CourseGroup } from "@/lib/models/course-group";
import { Edit, Folder, Trash2 } from "lucide-react";

interface CourseGroupCardProps {
    group: CourseGroup;
    onEdit: (group: CourseGroup) => void;
    onDelete: (id: string) => void;
}

export function CourseGroupCard({ group, onEdit, onDelete }: CourseGroupCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(group)}
                            className="border border-orange-500"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(group.id)}
                            className="text-destructive hover:text-destructive border border-orange-500"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="mb-4">
                    {group.description}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group.batchCount} batches</span>
                    <span>
                        Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
