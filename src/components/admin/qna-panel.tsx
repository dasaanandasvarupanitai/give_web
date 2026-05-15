"use client";

import { useToast } from "@/hooks/use-toast";
import { useModeratedQuestions } from "@/hooks/use-moderated-questions";
import { ModerationStatus, PublicQuestion } from "@/lib/models/public-question";
import { updateQuestionStatus, deleteQuestion, editQuestion } from "@/lib/services/question-service";
import { Loader2 } from "lucide-react";
import { useCallback, useRef } from "react";
import { ModeratedQuestionsSection } from "./moderated-questions-section";
import { PendingQuestionsSection } from "./pending-questions-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function QnAPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("approved");
  const [hasOpened, setHasOpened] = useState({
    approved: true, // Default tab is already opened
    disapproved: false,
    pending: false,
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (!hasOpened[value as keyof typeof hasOpened]) {
      setHasOpened((prev) => ({ ...prev, [value]: true }));
    }
  };

  const approved = useModeratedQuestions("approved", hasOpened.approved);
  const disapproved = useModeratedQuestions("disapproved", hasOpened.disapproved);

  // Ref to the pending section's addQuestion function for rollback support
  const pendingAddQuestionRef = useRef<((q: PublicQuestion) => void) | null>(null);

  const handlePendingAddQuestionRef = useCallback(
    (addQuestion: (q: PublicQuestion) => void) => {
      pendingAddQuestionRef.current = addQuestion;
    },
    []
  );

  // Show a loading indicator while either moderated section is still loading
  const isLoading = approved.loading || disapproved.loading;

  // Show an error if either initial load failed
  const loadError = approved.error ?? disapproved.error;

  /**
   * Central handler for all moderation status changes across all three sections.
   *
   * Logic:
   * 1. Optimistically remove from source section and add to destination section.
   * 2. Call updateQuestionStatus(id, newStatus).
   * 3. On failure: roll back and show a toast error.
   *
   * Special case — previousStatus === "pending":
   *   PendingQuestionsSection already removed the card before calling this callback,
   *   so we only need to add it to the destination section. On rollback, we add it
   *   back to pending via pendingAddQuestionRef.
   */
  const handleStatusChange = useCallback(
    async (
      question: PublicQuestion,
      newStatus: ModerationStatus,
      previousStatus: ModerationStatus
    ) => {
      // Determine source hook (null for pending — already removed by the section)
      const sourceHook =
        previousStatus === "approved"
          ? approved
          : previousStatus === "disapproved"
            ? disapproved
            : null;

      // Determine destination hook (null for pending — not a valid destination here)
      const destHook =
        newStatus === "approved"
          ? approved
          : newStatus === "disapproved"
            ? disapproved
            : null;

      const updatedQuestion: PublicQuestion = { ...question, status: newStatus };

      // Step 1: Optimistic update
      if (sourceHook) {
        sourceHook.removeQuestion(question.id);
      }
      if (destHook) {
        destHook.addQuestion(updatedQuestion);
      }

      // Step 2: Persist to Firestore
      const result = await updateQuestionStatus(question.id, newStatus);

      if (!result.ok) {
        // Step 3: Roll back on failure
        if (destHook) {
          destHook.removeQuestion(question.id);
        }
        if (sourceHook) {
          sourceHook.addQuestion(question);
        } else if (previousStatus === "pending") {
          // Roll back to pending section
          pendingAddQuestionRef.current?.(question);
        }

        toast({
          title: "Update failed",
          description:
            result.error ?? "Could not save the status change. Please try again.",
          variant: "destructive",
        });
      }
    },
    [approved, disapproved, toast]
  );

  /**
   * Adapter for PendingQuestionsSection.
   * The section passes the full question object as the 4th argument.
   */
  const handlePendingStatusChange = useCallback(
    (
      _id: string,
      newStatus: ModerationStatus,
      previousStatus: ModerationStatus,
      question: PublicQuestion
    ) => {
      handleStatusChange(question, newStatus, previousStatus);
    },
    [handleStatusChange]
  );

  /**
   * Adapter for ModeratedQuestionsSection (approved).
   * Looks up the full question from the approved list.
   */
  const handleApprovedStatusChange = useCallback(
    (id: string, newStatus: ModerationStatus, previousStatus: ModerationStatus) => {
      const question = approved.questions.find((q) => q.id === id);
      if (!question) return;
      handleStatusChange(question, newStatus, previousStatus);
    },
    [approved.questions, handleStatusChange]
  );

  /**
   * Adapter for ModeratedQuestionsSection (disapproved).
   * Looks up the full question from the disapproved list.
   */
  const handleDisapprovedStatusChange = useCallback(
    (id: string, newStatus: ModerationStatus, previousStatus: ModerationStatus) => {
      const question = disapproved.questions.find((q) => q.id === id);
      if (!question) return;
      handleStatusChange(question, newStatus, previousStatus);
    },
    [disapproved.questions, handleStatusChange]
  );

  const handleDelete = useCallback(
    async (id: string, status: ModerationStatus) => {
      if (status === "pending") return; // Handled internally by pending section
      const hook = status === "approved" ? approved : disapproved;
      const question = hook.questions.find((q) => q.id === id);
      if (!question) return;

      hook.removeQuestion(id);
      const res = await deleteQuestion(id);
      if (!res.ok) {
        hook.addQuestion(question);
        toast({ title: "Delete failed", description: res.error || "Could not delete.", variant: "destructive" });
      }
    },
    [approved, disapproved, toast]
  );

  const handleEdit = useCallback(
    async (id: string, updatedData: { name: string; whatsappNumber: string; question: string }, status: ModerationStatus) => {
      if (status === "pending") return; // Handled internally by pending section
      const hook = status === "approved" ? approved : disapproved;
      const question = hook.questions.find((q) => q.id === id);
      if (!question) return;

      hook.updateQuestion({ ...question, ...updatedData });
      const res = await editQuestion(id, updatedData);
      if (!res.ok) {
        hook.updateQuestion(question); // rollback
        toast({ title: "Edit failed", description: res.error || "Could not update.", variant: "destructive" });
      }
    },
    [approved, disapproved, toast]
  );

  const handleAnswerSaved = useCallback(
    (id: string, answer: string, status: ModerationStatus) => {
      const hook = status === "approved" ? approved : disapproved;
      const question = hook.questions.find((q) => q.id === id);
      if (!question) return;
      hook.updateQuestion({ ...question, answer });
    },
    [approved, disapproved]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="disapproved">Disapproved</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="mt-0">
          <ModeratedQuestionsSection
            title="Approved"
            status="approved"
            questions={approved.questions}
            loadingMore={approved.loadingMore}
            hasMore={approved.hasMore}
            loadMore={approved.loadMore}
            fetchAllForExport={approved.fetchAllForExport}
            onStatusChange={handleApprovedStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAnswerSaved={handleAnswerSaved}
          />
        </TabsContent>

        <TabsContent value="disapproved" className="mt-0">
          <ModeratedQuestionsSection
            title="Disapproved"
            status="disapproved"
            questions={disapproved.questions}
            loadingMore={disapproved.loadingMore}
            hasMore={disapproved.hasMore}
            loadMore={disapproved.loadMore}
            onStatusChange={handleDisapprovedStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAnswerSaved={handleAnswerSaved}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <PendingQuestionsSection
            enabled={hasOpened.pending}
            onStatusChange={handlePendingStatusChange}
            onAddQuestionRef={handlePendingAddQuestionRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
