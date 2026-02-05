"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import type { Submission } from "@/lib/models/submission";
import type { Task } from "@/lib/models/task";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";

interface SubmissionViewProps {
    task: Task;
    submission: Submission;
    withinGracePeriod: boolean;
    gracePeriodRemaining: number;
    onDelete: () => void;
    isDeleting: boolean;
}

export function SubmissionView({
    task,
    submission,
    withinGracePeriod,
    gracePeriodRemaining,
    onDelete,
    isDeleting,
}: SubmissionViewProps) {
    return (
        <Card>
            <CardContent className="py-12 text-center">
                <div className="text-orange-600 mb-4">
                    <CheckCircle2 className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Already Submitted</h3>
                <p className="text-muted-foreground mb-4">
                    You have already submitted this task.
                    {submission.status === "graded" && submission.grade !== undefined && (
                        <span className="block mt-2">
                            Grade: <strong>{submission.grade}/{task.maxPoints}</strong>
                        </span>
                    )}
                    {!withinGracePeriod && submission.status === "submitted" && (
                        <span className="block mt-2 text-sm text-orange-600">
                            The 15-minute grace period for editing has expired.
                        </span>
                    )}
                </p>

                {submission.fileUrls && submission.fileUrls.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                        <h4 className="font-semibold mb-2">Uploaded Files:</h4>
                        <div className="space-y-2">
                            {submission.fileUrls.map((url, index) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span>File {index + 1}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {submission.notes && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                        <h4 className="font-semibold mb-2">
                            {task.type === "dailyListening" ? "Text Submission:" : "Notes:"}
                        </h4>
                        <p className="text-sm whitespace-pre-wrap">{submission.notes}</p>
                    </div>
                )}

                {submission.recordingUrl && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                        <h4 className="font-semibold mb-2">Audio Recording:</h4>
                        <audio controls src={submission.recordingUrl} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                )}

                {submission.feedback && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                        <h4 className="font-semibold mb-2">Feedback:</h4>
                        <p className="text-sm">{submission.feedback}</p>
                    </div>
                )}

                {withinGracePeriod && submission.status === "submitted" && (
                    <div className="mt-4">
                        <Button
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete and Resubmit"
                            )}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                            You have {gracePeriodRemaining} minute{gracePeriodRemaining !== 1 ? 's' : ''} remaining to delete and resubmit.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
