"use client";

import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/use-auth";
import type { Batch } from "@/lib/models/batch";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TaskFormDialog } from "./task-form-dialog";

interface TaskCreationProps {
  batch: Batch;
  onTaskCreated?: () => void;
}

export function TaskCreation({ batch, onTaskCreated }: TaskCreationProps) {
  const { user } = useAuthUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Task
      </Button>

      {user?.uid && (
        <TaskFormDialog
          mode="create"
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          batchId={batch.id}
          batchName={batch.name}
          teacherId={user.uid}
          onSuccess={onTaskCreated}
        />
      )}
    </>
  );
}
