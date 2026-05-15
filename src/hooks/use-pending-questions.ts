"use client";

import { ModerationStatus, PublicQuestion } from "@/lib/models/public-question";
import { getPendingQuestionsPage } from "@/lib/services/question-service";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 10;

export interface UsePendingQuestionsReturn {
  questions: PublicQuestion[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  updateLocalStatus: (id: string, status: ModerationStatus) => void;
  updateQuestionLocal: (id: string, data: Partial<PublicQuestion>) => void;
  removeQuestion: (id: string) => void;
  addQuestion: (q: PublicQuestion) => void;
}

export function usePendingQuestions(enabled: boolean = true): UsePendingQuestionsReturn {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor is stored in a ref so it doesn't trigger re-renders and is always
  // up-to-date inside the loadPage callback without needing to be a dependency.
  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);

  // Track whether an initial load has been kicked off to avoid double-fetching
  // in React Strict Mode.
  const initialLoadDone = useRef(false);

  const loadPage = useCallback(async (isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const { docs, nextCursor } = await getPendingQuestionsPage(
        PAGE_SIZE,
        cursorRef.current
      );

      cursorRef.current = nextCursor;
      setHasMore(nextCursor !== null);

      if (isInitial) {
        setQuestions(docs);
      } else {
        setQuestions((prev) => [...prev, ...docs]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    if (!enabled || initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadPage(true);
  }, [loadPage, enabled]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    loadPage(false);
  }, [loadPage, loadingMore, hasMore]);

  /**
   * Optimistically update the status of a question in local state.
   * Called by the parent (QnAPanel) before the Firestore write so the UI
   * responds instantly.
   */
  const updateLocalStatus = useCallback(
    (id: string, status: ModerationStatus) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q))
      );
    },
    []
  );

  /**
   * Optimistically update any fields of a question in local state.
   */
  const updateQuestionLocal = useCallback(
    (id: string, data: Partial<PublicQuestion>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...data } : q))
      );
    },
    []
  );

  /**
   * Remove a question from the local list.
   * Called by the parent when a pending card is moved to another section
   * (optimistic removal).
   */
  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  /**
   * Add a question back to the pending list.
   * Called by the parent when a cross-section move fails and needs to be rolled back.
   */
  const addQuestion = useCallback((q: PublicQuestion) => {
    setQuestions((prev) => {
      // Avoid duplicates
      if (prev.some((existing) => existing.id === q.id)) return prev;
      // Insert in createdAt ascending order
      const next = [...prev, q];
      next.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      return next;
    });
  }, []);

  return {
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
  };
}
