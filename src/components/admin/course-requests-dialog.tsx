"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBatchRequest,
  subscribeBatchRequestsByCourse,
} from "@/lib/services/firestore";
import type { Course } from "@/lib/models/course";
import type { BatchRequest } from "@/lib/models/batch-request";
import {
  Copy,
  Loader2,
  Phone,
  Search,
  Trash2,
  Users,
} from "lucide-react";

interface CourseRequestsDialogProps {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseRequestsDialog({
  course,
  isOpen,
  onOpenChange,
}: CourseRequestsDialogProps) {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<BatchRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (!isOpen || !course) return;

    setLoading(true);
    const unsubscribe = subscribeBatchRequestsByCourse(course.id, (data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, course]);

  if (!course) return null;

  const filteredRequests = requests.filter((req) => {
    const query = searchQuery.toLowerCase();
    return (
      req.name.toLowerCase().includes(query) ||
      req.city.toLowerCase().includes(query) ||
      req.whatsapp.toLowerCase().includes(query) ||
      req.preferredLanguage.toLowerCase().includes(query)
    );
  });

  const handleCopyAllWhatsapp = () => {
    if (requests.length === 0) return;
    const numbers = requests.map((r) => r.whatsapp.trim()).join(", ");
    navigator.clipboard.writeText(numbers);
    toast({
      title: "Copied!",
      description: `Copied ${requests.length} WhatsApp numbers to clipboard.`,
    });
  };

  const handleCopySingle = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({
      title: "Number Copied",
      description: `WhatsApp number ${num} copied to clipboard.`,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      await deleteBatchRequest(id);
      toast({
        title: "Deleted",
        description: "Future batch request deleted successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col gap-4 rounded-xl bg-background p-6 shadow-2xl border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Requests: {course.title}
          </DialogTitle>
          <DialogDescription>
            View all students who requested enrollment for a future batch of this course.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, language..."
              className="pl-9 w-full sm:max-w-xs focus:ring-primary border-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          {requests.length > 0 && (
            <Button
              onClick={handleCopyAllWhatsapp}
              variant="outline"
              className="flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/10 shrink-0"
            >
              <Copy className="h-4 w-4" />
              Copy All WhatsApp Numbers ({requests.length})
            </Button>
          )}
        </div>

        {/* Request table / listing */}
        <div className="flex-1 overflow-auto rounded-lg border border-border/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="font-semibold text-foreground">No requests found</p>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                {searchQuery
                  ? "Try searching for something else or clear the query."
                  : "No students have requested a future batch of this course yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="font-semibold">WhatsApp Number</TableHead>
                  <TableHead className="font-semibold">Language</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {req.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {req.name}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {req.city}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">{req.whatsapp}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => handleCopySingle(req.whatsapp)}
                          title="Copy WhatsApp"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://wa.me/${req.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-md text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
                          title="Message on WhatsApp"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.preferredLanguage}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(req.id)}
                        title="Delete Request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
