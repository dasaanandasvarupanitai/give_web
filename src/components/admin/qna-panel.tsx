"use client";

import { Loader2 } from "lucide-react";
import { ModeratedQuestionsSection } from "./moderated-questions-section";
import { PendingQuestionsSection } from "./pending-questions-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQnaHandlers } from "./hooks/use-qna-handlers";

export function QnAPanel() {
  const [activeTab, setActiveTab] = useState("approved");
  const [hasOpened, setHasOpened] = useState({
    approved: true,
    disapproved: false,
    pending: false,
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (!hasOpened[value as keyof typeof hasOpened]) {
      setHasOpened((prev) => ({ ...prev, [value]: true }));
    }
  };

  const {
    approved,
    disapproved,
    handlePendingAddQuestionRef,
    handlePendingStatusChange,
    handleApprovedStatusChange,
    handleDisapprovedStatusChange,
    handleDelete,
    handleEdit,
    handleAnswerSaved,
  } = useQnaHandlers(hasOpened);

  const isLoading = approved.loading || disapproved.loading;
  const loadError = approved.error ?? disapproved.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-destructive">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="disapproved">Disapproved</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="mt-0">
          <ModeratedQuestionsSection
            title="Approved"
            status="approved"
            questions={approved.questions}
            loadingMore={approved.loadingMore}
            hasMore={approved.hasMore}
            loadMore={approved.loadMore}
            fetchAllForExport={approved.fetchAllForExport}
            onStatusChange={handleApprovedStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAnswerSaved={handleAnswerSaved}
          />
        </TabsContent>

        <TabsContent value="disapproved" className="mt-0">
          <ModeratedQuestionsSection
            title="Disapproved"
            status="disapproved"
            questions={disapproved.questions}
            loadingMore={disapproved.loadingMore}
            hasMore={disapproved.hasMore}
            loadMore={disapproved.loadMore}
            onStatusChange={handleDisapprovedStatusChange}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAnswerSaved={handleAnswerSaved}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <PendingQuestionsSection
            enabled={hasOpened.pending}
            onStatusChange={handlePendingStatusChange}
            onAddQuestionRef={handlePendingAddQuestionRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
