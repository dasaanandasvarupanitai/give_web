"use client";

import { useEffect, useState } from "react";
import { PublicQuestion } from "@/lib/models/public-question";
import { getAllQuestionsByStatus } from "@/lib/services/question-service";
import { MessageCircleQuestion, Loader2 } from "lucide-react";

export function PublicQnAPage() {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllQuestionsByStatus("approved")
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden border-b border-border/40 bg-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(25_95%_53%_/_0.08),_transparent_70%)]" />
        <div className="relative container max-w-6xl mx-auto px-4 py-8 text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
            Questions Asked by Various Devotees
            <span className="block text-primary">for the Next QnA Session</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Below are sincere questions submitted by devotees. Read through them and look forward to the answers in our upcoming sessions.
          </p>
          <p className="text-[13px] text-muted-foreground/70 italic">
            বিভিন্ন ভক্তদের দ্বারা জিজ্ঞাসিত প্রশ্নগুলি পড়ুন এবং আসন্ন প্রশ্নোত্তর সেশনের জন্য অপেক্ষা করুন।
          </p>
        </div>
      </div>

      {/* ── Question List ── */}
      <div className="container max-w-6xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-4">
              <MessageCircleQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              No questions have been published yet. Be the first to ask one!
            </p>
          </div>
        )}

        {!loading && !error && questions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-6 col-span-full">
              {questions.length} question{questions.length !== 1 ? "s" : ""} published
            </p>
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="group relative rounded-xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                {/* Number badge */}
                <span className="absolute -top-3 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                  {index + 1}
                </span>

                <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                  {question.question}
                </p>

                {question.answer ? (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1.5">Answer (উত্তর)</p>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-dashed border-border/60 bg-muted/30 px-4 py-2.5">
                    <p className="text-[11px] font-medium text-muted-foreground italic">
                      Not answered yet (এখনো উত্তর দেওয়া হয়নি)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
