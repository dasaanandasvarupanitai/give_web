"use client";

import { useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useModeratedQuestions } from "@/hooks/use-moderated-questions";
import { ModerationStatus, PublicQuestion } from "@/lib/models/public-question";
import { updateQuestionStatus, deleteQuestion, editQuestion } from "@/lib/services/question-service";

export function useQnaHandlers(hasOpened: { approved: boolean; disapproved: boolean; pending: boolean }) {
    const { toast } = useToast();

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

    const handleStatusChange = useCallback(
        async (
            question: PublicQuestion,
            newStatus: ModerationStatus,
            previousStatus: ModerationStatus
        ) => {
            const sourceHook =
                previousStatus === "approved"
                    ? approved
                    : previousStatus === "disapproved"
                        ? disapproved
                        : null;

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

    const handleApprovedStatusChange = useCallback(
        (id: string, newStatus: ModerationStatus, previousStatus: ModerationStatus) => {
            const question = approved.questions.find((q) => q.id === id);
            if (!question) return;
            handleStatusChange(question, newStatus, previousStatus);
        },
        [approved.questions, handleStatusChange]
    );

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
            if (status === "pending") return;
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
            if (status === "pending") return;
            const hook = status === "approved" ? approved : disapproved;
            const question = hook.questions.find((q) => q.id === id);
            if (!question) return;

            hook.updateQuestion({ ...question, ...updatedData });
            const res = await editQuestion(id, updatedData);
            if (!res.ok) {
                hook.updateQuestion(question);
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

    return {
        approved,
        disapproved,
        handlePendingAddQuestionRef,
        handlePendingStatusChange,
        handleApprovedStatusChange,
        handleDisapprovedStatusChange,
        handleDelete,
        handleEdit,
        handleAnswerSaved,
    };
}
