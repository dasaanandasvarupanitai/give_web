"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { User } from "@/lib/models/user";
import {
  getBatchById,
  getEnrollmentsByBatch,
  getSubmissionsByBatch,
  getTasksByBatch,
  getUserById,
  updateSubmission,
} from "@/lib/services/firestore";
import { deleteFileByUrl } from "@/lib/services/storage";
import {
  getTaskTypeColor,
  getTaskTypeIcon,
  getTaskTypeLabel,
} from "@/lib/utils/task-helpers";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StudentFile {
  submissionId: string;
  fileUrl: string;
  fileName: string;
  studentId: string;
  taskId?: string; // Optional: only needed for combined daily listening tasks
  taskTitle?: string; // Optional: only needed for combined daily listening tasks
  submittedAt?: Date; // When the submission was submitted
  type: "file";
}

interface StudentTextSubmission {
  submissionId: string;
  text: string;
  studentId: string;
  taskId?: string; // Optional: only needed for combined daily listening tasks
  taskTitle?: string; // Optional: only needed for combined daily listening tasks
  submittedAt?: Date; // When the submission was submitted
  type: "text";
}

type StudentSubmissionItem = StudentFile | StudentTextSubmission;

interface StudentSubmission {
  studentId: string;
  files: StudentFile[];
  textSubmissions: StudentTextSubmission[];
}

interface TaskFiles {
  task: Task;
  studentSubmissions: StudentSubmission[];
}

/**
 * Calculate the display status for a task in the teacher dashboard
 * - "scheduled": Task has startDate in the future (not yet visible to students)
 * - "published": Task is currently visible to students (startDate has passed, but not closed)
 * - "closed": Task is past its deadline (dueDate + grace period/late submission window)
 */
function getTaskDisplayStatus(task: Task): "scheduled" | "published" | "closed" {
  const now = new Date();

  // Check if task is scheduled (startDate is in the future)
  if (task.startDate) {
    const startDate = new Date(task.startDate);
    if (now < startDate) {
      return "scheduled";
    }
  }

  // For announcements, they're either scheduled or published (never closed)
  if (task.type === "announcement") {
    return "published";
  }

  // Check if task is closed (past due date/late submission)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    let deadline: Date;

    if (task.allowLateSubmission && task.lateSubmissionDays > 0) {
      // Late submission allowed: deadline is dueDate + lateSubmissionDays (11:59:59 PM on last day)
      deadline = new Date(dueDate);
      deadline.setDate(deadline.getDate() + task.lateSubmissionDays);
      deadline.setHours(23, 59, 59, 999);
    } else {
      // No late submission: deadline is exactly the due date (grace period disabled)
      // To re-enable 2-hour grace period, uncomment the following lines:
      // const gracePeriodMs = 2 * 60 * 60 * 1000; // 2 hours
      // deadline = new Date(dueDate.getTime() + gracePeriodMs);
      deadline = dueDate;
    }

    if (now > deadline) {
      return "closed";
    }
  }

  // Task is published (startDate has passed or no startDate, and not closed)
  return "published";
}

