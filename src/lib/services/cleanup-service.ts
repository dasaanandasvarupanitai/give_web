import { deleteFileByUrl } from "./storage";
import { getSubmissionsByBatch, updateSubmission, getTasksByBatch } from "./firestore";
import { TaskType } from "../models/task";

interface CleanupOptions {
    batchId: string;
    taskType: TaskType;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Cleans up submission storage for a specific batch and task type within a date range.
 * Deletes physical files from Firebase Storage but preserves the Firestore records for analytics.
 */
export async function cleanupSubmissionsStorage({
    batchId,
    taskType,
    startDate,
    endDate,
}: CleanupOptions): Promise<{ processed: number; deleted: number; errors: number }> {
    try {
        // 1. Get all tasks for this batch to filter by task type
        const tasks = await getTasksByBatch(batchId, true);
        const targetTaskIds = new Set(
            tasks.filter((t) => t.type === taskType).map((t) => t.id)
        );

        if (targetTaskIds.size === 0) {
            return { processed: 0, deleted: 0, errors: 0 };
        }

        // 2. Get all submissions for this batch
        const allSubmissions = await getSubmissionsByBatch(batchId);

        // 3. Filter submissions by task ID and date range
        const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        const matchingSubmissions = allSubmissions.filter((s) => {
            // ONLY tasks matching the selected type
            if (!targetTaskIds.has(s.taskId)) return false;

            // Skip already archived ones
            if (s.isArchived) return false;

            const subDate = s.submittedAt || s.createdAt;
            if (!subDate) return false; // This shouldn't happen but is a safety check

            const subTimestamp = new Date(subDate).getTime();

            // If user selected a start date, skip things before it
            if (startTimestamp && subTimestamp < startTimestamp) return false;

            // If user selected an end date (INCLUSIVE of the whole day), skip things after it
            if (endTimestamp && subTimestamp > endTimestamp) return false;

            return true;
        });

        let processed = 0;
        let deleted = 0;
        let errors = 0;

        // 4. Process submissions in parallel chunks (e.g., 20 at a time) for speed
        const CHUNK_SIZE = 20;
        for (let i = 0; i < matchingSubmissions.length; i += CHUNK_SIZE) {
            const chunk = matchingSubmissions.slice(i, i + CHUNK_SIZE);
            const chunkResults = await Promise.allSettled(
                chunk.map(async (submission) => {
                    const filesToDelete: string[] = [];

                    if (submission.fileUrls && submission.fileUrls.length > 0) {
                        filesToDelete.push(...submission.fileUrls);
                    }
                    if (submission.recordingUrl) {
                        filesToDelete.push(submission.recordingUrl);
                    }

                    // Delete files from storage
                    if (filesToDelete.length > 0) {
                        await Promise.allSettled(
                            filesToDelete.map((url) => deleteFileByUrl(url).catch((err) => {
                                console.error(`Failed to delete file ${url}:`, err);
                            }))
                        );
                    }

                    // Update Firestore record
                    await updateSubmission(submission.id, {
                        fileUrls: [],
                        recordingUrl: "",
                        notes: "",
                        isArchived: true,
                    });

                    return filesToDelete.length;
                })
            );

            // Accumulate results from this chunk
            chunkResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    processed++;
                    deleted += result.value;
                } else {
                    errors++;
                    console.error("Error in cleanup chunk:", result.reason);
                }
            });
        }

        return { processed, deleted, errors };
    } catch (error) {
        console.error("Storage cleanup failed:", error);
        throw error;
    }
}
