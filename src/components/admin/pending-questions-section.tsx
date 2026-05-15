"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { usePendingQuestions } from "@/hooks/use-pending-questions";
import { ModerationStatus, PublicQuestion } from "@/lib/models/public-question";
import { deleteQuestion, editQuestion } from "@/lib/services/question-service";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { QnASubmissionCard } from "./qna-submission-card";

interface PendingQuestionsSectionProps {
  onStatusChange: (
    id: string,
    newStatus: ModerationStatus,
    prev: ModerationStatus,
    question: PublicQuestion
  ) => void;
  /** Called with the addQuestion function so the parent can roll back optimistic removals */
  onAddQuestionRef?: (addQuestion: (q: PublicQuestion) => void) => void;
  enabled?: boolean;
}

export function PendingQuestionsSection({
  onStatusChange,
  onAddQuestionRef,
  enabled = true,
}: PendingQuestionsSectionProps) {
  const {
    questions,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    updateLocalStatus,
    updateQuestionLocal,
    removeQuestion,
    addQuestion,
  } = usePendingQuestions(enabled);
  const { toast } = useToast();

  // Expose addQuestion to the parent for rollback support
  useEffect(() => {
    onAddQuestionRef?.(addQuestion);
  }, [addQuestion, onAddQuestionRef]);

  // Sentinel ref for IntersectionObserver — triggers loadMore when visible
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleApprove = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    removeQuestion(id);
    onStatusChange(id, "approved", "pending", question);
  };

  const handleDisapprove = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    removeQuestion(id);
    onStatusChange(id, "disapproved", "pending", question);
  };

  // "Move to Pending" is a no-op here since these cards are already pending,
  // but the card hides the button when status === "pending" anyway.
  const handleMoveToPending = (_id: string) => {
    // Cards in this section always have status "pending"; button is hidden.
  };

  const handleDelete = async (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    
    // Optimistic delete
    removeQuestion(id);
    
    const result = await deleteQuestion(id);
    if (!result.ok) {
      // Rollback
      addQuestion(question);
      toast({
        title: "Delete failed",
        description: result.error || "Could not delete the question.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, updatedData: { name: string; whatsappNumber: string; question: string }) => {
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    // Optimistic update
    updateQuestionLocal(id, updatedData);

    const result = await editQuestion(id, updatedData);
    if (!result.ok) {
      // Rollback
      updateQuestionLocal(id, {
        name: question.name,
        whatsappNumber: question.whatsappNumber,
        question: question.question,
      });
      toast({
        title: "Edit failed",
        description: result.error || "Could not update the question.",
        variant: "destructive",
      });
    }
  };

  // Initial loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state (initial load failed)
  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={loadMore}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No pending questions.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ScrollArea className="h-[500px] pr-3">
        <div className="space-y-3 pb-2">
          {questions.map((question) => (
            <QnASubmissionCard
              key={question.id}
              question={question}
              onApprove={handleApprove}
              onDisapprove={handleDisapprove}
              onMoveToPending={handleMoveToPending}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}

          {/* Sentinel div — observed by IntersectionObserver to trigger loadMore */}
          <div ref={sentinelRef} className="h-1" aria-hidden="true" />
        </div>
      </ScrollArea>

      {/* Loading more spinner */}
      {loadingMore && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error while loading more (list already has items) */}
      {error && questions.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <p className="text-xs text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={loadMore}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
