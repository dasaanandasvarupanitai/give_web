"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Submission } from "@/lib/models/submission";
import type { User } from "@/lib/models/user";
import {
  getBatchById,
  getEnrollmentsByBatch,
  getSubmissionsByBatch,
  getTasksByBatch,
  getUserById,
} from "@/lib/services/firestore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ExcelJS from "exceljs";
import { ArrowLeft, CalendarIcon, Download, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StudentAnalytics {
  student: User;
  enrollment: Enrollment;
  totalDailyListeningTasks: number;
  submittedCount: number;
  percentage: number;
  submissions: Submission[];
}

export default function DailyListeningAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();
  const isMobile = useIsMobile();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // Redirect if not a teacher
    if (!teacherInitializing && !isTeacher) {
      router.push("/teacher");
      return;
    }
  }, [isTeacher, teacherInitializing, router]);

  useEffect(() => {
    if (!batchId || !isTeacher) return;
    loadAnalytics();
  }, [batchId, isTeacher, appliedDateRange.from, appliedDateRange.to]);

  const handleDatePreset = (preset: string) => {
    if (preset === "all") {
      setDateRange({ from: undefined, to: undefined });
      setAppliedDateRange({ from: undefined, to: undefined });
      setDateRangePreset("all");
    } else {
      setDateRangePreset("custom");
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load batch, tasks, enrollments, and submissions
      const [batchData, tasks, enrollments, submissions] = await Promise.all([
        getBatchById(batchId),
        getTasksByBatch(batchId),
        getEnrollmentsByBatch(batchId),
        getSubmissionsByBatch(batchId),
      ]);

      setBatch(batchData);

      // Filter only daily listening tasks
      let dailyListeningTasks = tasks.filter(
        (task) => task.type === "dailyListening"
      );

      // Filter tasks by date range if specified (based on task creation date)
      if (appliedDateRange.from || appliedDateRange.to) {
        dailyListeningTasks = dailyListeningTasks.filter((task) => {
          const taskDate = new Date(task.createdAt);

          if (appliedDateRange.from) {
            const fromDate = new Date(appliedDateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            // Exclude tasks created before 12:00 AM of start date
            if (taskDate < fromDate) return false;
          }

          if (appliedDateRange.to) {
            const toDate = new Date(appliedDateRange.to);
            toDate.setHours(23, 59, 59, 999);
            // Include tasks created up to and including 11:59:59 PM of end date
            if (taskDate > toDate) return false;
          }

          return true;
        });
      }

      // Filter only active enrollments
      const activeEnrollments = enrollments.filter(
        (e) => e.status === "active"
      );

      // Load student data and calculate analytics
      const analyticsData = await Promise.all(
        activeEnrollments.map(async (enrollment): Promise<StudentAnalytics | null> => {
          try {
            const student = await getUserById(enrollment.studentId);
            if (!student) {
              return null;
            }

            // Get all submissions for this student for daily listening tasks
            // Count submissions based on status, not whether files still exist
            // A submission is valid if it was submitted or graded, regardless of file deletion
            let studentSubmissions = submissions.filter(
              (s) =>
                s.studentId === enrollment.studentId &&
                dailyListeningTasks.some((task) => task.id === s.taskId) &&
                (s.status === "submitted" || s.status === "graded")
            );

            // Filter by date range if specified
            if (appliedDateRange.from || appliedDateRange.to) {
              studentSubmissions = studentSubmissions.filter((s) => {
                // Use submittedAt if available, otherwise fallback to createdAt
                // submittedAt is set when status changes to "submitted" or "graded"
                const submissionDate = s.submittedAt || s.createdAt;
                if (!submissionDate) return false;

                const subDate = new Date(submissionDate);

                if (appliedDateRange.from) {
                  const fromDate = new Date(appliedDateRange.from);
                  fromDate.setHours(0, 0, 0, 0);
                  // Exclude submissions before the start date (before 12:00 AM of start date)
                  if (subDate < fromDate) return false;
                }

                if (appliedDateRange.to) {
                  const toDate = new Date(appliedDateRange.to);
                  toDate.setHours(23, 59, 59, 999);
                  // Include submissions up to and including 11:59:59 PM of end date
                  if (subDate > toDate) return false;
                }

                return true;
              });
            }

            // Count unique tasks submitted (a student might submit multiple times for same task)
            const uniqueTaskIds = new Set(
              studentSubmissions.map((s) => s.taskId)
            );
            const submittedCount = uniqueTaskIds.size;
            const totalDailyListeningTasks = dailyListeningTasks.length;
            const percentage =
              totalDailyListeningTasks > 0
                ? Math.round((submittedCount / totalDailyListeningTasks) * 100)
                : 0;

            return {
              student,
              enrollment,
              totalDailyListeningTasks,
              submittedCount,
              percentage,
              submissions: studentSubmissions,
            };
          } catch (error) {
            console.error(
              `Error loading student ${enrollment.studentId}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out null values and sort by percentage (descending)
      const validAnalytics = analyticsData
        .filter((a): a is StudentAnalytics => a !== null)
        .sort((a, b) => b.percentage - a.percentage);

      setAnalytics(validAnalytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load analytics. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      // Create a new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Daily Listening Analytics");

      // Define columns (headers will be in row 2 after we insert date range row)
      worksheet.columns = [
        { header: "Student Name", key: "studentName", width: 25 },
        { header: "Diksha Name", key: "dikshaName", width: 25 },
        { header: "WhatsApp Number", key: "whatsappNumber", width: 18 },
        { header: "Student Email", key: "studentEmail", width: 30 },
        { header: "Total Daily Listening Tasks", key: "totalTasks", width: 25 },
        { header: "Submitted Count", key: "submittedCount", width: 18 },
        { header: "Percentage (%)", key: "percentage", width: 15 },
        { header: "Status", key: "status", width: 20 },
      ];

      // Insert a row at the beginning for date range info
      worksheet.insertRow(1, []);

      // Add date range info row (row 1)
      let dateRangeText = "Date Range: All Time";
      if (appliedDateRange.from || appliedDateRange.to) {
        if (appliedDateRange.from && appliedDateRange.to) {
          dateRangeText = `Date Range: ${format(appliedDateRange.from, "MMM dd, yyyy")} to ${format(appliedDateRange.to, "MMM dd, yyyy")}`;
        } else if (appliedDateRange.from) {
          dateRangeText = `Date Range: From ${format(appliedDateRange.from, "MMM dd, yyyy")}`;
        } else if (appliedDateRange.to) {
          dateRangeText = `Date Range: Up to ${format(appliedDateRange.to, "MMM dd, yyyy")}`;
        }
      }

      worksheet.mergeCells(1, 1, 1, worksheet.columns.length);
      const dateRangeRow = worksheet.getRow(1);
      dateRangeRow.getCell(1).value = dateRangeText;
      dateRangeRow.getCell(1).font = { bold: true };
      dateRangeRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
      };
      dateRangeRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
      dateRangeRow.height = 20;

      // Style the header row (row 2) - column headers
      worksheet.getRow(2).font = { bold: true };
      worksheet.getRow(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data rows - uses filtered analytics based on date range
      analytics.forEach((item) => {
        worksheet.addRow({
          studentName: item.enrollment.studentName || item.student.name || "Unknown",
          dikshaName: item.enrollment.dikshaName || "",
          whatsappNumber: item.enrollment.whatsappNumber || "",
          studentEmail: item.student.email || "No email",
          totalTasks: item.totalDailyListeningTasks,
          submittedCount: item.submittedCount,
          percentage: item.percentage,
          status:
            item.percentage === 100
              ? "Complete"
              : item.percentage >= 80
                ? "Good"
                : item.percentage >= 50
                  ? "Average"
                  : "Needs Improvement",
        });
      });

      // Generate filename with batch name, date range, and export date
      const batchName = batch?.name || "Batch";
      const sanitizedBatchName = batchName.replace(/[^a-zA-Z0-9]/g, "_");
      const exportDate = new Date().toISOString().split("T")[0];

      let dateRangeSuffix = "";
      if (appliedDateRange.from || appliedDateRange.to) {
        if (appliedDateRange.from && appliedDateRange.to) {
          const fromStr = format(appliedDateRange.from, "yyyy-MM-dd");
          const toStr = format(appliedDateRange.to, "yyyy-MM-dd");
          dateRangeSuffix = `_${fromStr}_to_${toStr}`;
        } else if (appliedDateRange.from) {
          const fromStr = format(appliedDateRange.from, "yyyy-MM-dd");
          dateRangeSuffix = `_from_${fromStr}`;
        } else if (appliedDateRange.to) {
          const toStr = format(appliedDateRange.to, "yyyy-MM-dd");
          dateRangeSuffix = `_to_${toStr}`;
        }
      } else {
        dateRangeSuffix = "_All_Time";
      }

      const filename = `Daily_Listening_Analytics_${sanitizedBatchName}${dateRangeSuffix}_exported_${exportDate}.xlsx`;

      // Write file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Analytics exported to Excel successfully",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to export to Excel",
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
            <Button onClick={exportToExcel} disabled={analytics.length === 0} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          {/* Date Range Picker */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium whitespace-nowrap">Filter by Date:</span>
                  <Popover open={popoverOpen} onOpenChange={(open) => {
                    // Prevent closing if only start date is selected
                    if (!open && dateRange.from && !dateRange.to) {
                      return; // Don't close
                    }
                    setPopoverOpen(open);
                  }}>
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
                      onEscapeKeyDown={(e) => {
                        // Allow closing with Escape even if only start date is selected
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
                  onClick={() => handleDatePreset("all")}
                  className="w-full sm:w-auto"
                >
                  All Time
                </Button>
              </div>
            </CardContent>
          </Card>
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>
                Overview of daily listening submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Daily Listening Tasks
                  </p>
                  <p className="text-2xl font-bold">{totalDailyListeningTasks}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Active Students
                  </p>
                  <p className="text-2xl font-bold">{analytics.length}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Average Submission Rate
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.length > 0
                      ? Math.round(
                        analytics.reduce((sum, a) => sum + a.percentage, 0) /
                        analytics.length
                      )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Submission Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of each student's daily listening submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No active students found in this batch</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">
                          Total Tasks
                        </TableHead>
                        <TableHead className="text-center">
                          Submitted
                        </TableHead>
                        <TableHead className="text-center">
                          Percentage
                        </TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.map((item) => (
                        <TableRow key={item.student.id}>
                          <TableCell className="font-medium">
                            {item.enrollment.dikshaName ||
                              item.enrollment.studentName ||
                              item.student.name ||
                              "Unknown Student"}
                          </TableCell>
                          <TableCell>{item.student.email || "No email"}</TableCell>
                          <TableCell className="text-center">
                            {item.totalDailyListeningTasks}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.submittedCount}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                item.percentage === 100
                                  ? "default"
                                  : item.percentage >= 80
                                    ? "secondary"
                                    : item.percentage >= 50
                                      ? "outline"
                                      : "destructive"
                              }
                            >
                              {item.percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.percentage === 100 ? (
                              <Badge variant="default">Complete</Badge>
                            ) : item.percentage >= 80 ? (
                              <Badge variant="secondary">Good</Badge>
                            ) : item.percentage >= 50 ? (
                              <Badge variant="outline">Average</Badge>
                            ) : (
                              <Badge variant="destructive">
                                Needs Improvement
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
