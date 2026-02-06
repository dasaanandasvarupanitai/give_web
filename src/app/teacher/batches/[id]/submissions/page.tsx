"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteSubmissionDialog } from "@/components/teacher/submissions/delete-submission-dialog";
import {
  PreviewFile,
  SubmissionPreviewDialog,
} from "@/components/teacher/submissions/submission-preview-dialog";
import { SubmissionsList } from "@/components/teacher/submissions/submissions-list";
import { useTeacher } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import { useSubmissionHandlers } from "@/hooks/use-submission-handlers";
import { useSubmissionsData } from "@/hooks/use-submissions-data";
import { getFileType } from "@/lib/utils/file-helpers";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BatchSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const { toast } = useToast();
  const { isTeacher, initializing: teacherInitializing } = useTeacher();

  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const {
    batch,
    tasksWithFiles,
    studentsMap,
    enrollmentsMap,
    loading,
    refresh,
  } = useSubmissionsData({ batchId, isTeacher, toast });

  const {
    state: deleteState,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteTextClick,
    handleDeleteTextConfirm,
    handleDeleteAllClick,
    handleDeleteAllConfirm,
    handleFileSelect,
    handleSelectAll,
    getSelectedFilesForTask,
    handleDeleteSelectedClick,
    handleDeleteSelectedConfirm,
  } = useSubmissionHandlers({
    batchId,
    tasksWithFiles,
    onSuccess: refresh,
    toast,
  });

  useEffect(() => {
    if (!teacherInitializing && !isTeacher) {
      router.push("/teacher");
    }
  }, [isTeacher, teacherInitializing, router]);

  const handlePreview = (fileUrl: string, fileName: string) => {
    const type = getFileType(fileName);
    if (type === "other") {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPreviewFile({ url: fileUrl, name: fileName, type });
  };

  const handlePreviewText = (text: string, title?: string) => {
    setPreviewFile({
      url: "",
      name: title || "Text Submission",
      type: "text",
      text,
    });
  };

  if (teacherInitializing || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You must be a teacher to access this page.
          </p>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Batch not found</h1>
          <Button onClick={() => router.push("/teacher")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/teacher/batches/${batchId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batch Details
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
            Submissions - {batch.name}
          </h1>
          <p className="text-muted-foreground">
            View and manage all submitted files grouped by task
          </p>
        </div>
      </div>

      {tasksWithFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tasks found for this batch
            </p>
          </CardContent>
        </Card>
      ) : (
        <SubmissionsList
          tasksWithFiles={tasksWithFiles}
          enrollmentsMap={enrollmentsMap}
          studentsMap={studentsMap}
          selectedFiles={deleteState.selectedFiles}
          onSelectFile={handleFileSelect}
          onSelectAll={handleSelectAll}
          onPreview={handlePreview}
          onPreviewText={handlePreviewText}
          onDeleteFile={handleDeleteClick}
          onDeleteText={handleDeleteTextClick}
          onDeleteSelected={handleDeleteSelectedClick}
          getSelectedFilesForTask={getSelectedFilesForTask}
        />
      )}

      {/* Preview dialog */}
      <SubmissionPreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
      />

      {/* Delete Single File Dialog */}
      <DeleteSubmissionDialog
        open={deleteState.deleteDialogOpen}
        onOpenChange={(open) =>
          !open && handleDeleteClick("", "", "", "")
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteState.deleting}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteState.fileToDelete?.fileName}"? This action cannot be undone.`}
      />

      {/* Delete Text Submission Dialog */}
      <DeleteSubmissionDialog
        open={deleteState.deleteTextDialogOpen}
        onOpenChange={(open) => !open && handleDeleteTextClick("", "")}
        onConfirm={handleDeleteTextConfirm}
        isDeleting={deleteState.deletingText}
        title="Delete Text Submission"
        description="Are you sure you want to delete this text submission? This action cannot be undone."
      />

      {/* Delete All Files Dialog */}
      <DeleteSubmissionDialog
        open={deleteState.deleteAllDialogOpen}
        onOpenChange={() => { }}
        onConfirm={handleDeleteAllConfirm}
        isDeleting={deleteState.deletingAll}
        title="Delete All Files"
        description={`Are you sure you want to delete all files for "${deleteState.taskToDeleteAll?.title}"?`}
        confirmText="Delete All"
      />

      {/* Delete Selected Files Dialog */}
      <DeleteSubmissionDialog
        open={deleteState.deleteSelectedDialogOpen}
        onOpenChange={() => { }}
        onConfirm={handleDeleteSelectedConfirm}
        isDeleting={deleteState.deletingSelected}
        title="Delete Selected Files"
        description={`Are you sure you want to delete ${deleteState.selectedFiles.size} selected file(s)?`}
        confirmText="Delete Selected"
      />
    </div>
  );
}
