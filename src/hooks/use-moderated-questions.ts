"use client";

import { PublicQuestion } from "@/lib/models/public-question";
import { getModeratedQuestionsPage, getAllQuestionsByStatus } from "@/lib/services/question-service";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 10;

export interface UseModeratedQuestionsReturn {
  questions: PublicQuestion[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  fetchAllForExport: () => Promise<PublicQuestion[]>;
  addQuestion: (q: PublicQuestion) => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (q: PublicQuestion) => void;
}

export function useModeratedQuestions(
  status: "approved" | "disapproved",
  enabled: boolean = true
): UseModeratedQuestionsReturn {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(enabled); // Initial loading state matches enabled
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<QueryDocumentSnapshot | null>(null);
  const initialLoadDone = useRef(false);

  const loadPage = useCallback(async (isInitial: boolean) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const { docs, nextCursor } = await getModeratedQuestionsPage(
        status,
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
  }, [status]);

  useEffect(() => {
    if (!enabled || initialLoadDone.current) return;
    initialLoadDone.current = true;
    loadPage(true);
  }, [loadPage, enabled]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    loadPage(false);
  }, [loadPage, loadingMore, hasMore]);

  const fetchAllForExport = useCallback(async () => {
    return await getAllQuestionsByStatus(status);
  }, [status]);

  const addQuestion = useCallback((q: PublicQuestion) => {
    setQuestions((prev) => {
      if (prev.some((existing) => existing.id === q.id)) return prev;
      const next = [...prev, q];
      next.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Descending
      return next;
    });
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuestion = useCallback((q: PublicQuestion) => {
    setQuestions((prev) => prev.map((existing) => (existing.id === q.id ? q : existing)));
  }, []);

  return {
    questions,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    fetchAllForExport,
    addQuestion,
    removeQuestion,
    updateQuestion,
  };
}
