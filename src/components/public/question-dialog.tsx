"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { submitQuestion } from "@/lib/services/question-service";

// ==================== Types ====================

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = "form" | "success" | "error";

// ==================== Zod Schema ====================

const questionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  country: z.string().min(1, "Country is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  question: z.string().min(1, "Question is required"),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

// ==================== Component ====================

export function QuestionDialog({ open, onOpenChange }: QuestionDialogProps) {
  const [view, setView] = useState<DialogView>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      name: "",
      country: "",
      whatsappNumber: "",
      question: "",
    },
  });

  async function onSubmit(data: QuestionFormValues) {
    setIsSubmitting(true);
    const result = await submitQuestion(data);
    setIsSubmitting(false);

    if (result.ok) {
      setView("success");
    } else {
      setView("error");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setView("form");
        form.reset();
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl sm:w-full max-h-[90vh] overflow-y-auto p-0 gap-0">

        {view === "form" && (
          <div className="flex flex-col md:flex-row min-h-[420px]">

            {/* ── Left panel: inspirational content ── */}
            <div className="md:w-[42%] bg-primary/5 border-b md:border-b-0 md:border-r border-border/40 p-5 md:p-6 flex flex-col justify-center gap-4">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Ask Your Question
                </p>
                <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug">
                  Every sincere question can become a step toward Krishna
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  প্রতিটি আন্তরিক জিজ্ঞাসা, আপনার কৃষ্ণ অভিমুখে যাত্রার এক একটি পদক্ষেপ।
                </p>
              </div>

              <div className="h-px bg-border/50" />

              <div className="space-y-2">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  You can ask your questions to us for making progress in your devotional life.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  আপনার ভক্তিজীবনের অগ্রগতির লক্ষ্যে চাইলে আমাদের প্রশ্ন করতে পারেন।
                </p>
              </div>
            </div>

            {/* ── Right panel: form ── */}
            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Name <span className="text-muted-foreground font-normal">(নাম)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your name"
                              className="border-border/60 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Country <span className="text-muted-foreground font-normal">(দেশ)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your country"
                              className="border-border/60 focus-visible:ring-primary/50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          WhatsApp Number{" "}
                          <span className="text-muted-foreground font-normal">(হোয়াট্সঅ্যাপ নম্বর)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+880 17XX XXXXXX"
                            className="border-border/60 focus-visible:ring-primary/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Your Question{" "}
                          <span className="text-muted-foreground font-normal">(English, বাংলা, हिंदी)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your question here…"
                            className="min-h-[80px] resize-none border-border/60 focus-visible:ring-primary/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting…" : "Submit Question"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        )}

        {view === "success" && (
          <div className="flex flex-col items-center py-12 px-8 space-y-6 text-center">
            <div className="rounded-full bg-green-100/80 p-3 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Your question has been submitted successfully! Keep an eye on our upcoming
              question-answer sessions to find your answer.
            </p>
            <Button variant="default" className="w-full max-w-xs" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {view === "error" && (
          <div className="flex flex-col gap-4 py-12 px-8">
            <Alert variant="destructive">
              <AlertDescription>
                Sorry, we could not submit your question. Please try again.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => setView("form")}>
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
