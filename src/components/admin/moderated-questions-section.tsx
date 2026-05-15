"use client";

import { ModerationStatus, PublicQuestion } from "@/lib/models/public-question";
import { QnASubmissionCard } from "./qna-submission-card";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModeratedQuestionsSectionProps {
  title: string;
  status: "approved" | "disapproved";
  questions: PublicQuestion[];
  loadingMore?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  fetchAllForExport?: () => Promise<PublicQuestion[]>;
  onStatusChange: (
    id: string,
    newStatus: ModerationStatus,
    prev: ModerationStatus
  ) => void;
  onDelete?: (id: string, status: ModerationStatus) => void;
  onEdit?: (id: string, updatedData: { name: string; whatsappNumber: string; question: string }, status: ModerationStatus) => void;
  onAnswerSaved?: (id: string, answer: string, status: ModerationStatus) => void;
}

export function ModeratedQuestionsSection({
  title,
  status,
  questions,
  loadingMore,
  hasMore,
  loadMore,
  fetchAllForExport,
  onStatusChange,
  onDelete,
  onEdit,
  onAnswerSaved,
}: ModeratedQuestionsSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!hasMore || loadingMore || !loadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "100px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  const handleApprove = (id: string) => onStatusChange(id, "approved", status);
  const handleDisapprove = (id: string) => onStatusChange(id, "disapproved", status);
  const handleMoveToPending = (id: string) => onStatusChange(id, "pending", status);

  const handleExport = async () => {
    if (!fetchAllForExport) return;
    setIsExporting(true);
    try {
      const allQuestions = await fetchAllForExport();
      
      let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${title} Questions</title></head><body>
        <h1>${title} Questions</h1>
        <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <thead>
            <tr>
              <th style="background-color: #f2f2f2; text-align: left;">Name</th>
              <th style="background-color: #f2f2f2; text-align: left;">WhatsApp Number</th>
              <th style="background-color: #f2f2f2; text-align: left;">Question</th>
              <th style="background-color: #f2f2f2; text-align: left;">Answer</th>
              <th style="background-color: #f2f2f2; text-align: left;">Date Submitted</th>
            </tr>
          </thead>
          <tbody>`;
      
      allQuestions.forEach(q => {
        html += `<tr>
          <td valign="top">${q.name}</td>
          <td valign="top">${q.whatsappNumber}</td>
          <td valign="top">${q.question.replace(/\n/g, '<br/>')}</td>
          <td valign="top">${(q.answer || "—").replace(/\n/g, '<br/>')}</td>
          <td valign="top">${new Date(q.createdAt).toLocaleString()}</td>
        </tr>`;
      });
      
      html += `</tbody></table></body></html>`;

      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
      const link = document.createElement("a");
      link.href = source;
      link.download = `${title}_Questions_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {status === "approved" && questions.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-300 dark:border-slate-700"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export to Word
          </Button>
        </div>
      )}

      {questions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {status === "approved"
            ? "No approved questions."
            : "No disapproved questions."}
        </p>
      ) : (
        <ScrollArea className="h-[500px] pr-3">
          <div className="space-y-3 pb-2">
            {questions.map((question) => (
              <QnASubmissionCard
                key={question.id}
                question={question}
                onApprove={handleApprove}
                onDisapprove={handleDisapprove}
                onMoveToPending={handleMoveToPending}
                onDelete={onDelete ? (id) => onDelete(id, status) : undefined}
                onEdit={onEdit ? (id, data) => onEdit(id, data, status) : undefined}
                onAnswerSaved={onAnswerSaved ? (id, answer) => onAnswerSaved(id, answer, status) : undefined}
              />
            ))}
            
            {/* Sentinel div for infinite scrolling */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </div>
        </ScrollArea>
      )}

      {loadingMore && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
