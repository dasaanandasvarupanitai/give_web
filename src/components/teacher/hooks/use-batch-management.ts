"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import {
  deleteBatch,
  getCourseGroups,
  subscribeBatchesByCourseGroup,
} from "@/lib/services/firestore";

export function useBatchManagement() {
  const { user } = useAuthUser();
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedCourseGroupId, setSelectedCourseGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid) return;
    loadCourseGroups();
  }, [user]);

  useEffect(() => {
    if (selectedCourseGroupId) {
      const unsubscribe = loadBatches(selectedCourseGroupId);
      return () => unsubscribe();
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
    return subscribeBatchesByCourseGroup(courseGroupId, (batches) => {
      setBatches(batches);
    });
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
    if (!confirm("Are you sure you want to delete this batch? This action cannot be undone.")) {
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
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
  };

  const selectedCourseGroup = courseGroups.find((cg) => cg.id === selectedCourseGroupId);

  return {
    user,
    courseGroups,
    batches,
    selectedCourseGroupId,
    setSelectedCourseGroupId,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    selectedBatch,
    selectedCourseGroup,
    handleCreate,
    handleEdit,
    handleDelete,
    handleCopyCode,
  };
}
