import type { Enrollment } from "@/lib/models/enrollment";
import type { Submission } from "@/lib/models/submission";
import type { User } from "@/lib/models/user";

export interface StudentAnalytics {
    student: User;
    enrollment: Enrollment;
    totalDailyListeningTasks: number;
    submittedCount: number;
    percentage: number;
    submissions: Submission[];
}
