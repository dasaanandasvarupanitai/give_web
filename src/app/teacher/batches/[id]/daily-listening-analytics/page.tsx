"use client";

import { AnalyticsDateFilter } from "@/components/teacher/analytics/analytics-date-filter";
import { AnalyticsSummaryCards } from "@/components/teacher/analytics/analytics-summary-cards";
import { AnalyticsTable } from "@/components/teacher/analytics/analytics-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { useDailyListeningAnalytics } from "@/hooks/use-daily-listening-analytics";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import { exportAnalyticsToExcel } from "@/lib/utils/export-analytics";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DailyListeningAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();

  // Date filter state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [dateRangePreset, setDateRangePreset] = useState<string>("all");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Use custom hook for data fetching
  const { batch, analytics, loading, error } = useDailyListeningAnalytics(
    batchId,
    isTeacher,
    appliedDateRange
  );

  useEffect(() => {
    // Redirect if not a teacher
    if (!teacherInitializing && !isTeacher) {
      router.push("/teacher");
      return;
    }
  }, [isTeacher, teacherInitializing, router]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleDatePresetChange = (preset: string) => {
    if (preset === "all") {
      setDateRange({ from: undefined, to: undefined });
      setAppliedDateRange({ from: undefined, to: undefined });
      setDateRangePreset("all");
    } else {
      setDateRangePreset("custom");
    }
  };

  const handleExportToExcel = async () => {
    try {
      await exportAnalyticsToExcel(analytics, batch, appliedDateRange);
      toast({
        title: "Success",
        description: "Analytics exported to Excel successfully",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description: "Failed to export to Excel",
        variant: "destructive",
      });
    }
  };

  if (teacherInitializing || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You must be a teacher to access this page.
          </p>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const totalDailyListeningTasks =
    analytics.length > 0 ? analytics[0].totalDailyListeningTasks : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/teacher/batches/${batchId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch Details
        </Button>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
                Daily Listening Analytics - {batch.name}
              </h1>
              <p className="text-muted-foreground">
                View submission statistics for daily listening tasks
              </p>
            </div>
            <Button
              onClick={handleExportToExcel}
              disabled={analytics.length === 0}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          <AnalyticsDateFilter
            dateRange={dateRange}
            setDateRange={setDateRange}
            appliedDateRange={appliedDateRange}
            setAppliedDateRange={setAppliedDateRange}
            dateRangePreset={dateRangePreset}
            setDateRangePreset={setDateRangePreset}
            popoverOpen={popoverOpen}
            setPopoverOpen={setPopoverOpen}
            onDatePresetChange={handleDatePresetChange}
          />
        </div>
      </div>

      {totalDailyListeningTasks === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No daily listening tasks found for this batch
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <AnalyticsSummaryCards
            analytics={analytics}
            totalDailyListeningTasks={totalDailyListeningTasks}
          />

          <AnalyticsTable analytics={analytics} />
        </>
      )}
    </div>
  );
}
