"use client";

import {
  AlertDialog,
  AlertDialogAction,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { TaskBookmark } from "@/lib/models/task-bookmark";
import {
  createEnrollment,
  deleteEnrollment,
  getBatchById,
  getTaskById,
  subscribeEnrollmentsByStudent,
  subscribeTaskBookmarksByStudent,
  validateClassCode
} from "@/lib/services/firestore";
import { assignStudentRole } from "@/lib/user-roles";
import { getTaskTypeColor, getTaskTypeIcon, getTaskTypeLabel } from "@/lib/utils/task-helpers";
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  School,
  Trash2,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function StudentDashboard() {
  const { user } = useAuthUser();
  const router = useRouter();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [batches, setBatches] = useState<Map<string, Batch>>(new Map());
  const [bookmarks, setBookmarks] = useState<TaskBookmark[]>([]);
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [classCode, setClassCode] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successBatchName, setSuccessBatchName] = useState("");
  // Information collection dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [validatedBatchInfo, setValidatedBatchInfo] = useState<{ batchId: string; courseGroupId: string; classCode: string } | null>(null);
  const [studentName, setStudentName] = useState("");
  const [dikshaName, setDikshaName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  // Remove enrollment dialog state
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<Enrollment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time enrollment updates
    const unsubscribeEnrollments = subscribeEnrollmentsByStudent(user.uid, async (enrollmentsList) => {
      setEnrollments(enrollmentsList);

      // Load batch details for each enrollment
      const batchMap = new Map<string, Batch>();
      const batchLoadPromises = enrollmentsList.map(async (enrollment) => {
        if (!batchMap.has(enrollment.batchId)) {
          try {
            const batch = await getBatchById(enrollment.batchId);
            if (batch) {
              batchMap.set(enrollment.batchId, batch);
            }
            // If batch is null (deleted), we simply don't add it to the map
            // This will be handled in the render section
          } catch (error) {
            console.error(`Error loading batch ${enrollment.batchId}:`, error);
            // Continue loading other batches even if one fails
          }
        }
      });

      // Wait for all batch loads to complete (including failures)
      await Promise.allSettled(batchLoadPromises);
      setBatches(batchMap);
      setLoading(false);
    });

    // Subscribe to bookmarks
    const unsubscribeBookmarks = subscribeTaskBookmarksByStudent(user.uid, async (bookmarksList) => {
      setBookmarks(bookmarksList);

      // Load task details for each bookmark
      const taskMap = new Map<string, Task>();
      for (const bookmark of bookmarksList) {
        if (!taskMap.has(bookmark.taskId)) {
          try {
            const task = await getTaskById(bookmark.taskId);
            if (task) {
              taskMap.set(bookmark.taskId, task);
            }
          } catch (error) {
            console.error(`Error loading task ${bookmark.taskId}:`, error);
          }
        }
      }
      setBookmarkedTasks(taskMap);
    });

    return () => {
      unsubscribeEnrollments();
      unsubscribeBookmarks();
    };
  }, [user]);

  const handleJoinBatch = async () => {
    if (!user?.uid || !user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to join a batch",
        variant: "destructive",
      });
      return;
    }

    if (!classCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a class code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Validate class code (returns only batchId and courseGroupId - no batch details)
      const batchInfo = await validateClassCode(classCode.trim().toUpperCase());

      if (!batchInfo) {
        toast({
          title: "Error",
          description: "Invalid class code. Please check the code and try again.",
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Check if already enrolled (only check active or pending enrollments)
      // Allow rejoining if status is "dropped" or "declined"
      const isAlreadyEnrolled = enrollments.some(
        (e) => e.batchId === batchInfo.batchId &&
          (e.status === "active" || e.status === "pending" || e.status === "completed")
      );

      if (isAlreadyEnrolled) {
        const existingEnrollment = enrollments.find(e => e.batchId === batchInfo.batchId);
        let message = "You are already enrolled in this batch.";
        if (existingEnrollment?.status === "pending") {
          message = "You have a pending enrollment request for this batch.";
        } else if (existingEnrollment?.status === "completed") {
          message = "You have already completed this batch.";
        }
        toast({
          title: "Already Enrolled",
          description: message,
          variant: "destructive",
        });
        setIsJoining(false);
        return;
      }

      // Store validated batch info and show information collection dialog
      setValidatedBatchInfo({
        ...batchInfo,
        classCode: classCode.trim().toUpperCase(),
      });
      setIsJoinDialogOpen(false);
      setShowInfoDialog(true);
    } catch (error) {
      console.error("Error validating class code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to validate class code",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSubmitEnrollmentInfo = async () => {
    if (!user?.uid || !user?.email || !validatedBatchInfo) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    if (!studentName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!whatsappNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your WhatsApp number",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Create enrollment request with student information
      console.log("Creating enrollment for batch:", validatedBatchInfo.batchId);
      const enrollmentId = await createEnrollment({
        studentId: user.uid,
        batchId: validatedBatchInfo.batchId,
        courseGroupId: validatedBatchInfo.courseGroupId,
        status: "pending",
        enrolledAt: new Date(),
        classCode: validatedBatchInfo.classCode,
        studentName: studentName.trim(),
        dikshaName: dikshaName.trim() || undefined,
        whatsappNumber: whatsappNumber.trim(),
        address: address.trim() || undefined,
      }, user.email || "");

      console.log("Enrollment created with ID:", enrollmentId);

      // Assign student role if not already assigned
      await assignStudentRole(user.uid, user.email);

      // Reset form
      setStudentName("");
      setDikshaName("");
      setWhatsappNumber("");
      setAddress("");
      setClassCode("");
      setValidatedBatchInfo(null);
      setShowInfoDialog(false);

      // Show success dialog and toast
      setSuccessBatchName(`Class Code: ${validatedBatchInfo.classCode}`);

      // Show toast notification
      toast({
        title: "Request Sent",
        description: `Your enrollment request for class code "${validatedBatchInfo.classCode}" has been sent. Waiting for teacher approval.`,
      });

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create enrollment",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveEnrollment = async () => {
    if (!enrollmentToRemove) return;

    // Safety check: Only allow removal of declined or dropped enrollments
    // This prevents accidental deletion of active, pending, or completed batches
    if (enrollmentToRemove.status !== "declined" && enrollmentToRemove.status !== "dropped") {
      toast({
        title: "Error",
        description: "Only declined or dropped batches can be removed from your dashboard.",
        variant: "destructive",
      });
      setEnrollmentToRemove(null);
      return;
    }

    setIsRemoving(true);
    try {
      await deleteEnrollment(enrollmentToRemove.id);
      toast({
        title: "Success",
        description: "Batch removed from your dashboard",
      });
      setEnrollmentToRemove(null);
    } catch (error) {
      console.error("Error removing enrollment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove batch",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const getStatusBadge = (status: Enrollment["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs sm:text-sm">
            <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
            <School className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            Completed
          </Badge>
        );
      case "dropped":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs sm:text-sm">
            <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            Dropped
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs sm:text-sm">
            <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
            Declined
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-primary-foreground/90">Welcome back,</p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {user?.displayName || user?.email?.split("@")[0] || "Student"}
            </h2>
            <p className="text-primary-foreground/90">
              Continue your spiritual learning journey
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Join Batch
            </CardTitle>
            <CardDescription>
              Enter class code to join a batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Join Batch
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] max-w-md sm:max-w-lg left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] mx-auto">
                <DialogHeader>
                  <DialogTitle>Join Batch</DialogTitle>
                  <DialogDescription>
                    Enter the class code provided by your teacher to join a batch.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="classCode">Class Code</Label>
                    <Input
                      id="classCode"
                      placeholder="Enter class code"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                      className="uppercase"
                      maxLength={10}
                    />
                  </div>
                </div>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsJoinDialogOpen(false);
                      setClassCode("");
                    }}
                    className="w-full sm:w-auto"
                    disabled={isJoining}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinBatch}
                    disabled={isJoining}
                    className="w-full sm:w-auto"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      "Join Batch"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Student Information Collection Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={(open) => {
        if (!open && !isJoining) {
          setShowInfoDialog(false);
          setValidatedBatchInfo(null);
          setStudentName("");
          setDikshaName("");
          setWhatsappNumber("");
          setAddress("");
        }
      }}>
        <DialogContent className="w-[90%] max-w-md sm:max-w-2xl left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Information</DialogTitle>
            <DialogDescription>
              Please provide your information for enrollment. This information will be used for certificates and communication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="studentName"
                placeholder="Enter your full name (as it should appear on certificate)"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                This name will be used on your completion certificate
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dikshaName">Diksha Name (Optional)</Label>
              <Input
                id="dikshaName"
                placeholder="Enter your diksha name if you have one"
                value={dikshaName}
                onChange={(e) => setDikshaName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">
                WhatsApp Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="whatsappNumber"
                placeholder="Enter your WhatsApp number with country code"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                type="tel"
                required
              />
              <p className="text-xs text-muted-foreground">
                Example: +1234567890
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Textarea
                id="address"
                placeholder="Enter your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInfoDialog(false);
                setValidatedBatchInfo(null);
                setStudentName("");
                setDikshaName("");
                setWhatsappNumber("");
                setAddress("");
              }}
              disabled={isJoining}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEnrollmentInfo}
              disabled={isJoining || !studentName.trim() || !whatsappNumber.trim()}
              className="w-full sm:w-auto"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Enrollment Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bookmarked Tasks Section */}
      {bookmarks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="h-6 w-6 fill-yellow-500 text-yellow-500" />
              Bookmarked Tasks ({bookmarks.length})
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarks
              .filter((bookmark) => {
                // Only show bookmarks where both task and batch exist
                const task = bookmarkedTasks.get(bookmark.taskId);
                const batch = batches.get(bookmark.batchId);
                return task && batch;
              })
              .map((bookmark) => {
                const task = bookmarkedTasks.get(bookmark.taskId);
                const batch = batches.get(bookmark.batchId);

                // At this point, both should exist due to filter above
                if (!task || !batch) {
                  return null;
                }

                const TaskIcon = getTaskTypeIcon(task.type);
                const taskColor = getTaskTypeColor(task.type);

                return (
                  <Card
                    key={bookmark.id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => {
                      if (batch) {
                        router.push(`/classroom/batches/${batch.id}`);
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${taskColor}20`, color: taskColor }}
                          >
                            <TaskIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                            {batch && (
                              <CardDescription className="mt-1">
                                {batch.name}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <Bookmark className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Enrolled Batches */}
      <div>
        <h3 className="text-2xl font-bold mb-4">My Batches</h3>
        {(() => {
          const validEnrollments = enrollments.filter((enrollment) =>
            batches.has(enrollment.batchId)
          );
          return validEnrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-xl font-semibold mb-2">No Batches Yet</h4>
                <p className="text-muted-foreground mb-4">
                  Join a batch using a class code to start learning
                </p>
                <Button onClick={() => setIsJoinDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Join Batch
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {validEnrollments.map((enrollment) => {
                const batch = batches.get(enrollment.batchId);
                // At this point, batch should always exist due to filter above
                if (!batch) {
                  return null;
                }

                const canRemove = enrollment.status === "declined" || enrollment.status === "dropped";

                return (
                  <Card key={enrollment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base">
                            {batch.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">{batch.name}</CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-start sm:self-auto">
                          {getStatusBadge(enrollment.status)}
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEnrollmentToRemove(enrollment);
                              }}
                              title="Remove from dashboard"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {batch.description && (
                        <div className="mb-4">
                          <ExpandableDescription text={batch.description} maxLines={2} className="text-sm" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="break-words">
                            <span className="hidden sm:inline">Enrolled: </span>
                            {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {enrollment.status === "active" && (
                        <Button
                          variant="outline"
                          className="w-full mt-4 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600"
                          onClick={() => router.push(`/classroom/batches/${batch.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Assessments
                        </Button>
                      )}
                      {enrollment.status === "pending" && (
                        <p className="text-sm text-orange-600 mt-4 text-center">
                          Waiting for approval
                        </p>
                      )}
                      {canRemove && (
                        <p className="text-sm text-muted-foreground mt-4 text-center">
                          You can remove this batch from your dashboard
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Remove Enrollment Confirmation Dialog */}
      <AlertDialog open={enrollmentToRemove !== null} onOpenChange={(open) => {
        if (!open) {
          setEnrollmentToRemove(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Batch from Dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {enrollmentToRemove && batches.get(enrollmentToRemove.batchId)?.name}
              </strong>{" "}
              (Status: <span className="capitalize">{enrollmentToRemove?.status}</span>) from your dashboard?
              This will permanently remove the enrollment record. You can join this batch again later using the class code if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnrollmentToRemove(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveEnrollment}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-orange-600" />
              </div>
              <AlertDialogTitle>Request Sent Successfully!</AlertDialogTitle>
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <p className="mb-4">
                Your enrollment request for <strong>{successBatchName}</strong> has been sent successfully.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Your request is now pending approval</li>
                      <li>The teacher will review your request</li>
                      <li>You will be able to access the batch once approved</li>
                      <li>Check back later for updates on your enrollment status</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowSuccessDialog(false);
              // Reload the page to refresh enrollment data and prevent freezing
              window.location.reload();
            }}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
