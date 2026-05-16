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
import { Progress } from "@/components/ui/progress";
import type { Batch } from "@/lib/models/batch";
import { Loader2 } from "lucide-react";
import { BatchExcelUploadBody } from "./batch-excel-upload-body";
import { useExcelUpload } from "./hooks/use-excel-upload";

interface BatchExcelUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batch: Batch;
    onSuccess?: () => void;
}

export function BatchExcelUploadDialog({
    open,
    onOpenChange,
    batch,
    onSuccess,
}: BatchExcelUploadDialogProps) {
    const {
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
    } = useExcelUpload(batch, open, onSuccess, onOpenChange);

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
                    <BatchExcelUploadBody
                        batchName={batch.name}
                        initing={initing}
                        linkedSheet={linkedSheet}
                        sheetNames={sheetNames}
                        selectedSheet={selectedSheet}
                        setSelectedSheet={setSelectedSheet}
                        newTasks={newTasks}
                        maxScheduledDate={maxScheduledDate}
                    />
                </div>

                {loading && progress > 0 && (
                    <div className="px-1 pb-2 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Scheduling tasks...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

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
