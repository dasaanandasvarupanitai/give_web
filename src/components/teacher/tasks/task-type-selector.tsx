"use client";

import type { TaskType } from "@/lib/models/task";
import {
    BookOpen,
    FileQuestion,
    FileText,
    Headphones,
    Megaphone,
} from "lucide-react";

export const taskTypes: { value: TaskType; label: string; icon: typeof Headphones }[] = [
    { value: "dailyListening", label: "Daily Listening", icon: Headphones },
    { value: "cba", label: "CBA", icon: FileQuestion },
    { value: "oba", label: "OBA", icon: FileText },
    { value: "slokaMemorization", label: "Sloka Memorization", icon: BookOpen },
    { value: "announcement", label: "Announcement", icon: Megaphone },
];

interface TaskTypeSelectorProps {
    selectedType: TaskType;
    onTypeChange: (type: TaskType) => void;
}

export function TaskTypeSelector({ selectedType, onTypeChange }: TaskTypeSelectorProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {taskTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.value;
                return (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => onTypeChange(type.value)}
                        className={`p-3 border rounded-lg text-left transition-colors ${isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                            }`}
                    >
                        <Icon className="h-5 w-5 mb-2" />
                        <p className="text-sm font-medium">{type.label}</p>
                    </button>
                );
            })}
        </div>
    );
}
