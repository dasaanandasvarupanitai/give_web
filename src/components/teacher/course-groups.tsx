"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { CourseGroup } from "@/lib/models/course-group";
import {
  createCourseGroup,
  deleteCourseGroup,
  subscribeCourseGroups,
  updateCourseGroup
} from "@/lib/services/firestore";
import { Edit, Folder, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function CourseGroupsManagement() {
  const { user } = useAuthUser();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time updates
    const unsubscribe = subscribeCourseGroups(user.uid, (groups) => {
      setCourseGroups(groups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      console.error("No user UID found");
      toast({
        title: "Error",
        description: "You must be logged in to create a course group",
        variant: "destructive",
      });
      return;
    }
    console.log("Form submitted, user UID:", user.uid, "email:", user.email);

    if (!formData.name.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        await updateCourseGroup(editingId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
        toast({
          title: "Success",
          description: "Course group updated successfully",
        });
      } else {
        console.log("Creating course group with data:", {
          name: formData.name.trim(),
          description: formData.description.trim(),
          teacherId: user.uid,
        });
        const courseGroupId = await createCourseGroup({
          name: formData.name.trim(),
          description: formData.description.trim(),
          teacherId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          batchCount: 0,
        });
        console.log("Course group created successfully with ID:", courseGroupId);
        toast({
          title: "Success",
          description: "Course group created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating/updating course group:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (courseGroup: CourseGroup) => {
    setFormData({
      name: courseGroup.name,
      description: courseGroup.description,
    });
    setIsEditing(true);
    setEditingId(courseGroup.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course group? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteCourseGroup(id);
      toast({
        title: "Success",
        description: "Course group deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course group",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setIsEditing(false);
    setEditingId(null);
  };

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
              <Folder className="h-5 w-5" />
              Course Groups
            </CardTitle>
            <CardDescription>
              Organize your courses into groups
            </CardDescription>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Course Group
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? "Edit Course Group" : "Create Course Group"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? "Update the course group details"
                      : "Create a new course group to organize your courses"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Course Group Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., ISKCON Disciple Course"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this course group covers..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditing ? "Updating..." : "Creating..."}
                      </>
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {courseGroups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No course groups yet. Create your first course group to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courseGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(group)}
                        className="border border-orange-500"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group.id)}
                        className="text-destructive hover:text-destructive border border-orange-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {group.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{group.batchCount} batches</span>
                    <span>
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
