"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import {
  createSubmission,
  deleteSubmission,
  getTaskById,
  subscribeSubmissionByTaskAndStudent
} from "@/lib/services/firestore";
import { uploadFile, uploadFiles } from "@/lib/services/storage";
import {
  getGracePeriodRemainingMinutes,
  getSubmissionDeadline,
  getSubmissionWindowRemainingMinutes,
  isSubmissionWindowOpen,
  isWithinGracePeriod
} from "@/lib/utils";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Mic,
  Square,
  Star,
  Upload,
  X
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TaskSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionJustCompleted, setSubmissionJustCompleted] = useState(false); // Track if submission was just completed to disable button immediately
  const [notes, setNotes] = useState("");
  const [textSubmission, setTextSubmission] = useState(""); // For daily listening text submission
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<number, number>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<number>(0);
  const [submissionWindowRemaining, setSubmissionWindowRemaining] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Track which submission type is active (null = none, 'text' | 'audio' | 'file')
  const [activeSubmissionType, setActiveSubmissionType] = useState<'text' | 'audio' | 'file' | null>(null);

  // Determine active submission type based on current inputs
  // Only applies to daily listening tasks (text, audio, file)
  // Other tasks only have file uploads, so no restrictions needed
  useEffect(() => {
    if (task?.type === "dailyListening") {
      if (textSubmission.trim()) {
        setActiveSubmissionType('text');
      } else if (audioBlob) {
        setActiveSubmissionType('audio');
      } else if (selectedFiles.length > 0) {
        setActiveSubmissionType('file');
      } else {
        setActiveSubmissionType(null);
      }
    } else {
      // For other tasks, no restrictions - they can only upload files
      setActiveSubmissionType(null);
    }
  }, [textSubmission, audioBlob, selectedFiles.length, task?.type]);

  useEffect(() => {
    if (!taskId || !user?.uid) return;

    const loadTask = async () => {
      try {
        const taskData = await getTaskById(taskId);
        if (!taskData) {
          toast({
            title: "Error",
            description: "Task not found",
            variant: "destructive",
          });
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

    // Subscribe to real-time submission updates
    const unsubscribe = subscribeSubmissionByTaskAndStudent(
      taskId,
      user.uid,
      (submissionData) => {
        if (submissionData) {
          setSubmission(submissionData);
          // Reset the flag when real-time update confirms submission exists
          setSubmissionJustCompleted(false);
          // Note: We'll handle the task type check in a separate useEffect that depends on task
          // For now, populate both fields and let the task-dependent useEffect handle it
          setTextSubmission(submissionData.notes || "");
          setNotes(submissionData.notes || "");
        } else {
          setSubmission(null);
          setNotes("");
          setTextSubmission("");
          // Re-enable submit button if submission is deleted (within grace period)
          setSubmissionJustCompleted(false);
        }
      }
    );

    return () => unsubscribe();
  }, [taskId, user?.uid, router, toast]);

  // Update grace period countdown (15 minutes for editing submissions)
  useEffect(() => {
    if (!submission || !isWithinGracePeriod(submission)) {
      setGracePeriodRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = getGracePeriodRemainingMinutes(submission);
      setGracePeriodRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [submission]);

  // Update submission window grace period countdown (2 hours after due date)
  useEffect(() => {
    if (!task?.dueDate || task.type === "announcement") {
      setSubmissionWindowRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = getSubmissionWindowRemainingMinutes(task.dueDate);
      setSubmissionWindowRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [task?.dueDate, task?.type]);

  // Cleanup media recorder and object URLs on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync submission data with task type (for daily listening vs other tasks)
  useEffect(() => {
    if (!submission || !task) return;

    // For daily listening tasks, use textSubmission; for others, use notes
    if (task.type === "dailyListening") {
      setTextSubmission(submission.notes || "");
      setNotes("");
    } else {
      setNotes(submission.notes || "");
      setTextSubmission("");
    }
  }, [submission, task]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      // Validate file sizes (max 100MB per file)
      const maxSize = 100 * 1024 * 1024; // 100MB
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach((file) => {
        if (file.size > maxSize) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast({
          title: "File Size Error",
          description: `The following files exceed 100MB limit: ${invalidFiles.join(", ")}`,
          variant: "destructive",
        });
      }

      if (validFiles.length > 0) {
        // For daily listening tasks: Clear text and audio when files are selected
        if (task?.type === "dailyListening" && (textSubmission.trim() || audioBlob)) {
          toast({
            title: "Submission Type Changed",
            description: "File upload selected. Text submission and audio recording have been cleared.",
            variant: "default",
          });
          setTextSubmission("");
          resetRecordingState();
        }
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetRecordingState = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartTimeRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
  };

  const startRecording = async () => {
    try {
      setRecordingError(null);

      // For daily listening tasks: Clear text and files when starting audio recording
      if (task?.type === "dailyListening" && (textSubmission.trim() || selectedFiles.length > 0)) {
        toast({
          title: "Submission Type Changed",
          description: "Audio recording selected. Text submission and file uploads have been cleared.",
          variant: "default",
        });
        setTextSubmission("");
        setSelectedFiles([]);
        setUploadProgress(new Map());
      }

      // Stop any existing recording state
      resetRecordingState();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType =
        typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const diff = Date.now() - recordingStartTimeRef.current;
          setRecordingDuration(Math.floor(diff / 1000));
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      setRecordingError(
        error instanceof Error
          ? error.message
          : "Failed to start audio recording. Please check microphone permissions."
      );
      resetRecordingState();
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping audio recording:", error);
    } finally {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleSubmit = async () => {
    if (!task || !user?.uid) return;

    // Prevent submission if due date has passed (for new submissions) and late submission is not allowed
    if (dueDatePassed && !submission && !lateSubmissionAllowed) {
      toast({
        title: "Due Date Passed",
        description: "The due date for this task has passed. You can no longer submit.",
        variant: "destructive",
      });
      return;
    }

    // Prevent submission if grace period has passed
    if (gracePeriodPassed) {
      toast({
        title: "Grace Period Expired",
        description: "The grace period for editing your submission has expired. You can no longer submit.",
        variant: "destructive",
      });
      return;
    }

    // Validation: Different rules for daily listening vs other tasks
    if (task.type !== "announcement") {
      if (task.type === "dailyListening") {
        // For daily listening: require at least text submission, file, or audio recording
        if (selectedFiles.length === 0 && !textSubmission.trim() && !audioBlob) {
          toast({
            title: "Validation Error",
            description: "Please add a text submission, upload a file, or record audio",
            variant: "destructive",
          });
          return;
        }
      } else {
        // For other tasks: require at least file or notes
        if (selectedFiles.length === 0 && !notes.trim()) {
          toast({
            title: "Validation Error",
            description: "Please add at least one submission (file or notes)",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(new Map());

    try {
      let fileUrls: string[] = [];
      let recordingUrl: string | undefined = undefined;

      // Upload files if any (for all task types except announcements)
      if (selectedFiles.length > 0 && task.type !== "announcement") {
        const basePath = `submissions/${task.id}/${user.uid}`;

        try {
          fileUrls = await uploadFiles(
            selectedFiles,
            basePath,
            (fileIndex, progress) => {
              setUploadProgress((prev) => {
                const newMap = new Map(prev);
                newMap.set(fileIndex, progress);
                return newMap;
              });
            }
          );
        } catch (uploadError) {
          toast({
            title: "Upload Error",
            description: uploadError instanceof Error ? uploadError.message : "Failed to upload files. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
      }

      // Upload audio recording for daily listening tasks if present
      if (task.type === "dailyListening" && audioBlob) {
        try {
          const fileName = `recording_${Date.now()}.webm`;
          const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });
          const basePath = `submissions/${task.id}/${user.uid}`;
          const audioPath = `${basePath}/${fileName}`;
          recordingUrl = await uploadFile(audioFile, audioPath);
        } catch (uploadError) {
          toast({
            title: "Upload Error",
            description:
              uploadError instanceof Error
                ? uploadError.message
                : "Failed to upload audio recording. Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
      }

      setIsUploading(false);

      // Create submission
      // For daily listening: use textSubmission; for others: use notes
      const submissionNotes = task.type === "dailyListening"
        ? textSubmission.trim() || undefined
        : notes.trim() || undefined;

      const submissionData: Omit<Submission, "id"> = {
        taskId: task.id,
        studentId: user.uid,
        batchId: task.batchId,
        status: "submitted",
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
        fileUrls: fileUrls,
        recordingUrl: recordingUrl,
        notes: submissionNotes,
      };

      await createSubmission(submissionData);

      // Immediately disable submit button to prevent multiple clicks
      setSubmissionJustCompleted(true);

      toast({
        title: "Success",
        description: "Task submitted successfully!",
      });

      // Clear form
      setSelectedFiles([]);
      setNotes("");
      setTextSubmission("");
      setUploadProgress(new Map());
      resetRecordingState();

      // Don't navigate back immediately - let user see the success state
      // The real-time subscription will update the UI to show "Already Submitted"
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!submission || !user?.uid) return;

    if (!confirm("Are you sure you want to delete this submission? You can resubmit within the grace period.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const urlsToDelete = [
        ...(submission.fileUrls || []),
        submission.recordingUrl || "",
      ].filter((url) => url && url.trim().length > 0);
      await deleteSubmission(submission.id, urlsToDelete);
      // Re-enable submit button after deletion (within grace period)
      setSubmissionJustCompleted(false);
      toast({
        title: "Success",
        description: "Submission deleted. You can now resubmit.",
      });
      // Clear form
      setSelectedFiles([]);
      setNotes("");
      setTextSubmission("");
      setUploadProgress(new Map());
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

  const TaskIcon = getTaskTypeIcon(task.type);
  const taskColor = getTaskTypeColor(task.type);

  // Calculate local deadline for comparisons (11:59:59 PM on due date in user's local timezone)
  const localDueDateDeadline = task.dueDate ? (() => {
    const dueDate = new Date(task.dueDate);
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth();
    const day = dueDate.getDate();
    return new Date(year, month, day, 23, 59, 59, 999);
  })() : null;

  const now = new Date();
  const isOverdue = localDueDateDeadline && now > localDueDateDeadline;
  const isDueSoon =
    localDueDateDeadline &&
    !isOverdue &&
    Math.ceil((localDueDateDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 3;
  const alreadySubmitted = submission?.status === "submitted" || submission?.status === "graded";
  const withinGracePeriod = isWithinGracePeriod(submission);
  const canEdit = withinGracePeriod && submission?.status === "submitted";

  // Check if submission window is still open (grace period disabled - closes exactly at due date)
  // Uses per-user timezone: deadline is 11:59:59 PM on due date in user's local timezone
  const submissionWindowOpen = task.dueDate && task.type !== "announcement"
    ? isSubmissionWindowOpen(task.dueDate)
    : true;

  // Check if due date has passed (for display purposes, not for blocking submissions)
  // Uses per-user timezone: compares against 11:59:59 PM on due date in user's local timezone
  const dueDatePassed = localDueDateDeadline && task.type !== "announcement" && now > localDueDateDeadline;

  // Check if submission window has closed (due date + grace period passed)
  const submissionWindowClosed = task.dueDate && task.type !== "announcement" && !submissionWindowOpen;

  // Check if grace period has passed (for submissions)
  const gracePeriodPassed = submission?.submittedAt && !withinGracePeriod && submission.status === "submitted";

  // Helper function to check if late submission is currently allowed
  // Uses per-user timezone: deadline is 11:59:59 PM on due date in user's local timezone
  const isLateSubmissionAllowed = (): boolean => {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") {
      return false;
    }
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    // Calculate deadline in user's local timezone: 11:59:59 PM on (dueDate + lateSubmissionDays)
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth();
    const day = dueDate.getDate();
    const lateSubmissionDeadline = new Date(year, month, day + task.lateSubmissionDays, 23, 59, 59, 999);
    // Calculate due date deadline in user's local timezone: 11:59:59 PM on due date
    const dueDateDeadline = new Date(year, month, day, 23, 59, 59, 999);
    return now > dueDateDeadline && now <= lateSubmissionDeadline;
  };

  // Helper function to get remaining late submission days
  // Uses per-user timezone: deadlines calculated in user's local timezone
  const getRemainingLateSubmissionDays = (): number | null => {
    if (!task.allowLateSubmission || !task.dueDate || task.type === "announcement") {
      return null;
    }
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    // Calculate deadlines in user's local timezone
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth();
    const day = dueDate.getDate();
    const dueDateDeadline = new Date(year, month, day, 23, 59, 59, 999);
    const lateSubmissionDeadline = new Date(year, month, day + task.lateSubmissionDays, 23, 59, 59, 999);

    if (now > dueDateDeadline && now <= lateSubmissionDeadline) {
      const remainingMs = lateSubmissionDeadline.getTime() - now.getTime();
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
      return Math.max(0, remainingDays);
    }
    return null;
  };

  const lateSubmissionAllowed = isLateSubmissionAllowed();
  const remainingLateDays = getRemainingLateSubmissionDays();

  // Block access only if submission window is closed AND no submission exists AND late submission is not allowed
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
              The submission window for this task has closed. You can no longer submit to this task.
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
              {task.allowLateSubmission && task.lateSubmissionDays > 0 && (
                <span className="block mt-2 text-sm text-orange-600">
                  Late submission was allowed for {task.lateSubmissionDays} day{task.lateSubmissionDays !== 1 ? 's' : ''} after the due date, but that period has also expired.
                </span>
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

      {/* Task Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
              >
                <TaskIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl break-words">{task.title}</CardTitle>
                <CardDescription className="mt-1">
                  {getTaskTypeLabel(task.type)}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                task.status === "published"
                  ? "bg-orange-50 text-orange-700 border-orange-200"
                  : task.status === "closed"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
              }
            >
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-4">
            <p className="whitespace-pre-wrap">
              <LinkifiedText text={task.description} />
            </p>
          </div>

          {task.type !== "announcement" && (
            <div className="flex flex-wrap gap-2">
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={
                    isOverdue
                      ? "bg-red-50 text-red-700 border-red-200"
                      : isDueSoon
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                  }
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                  {isOverdue && " (Overdue)"}
                  {isDueSoon && !isOverdue && " (Due Soon)"}
                </Badge>
              )}
              {lateSubmissionAllowed && remainingLateDays !== null && (
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Late Submission: {remainingLateDays} day{remainingLateDays !== 1 ? 's' : ''} remaining
                </Badge>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Star className="h-3 w-3 mr-1" />
                {task.maxPoints} points
              </Badge>
            </div>
          )}

          {task.instructions && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <p className="text-sm whitespace-pre-wrap">
                <LinkifiedText text={task.instructions} />
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      {alreadySubmitted && !canEdit ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-orange-600 mb-4">
              <CheckCircle2 className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Already Submitted</h3>
            <p className="text-muted-foreground mb-4">
              You have already submitted this task.
              {submission?.status === "graded" && submission.grade !== undefined && (
                <span className="block mt-2">
                  Grade: <strong>{submission.grade}/{task.maxPoints}</strong>
                </span>
              )}
              {!withinGracePeriod && submission?.status === "submitted" && (
                <span className="block mt-2 text-sm text-orange-600">
                  The 15-minute grace period for editing has expired.
                </span>
              )}
            </p>
            {submission?.fileUrls && submission.fileUrls.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {submission.fileUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      <span>File {index + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {submission?.notes && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">
                  {task.type === "dailyListening" ? "Text Submission:" : "Notes:"}
                </h4>
                <p className="text-sm whitespace-pre-wrap">{submission.notes}</p>
              </div>
            )}
            {submission?.recordingUrl && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Audio Recording:</h4>
                <audio controls src={submission.recordingUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            {submission?.feedback && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <h4 className="font-semibold mb-2">Feedback:</h4>
                <p className="text-sm">{submission.feedback}</p>
              </div>
            )}
            {withinGracePeriod && submission?.status === "submitted" && (
              <div className="mt-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteSubmission}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete and Resubmit"
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  You have {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining to delete and resubmit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : task.type === "announcement" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Announcements are read-only. No submission required.
            </p>
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
                      You can edit or delete your submission. {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSubmission}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
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
          {/* Text & Audio Submission Section - Only for Daily Listening Tasks */}
          {task.type === "dailyListening" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Text Submission</CardTitle>
                  <CardDescription>
                    Write your response or submission text here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={textSubmission}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Clear audio and files when text is entered (only for daily listening)
                      if (task?.type === "dailyListening" && newValue.trim() && (audioBlob || selectedFiles.length > 0)) {
                        toast({
                          title: "Submission Type Changed",
                          description: "Text submission selected. Audio recording and file uploads have been cleared.",
                          variant: "default",
                        });
                        resetRecordingState();
                        setSelectedFiles([]);
                        setUploadProgress(new Map());
                      }
                      setTextSubmission(newValue);
                    }}
                    placeholder="Enter your submission text here..."
                    rows={8}
                    disabled={
                      (alreadySubmitted && !canEdit) ||
                      isSubmitting ||
                      activeSubmissionType === 'audio' ||
                      activeSubmissionType === 'file'
                    }
                    className="font-mono text-sm border-2 border-gray-300 focus:border-primary"
                  />
                  {task?.type === "dailyListening" && activeSubmissionType === 'audio' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Text submission is disabled because audio recording is active. Remove the audio recording to enable text input.
                    </p>
                  )}
                  {task?.type === "dailyListening" && activeSubmissionType === 'file' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Text submission is disabled because files are uploaded. Remove the files to enable text input.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audio Recording (Optional)</CardTitle>
                  <CardDescription>
                    Record your daily listening reflection using your microphone. Works best in Chrome or modern browsers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recordingError && (
                    <p className="text-sm text-red-600">{recordingError}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      className="border border-orange-500"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={
                        (alreadySubmitted && !canEdit) ||
                        isSubmitting ||
                        isUploading ||
                        (task?.type === "dailyListening" && activeSubmissionType === 'text') ||
                        (task?.type === "dailyListening" && activeSubmissionType === 'file')
                      }
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      {isRecording
                        ? `Recording... ${recordingDuration}s`
                        : audioBlob
                          ? "Recorded audio ready to submit."
                          : (task?.type === "dailyListening" && (activeSubmissionType === 'text' || activeSubmissionType === 'file'))
                            ? "Audio recording is disabled because another submission type is active."
                            : "No recording yet."}
                    </div>
                  </div>

                  {audioUrl && (
                    <div className="space-y-2">
                      <audio controls src={audioUrl} className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="border border-orange-500"
                        onClick={resetRecordingState}
                        disabled={isRecording || isSubmitting || isUploading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Recording
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Upload files: PDF, documents, pictures, videos, or audio (Max 100MB per file)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.avi,.mkv,.webm,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                onChange={handleFileSelect}
                className="hidden"
                disabled={
                  (alreadySubmitted && !canEdit) ||
                  isSubmitting ||
                  (task?.type === "dailyListening" && activeSubmissionType === 'text') ||
                  (task?.type === "dailyListening" && activeSubmissionType === 'audio')
                }
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-orange-500"
                disabled={
                  (alreadySubmitted && !canEdit) ||
                  isSubmitting ||
                  isUploading ||
                  (task?.type === "dailyListening" && activeSubmissionType === 'text') ||
                  (task?.type === "dailyListening" && activeSubmissionType === 'audio')
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              {task?.type === "dailyListening" && activeSubmissionType === 'text' && (
                <p className="text-sm text-muted-foreground mt-2">
                  File upload is disabled because text submission is active. Clear the text to enable file upload.
                </p>
              )}
              {task?.type === "dailyListening" && activeSubmissionType === 'audio' && (
                <p className="text-sm text-muted-foreground mt-2">
                  File upload is disabled because audio recording is active. Remove the audio recording to enable file upload.
                </p>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => {
                    const progress = uploadProgress.get(index);
                    const isUploadingFile = isUploading && progress !== undefined && progress < 100;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            {isUploadingFile && progress !== undefined && (
                              <div className="mt-2">
                                <div className="w-full bg-secondary rounded-full h-1.5">
                                  <div
                                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground mt-1 block">
                                  Uploading... {Math.round(progress)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            removeFile(index);
                            setUploadProgress((prev) => {
                              const newMap = new Map(prev);
                              newMap.delete(index);
                              return newMap;
                            });
                          }}
                          disabled={isUploadingFile}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section - Only for non-daily listening tasks */}
          {task.type !== "dailyListening" && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes (Optional)</CardTitle>
                <CardDescription>
                  Add any additional notes or comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  rows={6}
                  disabled={(alreadySubmitted && !canEdit) || isSubmitting}
                />
              </CardContent>
            </Card>
          )}

          {/* Grace Period Warning */}
          {dueDatePassed && submissionWindowOpen && !submission && !lateSubmissionAllowed && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-0.5">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Grace Period</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      The submission window has closed.
                    </p>
                    {submissionWindowRemaining !== null && submissionWindowRemaining > 0 && (
                      <p className="text-sm font-semibold text-yellow-900 mt-2">
                        Time remaining: {(() => {
                          const hours = Math.floor(submissionWindowRemaining / 60);
                          const minutes = submissionWindowRemaining % 60;
                          if (hours > 0) {
                            return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                          }
                          return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Late Submission Warning */}
          {lateSubmissionAllowed && dueDatePassed && !submission && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-orange-600 mt-0.5">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">Late Submission</p>
                    <p className="text-sm text-orange-700 mt-1">
                      You are submitting after the due date. {remainingLateDays !== null && remainingLateDays > 0 && (
                        <>You have {remainingLateDays} day{remainingLateDays !== 1 ? 's' : ''} remaining to submit.</>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="border border-orange-500"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                alreadySubmitted || // Disable if already submitted (regardless of grace period - must delete first to resubmit)
                isUploading ||
                gracePeriodPassed ||
                submissionJustCompleted
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading Files...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (alreadySubmitted && !canEdit) ? (
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
