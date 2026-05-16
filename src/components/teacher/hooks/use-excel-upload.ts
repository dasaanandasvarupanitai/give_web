"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import { updateBatch } from "@/lib/services/batch-service";
import { createTask, getTasksByBatch } from "@/lib/services/task-service";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export interface ParsedTask {
    title: string;
    url: string;
    startDate: Date;
    dueDate: Date;
}

export function useExcelUpload(
    batch: Batch,
    open: boolean,
    onSuccess: (() => void) | undefined,
    onOpenChange: (open: boolean) => void
) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
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

            listeningTasks.forEach(t => {
                if (t.startDate) {
                    const tTime = t.startDate.getTime();
                    if (tTime > maxFsTime) maxFsTime = tTime;
                }
            });

            setMaxScheduledDate(maxFsTime > 0 ? new Date(maxFsTime) : null);
            const fsDayMs = maxFsTime > 0 ? new Date(maxFsTime).setHours(0, 0, 0, 0) : 0;

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

                    // Use title directly from the Excel sheet + append the date suffix
                    const excelTitle = row.title ? row.title.toString().trim() : "Today's listening to Srila Prabhupada";
                    const finalTitle = `${excelTitle} (${formattedDateSuffix})`;

                    // Due date is end of the day
                    const dueDateObj = new Date(rowDayMs);
                    dueDateObj.setHours(23, 59, 59, 999);

                    foundNew.push({
                        title: finalTitle,
                        url: row.url.toString().trim(),
                        startDate: rowDateObj,
                        dueDate: dueDateObj
                    });
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
        setProgress(0);
        try {
            for (let i = 0; i < newTasks.length; i++) {
                const t = newTasks[i];
                await createTask({
                    title: t.title,
                    description: t.url,
                    batchId: batch.id,
                    teacherId: batch.teacherId,
                    type: "dailyListening",
                    status: "published",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    startDate: t.startDate,
                    dueDate: t.dueDate,
                    maxPoints: 100,
                    attachments: [t.url],
                    allowedFileTypes: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
                    allowLateSubmission: false,
                    lateSubmissionDays: 0,
                    submissionCount: 0,
                    isPinned: false,
                });
                setProgress(Math.round(((i + 1) / newTasks.length) * 100));
            }

            toast({
                title: "Success",
                description: `Successfully scheduled ${newTasks.length} new tasks!`,
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
            setProgress(0);
        }
    };

    return {
        loading,
        progress,
        initing,
        sheetNames,
        selectedSheet,
        setSelectedSheet,
        linkedSheet,
        newTasks,
        maxScheduledDate,
        handleLinkSheet,
        handleBulkSchedule,
    };
}
