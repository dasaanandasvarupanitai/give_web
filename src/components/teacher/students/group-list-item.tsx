"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GroupData } from "@/lib/types/student-management";
import { ChevronDown, ChevronRight } from "lucide-react";
import { BatchListItem } from "./batch-list-item";

interface GroupListItemProps {
    groupData: GroupData;
    isExpanded: boolean;
    onToggle: () => void;
    expandedBatches: Set<string>;
    onToggleBatch: (batchId: string) => void;
}

export function GroupListItem({
    groupData,
    isExpanded,
    onToggle,
    expandedBatches,
    onToggleBatch,
}: GroupListItemProps) {
    return (
        <Card>
            <Collapsible open={isExpanded} onOpenChange={onToggle}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                )}
                                <CardTitle className="text-lg">{groupData.group.name}</CardTitle>
                            </div>
                            <CardDescription className="text-sm sm:text-base">
                                {groupData.batches.length} batch
                                {groupData.batches.length !== 1 ? "es" : ""}
                            </CardDescription>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-2 pl-4 sm:pl-6">
                            {groupData.batches.map((batchData) => (
                                <BatchListItem
                                    key={batchData.batch.id}
                                    batchData={batchData}
                                    isExpanded={expandedBatches.has(batchData.batch.id)}
                                    onToggle={() => onToggleBatch(batchData.batch.id)}
                                />
                            ))}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}
