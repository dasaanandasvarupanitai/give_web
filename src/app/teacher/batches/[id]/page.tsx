"use client";

import { TaskCreation } from "@/components/teacher/task-creation";
import { PendingEnrollmentCard } from "@/components/teacher/batch-details/pending-enrollment-card";
import { StudentCard } from "@/components/teacher/batch-details/student-card";
import { TaskCard } from "@/components/teacher/batch-details/task-card";
import { BatchExcelUploadDialog } from "@/components/teacher/batch-excel-upload-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import {
  getBatchById,
  subscribeEnrollmentsByBatch,
  subscribeSubmissionsByTask,
  subscribeTasksByBatch,
  updateEnrollment
} from "@/lib/services/firestore";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Copy,
  Loader2,
  Users,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);

  useEffect(() => {
    if (!batchId) return;

    loadBatch();
    const unsubscribeEnrollments = subscribeEnrollmentsByBatch(
      batchId,
      (enrollments) => {
        setEnrollments(enrollments);
      }
    );

    let submissionUnsubscribers: (() => void)[] = [];

    const unsubscribeTasks = subscribeTasksByBatch(batchId, (tasks) => {
      setTasks(tasks);

      // Clean up previous submission subscriptions
      submissionUnsubscribers.forEach((unsub) => unsub());
      submissionUnsubscribers = [];

      // Subscribe to submissions for each task to get real-time counts
      tasks.forEach((task) => {
        const unsubscribe = subscribeSubmissionsByTask(task.id, (submissions) => {
          setSubmissionCounts((prev) => {
            const newMap = new Map(prev);
            newMap.set(task.id, submissions.length);
            return newMap;
          });
        });
        submissionUnsubscribers.push(unsubscribe);
      });
    }, true); // Include future tasks for teachers

    return () => {
      unsubscribeEnrollments();
      unsubscribeTasks();
      submissionUnsubscribers.forEach((unsub) => unsub());
    };
  }, [batchId]);

  const loadBatch = async () => {
    try {
      const batchData = await getBatchById(batchId);
      setBatch(batchData);
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load batch",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollment: Enrollment) => {
    try {
      await updateEnrollment(enrollment.id, {
        status: "active",
      });
      toast({
        title: "Success",
        description: "Student approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve student",
        variant: "destructive",
      });
    }
  };

  const handleDeclineEnrollment = async (enrollment: Enrollment) => {
    try {
      await updateEnrollment(enrollment.id, {
        status: "declined",
      });
      toast({
        title: "Success",
        description: "Enrollment request declined",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline enrollment",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = async (enrollment: Enrollment) => {
    if (
      !confirm(
        "Are you sure you want to remove this student from the batch?"
      )
    ) {
      return;
    }

    try {
      await updateEnrollment(enrollment.id, {
        status: "dropped",
        droppedAt: new Date(),
      });
      toast({
        title: "Success",
        description: "Student removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove student",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = () => {
    if (!batch) return;
    navigator.clipboard.writeText(batch.classCode);
    setCopiedCode(true);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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

  const pendingEnrollments = enrollments.filter((e) => e.status === "pending");
  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/teacher")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">{batch.name}</h1>
            {batch.description && (
              <ExpandableDescription text={batch.description} maxLines={3} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <span className="text-sm font-medium">Class Code:</span>
              <code className="text-sm font-mono">{batch.classCode}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyCode}
              >
                {copiedCode ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            {batch && <TaskCreation batch={batch} />}
          </div>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="flex-wrap w-full sm:w-auto h-auto sm:h-10">
          <TabsTrigger value="students" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Students</span>
            </div>
            <span className="text-xs leading-tight">({activeEnrollments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Pending</span>
            </div>
            <span className="text-xs leading-tight">({pendingEnrollments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 sm:flex-initial min-w-0 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 sm:py-1.5 h-auto sm:h-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              <ClipboardList className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap text-xs sm:text-sm">Tasks</span>
            </div>
            <span className="text-xs leading-tight">({tasks.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Students</CardTitle>
              <CardDescription>
                Students currently enrolled in this batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active students yet
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEnrollments.map((enrollment) => (
                    <StudentCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      onRemove={() => handleRemoveStudent(enrollment)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Enrollment Requests</CardTitle>
              <CardDescription>
                Approve or decline student enrollment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingEnrollments.map((enrollment) => (
                    <PendingEnrollmentCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      onApprove={() => handleApproveEnrollment(enrollment)}
                      onDecline={() => handleDeclineEnrollment(enrollment)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>All tasks for this batch</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/daily-listening-analytics`)}
                    variant="outline"
                    className="w-full sm:w-auto border border-orange-500"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Daily Listening Analytics</span>
                    <span className="sm:hidden">Analytics</span>
                  </Button>
                  <Button
                    onClick={() => setIsExcelUploadOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto border border-orange-500"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Schedule from Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                  <Button
                    onClick={() => router.push(`/teacher/batches/${batchId}/submissions`)}
                    variant="outline"
                    className="w-full sm:w-auto border border-orange-500"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">View All Submissions</span>
                    <span className="sm:hidden">Submissions</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks created yet
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      submissionCount={submissionCounts.get(task.id) ?? task.submissionCount}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {batch && (
            <BatchExcelUploadDialog
              open={isExcelUploadOpen}
              onOpenChange={setIsExcelUploadOpen}
              batch={batch}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
