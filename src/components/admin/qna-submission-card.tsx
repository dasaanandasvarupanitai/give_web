"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PublicQuestion } from "@/lib/models/public-question";
import { format } from "date-fns";
import { Trash2, Edit2, Check, X, MessageSquarePlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQnASubmissionCard } from "./hooks/use-qna-submission-card";

interface QnASubmissionCardProps {
  question: PublicQuestion;
  onApprove: (id: string) => void;
  onDisapprove: (id: string) => void;
  onMoveToPending: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updatedData: { name: string; whatsappNumber: string; question: string }) => void;
  onAnswerSaved?: (id: string, answer: string) => void;
}

export function QnASubmissionCard({
  question,
  onApprove,
  onDisapprove,
  onMoveToPending,
  onDelete,
  onEdit,
  onAnswerSaved,
}: QnASubmissionCardProps) {
  const isPending = question.status === "pending";
  const isApproved = question.status === "approved";

  const {
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
  } = useQnASubmissionCard(question, onAnswerSaved);

  const handleEditSave = () => {
    if (onEdit) {
      onEdit(question.id, editData);
    }
    setIsEditDialogOpen(false);
  };

  return (
    <Card className="w-full border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="bg-muted/20 pb-3 pt-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-base text-foreground leading-none">{question.name}</h3>
            <p className="text-xs font-medium text-muted-foreground">{question.whatsappNumber}{question.country ? ` · ${question.country}` : ""}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider shrink-0 bg-muted/50 px-2 py-1 rounded-md">
              {format(question.createdAt, "MMM d, yyyy h:mm a")}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {/* Add / Edit Answer — only for approved questions */}
              {isApproved && (
                <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-[11px] gap-1 border-slate-300 dark:border-slate-700 ${
                        question.answer
                          ? "text-green-600 hover:text-green-700"
                          : "text-primary hover:text-primary/80"
                      }`}
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                      {question.answer ? "Edit Answer" : "Add Answer"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{question.answer ? "Edit Answer" : "Add Answer"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="rounded-md bg-muted/50 border border-border/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Question</p>
                        <p className="text-sm text-foreground leading-relaxed">{question.question}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Answer</Label>
                        <Textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type the answer here…"
                          className="min-h-[140px] border-border/60"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="border-slate-300 dark:border-slate-700"
                        onClick={() => setIsAnswerDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAnswerSave} disabled={isSavingAnswer || !answerText.trim()}>
                        {isSavingAnswer ? "Saving…" : "Save Answer"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {onEdit && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-6 w-6 border-slate-300 dark:border-slate-700 text-muted-foreground hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp Number</Label>
                        <Input value={editData.whatsappNumber} onChange={(e) => setEditData({...editData, whatsappNumber: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Question</Label>
                        <Textarea value={editData.question} onChange={(e) => setEditData({...editData, question: e.target.value})} className="min-h-[100px]" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="border-slate-300 dark:border-slate-700" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleEditSave}>Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-6 w-6 border-slate-300 dark:border-slate-700 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this question from the database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-300 dark:border-slate-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(question.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-4 space-y-3">
        <p className="text-[15px] whitespace-pre-wrap leading-relaxed text-foreground/90">
          {question.question}
        </p>

        {/* Show existing answer if present */}
        {question.answer && (
          <div className="rounded-md border border-green-200 bg-green-50/60 dark:border-green-800/40 dark:bg-green-900/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 mb-1">Answer (উত্তর)</p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
          </div>
        )}
      </CardContent>
      {isPending && (
        <CardFooter className="flex flex-wrap gap-2 pt-0">
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onApprove(question.id)}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDisapprove(question.id)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Disapprove
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
