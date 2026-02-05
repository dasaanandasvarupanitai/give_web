"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { StudentAnalytics } from "@/lib/types/analytics";

interface AnalyticsSummaryCardsProps {
    analytics: StudentAnalytics[];
    totalDailyListeningTasks: number;
}

export function AnalyticsSummaryCards({
    analytics,
    totalDailyListeningTasks,
}: AnalyticsSummaryCardsProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                    Overview of daily listening submissions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Total Daily Listening Tasks
                        </p>
                        <p className="text-2xl font-bold">{totalDailyListeningTasks}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Active Students
                        </p>
                        <p className="text-2xl font-bold">{analytics.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Average Submission Rate
                        </p>
                        <p className="text-2xl font-bold">
                            {analytics.length > 0
                                ? Math.round(
                                    analytics.reduce((sum, a) => sum + a.percentage, 0) /
                                    analytics.length
                                )
                                : 0}
                            %
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
