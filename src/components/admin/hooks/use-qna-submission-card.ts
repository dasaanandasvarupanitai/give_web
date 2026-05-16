"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PublicQuestion } from "@/lib/models/public-question";
import { addAnswerToQuestion } from "@/lib/services/question-service";

export function useQnASubmissionCard(question: PublicQuestion, onAnswerSaved?: (id: string, answer: string) => void) {
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: question.name,
    whatsappNumber: question.whatsappNumber,
    question: question.question,
  });

  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [answerText, setAnswerText] = useState(question.answer ?? "");
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  const handleAnswerSave = async () => {
    setIsSavingAnswer(true);
    const result = await addAnswerToQuestion(question.id, answerText);
    setIsSavingAnswer(false);

    if (result.ok) {
      toast({ title: "Answer saved!", description: "The answer is now visible on the public QnA page." });
      setIsAnswerDialogOpen(false);
      onAnswerSaved?.(question.id, answerText);
    } else {
      toast({ title: "Failed to save", description: result.error, variant: "destructive" });
    }
  };

  return {
    isEditDialogOpen,
    setIsEditDialogOpen,
    editData,
    setEditData,
    isAnswerDialogOpen,
    setIsAnswerDialogOpen,
    answerText,
    setAnswerText,
    isSavingAnswer,
    handleAnswerSave,
  };
}
