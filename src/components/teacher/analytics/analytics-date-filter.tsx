"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { DateRangePicker } from "./date-range-picker";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface AnalyticsDateFilterProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    appliedDateRange: DateRange;
    setAppliedDateRange: (range: DateRange) => void;
    dateRangePreset: string;
    setDateRangePreset: (preset: string) => void;
    popoverOpen: boolean;
    setPopoverOpen: (open: boolean) => void;
    onDatePresetChange: (preset: string) => void;
}

export function AnalyticsDateFilter({
    dateRange,
    setDateRange,
    appliedDateRange,
    setAppliedDateRange,
    dateRangePreset,
    setDateRangePreset,
    popoverOpen,
    setPopoverOpen,
    onDatePresetChange,
}: AnalyticsDateFilterProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm font-medium whitespace-nowrap">Filter by Date:</span>
                        <DateRangePicker
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            appliedDateRange={appliedDateRange}
                            setAppliedDateRange={setAppliedDateRange}
                            setDateRangePreset={setDateRangePreset}
                            popoverOpen={popoverOpen}
                            setPopoverOpen={setPopoverOpen}
                        />
                    </div>
                    <Button
                        variant={dateRangePreset === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => onDatePresetChange("all")}
                        className="w-full sm:w-auto"
                    >
                        All Time
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
