"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StudentAnalytics } from "@/lib/types/analytics";

interface AnalyticsTableProps {
    analytics: StudentAnalytics[];
}

export function AnalyticsTable({ analytics }: AnalyticsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Submission Analytics</CardTitle>
                <CardDescription>
                    Detailed breakdown of each student's daily listening submissions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {analytics.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <p>No active students found in this batch</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">
                                        Total Tasks
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Submitted
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Percentage
                                    </TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.map((item) => (
                                    <TableRow key={item.student.id}>
                                        <TableCell className="font-medium">
                                            {item.enrollment.dikshaName ||
                                                item.enrollment.studentName ||
                                                item.student.name ||
                                                "Unknown Student"}
                                        </TableCell>
                                        <TableCell>{item.student.email || "No email"}</TableCell>
                                        <TableCell className="text-center">
                                            {item.totalDailyListeningTasks}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.submittedCount}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    item.percentage === 100
                                                        ? "default"
                                                        : item.percentage >= 80
                                                            ? "secondary"
                                                            : item.percentage >= 50
                                                                ? "outline"
                                                                : "destructive"
                                                }
                                            >
                                                {item.percentage}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.percentage === 100 ? (
                                                <Badge variant="default">Complete</Badge>
                                            ) : item.percentage >= 80 ? (
                                                <Badge variant="secondary">Good</Badge>
                                            ) : item.percentage >= 50 ? (
                                                <Badge variant="outline">Average</Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Needs Improvement
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
