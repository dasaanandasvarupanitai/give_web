"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpandableDescription } from "@/components/ui/expandable-description";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import {
  deleteBatch,
  getCourseGroups,
  subscribeBatchesByCourseGroup,
} from "@/lib/services/firestore";
import { Check, Copy, Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BatchFormDialog } from "./batch-form-dialog";

export function BatchManagement() {
  const { user } = useAuthUser();
  const router = useRouter();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;

    loadCourseGroups();
  }, [user]);

  useEffect(() => {
    if (selectedCourseGroupId) {
      loadBatches(selectedCourseGroupId);
    } else {
      setBatches([]);
    }
  }, [selectedCourseGroupId]);

  const loadCourseGroups = async () => {
    if (!user?.uid) return;
    try {
      const groups = await getCourseGroups(user.uid);
      setCourseGroups(groups);
      if (groups.length > 0 && !selectedCourseGroupId) {
        setSelectedCourseGroupId(groups[0].id);
      }
      setLoading(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load course groups",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadBatches = (courseGroupId: string) => {
    const unsubscribe = subscribeBatchesByCourseGroup(courseGroupId, (batches) => {
      setBatches(batches);
    });
    return unsubscribe;
  };

  const handleCreate = () => {
    setDialogMode("create");
    setSelectedBatch(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (batch: Batch) => {
    setDialogMode("edit");
    setSelectedBatch(batch);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, courseGroupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this batch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteBatch(id, courseGroupId);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const selectedCourseGroup = courseGroups.find(
    (cg) => cg.id === selectedCourseGroupId
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Batch Management
            </CardTitle>
            <CardDescription>
              Create and manage batches for your course groups
            </CardDescription>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!selectedCourseGroupId || courseGroups.length === 0}
            className="w-full sm:w-auto border border-orange-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Batch
          </Button>

          {user?.uid && selectedCourseGroupId && (
            <BatchFormDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              mode={dialogMode}
              initialData={selectedBatch}
              courseGroupId={selectedCourseGroupId}
              courseGroupName={selectedCourseGroup?.name}
              teacherId={user.uid}
              onSuccess={() => {
                // Determine if we need to reload anything or if subscription handles it
                // Subscription handles list updates, so nothing manual needed
              }}
            />
          )}

        </div>
      </CardHeader>
      <CardContent>
        {courseGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Create a course group first to manage batches.</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label htmlFor="course-group-select">Filter by Course Group</Label>
              <Select
                value={selectedCourseGroupId || ""}
                onValueChange={setSelectedCourseGroupId}
              >
                <SelectTrigger id="course-group-select" className="mt-2 border border-orange-500">
                  <SelectValue placeholder="Select a course group" />
                </SelectTrigger>
                <SelectContent>
                  {courseGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {batches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No batches yet. Create your first batch to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {batches.map((batch) => (
                  <Card key={batch.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg">{batch.name}</CardTitle>
                          {batch.description && (
                            <CardDescription className="mt-1">
                              <ExpandableDescription text={batch.description} maxLines={2} />
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1 self-start sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(batch)}
                            className="border border-orange-500"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(batch.id, batch.courseGroupId)}
                            className="text-destructive hover:text-destructive border border-orange-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 bg-muted rounded">
                          <span className="text-sm font-medium">Class Code:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono break-all">{batch.classCode}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleCopyCode(batch.classCode)}
                            >
                              {copiedCode === batch.classCode ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span>{batch.studentCount} students</span>
                          {batch.startDate && (
                            <span>
                              Starts {new Date(batch.startDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border border-orange-500"
                          onClick={() => router.push(`/teacher/batches/${batch.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
