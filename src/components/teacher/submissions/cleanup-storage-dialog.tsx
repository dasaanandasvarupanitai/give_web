"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cleanupSubmissionsStorage } from "@/lib/services/cleanup-service";
import { TaskType } from "@/lib/models/task";
import { getTaskTypeLabel } from "@/lib/utils/task-helpers";
import { useToast } from "@/hooks/use-toast";

interface CleanupStorageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    batchId: string;
    taskType: TaskType;
    onSuccess: () => void;
}

export function CleanupStorageDialog({
    open,
    onOpenChange,
    batchId,
    taskType,
    onSuccess,
}: CleanupStorageDialogProps) {
    const { toast } = useToast();
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [isCleaning, setIsCleaning] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleCleanup = async () => {
        if (!isConfirmed) {
            toast({
                title: "Confirmation Required",
                description: "Please check the confirmation box to proceed.",
                variant: "destructive",
            });
            return;
        }

        setIsCleaning(true);
        try {
            const result = await cleanupSubmissionsStorage({
                batchId,
                taskType,
                startDate: dateRange?.from,
                endDate: dateRange?.to,
            });

            toast({
                title: "Cleanup Complete",
                description: `Processed ${result.processed} submissions and deleted ${result.deleted} files.`,
            });

            onSuccess();
            onOpenChange(false);
            // Reset state
            setDateRange(undefined);
            setIsConfirmed(false);
        } catch (error) {
            toast({
                title: "Cleanup Failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsCleaning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Cleanup Storage
                    </DialogTitle>
                    <DialogDescription>
                        Delete physical files and text content for <strong>{getTaskTypeLabel(taskType)}</strong> submissions to save space.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Date Range (Optional)</label>
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                {format(dateRange.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="start"
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                onCloseAutoFocus={(e) => e.preventDefault()}
                                onInteractOutside={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target?.closest('.rdp-nav')) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <div onPointerDown={(e) => e.stopPropagation()}>
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={1}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-md border border-orange-200 text-sm space-y-2">
                        <p className="font-semibold text-orange-800">What happens?</p>
                        <ul className="list-disc list-inside text-orange-700 space-y-1">
                            <li>All uploaded files and recordings will be deleted from storage.</li>
                            <li>Text-only submissions will be cleared.</li>
                            <li><strong>Submission records will be kept for analytics.</strong></li>
                            <li>This action cannot be undone.</li>
                        </ul>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="confirm-cleanup"
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                        />
                        <label
                            htmlFor="confirm-cleanup"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I understand that files will be permanently deleted.
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCleaning}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCleanup}
                        disabled={isCleaning || !isConfirmed}
                    >
                        {isCleaning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cleaning...
                            </>
                        ) : (
                            "Proceed with Cleanup"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
