"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Task } from "@/lib/models/task";
import { updateBatch } from "@/lib/services/batch-service";
import { bulkCreateTasks, getTasksByBatch } from "@/lib/services/task-service";
import { CalendarClock, Loader2, Link2 } from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface BatchExcelUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batch: Batch;
    onSuccess?: () => void;
}

interface ParsedTask {
    title: string;
    url: string;
    startDate: Date;
    dueDate: Date;
}

export function BatchExcelUploadDialog({
    open,
    onOpenChange,
    batch,
    onSuccess,
}: BatchExcelUploadDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [initing, setIniting] = useState(true);

    // Excel State
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [linkedSheet, setLinkedSheet] = useState<string | undefined>(batch.dailyListeningSheetName);

    // Data State
    const [newTasks, setNewTasks] = useState<ParsedTask[]>([]);
    const [maxScheduledDate, setMaxScheduledDate] = useState<Date | null>(null);

    useEffect(() => {
        if (open) {
            initializeFlow();
        } else {
            // Reset state on close
            setWorkbook(null);
            setSheetNames([]);
            setSelectedSheet("");
            setNewTasks([]);
            setMaxScheduledDate(null);
            setLoading(false);
            setIniting(true);
            setLinkedSheet(batch.dailyListeningSheetName);
        }
    }, [open, batch.dailyListeningSheetName]);

    const initializeFlow = async () => {
        setIniting(true);
        try {
            // Fetch the Excel file securely from the public directory
            const response = await fetch("/Daily Sadhana.xlsx");
            if (!response.ok) {
                throw new Error("Failed to load Excel file from the server.");
            }
            const arrayBuffer = await response.arrayBuffer();
            const wb = XLSX.read(arrayBuffer);

            setWorkbook(wb);
            setSheetNames(wb.SheetNames);

            // Using batch.dailyListeningSheetName directly to avoid closure issues during init
            if (batch.dailyListeningSheetName) {
                setSelectedSheet(batch.dailyListeningSheetName);
                await parseAndCompareTasks(wb, batch.dailyListeningSheetName);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to read excel file.",
                variant: "destructive",
            });
            onOpenChange(false);
        } finally {
            setIniting(false);
        }
    };

    const handleLinkSheet = async () => {
        if (!selectedSheet) return;
        setLoading(true);
        try {
            await updateBatch(batch.id, { dailyListeningSheetName: selectedSheet });
            setLinkedSheet(selectedSheet);

            toast({
                title: "Sheet Linked",
                description: `Successfully linked ${selectedSheet} to ${batch.name}.`,
            });

            if (workbook) {
                await parseAndCompareTasks(workbook, selectedSheet);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to link sheet.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const parseAndCompareTasks = async (wb: XLSX.WorkBook, sheetName: string) => {
        try {
            // 1. Fetch Firestore tasks
            const existingTasks = await getTasksByBatch(batch.id, true);
            const listeningTasks = existingTasks.filter(t => t.type === "dailyListening");

            let maxFsTime = 0;
            let lastTitle = "";

            listeningTasks.forEach(t => {
                if (t.startDate) {
                    const tTime = t.startDate.getTime();
                    if (tTime > maxFsTime) {
                        maxFsTime = tTime;
                        lastTitle = t.title;
                    }
                }
            });

            setMaxScheduledDate(maxFsTime > 0 ? new Date(maxFsTime) : null);
            const fsDayMs = maxFsTime > 0 ? new Date(maxFsTime).setHours(0, 0, 0, 0) : 0;

            // Extract last sequence number from title if it exists e.g., "Today's listening to Srila Prabhupada - 53 (04.04.26)"
            let nextSeqNumber = 1;
            if (lastTitle) {
                // match something like "- 53" or "- 053"
                const match = lastTitle.match(/-\s*(\d+)/);
                if (match && match[1]) {
                    nextSeqNumber = parseInt(match[1]) + 1;
                }
            }

            // 2. Read Sheet
            const sheet = wb.Sheets[sheetName];
            if (!sheet) {
                throw new Error("Linked sheet not found in the workbook.");
            }

            // We expect [ "url", "Title", "date" ] in row 1
            const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { header: ["url", "title", "date"], range: 1 });

            const foundNew: ParsedTask[] = [];

            for (const row of rawRows) {
                if (!row.url || !row.date) continue; // title might be ignored in favor of generated title

                let rowDateMs = 0;
                let rowDateObj: Date;

                if (row.date instanceof Date) {
                    rowDateObj = row.date;
                } else if (typeof row.date === "number") {
                    const parsed = XLSX.SSF.parse_date_code(row.date);
                    rowDateObj = new Date(parsed.y, parsed.m - 1, parsed.d);
                } else {
                    rowDateObj = new Date(row.date);
                }

                rowDateMs = rowDateObj.getTime();

                if (isNaN(rowDateMs)) continue; // skip invalid dates

                const rowDayMs = new Date(rowDateMs).setHours(0, 0, 0, 0);

                if (rowDayMs > fsDayMs) {
                    const rowDateObj = new Date(rowDayMs);
                    const formattedDateSuffix = format(rowDateObj, "dd.MM.yy");

                    let newTitle = "Today's listening to Srila Prabhupada";

                    // Mimic format: "Today's listening to Srila Prabhupada - 54 (05.04.26)"
                    if (lastTitle) {
                        const parts = lastTitle.split(" - ");
                        if (parts.length > 1) {
                            newTitle = parts[0];
                        }
                    }

                    const finalTitle = `${newTitle} - ${nextSeqNumber} (${formattedDateSuffix})`;

                    // Due date is end of the day
                    const dueDateObj = new Date(rowDayMs);
                    dueDateObj.setHours(23, 59, 59, 999);

                    foundNew.push({
                        title: finalTitle,
                        url: row.url.toString().trim(),
                        startDate: rowDateObj,
                        dueDate: dueDateObj
                    });

                    nextSeqNumber++;
                }
            }

            setNewTasks(foundNew);

        } catch (error) {
            console.error(error);
            throw new Error("Failed to parse and compare tasks.");
        }
    };

    const handleBulkSchedule = async () => {
        if (newTasks.length === 0) return;
        setLoading(true);
        try {
            const tasksToCreate: Omit<Task, "id">[] = newTasks.map((t) => ({
                title: t.title,
                description: t.url, // Description only URL as requested
                batchId: batch.id,
                teacherId: batch.teacherId, // Note: assuming teacher executing this leads to batch.teacherId context
                type: "dailyListening",
                status: "published",
                createdAt: new Date(),
                updatedAt: new Date(),
                startDate: t.startDate,
                dueDate: t.dueDate,
                maxPoints: 100, // default or 0? 100 is standard
                attachments: [t.url],
                allowedFileTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
                allowLateSubmission: false,
                lateSubmissionDays: 0,
                submissionCount: 0,
            }));

            await bulkCreateTasks(tasksToCreate);

            toast({
                title: "Success",
                description: `Successfully scheduled ${tasksToCreate.length} new tasks!`,
            });

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to bulk schedule tasks.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Schedule Tasks from Excel</DialogTitle>
                    <DialogDescription>
                        Automatically sync new daily listening tasks from the global Excel registry.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {initing ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                            <p className="text-sm text-muted-foreground">Reading Excel Registry...</p>
                        </div>
                    ) : !linkedSheet ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-orange-50 text-orange-800 rounded-md border border-orange-200">
                                <div className="flex items-center gap-2 font-medium mb-1">
                                    <Link2 className="h-4 w-4" />
                                    Link to Excel Sheet
                                </div>
                                <p className="text-sm">
                                    This batch is not linked to any sub-sheet yet. Please select the correct sub-sheet
                                    for {batch.name} to continue. You only need to do this once.
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
                    ) : (
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
                    )}
                </div>

                <DialogFooter className="sm:justify-between items-center mt-4 border-t pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>

                    {!initing && !linkedSheet && (
                        <Button
                            onClick={handleLinkSheet}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={!selectedSheet || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Link Sheet
                        </Button>
                    )}

                    {!initing && linkedSheet && newTasks.length > 0 && (
                        <Button
                            onClick={handleBulkSchedule}
                            className="bg-orange-600 hover:bg-orange-700"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Schedule {newTasks.length} Tasks
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
