"use client";

import { AudioRecorder } from "@/components/student/task/audio-recorder";
import { FileUploader } from "@/components/student/task/file-uploader";
import { SubmissionView } from "@/components/student/task/submission-view";
import { TaskHeader } from "@/components/student/task/task-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTaskSubmissionForm } from "@/hooks/use-task-submission-form";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
  getTaskById,
  subscribeSubmissionByTaskAndStudent,
} from "@/lib/services/firestore";
import {
  getGracePeriodRemainingMinutes,
  getSubmissionDeadline,
  getSubmissionWindowRemainingMinutes,
  isSubmissionWindowOpen,
  isWithinGracePeriod,
} from "@/lib/utils";
import { ArrowLeft, Calendar, Loader2, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TaskSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number>(0);
  const [submissionWindowRemaining, setSubmissionWindowRemaining] = useState<number | null>(null);

  const form = useTaskSubmissionForm({
    task,
    userId: user?.uid,
    submission,
    toast,
  });

  // Load task and subscribe to submissions
  useEffect(() => {
    if (!taskId || !user?.uid) return;

    const loadTask = async () => {
      try {
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          toast({ title: "Error", description: "Task not found", variant: "destructive" });
          router.back();
          return;
        }
        setTask(taskData);
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load task",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    loadTask();

    const unsubscribe = subscribeSubmissionByTaskAndStudent(taskId, user.uid, (submissionData) => {
      if (submissionData) {
        setSubmission(submissionData);
        form.setSubmissionJustCompleted(false);
        form.setTextSubmission(submissionData.notes || "");
        form.setNotes(submissionData.notes || "");
      } else {
        setSubmission(null);
        form.setNotes("");
        form.setTextSubmission("");
        form.setSubmissionJustCompleted(false);
      }
    });

    return () => unsubscribe();
  }, [taskId, user?.uid, router, toast]);

  // Determine active submission type for daily listening
  useEffect(() => {
    if (task?.type === "dailyListening") {
      if (form.textSubmission.trim()) {
        form.setActiveSubmissionType("text");
      } else if (form.audioBlob) {
        form.setActiveSubmissionType("audio");
      } else if (form.selectedFiles.length > 0) {
        form.setActiveSubmissionType("file");
      } else {
        form.setActiveSubmissionType(null);
      }
    } else {
      form.setActiveSubmissionType(null);
    }
  }, [form.textSubmission, form.audioBlob, form.selectedFiles.length, task?.type]);

  // Update grace period countdown
  useEffect(() => {
    if (!submission || !isWithinGracePeriod(submission)) {
      setGracePeriodRemaining(0);
      return;
    }
    const updateCountdown = () => setGracePeriodRemaining(getGracePeriodRemainingMinutes(submission));
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [submission]);

  // Update submission window countdown
  useEffect(() => {
    if (!task?.dueDate || task.type === "announcement") {
      setSubmissionWindowRemaining(null);
      return;
    }
    const updateCountdown = () => setSubmissionWindowRemaining(getSubmissionWindowRemainingMinutes(task.dueDate));
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [task?.dueDate, task?.type]);

  // Sync form with task type
  useEffect(() => {
    if (!submission || !task) return;
    if (task.type === "dailyListening") {
      form.setTextSubmission(submission.notes || "");
      form.setNotes("");
    } else {
      form.setNotes(submission.notes || "");
      form.setTextSubmission("");
    }
  }, [submission, task]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate status values
  const localDueDateDeadline = task.dueDate
    ? (() => {
      const dueDate = new Date(task.dueDate);
      return new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    })()
    : null;

  const now = new Date();
  const isOverdue = localDueDateDeadline !== null && now > localDueDateDeadline;
  const isDueSoon =
    localDueDateDeadline !== null &&
    !isOverdue &&
    Math.ceil((localDueDateDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 3;
  const alreadySubmitted = submission?.status === "submitted" || submission?.status === "graded";
  const withinGracePeriod = isWithinGracePeriod(submission);
  const canEdit = withinGracePeriod && submission?.status === "submitted";
  const submissionWindowOpen = task.dueDate && task.type !== "announcement" ? isSubmissionWindowOpen(task.dueDate) : true;
  const dueDatePassed = localDueDateDeadline !== null && task.type !== "announcement" && now > localDueDateDeadline;
  const submissionWindowClosed = task.dueDate && task.type !== "announcement" && !submissionWindowOpen;
  const gracePeriodPassed = submission?.submittedAt && !withinGracePeriod && submission.status === "submitted";

  // Late submission helpers
  const isLateSubmissionAllowed = (): boolean => {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return false;
    const dueDate = new Date(task.dueDate);
    const lateSubmissionDeadline = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate() + task.lateSubmissionDays,
      23,
      59,
      59,
      999
    );
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    return now > dueDateDeadline && now <= lateSubmissionDeadline;
  };

  const getRemainingLateSubmissionDays = (): number | null => {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") return null;
    const dueDate = new Date(task.dueDate);
    const dueDateDeadline = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate() + task.lateSubmissionDays,
      23,
      59,
      59,
      999
    );
    if (now > dueDateDeadline && now <= lateSubmissionDeadline) {
      const remainingMs = lateSubmissionDeadline.getTime() - now.getTime();
      return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    }
    return null;
  };

  const lateSubmissionAllowed = isLateSubmissionAllowed();
  const remainingLateDays = getRemainingLateSubmissionDays();

  // Block closed submission window
  if (submissionWindowClosed && !submission && !lateSubmissionAllowed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-600 mb-4">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Submission Window Closed</h3>
            <p className="text-muted-foreground mb-4">
              The submission window for this task has closed.
              {task.dueDate && (
                <>
                  <span className="block mt-2 text-sm">
                    Due date was: <strong>{new Date(task.dueDate).toLocaleString()}</strong>
                  </span>
                  <span className="block mt-1 text-sm">
                    Submission window closed: <strong>{getSubmissionDeadline(task.dueDate)?.toLocaleString()}</strong>
                  </span>
                </>
              )}
            </p>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <TaskHeader
        task={task}
        isOverdue={isOverdue}
        isDueSoon={isDueSoon}
        lateSubmissionAllowed={lateSubmissionAllowed}
        remainingLateDays={remainingLateDays}
      />

      {/* Submission Form */}
      {alreadySubmitted && !canEdit ? (
        <SubmissionView
          task={task}
          submission={submission}
          withinGracePeriod={withinGracePeriod}
          gracePeriodRemaining={gracePeriodRemaining}
          onDelete={form.handleDeleteSubmission}
          isDeleting={form.isDeleting}
        />
      ) : task.type === "announcement" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Announcements are read-only. No submission required.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {canEdit && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">Grace Period Active</p>
                    <p className="text-sm text-orange-700">
                      You can edit or delete your submission. {gracePeriodRemaining} minute
                      {gracePeriodRemaining !== 1 ? "s" : ""} remaining.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={form.handleDeleteSubmission}
                    disabled={form.isDeleting}
                  >
                    {form.isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Submission"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily listening specific sections */}
          {task.type === "dailyListening" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Text Submission</CardTitle>
                  <CardDescription>Write your response or submission text here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.textSubmission}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (task?.type === "dailyListening" && newValue.trim() && (form.audioBlob || form.selectedFiles.length > 0)) {
                        toast({
                          title: "Submission Type Changed",
                          description: "Text submission selected. Audio and files cleared.",
                        });
                        form.setAudioBlob(null);
                        form.setIsRecording(false);
                        form.setSelectedFiles([]);
                        form.setUploadProgress(new Map());
                      }
                      form.setTextSubmission(newValue);
                    }}
                    placeholder="Enter your submission text here..."
                    rows={8}
                    disabled={
                      (alreadySubmitted && !canEdit) ||
                      form.isSubmitting ||
                      form.activeSubmissionType === "audio" ||
                      form.activeSubmissionType === "file"
                    }
                    className="font-mono text-sm border-2 border-gray-300 focus:border-primary"
                  />
                </CardContent>
              </Card>

              <AudioRecorder
                onRecordingComplete={(blob) => form.setAudioBlob(blob)}
                onRecordingRemoved={() => form.setAudioBlob(null)}
                isRecordingActive={form.isRecording}
                onRecordingStateChange={form.setIsRecording}
                disabled={
                  (alreadySubmitted && !canEdit) ||
                  form.isSubmitting ||
                  form.isUploading ||
                  (task?.type === "dailyListening" && form.activeSubmissionType === "text") ||
                  (task?.type === "dailyListening" && form.activeSubmissionType === "file")
                }
                activeSubmissionType={form.activeSubmissionType}
                taskType={task.type}
              />
            </>
          )}

          {/* File Upload */}
          <FileUploader
            selectedFiles={form.selectedFiles}
            onFilesSelected={(files) => {
              if (task?.type === "dailyListening" && (form.textSubmission.trim() || form.audioBlob)) {
                toast({
                  title: "Submission Type Changed",
                  description: "File upload selected. Text and audio cleared.",
                });
                form.setTextSubmission("");
                form.setAudioBlob(null);
                form.setIsRecording(false);
              }
              form.setSelectedFiles((prev) => [...prev, ...files]);
            }}
            onFileRemoved={(index) => {
              form.setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
            }}
            uploadProgress={form.uploadProgress}
            isUploading={form.isUploading}
            disabled={
              (alreadySubmitted && !canEdit) ||
              form.isSubmitting ||
              (task?.type === "dailyListening" && form.activeSubmissionType === "text") ||
              (task?.type === "dailyListening" && form.activeSubmissionType === "audio")
            }
            activeSubmissionType={form.activeSubmissionType}
            taskType={task.type}
          />

          {/* Notes for non-daily-listening tasks */}
          {task.type !== "dailyListening" && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes (Optional)</CardTitle>
                <CardDescription>Add any additional notes or comments</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.notes}
                  onChange={(e) => form.setNotes(e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  rows={6}
                  disabled={(alreadySubmitted && !canEdit) || form.isSubmitting}
                />
              </CardContent>
            </Card>
          )}

          {/* Late Submission Warning */}
          {lateSubmissionAllowed && dueDatePassed && !submission && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">Late Submission</p>
                    <p className="text-sm text-orange-700 mt-1">
                      You are submitting after the due date.
                      {remainingLateDays !== null && remainingLateDays > 0 && (
                        <> You have {remainingLateDays} day{remainingLateDays !== 1 ? "s" : ""} remaining to submit.</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="border border-orange-500" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={() => form.handleSubmit(dueDatePassed, lateSubmissionAllowed, gracePeriodPassed || false)}
              disabled={
                form.isSubmitting ||
                alreadySubmitted ||
                form.isUploading ||
                gracePeriodPassed ||
                form.submissionJustCompleted
              }
            >
              {form.isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading Files...
                </>
              ) : form.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : alreadySubmitted && !canEdit ? (
                "Already Submitted"
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
