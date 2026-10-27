"use client";

import { AnalyticsDateFilter } from "@/components/teacher/analytics/analytics-date-filter";
import { AnalyticsSummaryCards } from "@/components/teacher/analytics/analytics-summary-cards";
import { AnalyticsTable } from "@/components/teacher/analytics/analytics-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { useDailyListeningAnalytics } from "@/hooks/use-daily-listening-analytics";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import { exportAnalyticsToExcel } from "@/lib/utils/export-analytics";
import { AlertTriangle, ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
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
  const [recountDialogOpen, setRecountDialogOpen] = useState(false);

  // Use custom hook for data fetching
  const { batch, analytics, autoCorrections, recounting, loading, error, recountAll } =
    useDailyListeningAnalytics(batchId, isTeacher, appliedDateRange);

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

  const handleRecountConfirm = async () => {
    setRecountDialogOpen(false);
    try {
      await recountAll();
      toast({
        title: "Recount complete",
        description: "All totals were re-checked from the original submissions.",
      });
    } catch {
      // error state is surfaced through the existing error toast effect
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
          <Button onClick={() => router.push("/teacher")}>Back to Dashboard</Button>
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setRecountDialogOpen(true)}
                disabled={recounting}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${recounting ? "animate-spin" : ""}`} />
                {recounting ? "Recounting..." : "Recount"}
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={analytics.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>

          {autoCorrections > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {autoCorrections} student total{autoCorrections !== 1 ? "s" : ""}{" "}
                automatically re-checked and corrected just now. Numbers shown are
                verified against the original submissions.
              </span>
            </div>
          )}

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

      <AlertDialog open={recountDialogOpen} onOpenChange={setRecountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recount all totals?</AlertDialogTitle>
            <AlertDialogDescription>
              This re-checks every submission from the very beginning. It will
              cost heavy reads on your Firebase, so only do this if a number
              ever looks wrong. Normal reports do not need it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecountConfirm}>
              Yes, recount everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
