"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBatchRequest,
  subscribeBatchRequests,
  subscribeCourses,
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
  BookOpen,
} from "lucide-react";

export function GlobalRequestsSection({ enabled = true }: { enabled?: boolean }) {
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<BatchRequest[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [loadingCourses, setLoadingCourses] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("all");

  React.useEffect(() => {
    if (!enabled) return;

    // Subscribe to all courses
    const unsubscribeCourses = subscribeCourses(
      (data) => {
        setCourses(data);
        setLoadingCourses(false);
      },
      (error) => {
        console.error("Error subscribing to courses:", error);
        setLoadingCourses(false);
      }
    );

    // Subscribe to all batch requests
    const unsubscribeRequests = subscribeBatchRequests((data) => {
      setRequests(data);
      setLoadingRequests(false);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeRequests();
    };
  }, [enabled]);

  if (!enabled) return null;

  // Filter requests based on course and query
  const filteredRequests = requests.filter((req) => {
    const matchesCourse =
      selectedCourseId === "all" || req.courseId === selectedCourseId;
    const matchesQuery =
      searchQuery === "" ||
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.whatsapp.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.preferredLanguage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCourse && matchesQuery;
  });

  const handleCopyAllWhatsapp = () => {
    if (filteredRequests.length === 0) return;
    const numbers = filteredRequests.map((r) => r.whatsapp.trim()).join(", ");
    navigator.clipboard.writeText(numbers);
    toast({
      title: "Copied!",
      description: `Copied ${filteredRequests.length} WhatsApp numbers to clipboard.`,
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

  const isLoading = loadingRequests || loadingCourses;

  return (
    <div className="space-y-6">
      {/* Top statistics summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Requests
            </p>
            <h3 className="text-2xl font-bold font-headline mt-0.5">
              {requests.length}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Filtered Requests
            </p>
            <h3 className="text-2xl font-bold font-headline mt-0.5">
              {filteredRequests.length}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm flex items-center gap-4 sm:col-span-2 md:col-span-1">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Courses Tracked
            </p>
            <h3 className="text-2xl font-bold font-headline mt-0.5">
              {courses.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and control controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, course..."
              className="pl-9 w-full focus:ring-primary border-orange-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Course filter select */}
          <div className="w-full sm:max-w-xs">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-full focus:ring-primary border-orange-500">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Copy All WhatsApps button */}
        {filteredRequests.length > 0 && (
          <Button
            onClick={handleCopyAllWhatsapp}
            variant="outline"
            className="flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/10 w-full md:w-auto self-start md:self-auto"
          >
            <Copy className="h-4 w-4" />
            Copy Filtered WhatsApps ({filteredRequests.length})
          </Button>
        )}
      </div>

      {/* Requests table listing */}
      <div className="rounded-lg border border-border/40 overflow-hidden bg-card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading request data...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-lg font-semibold text-foreground">No requests found</p>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mx-auto">
              {searchQuery || selectedCourseId !== "all"
                ? "No matches found for your current filter/search settings."
                : "No students have requested future batch enrollments yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Course Title</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">City</TableHead>
                  <TableHead className="font-semibold">WhatsApp Number</TableHead>
                  <TableHead className="font-semibold">Language</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {req.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground max-w-xs truncate">
                      {req.courseTitle}
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
          </div>
        )}
      </div>
    </div>
  );
}
