"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createBatchRequest } from "@/lib/services/firestore";
import type { Course } from "@/lib/models/course";
import { Loader2, MessageSquare } from "lucide-react";

interface BatchRequestDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchRequestDialog({
  course,
  isOpen,
  onOpenChange,
}: BatchRequestDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    city: "",
    whatsapp: "",
    preferredLanguage: "",
  });

  // Reset form when dialog opens/closes or course changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        city: "",
        whatsapp: "",
        preferredLanguage: "",
      });
    }
  }, [isOpen, course]);

  if (!course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.city.trim()) {
      toast({
        title: "City Required",
        description: "Please enter your city.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.whatsapp.trim()) {
      toast({
        title: "WhatsApp Number Required",
        description: "Please enter your WhatsApp number.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.preferredLanguage) {
      toast({
        title: "Language Preferred Required",
        description: "Please select your preferred language.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await createBatchRequest({
        courseId: course.id,
        courseTitle: course.title,
        name: formData.name.trim(),
        city: formData.city.trim(),
        whatsapp: formData.whatsapp.trim(),
        preferredLanguage: formData.preferredLanguage,
      });

      toast({
        title: "Request Submitted!",
        description: `Thank you! Your request for the future batch of "${course.title}" has been registered successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting batch request:", error);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg rounded-xl md:p-6 p-4 gap-4 bg-background shadow-2xl border border-border/50 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-2 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-headline font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Request Future Batch
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            You are requesting enrollment for a future batch of{" "}
            <span className="font-semibold text-foreground">{course.title}</span>
            . Once a new batch begins for this course, we will reach out to you
            directly via WhatsApp or call to share the schedule and registration
            details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
          <div className="space-y-4 overflow-y-auto flex-1 px-1.5 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="req-name" className="text-sm font-semibold text-foreground">
                Full Name
              </Label>
              <Input
                id="req-name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isSubmitting}
                className="w-full focus:ring-primary focus:border-primary border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-city" className="text-sm font-semibold text-foreground">
                City
              </Label>
              <Input
                id="req-city"
                placeholder="Enter your city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                disabled={isSubmitting}
                className="w-full focus:ring-primary focus:border-primary border-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-whatsapp" className="text-sm font-semibold text-foreground">
                WhatsApp Number
              </Label>
              <Input
                id="req-whatsapp"
                placeholder="e.g. +1234567890"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
                disabled={isSubmitting}
                className="w-full focus:ring-primary focus:border-primary border-orange-500"
              />
              <p className="text-[11px] text-muted-foreground/80">
                Please include country code for easy contact.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-lang" className="text-sm font-semibold text-foreground">
                Preferred Language
              </Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, preferredLanguage: val }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="req-lang" className="w-full focus:ring-primary border-orange-500">
                  <SelectValue placeholder="Select preferred language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Bengali">Bengali (বাংলা)</SelectItem>
                  <SelectItem value="Hindi">Hindi (हिंदी)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
