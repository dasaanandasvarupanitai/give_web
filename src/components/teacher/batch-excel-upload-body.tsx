"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarClock, Link2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { ParsedTask } from "./hooks/use-excel-upload";

interface BatchExcelUploadBodyProps {
    batchName: string;
    initing: boolean;
    linkedSheet: string | undefined;
    sheetNames: string[];
    selectedSheet: string;
    setSelectedSheet: (val: string) => void;
    newTasks: ParsedTask[];
    maxScheduledDate: Date | null;
}

export function BatchExcelUploadBody({
    batchName,
    initing,
    linkedSheet,
    sheetNames,
    selectedSheet,
    setSelectedSheet,
    newTasks,
    maxScheduledDate,
}: BatchExcelUploadBodyProps) {
    if (initing) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                <p className="text-sm text-muted-foreground">Reading Excel Registry...</p>
            </div>
        );
    }

    if (!linkedSheet) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-orange-50 text-orange-800 rounded-md border border-orange-200">
                    <div className="flex items-center gap-2 font-medium mb-1">
                        <Link2 className="h-4 w-4" />
                        Link to Excel Sheet
                    </div>
                    <p className="text-sm">
                        This batch is not linked to any sub-sheet yet. Please select the correct sub-sheet
                        for {batchName} to continue. You only need to do this once.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Select Sub-sheet</Label>
                    <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Excel Sub-sheet" />
                        </SelectTrigger>
                        <SelectContent>
                            {sheetNames.map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted rounded-md gap-2">
                <div className="text-sm">
                    <span className="text-muted-foreground">Linked Sheet: </span>
                    <span className="font-medium">{linkedSheet}</span>
                </div>
                <div className="text-sm">
                    <span className="text-muted-foreground">Last Check: </span>
                    <span className="font-medium">
                        {maxScheduledDate ? format(maxScheduledDate, "dd MMM, yyyy") : "None Setup"}
                    </span>
                </div>
            </div>

            {newTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg border-dashed">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <CalendarClock className="h-6 w-6 text-green-600 m-auto mt-3" />
                    </div>
                    <h3 className="font-medium text-lg">You are all caught up!</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        No new later-dated tasks were found in the "{linkedSheet}" sheet.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium">New Tasks Found ({newTasks.length})</h4>
                    </div>
                    <ScrollArea className="h-[250px] w-full border rounded-md p-4">
                        <div className="space-y-4">
                            {newTasks.map((t, idx) => (
                                <div key={idx} className="flex flex-col text-sm border-b pb-3 last:border-0 last:pb-0">
                                    <span className="font-medium">{t.title}</span>
                                    <span className="text-muted-foreground text-xs mt-1 truncate">
                                        {t.url}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
