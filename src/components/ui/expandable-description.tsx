"use client";

import { Button } from "@/components/ui/button";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ExpandableDescriptionProps {
    text: string;
    maxLines?: 2 | 3;
    className?: string;
}

export function ExpandableDescription({
    text,
    maxLines = 3,
    className = "",
}: ExpandableDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Check if text needs truncation (rough estimate: ~80 characters per line)
    const needsTruncation = text.length > maxLines * 80;

    if (!needsTruncation) {
        return (
            <div className={cn("text-black whitespace-pre-wrap leading-relaxed", className)}>
                <LinkifiedText text={text} className="whitespace-pre-wrap" />
            </div>
        );
    }

    return (
        <div className={className}>
            <div
                className={cn(
                    "text-black whitespace-pre-wrap leading-relaxed",
                    !isExpanded && (maxLines === 2 ? "line-clamp-2" : "line-clamp-3")
                )}
            >
                <LinkifiedText text={text} className="whitespace-pre-wrap" />
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 h-auto p-0 text-primary hover:text-primary/80"
            >
                {isExpanded ? (
                    <>
                        Show less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                ) : (
                    <>
                        Show more <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                )}
            </Button>
        </div>
    );
}
