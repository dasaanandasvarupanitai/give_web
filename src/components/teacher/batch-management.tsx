"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Users } from "lucide-react";
import { BatchFormDialog } from "./batch-form-dialog";
import { BatchCard } from "./batches/batch-card";
import { useBatchManagement } from "./hooks/use-batch-management";

export function BatchManagement() {
  const {
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
  } = useBatchManagement();

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
              onSuccess={() => { }}
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
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCopyCode={handleCopyCode}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
