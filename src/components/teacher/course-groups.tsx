"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { CourseGroup } from "@/lib/models/course-group";
import {
  createCourseGroup,
  deleteCourseGroup,
  subscribeCourseGroups,
  updateCourseGroup
} from "@/lib/services/firestore";
import { Folder, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CourseGroupCard } from "./course-groups/course-group-card";
import { CourseGroupFormDialog } from "./course-groups/course-group-form-dialog";

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

    const unsubscribe = subscribeCourseGroups(user.uid, (groups) => {
      setCourseGroups(groups);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to create a course group",
        variant: "destructive",
      });
      return;
    }

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
        await createCourseGroup({
          name: formData.name.trim(),
          description: formData.description.trim(),
          teacherId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          batchCount: 0,
        });
        toast({
          title: "Success",
          description: "Course group created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
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

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    resetForm();
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
          <CourseGroupFormDialog
            isOpen={isDialogOpen}
            onOpenChange={handleDialogOpenChange}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
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
              <CourseGroupCard
                key={group.id}
                group={group}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
