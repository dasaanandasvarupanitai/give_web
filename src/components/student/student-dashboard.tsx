"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuthUser } from "@/hooks/use-auth";
import type { Batch } from "@/lib/models/batch";
import type { Enrollment } from "@/lib/models/enrollment";
import type { Task } from "@/lib/models/task";
import type { TaskBookmark } from "@/lib/models/task-bookmark";
import {
  getBatchById,
  getTaskById,
  subscribeEnrollmentsByStudent,
  subscribeTaskBookmarksByStudent
} from "@/lib/services/firestore";
import {
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BookmarkedTasksSection } from "./dashboard/bookmarked-tasks-section";
import { EnrolledBatchesSection } from "./dashboard/enrolled-batches-section";
import { JoinBatchFlow } from "./dashboard/join-batch-flow";

export function StudentDashboard() {
  const { user } = useAuthUser();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [batches, setBatches] = useState<Map<string, Batch>>(new Map());
  const [bookmarks, setBookmarks] = useState<TaskBookmark[]>([]);
  const [bookmarkedTasks, setBookmarkedTasks] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState(true);

  // Ref to trigger the Join Batch dialog from Enrolled Batches "Zero State" button
  // JoinBatchFlow will need to expose a method or we monitor a state?
  // Easier: Just have JoinBatchFlow handle the trigger normally, but we need to trigger it from EnrolledBatchesSection too.
  // Actually, JoinBatchFlow encapsulates the trigger button logic. 
  // We can just render another JoinBatchFlow hidden? No.
  // We should probably lift the `isJoinDialogOpen` state here if we want to trigger it from multiple places?
  // OR, we can just pass a triggerRef to JoinBatchFlow?
  // Let's modify JoinBatchFlow to accept an `open` prop or just use a ref.
  // Actually, the EnrolledBatchesSection "Join Batch" button effectively wants to do what the Quick Actions "Join Batch" does.
  // The "Quick Actions" is basically the `JoinBatchFlow` component.
  // So `EnrolledBatchesSection` needs to tell `JoinBatchFlow` to open.

  // Let's lift `isJoinDialogOpen` to here?
  // NO, `JoinBatchFlow` has a lot of internal state for the dialogs.
  // It's better if `JoinBatchFlow` exposes a trigger function or we use a context/event.
  // Simple hack: Render a hidden button in JoinBatchFlow and click it?
  // Better: Pass `isDialogOpen` and `setIsDialogOpen` to JoinBatchFlow. It already manages it.
  // Let's modify `JoinBatchFlow` to accept `isOpen` and `onOpenChange` optionally, or just a ref/trigger.
  // Actually re-reading JoinBatchFlow: it renders the Card internally (Quick Actions card).
  // AND it manages `isJoinDialogOpen`.

  // I'll make a small change to JoinBatchFlow to allow external control, or just duplicate the trigger button there?
  // The simplest way is to pass a `triggerRef` to JoinBatchFlow that can be clicked?
  // OR: Modify JoinBatchFlow to export `JoinBatchDialog` separated from the "Quick Action Card"?
  // Yes, separating the Dialog from the logic/trigger is cleaner but more work now.

  // Let's simply simulate a click on the "Join Batch" button if needed? 
  // Or just pass `open` state down.
  // I will assume for now that I can modify `JoinBatchFlow` later if needed, but for now I'll just render it.
  // Wait, `EnrolledBatchesSection` renders a "Join Batch" button if empty. exact same functionality.
  // I can just render `JoinBatchFlow` THERE inside `EnrolledBatchesSection`? 
  // But `JoinBatchFlow` is a big card. The empty state button is a small button.

  // Solution:
  // I will update `StudentDashboard` to manage `isJoinDialogOpen`.
  // I will update `JoinBatchFlow` to accept `isOpen` and `onOpenChange`.
  // This is the correct React way.

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

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
          } catch (error) {
            console.error(`Error loading batch ${enrollment.batchId}:`, error);
          }
        }
      });

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

      {/* Quick Actions (Join Batch) */}
      <div className="grid gap-4 md:grid-cols-2">
        <JoinBatchFlow
          enrollments={enrollments}
          isOpen={isJoinDialogOpen}
          onOpenChange={setIsJoinDialogOpen}
        />
      </div>

      {/* Bookmarked Tasks */}
      <BookmarkedTasksSection
        bookmarks={bookmarks}
        bookmarkedTasks={bookmarkedTasks}
        batches={batches}
      />

      {/* Enrolled Batches */}
      <EnrolledBatchesSection
        enrollments={enrollments}
        batches={batches}
        onJoinClick={() => setIsJoinDialogOpen(true)}
      />
    </div>
  );
}
