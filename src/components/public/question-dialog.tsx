"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Check } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitQuestion } from "@/lib/services/question-service";

// ==================== Country Codes List ====================
const COUNTRY_CODES = [
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩" },
  // Sorted alphabetically
  { code: "+93", name: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", name: "Albania", flag: "🇦🇱" },
  { code: "+213", name: "Algeria", flag: "🇩🇿" },
  { code: "+376", name: "Andorra", flag: "🇦🇩" },
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+374", name: "Armenia", flag: "🇦🇲" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+994", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+501", name: "Belize", flag: "🇧🇿" },
  { code: "+229", name: "Benin", flag: "🇧🇯" },
  { code: "+975", name: "Bhutan", flag: "🇧🇹" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴" },
  { code: "+387", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", name: "Botswana", flag: "🇧🇼" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+673", name: "Brunei", flag: "🇧🇳" },
  { code: "+359", name: "Bulgaria", flag: "🇧🇬" },
  { code: "+257", name: "Burundi", flag: "🇧🇮" },
  { code: "+855", name: "Cambodia", flag: "🇰🇭" },
  { code: "+237", name: "Cameroon", flag: "🇨🇲" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+242", name: "Congo", flag: "🇨🇬" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+385", name: "Croatia", flag: "🇭🇷" },
  { code: "+53", name: "Cuba", flag: "🇨🇺" },
  { code: "+357", name: "Cyprus", flag: "🇨🇾" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻" },
  { code: "+372", name: "Estonia", flag: "🇪🇪" },
  { code: "+251", name: "Ethiopia", flag: "🇪🇹" },
  { code: "+679", name: "Fiji", flag: "🇫🇯" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+995", name: "Georgia", flag: "🇬🇪" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹" },
  { code: "+509", name: "Haiti", flag: "🇭🇹" },
  { code: "+504", name: "Honduras", flag: "🇭🇳" },
  { code: "+852", name: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+354", name: "Iceland", flag: "🇮🇸" },
  { code: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "+98", name: "Iran", flag: "🇮🇷" },
  { code: "+964", name: "Iraq", flag: "🇮🇶" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+962", name: "Jordan", flag: "🇯🇴" },
  { code: "+7", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "+996", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", name: "Laos", flag: "🇱🇦" },
  { code: "+371", name: "Latvia", flag: "🇱🇻" },
  { code: "+961", name: "Lebanon", flag: "🇱🇧" },
  { code: "+218", name: "Libya", flag: "🇱🇾" },
  { code: "+370", name: "Lithuania", flag: "🇱🇹" },
  { code: "+352", name: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", name: "Macau", flag: "🇲🇴" },
  { code: "+389", name: "Macedonia", flag: "🇲🇰" },
  { code: "+261", name: "Madagascar", flag: "🇲🇬" },
  { code: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "+960", name: "Maldives", flag: "🇲🇻" },
  { code: "+356", name: "Malta", flag: "🇲🇹" },
  { code: "+230", name: "Mauritius", flag: "🇲🇺" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+373", name: "Moldova", flag: "🇲🇩" },
  { code: "+377", name: "Monaco", flag: "🇲🇨" },
  { code: "+976", name: "Mongolia", flag: "🇲🇳" },
  { code: "+382", name: "Montenegro", flag: "🇲🇪" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+95", name: "Myanmar", flag: "🇲🇲" },
  { code: "+264", name: "Namibia", flag: "🇳🇦" },
  { code: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "+507", name: "Panama", flag: "🇵🇦" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾" },
  { code: "+51", name: "Peru", flag: "🇵🇪" },
  { code: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "+250", name: "Rwanda", flag: "🇷🇼" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+381", name: "Serbia", flag: "🇷🇸" },
  { code: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "+421", name: "Slovakia", flag: "🇸🇰" },
  { code: "+386", name: "Slovenia", flag: "🇸🇮" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+886", name: "Taiwan", flag: "🇹🇼" },
  { code: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "+216", name: "Tunisia", flag: "🇹🇳" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾" },
  { code: "+998", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪" },
  { code: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "+263", name: "Zimbabwe", flag: "🇿🇼" }
];

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
  countryCode: z.string().min(1, "Country code is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  question: z.string().min(1, "Question is required"),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

// ==================== Custom Item for Country Code Selector ====================
const CountrySelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    flag: string;
    code: string;
    countryName: string;
  }
>(({ className, flag, code, countryName, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>
      <span>{flag}</span>
      <span className="font-medium ml-1.5">{code}</span>
    </SelectPrimitive.ItemText>
    
    <span className="text-[10px] text-muted-foreground ml-1.5">({countryName})</span>
  </SelectPrimitive.Item>
));
CountrySelectItem.displayName = "CountrySelectItem";

// ==================== Component ====================

export function QuestionDialog({ open, onOpenChange }: QuestionDialogProps) {
  const [view, setView] = useState<DialogView>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      name: "",
      country: "",
      countryCode: "+91_India",
      whatsappNumber: "",
      question: "",
    },
  });

  async function onSubmit(data: QuestionFormValues) {
    setIsSubmitting(true);
    
    // Extract the actual calling code (e.g. "+91" from "+91_India")
    const actualCode = data.countryCode.split("_")[0];
    
    // Concatenate the selected country code with the whatsapp number (strip spaces/pluses/leading zeros)
    const cleanedNumber = data.whatsappNumber.trim().replace(/^\+/, "").replace(/^0+/, "").replace(/\s+/g, "");
    const combinedWhatsapp = `${actualCode}${cleanedNumber}`;

    const result = await submitQuestion({
      name: data.name,
      country: data.country,
      whatsappNumber: combinedWhatsapp,
      question: data.question,
    });
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
        <DialogTitle className="sr-only">Ask Your Question</DialogTitle>
        <DialogDescription className="sr-only">
          Submit your question to devotees for the next QnA session.
        </DialogDescription>

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

                  <div className="space-y-1.5">
                    <FormLabel>
                      WhatsApp Number{" "}
                      <span className="text-muted-foreground font-normal">(হোয়াট্সঅ্যাপ নম্বর)</span>
                    </FormLabel>
                    <div className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem className="w-[100px] shrink-0 space-y-0">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-border/60 focus:ring-primary/50">
                                  <SelectValue placeholder="+91" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[250px]">
                                {COUNTRY_CODES.map((item, idx) => (
                                  <CountrySelectItem
                                    key={`${item.code}-${item.name}-${idx}`}
                                    value={`${item.code}_${item.name}`}
                                    flag={item.flag}
                                    code={item.code}
                                    countryName={item.name}
                                  />
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="whatsappNumber"
                        render={({ field }) => (
                          <FormItem className="flex-1 space-y-0">
                            <FormControl>
                              <Input
                                placeholder="17XX XXXXXX"
                                className="border-border/60 focus-visible:ring-primary/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="mt-1.5" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

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