export default function BatchSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [tasksWithFiles, setTasksWithFiles] = useState<TaskFiles[]>([]);
  const [studentsMap, setStudentsMap] = useState<Map<string, User>>(new Map());
  const [enrollmentsMap, setEnrollmentsMap] = useState<Map<string, Enrollment>>(new Map());
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: "pdf" | "video" | "audio" | "image" | "other" | "text";
    text?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{
    submissionId: string;
    fileUrl: string;
    fileName: string;
    studentId: string;
  } | null>(null);
  const [textToDelete, setTextToDelete] = useState<{
    submissionId: string;
    studentId: string;
  } | null>(null);
  const [taskToDeleteAll, setTaskToDeleteAll] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingText, setDeletingText] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteTextDialogOpen, setDeleteTextDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  useEffect(() => {
    // Redirect if not a teacher
    if (!teacherInitializing && !isTeacher) {
      router.push("/teacher");
      return;
    }
  }, [isTeacher, teacherInitializing, router]);

  useEffect(() => {
    if (!batchId || !isTeacher) return;
    loadData();
  }, [batchId, isTeacher]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load batch, all tasks, submissions, and enrollments in parallel
      const [batchData, tasks, submissions, enrollments] = await Promise.all([
        getBatchById(batchId),
        getTasksByBatch(batchId, true), // Include future tasks for teachers
        getSubmissionsByBatch(batchId),
        getEnrollmentsByBatch(batchId),
      ]);

      setBatch(batchData);

      console.log("Loaded tasks:", tasks.length);
      console.log("Loaded submissions:", submissions.length);
      console.log("Submissions data:", submissions);

      // Group files by task
      const taskFilesMap = new Map<string, TaskFiles>();

      // Initialize all tasks (even if no files), but exclude announcements
      tasks.forEach((task) => {
        // Skip announcement tasks as they don't have submissions
        if (task.type === "announcement") {
          return;
        }
        taskFilesMap.set(task.id, {
          task,
          studentSubmissions: [],
        });
      });

      // Group files and text submissions by task and student
      const uniqueStudentIds = new Set<string>();
      submissions.forEach((submission) => {
        const taskFiles = taskFilesMap.get(submission.taskId);
        if (taskFiles) {
          // Track student ID for loading student info
          if (submission.studentId) {
            uniqueStudentIds.add(submission.studentId);
          }

          // Find or create student submission entry
          let studentSubmission = taskFiles.studentSubmissions.find(
            (s) => s.studentId === submission.studentId
          );

          if (!studentSubmission) {
            studentSubmission = {
              studentId: submission.studentId,
              files: [],
              textSubmissions: [],
            };
            taskFiles.studentSubmissions.push(studentSubmission);
          }

          // Add files if any
          if (submission.fileUrls && Array.isArray(submission.fileUrls) && submission.fileUrls.length > 0) {
            // Get submission timestamp (prefer submittedAt, fallback to createdAt)
            const submissionTime = submission.submittedAt || submission.createdAt;
            submission.fileUrls.forEach((fileUrl, index) => {
              if (fileUrl && typeof fileUrl === 'string' && fileUrl.trim() !== '') {
                try {
                  const fileName = getFileNameFromUrl(fileUrl);
                  // For daily listening tasks, include task info for later display
                  const isDailyListening = taskFiles.task.type === "dailyListening";
                  studentSubmission.files.push({
                    submissionId: submission.id,
                    fileUrl,
                    fileName,
                    studentId: submission.studentId,
                    submittedAt: submissionTime,
                    type: "file",
                    ...(isDailyListening && {
                      taskId: submission.taskId,
                      taskTitle: taskFiles.task.title,
                    }),
                  });
                } catch (error) {
                  console.error(`Error processing file URL ${index + 1} in submission ${submission.id}:`, error, fileUrl);
                }
              } else {
                console.warn(`Invalid file URL at index ${index} in submission ${submission.id}:`, fileUrl);
              }
            });
          }

          // Add audio recording as a separate item for daily listening tasks
          if (taskFiles.task.type === "dailyListening" && submission.recordingUrl) {
            try {
              const fileName = getFileNameFromUrl(submission.recordingUrl);
              // Get submission timestamp (prefer submittedAt, fallback to createdAt)
              const submissionTime = submission.submittedAt || submission.createdAt;
              studentSubmission.files.push({
                submissionId: submission.id,
                fileUrl: submission.recordingUrl,
                fileName,
                studentId: submission.studentId,
                submittedAt: submissionTime,
                type: "file",
                taskId: submission.taskId,
                taskTitle: taskFiles.task.title,
              });
            } catch (error) {
              console.error(
                `Error processing recording URL in submission ${submission.id}:`,
                error,
                submission.recordingUrl
              );
            }
          }

          // Add text submission for daily listening tasks if notes exist
          if (taskFiles.task.type === "dailyListening" && submission.notes && submission.notes.trim()) {
            // Get submission timestamp (prefer submittedAt, fallback to createdAt)
            const submissionTime = submission.submittedAt || submission.createdAt;
            studentSubmission.textSubmissions.push({
              submissionId: submission.id,
              text: submission.notes,
              studentId: submission.studentId,
              submittedAt: submissionTime,
              type: "text",
              taskId: submission.taskId,
              taskTitle: taskFiles.task.title,
            });
          }
        }
      });

      // Remove students that no longer have any submissions (no files and no text)
      taskFilesMap.forEach((taskFiles) => {
        taskFiles.studentSubmissions = taskFiles.studentSubmissions.filter(
          (studentSub) =>
            studentSub.files.length > 0 || studentSub.textSubmissions.length > 0
        );
      });

      // Load student information for all unique student IDs
      const studentsMap = new Map<string, User>();
      const studentLoadPromises = Array.from(uniqueStudentIds).map(async (studentId) => {
        try {
          const student = await getUserById(studentId);
          if (student) {
            studentsMap.set(studentId, student);
          }
        } catch (error) {
          console.error(`Failed to load student ${studentId}:`, error);
        }
      });
      await Promise.all(studentLoadPromises);
      setStudentsMap(studentsMap);

      // Filter only active enrollments
      const activeEnrollments = enrollments.filter((e) => e.status === "active");

      // Map enrollments by studentId for display name priority (diksha -> certificate -> google)
      const enrollmentMap = new Map<string, Enrollment>();
      activeEnrollments.forEach((enrollment) => {
        if (enrollment.studentId && !enrollmentMap.has(enrollment.studentId)) {
          enrollmentMap.set(enrollment.studentId, enrollment);
        }
      });
      setEnrollmentsMap(enrollmentMap);

      // Sort student submissions by student name for each task
      taskFilesMap.forEach((taskFiles) => {
        taskFiles.studentSubmissions.sort((a, b) => {
          const studentA = studentsMap.get(a.studentId);
          const studentB = studentsMap.get(b.studentId);
          const enrollmentA = enrollmentMap.get(a.studentId);
          const enrollmentB = enrollmentMap.get(b.studentId);
          const nameA =
            enrollmentA?.dikshaName ||
            enrollmentA?.studentName ||
            studentA?.name ||
            "Unknown Student";
          const nameB =
            enrollmentB?.dikshaName ||
            enrollmentB?.studentName ||
            studentB?.name ||
            "Unknown Student";
          return nameA.localeCompare(nameB);
        });
      });

      console.log("Final task files map:", Array.from(taskFilesMap.entries()).map(([taskId, data]) => ({
        taskId,
        taskTitle: data.task.title,
        studentCount: data.studentSubmissions.length,
        totalFiles: data.studentSubmissions.reduce((sum, s) => sum + s.files.length, 0)
      })));

      // Sort all tasks by creation date (newest first)
      const finalTasksWithFiles = Array.from(taskFilesMap.values()).sort(
        (a, b) => b.task.createdAt.getTime() - a.task.createdAt.getTime()
      );

      setTasksWithFiles(finalTasksWithFiles);
      // Clear selection when data is reloaded
      setSelectedFiles(new Set());
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load submissions. Please check the console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      if (!url || typeof url !== 'string') {
        console.warn("Invalid URL provided to getFileNameFromUrl:", url);
        return "file";
      }

      const urlObj = new URL(url);
      // Handle both /o/ and /b/{bucket}/o/ patterns
      // Pattern matches: /o/path or /b/bucket-name/o/path
      const pathMatch = urlObj.pathname.match(/\/(?:o|b\/[^\/]+\/o)\/(.+?)(?:\?|$)/);

      if (pathMatch && pathMatch[1]) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const parts = decodedPath.split("/");
        const fileName = parts[parts.length - 1] || "file";
        return fileName;
      }

      // Fallback: try to extract from the full pathname
      const fallbackMatch = urlObj.pathname.match(/\/([^\/]+)$/);
      if (fallbackMatch) {
        return decodeURIComponent(fallbackMatch[1]);
      }

      console.warn("Could not extract filename from URL:", url);
      return "file";
    } catch (error) {
      console.error("Error parsing URL:", url, error);
      return "file";
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileType = (fileName: string): "pdf" | "video" | "audio" | "image" | "other" => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const videoExts = ["mp4", "webm", "mov", "m4v", "avi", "mkv"];
    const audioExts = ["mp3", "wav", "m4a", "aac", "ogg", "flac"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
    if (ext === "pdf") return "pdf";
    if (videoExts.includes(ext)) return "video";
    if (audioExts.includes(ext)) return "audio";
    if (imageExts.includes(ext)) return "image";
    return "other";
  };

  const handlePreview = (fileUrl: string, fileName: string) => {
    const type = getFileType(fileName);
    if (type === "other") {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPreviewFile({ url: fileUrl, name: fileName, type });
  };

  const handleDeleteClick = (
    submissionId: string,
    fileUrl: string,
    fileName: string,
    studentId: string
  ) => {
    setFileToDelete({ submissionId, fileUrl, fileName, studentId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteTextClick = (
    submissionId: string,
    studentId: string
  ) => {
    setTextToDelete({ submissionId, studentId });
    setDeleteTextDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      console.log("Deleting file:", fileToDelete.fileName, "from URL:", fileToDelete.fileUrl);

      // Delete file from storage (returns false if file doesn't exist)
      const fileExisted = await deleteFileByUrl(fileToDelete.fileUrl);

      if (fileExisted) {
        console.log("File deleted from storage successfully");
      } else {
        console.log("File was already deleted or doesn't exist in storage");
      }

      // Get current submissions to update the submission document
      const submissions = await getSubmissionsByBatch(batchId);
      const submission = submissions.find((s) => s.id === fileToDelete.submissionId);

      if (submission) {
        const updates: any = {};

        // Remove the file URL from submission.fileUrls if present
        if (submission.fileUrls && submission.fileUrls.length > 0) {
          const updatedFileUrls = submission.fileUrls.filter(
            (url) => url !== fileToDelete.fileUrl
          );
          if (updatedFileUrls.length !== submission.fileUrls.length) {
            updates.fileUrls = updatedFileUrls;
          }
          console.log(
            `Updating submission ${fileToDelete.submissionId}: removing file URL, ${submission.fileUrls.length} -> ${updatedFileUrls.length} files`
          );
        }

        // If this file is the recordingUrl, clear that field as well
        if (submission.recordingUrl === fileToDelete.fileUrl) {
          updates.recordingUrl = null as any; // Use null to trigger deleteField in updateSubmission
          console.log(
            `Updating submission ${fileToDelete.submissionId}: clearing recordingUrl`
          );
        }

        if (Object.keys(updates).length > 0) {
          await updateSubmission(fileToDelete.submissionId, updates);
          console.log("Submission updated successfully");
        } else {
          console.log(
            `No updates needed for submission ${fileToDelete.submissionId} after file deletion`
          );
        }
      } else {
        console.warn(`Submission ${fileToDelete.submissionId} not found after deletion`);
      }

      toast({
        title: "Success",
        description: fileExisted
          ? "File deleted successfully"
          : "File reference removed (file was already deleted from storage)",
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteTextConfirm = async () => {
    if (!textToDelete) return;

    setDeletingText(true);
    try {
      console.log("Deleting text submission:", textToDelete.submissionId);

      // Get current submissions to update the submission document
      const submissions = await getSubmissionsByBatch(batchId);
      const submission = submissions.find((s) => s.id === textToDelete.submissionId);

      if (submission) {
        // Remove the notes field from submission (set to undefined to delete it)
        console.log(`Updating submission ${textToDelete.submissionId}: removing text submission`);

        // Update submission to remove notes (use null to trigger deleteField)
        await updateSubmission(textToDelete.submissionId, {
          notes: null as any,
        });
        console.log("Text submission deleted successfully");
      } else {
        console.warn(`Submission ${textToDelete.submissionId} not found`);
      }

      toast({
        title: "Success",
        description: "Text submission deleted successfully",
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting text submission:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete text submission",
        variant: "destructive",
      });
    } finally {
      setDeletingText(false);
      setDeleteTextDialogOpen(false);
      setTextToDelete(null);
    }
  };

  const handleDeleteAllClick = (task: Task) => {
    setTaskToDeleteAll(task);
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    if (!taskToDeleteAll) return;

    setDeletingAll(true);
    try {
      console.log(`Deleting all files for task: ${taskToDeleteAll.title} (${taskToDeleteAll.id})`);

      // Get all submissions for this task
      const submissions = await getSubmissionsByBatch(batchId);
      const taskSubmissions = submissions.filter(
        (s) => s.taskId === taskToDeleteAll.id
      );
      console.log(`Found ${taskSubmissions.length} submissions for this task`);

      // Delete all files from storage and text submissions, then update submissions
      const deletePromises: Promise<void>[] = [];
      let totalFiles = 0;
      let filesDeleted = 0;
      let filesNotFound = 0;
      let textSubmissionsDeleted = 0;

      for (const submission of taskSubmissions) {
        const fileUrls = Array.isArray(submission.fileUrls)
          ? submission.fileUrls
          : [];

        console.log(
          `Processing submission ${submission.id} with ${fileUrls.length} files, ${submission.recordingUrl ? "recording" : "no recording"
          } and ${submission.notes ? "text" : "no text"}`
        );

        // Delete all files from storage
        for (const fileUrl of fileUrls) {
          totalFiles++;
          deletePromises.push(
            deleteFileByUrl(fileUrl)
              .then((existed) => {
                if (existed) {
                  filesDeleted++;
                } else {
                  filesNotFound++;
                }
              })
              .catch((error) => {
                // Only throw if it's not a "file not found" error
                if (error?.code !== 'storage/object-not-found' &&
                  !(error instanceof Error && error.message.includes('object-not-found'))) {
                  console.error(`Failed to delete file ${fileUrl}:`, error);
                  throw error;
                } else {
                  filesNotFound++;
                }
              })
          );
        }

        // Delete recording file if it exists
        if (submission.recordingUrl) {
          totalFiles++;
          deletePromises.push(
            deleteFileByUrl(submission.recordingUrl)
              .then((existed) => {
                if (existed) {
                  filesDeleted++;
                } else {
                  filesNotFound++;
                }
              })
              .catch((error) => {
                if (
                  error?.code !== "storage/object-not-found" &&
                  !(
                    error instanceof Error &&
                    error.message.includes("object-not-found")
                  )
                ) {
                  console.error(
                    `Failed to delete recording ${submission.recordingUrl}:`,
                    error
                  );
                  throw error;
                } else {
                  filesNotFound++;
                }
              })
          );
        }

        // Delete text submission if it exists
        if (submission.notes && submission.notes.trim()) {
          textSubmissionsDeleted++;
        }

        // Update submission to remove all file URLs, recording, and text
        const updates: any = {};
        if (fileUrls.length > 0) {
          updates.fileUrls = [];
        }
        if (submission.recordingUrl) {
          updates.recordingUrl = null; // Use null to trigger deleteField in updateSubmission
        }
        if (submission.notes && submission.notes.trim()) {
          updates.notes = null; // Use null to trigger deleteField in updateSubmission
        }

        if (Object.keys(updates).length > 0) {
          deletePromises.push(
            updateSubmission(submission.id, updates).catch((error) => {
              console.error(`Failed to update submission ${submission.id}:`, error);
              throw error;
            })
          );
        }
      }

      console.log(`Deleting ${totalFiles} files, ${textSubmissionsDeleted} text submissions, and updating ${taskSubmissions.length} submissions...`);
      await Promise.all(deletePromises);
      console.log(`All submissions processed: ${filesDeleted} files deleted, ${filesNotFound} files already missing, ${textSubmissionsDeleted} text submissions deleted`);

      const parts: string[] = [];
      if (totalFiles > 0) {
        if (filesNotFound > 0) {
          parts.push(`${filesDeleted} file(s) deleted, ${filesNotFound} file(s) were already missing`);
        } else {
          parts.push(`${filesDeleted} file(s) deleted`);
        }
      }
      if (textSubmissionsDeleted > 0) {
        parts.push(`${textSubmissionsDeleted} text submission(s) deleted`);
      }

      const description = parts.length > 0
        ? `All submissions for "${taskToDeleteAll.title}" deleted: ${parts.join(", ")}`
        : `All submissions for "${taskToDeleteAll.title}" deleted successfully`;

      toast({
        title: "Success",
        description,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting all files:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete all files",
        variant: "destructive",
      });
    } finally {
      setDeletingAll(false);
      setDeleteAllDialogOpen(false);
      setTaskToDeleteAll(null);
    }
  };

  // Multi-select delete handlers
  const handleFileSelect = (fileUrl: string, checked: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(fileUrl);
      } else {
        newSet.delete(fileUrl);
      }
      return newSet;
    });
  };

  const handleSelectAll = (taskFiles: TaskFiles, checked: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        // Add all file URLs from this task
        taskFiles.studentSubmissions.forEach((studentSub) => {
          studentSub.files.forEach((file) => {
            newSet.add(file.fileUrl);
          });
        });
      } else {
        // Remove all file URLs from this task
        taskFiles.studentSubmissions.forEach((studentSub) => {
          studentSub.files.forEach((file) => {
            newSet.delete(file.fileUrl);
          });
        });
      }
      return newSet;
    });
  };

  const getSelectedFilesForTask = (taskFiles: TaskFiles): StudentFile[] => {
    const selected: StudentFile[] = [];
    taskFiles.studentSubmissions.forEach((studentSub) => {
      studentSub.files.forEach((file) => {
        if (selectedFiles.has(file.fileUrl)) {
          selected.push(file);
        }
      });
    });
    return selected;
  };

  const handleDeleteSelectedClick = () => {
    setDeleteSelectedDialogOpen(true);
  };

  const handleDeleteSelectedConfirm = async () => {
    if (selectedFiles.size === 0) return;

    setDeletingSelected(true);
    try {
      // Get all submissions to update
      const submissions = await getSubmissionsByBatch(batchId);

      // Group selected files by submission ID
      const filesBySubmission = new Map<string, { fileUrl: string; fileName: string }[]>();

      // Find all selected files across all tasks
      tasksWithFiles.forEach(({ task, studentSubmissions }) => {
        studentSubmissions.forEach((studentSub) => {
          studentSub.files.forEach((file) => {
            if (selectedFiles.has(file.fileUrl)) {
              const existing = filesBySubmission.get(file.submissionId) || [];
              existing.push({ fileUrl: file.fileUrl, fileName: file.fileName });
              filesBySubmission.set(file.submissionId, existing);
            }
          });
        });
      });

      console.log(`Deleting ${selectedFiles.size} selected files from ${filesBySubmission.size} submissions`);

      // Delete files from storage and update submissions
      const deletePromises: Promise<void>[] = [];
      let filesDeleted = 0;
      let filesNotFound = 0;

      for (const [submissionId, files] of filesBySubmission.entries()) {
        const submission = submissions.find((s) => s.id === submissionId);
        if (!submission) {
          console.warn(`Submission ${submissionId} not found`);
          continue;
        }

        // Delete each file from storage
        for (const file of files) {
          deletePromises.push(
            deleteFileByUrl(file.fileUrl)
              .then((existed) => {
                if (existed) {
                  filesDeleted++;
                } else {
                  filesNotFound++;
                }
              })
              .catch((error) => {
                if (error?.code !== 'storage/object-not-found' &&
                  !(error instanceof Error && error.message.includes('object-not-found'))) {
                  console.error(`Failed to delete file ${file.fileUrl}:`, error);
                  throw error;
                } else {
                  filesNotFound++;
                }
              })
          );
        }

        // Update submission to remove deleted file URLs
        const updatedFileUrls = submission.fileUrls.filter(
          (url) => !files.some((f) => f.fileUrl === url)
        );

        if (updatedFileUrls.length !== submission.fileUrls.length) {
          deletePromises.push(
            updateSubmission(submissionId, {
              fileUrls: updatedFileUrls,
            }).catch((error) => {
              console.error(`Failed to update submission ${submissionId}:`, error);
              throw error;
            })
          );
        }
      }

      await Promise.all(deletePromises);
      console.log(`Selected files processed: ${filesDeleted} deleted, ${filesNotFound} already missing`);

      const description = filesNotFound > 0
        ? `${filesDeleted} file(s) deleted, ${filesNotFound} file(s) were already missing from storage.`
        : `${selectedFiles.size} file(s) deleted successfully`;

      toast({
        title: "Success",
        description,
      });

      // Clear selection and reload data
      setSelectedFiles(new Set());
      await loadData();
    } catch (error) {
      console.error("Error deleting selected files:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete selected files",
        variant: "destructive",
      });
    } finally {
      setDeletingSelected(false);
      setDeleteSelectedDialogOpen(false);
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
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
            Submissions - {batch.name}
          </h1>
          <p className="text-muted-foreground">
            View and manage all submitted files grouped by task
          </p>
        </div>
      </div>

      {tasksWithFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tasks found for this batch
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-2">
          {tasksWithFiles.map(({ task, studentSubmissions }) => {
            const TaskIcon = getTaskTypeIcon(task.type);
            const taskColor = getTaskTypeColor(task.type);
            const isDailyListening = task.type === "dailyListening";
            const totalFiles = studentSubmissions.reduce((sum, s) => sum + s.files.length, 0);
            const totalTextSubmissions = studentSubmissions.reduce((sum, s) => sum + s.textSubmissions.length, 0);
            const totalSubmissions = studentSubmissions.length; // Count students who submitted, not total files
            const hasAnySubmissions = totalSubmissions > 0;
            const displayStatus = getTaskDisplayStatus(task);

            return (
              <AccordionItem key={task.id} value={task.id} className="border rounded-lg px-4 mb-2">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{
                        backgroundColor: `${taskColor}20`,
                        color: taskColor,
                      }}
                    >
                      <TaskIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-lg break-words mb-1">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {getTaskTypeLabel(task.type)} • {enrollmentsMap.size} student
                        {enrollmentsMap.size !== 1 ? "s" : ""} • {totalSubmissions} submission
                        {totalSubmissions !== 1 ? "s" : ""}
                        {isDailyListening && totalTextSubmissions > 0 && (
                          <span> ({totalTextSubmissions} text{totalTextSubmissions !== 1 ? "s" : ""}, {totalFiles} file{totalFiles !== 1 ? "s" : ""})</span>
                        )}
                        <Badge
                          variant="outline"
                          className={`ml-2 ${displayStatus === "scheduled"
                            ? "bg-gray-50 text-gray-700 border-gray-200"
                            : displayStatus === "published"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-red-50 text-red-700 border-red-200"
                            }`}
                        >
                          {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  {studentSubmissions.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>No student submissions for this task.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Action buttons for bulk operations */}
                      {totalFiles > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                          {(() => {
                            const selectedForTask = getSelectedFilesForTask({ task, studentSubmissions });
                            const allSelected = selectedForTask.length > 0 && selectedForTask.length === totalFiles;
                            const someSelected = selectedForTask.length > 0 && selectedForTask.length < totalFiles;
                            return (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAll({ task, studentSubmissions }, !allSelected);
                                  }}
                                >
                                  {allSelected ? "Deselect All" : "Select All"}
                                </Button>
                                {selectedForTask.length > 0 && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSelectedClick();
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Selected ({selectedForTask.length})
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Student submissions */}
                      <Accordion type="multiple" className="w-full">
                        {studentSubmissions.map((studentSub) => {
                          const student = studentsMap.get(studentSub.studentId);
                          const enrollment = enrollmentsMap.get(studentSub.studentId);
                          const studentName =
                            enrollment?.dikshaName ||
                            enrollment?.studentName ||
                            student?.name ||
                            "Unknown Student";
                          const fileCount = studentSub.files.length;
                          const certificateName =
                            enrollment?.studentName &&
                              enrollment?.dikshaName &&
                              enrollment.dikshaName !== enrollment.studentName
                              ? enrollment.studentName
                              : null;

                          return (
                            <AccordionItem
                              key={studentSub.studentId}
                              value={studentSub.studentId}
                              className="border-b"
                            >
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex flex-wrap items-center justify-between w-full gap-2 sm:gap-3">
                                  <div className="flex flex-col items-start min-w-0 flex-1">
                                    <span className="font-medium text-base break-words">
                                      {studentName}
                                    </span>
                                    {certificateName && (
                                      <span className="text-sm text-muted-foreground break-words">
                                        Certificate: {certificateName}
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                    {fileCount + studentSub.textSubmissions.length} submission{(fileCount + studentSub.textSubmissions.length) !== 1 ? "s" : ""}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                  {/* Render text submissions first for daily listening */}
                                  {isDailyListening && studentSub.textSubmissions.map((textSub: StudentTextSubmission, index: number) => (
                                    <div
                                      key={`text-${index}`}
                                      className="flex flex-col p-3 bg-muted rounded-lg border gap-2 w-full"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium break-words">
                                          Text Submission
                                        </span>
                                      </div>
                                      {textSub.taskTitle && (
                                        <div className="flex items-center gap-1">
                                          <Badge variant="outline" className="text-xs">
                                            {textSub.taskTitle}
                                          </Badge>
                                        </div>
                                      )}
                                      <div className="text-sm text-muted-foreground line-clamp-3 break-words">
                                        {textSub.text}
                                      </div>
                                      {textSub.submittedAt && (
                                        <div className="text-xs text-muted-foreground">
                                          Submitted: {textSub.submittedAt.toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 flex-shrink-0 self-end">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            setPreviewFile({
                                              url: "",
                                              name: "Text Submission",
                                              type: "text",
                                              text: textSub.text,
                                            });
                                          }}
                                          title="View full text"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={() =>
                                            handleDeleteTextClick(
                                              textSub.submissionId,
                                              textSub.studentId
                                            )
                                          }
                                          title="Delete text submission"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Render file submissions */}
                                  {studentSub.files.map((file: StudentFile, index: number) => {
                                    const isSelected = selectedFiles.has(file.fileUrl);

                                    return (
                                      <div
                                        key={`file-${index}`}
                                        className={`flex flex-col p-3 bg-muted rounded-lg border gap-2 w-full ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                              handleFileSelect(file.fileUrl, checked === true)
                                            }
                                            className="flex-shrink-0"
                                          />
                                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                          <span className="text-sm break-words" title={file.fileName}>
                                            {file.fileName}
                                          </span>
                                        </div>
                                        {file.taskTitle && (
                                          <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs">
                                              {file.taskTitle}
                                            </Badge>
                                          </div>
                                        )}
                                        {file.submittedAt && (
                                          <div className="text-xs text-muted-foreground">
                                            Submitted: {file.submittedAt.toLocaleString(undefined, {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1 flex-shrink-0 self-end">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handlePreview(file.fileUrl, file.fileName)}
                                            title="Preview file"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              handleDownload(file.fileUrl, file.fileName)
                                            }
                                            title="Download file"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() =>
                                              handleDeleteClick(
                                                file.submissionId,
                                                file.fileUrl,
                                                file.fileName,
                                                file.studentId
                                              )
                                            }
                                            title="Delete file"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="w-[96vw] sm:w-[90vw] max-w-4xl p-2 sm:p-4">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base sm:text-lg">Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-2 w-full max-h-[80vh]">
            {previewFile?.type === "pdf" && (
              <div className="w-full h-[70vh] sm:h-[75vh]">
                <object
                  data={`${previewFile.url}#toolbar=0&navpanes=0&scrollbar=1`}
                  type="application/pdf"
                  className="w-full h-full rounded border"
                  aria-label="PDF preview"
                >
                  <iframe
                    src={`${previewFile.url}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded border"
                    title="PDF preview"
                  />
                </object>
              </div>
            )}
            {previewFile?.type === "video" && (
              <video
                controls
                className="w-full max-h-[75vh] rounded border bg-black"
                src={previewFile.url}
              />
            )}
            {previewFile?.type === "audio" && (
              <audio controls className="w-full" src={previewFile.url} />
            )}
            {previewFile?.type === "image" && (
              <img
                src={previewFile.url}
                alt="preview"
                className="max-h-[75vh] w-full object-contain rounded border"
              />
            )}
            {previewFile?.type === "text" && previewFile?.text && (
              <div className="w-full max-h-[75vh] overflow-y-auto p-4 bg-muted rounded border">
                <p className="whitespace-pre-wrap text-sm">{previewFile.text}</p>
              </div>
            )}
            {previewFile?.type === "other" && previewFile?.url && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.open(previewFile.url, "_blank", "noopener,noreferrer")}>
                  Open in new tab
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Single File Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.fileName}"? This
              action cannot be undone and the file will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Text Submission Dialog */}
      <AlertDialog open={deleteTextDialogOpen} onOpenChange={setDeleteTextDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Text Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this text submission? This
              action cannot be undone and the text will be permanently removed
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingText}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTextConfirm}
              disabled={deletingText}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingText ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Files Dialog (for Daily Listening) */}
      <AlertDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all files for "{taskToDeleteAll?.title}"?
              This action cannot be undone and all files will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              disabled={deletingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting All...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Files Dialog */}
      <AlertDialog
        open={deleteSelectedDialogOpen}
        onOpenChange={setDeleteSelectedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFiles.size} selected file{selectedFiles.size !== 1 ? "s" : ""}?
              This action cannot be undone and the files will be permanently removed
              from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSelected}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelectedConfirm}
              disabled={deletingSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingSelected ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Selected"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
