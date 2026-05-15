"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { QuestionDialog } from "@/components/public/question-dialog";

export function QuestionButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-2 ring-primary/60 ring-offset-2 ring-offset-background animate-pulse-glow"
        aria-label="Ask your question!"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        Ask your question!
      </button>
      <QuestionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
