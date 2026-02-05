"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherStats } from "@/hooks/use-teacher-stats";
import { FileText, Folder, Users } from "lucide-react";

interface TeacherStatsCardsProps {
  stats: TeacherStats;
  loading: boolean;
  onStudentsClick: () => void;
}

export function TeacherStatsCards({
  stats,
  loading,
  onStudentsClick,
}: TeacherStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Course Groups</CardTitle>
          <Folder className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.courseGroups}
          </div>
          <p className="text-xs text-muted-foreground">Active course groups</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.batches}
          </div>
          <p className="text-xs text-muted-foreground">Active batches</p>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:bg-accent transition-colors"
        onClick={onStudentsClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.students}
          </div>
          <p className="text-xs text-muted-foreground">Enrolled students</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {loading ? "..." : stats.pendingEnrollments}
          </div>
          <p className="text-xs text-muted-foreground">Enrollment requests</p>
        </CardContent>
      </Card>
    </div>
  );
}
