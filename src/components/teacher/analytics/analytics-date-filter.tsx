"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
    const isMobile = useIsMobile();

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm font-medium whitespace-nowrap">Filter by Date:</span>
                        <Popover
                            open={popoverOpen}
                            onOpenChange={(open) => {
                                // Prevent closing if only start date is selected
                                if (!open && dateRange.from && !dateRange.to) {
                                    return; // Don't close
                                }
                                setPopoverOpen(open);
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[280px] md:w-[300px] justify-start text-left font-normal",
                                        !appliedDateRange.from && !dateRange.from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">
                                        {appliedDateRange.from ? (
                                            appliedDateRange.to ? (
                                                <>
                                                    {format(appliedDateRange.from, "LLL dd, y")} -{" "}
                                                    {format(appliedDateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(appliedDateRange.from, "LLL dd, y")
                                            )
                                        ) : dateRange.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} - Select end date
                                                </>
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-0"
                                align="center"
                                alignOffset={0}
                                sideOffset={8}
                                side="bottom"
                                collisionPadding={16}
                                onEscapeKeyDown={() => {
                                    // Allow closing with Escape
                                }}
                            >
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from || appliedDateRange.from}
                                    selected={{
                                        from: dateRange.from,
                                        to: dateRange.to,
                                    }}
                                    onSelect={(range) => {
                                        if (range) {
                                            // Check if this is a valid range selection
                                            const hasStart = !!range.from;
                                            const hasEnd = !!range.to;

                                            // Update the visual selection state (for calendar display)
                                            setDateRange({
                                                from: range.from ?? undefined,
                                                to: range.to ?? undefined,
                                            });

                                            // Only apply the date range filter when both start and end dates are selected
                                            // AND they are different dates
                                            const isSameDate = hasStart && hasEnd &&
                                                range.from!.getTime() === range.to!.getTime();

                                            if (hasStart && hasEnd && !isSameDate) {
                                                // Valid range with different start and end dates - apply the filter
                                                setAppliedDateRange({
                                                    from: range.from!,
                                                    to: range.to!,
                                                });
                                                setDateRangePreset("custom");
                                                // Close popover when valid range is selected
                                                setPopoverOpen(false);
                                            } else if (hasStart && !hasEnd) {
                                                // Only start date selected - don't update appliedDateRange
                                                // Keep the previous appliedDateRange, just update visual state
                                                // This prevents analytics reload when only start date is selected
                                                // Keep popover open so user can select end date
                                                setDateRangePreset("custom");
                                            } else if (isSameDate) {
                                                // Same date selected for both - treat as incomplete selection
                                                // Don't update appliedDateRange
                                                setDateRangePreset("custom");
                                            }
                                        } else {
                                            // Range cleared - reset everything
                                            setDateRange({ from: undefined, to: undefined });
                                            setAppliedDateRange({ from: undefined, to: undefined });
                                            setDateRangePreset("all");
                                        }
                                    }}
                                    numberOfMonths={isMobile ? 1 : 2}
                                    classNames={{
                                        day_selected:
                                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                                        range_start:
                                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md",
                                        range_end:
                                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-r-md",
                                        day_range_middle:
                                            "bg-primary/20 text-primary-foreground hover:bg-primary/30 aria-selected:bg-primary/20 aria-selected:text-primary-foreground rounded-none",
                                        day_button: "aria-selected:bg-primary/20 aria-selected:text-primary-foreground",
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
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
