"use client";

import { BatchManagement } from "@/components/teacher/batch-management";
import { CourseGroupsManagement } from "@/components/teacher/course-groups";
import { TeacherStatsCards } from "@/components/teacher/dashboard/teacher-stats-cards";
import { TeacherManagement } from "@/components/teacher/teacher-management";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthUser } from "@/hooks/use-auth";
import { useTeacher } from "@/hooks/use-teacher";
import { useTeacherStats } from "@/hooks/use-teacher-stats";
import { Folder, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherDashboardPage() {
  const { isTeacher, initializing, user } = useTeacher();
  const { user: authUser } = useAuthUser();
  const router = useRouter();

  const { stats, loading: loadingStats } = useTeacherStats(
    authUser?.uid,
    isTeacher
  );

  useEffect(() => {
    if (!initializing && (!user || !isTeacher)) {
      router.push("/");
    }
  }, [isTeacher, initializing, user, router]);

  if (initializing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || !isTeacher) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have permission to access this page.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your course groups, batches, and students from here
        </p>
      </div>

      <TeacherStatsCards
        stats={stats}
        loading={loadingStats}
        onStudentsClick={() => router.push("/teacher/students")}
      />

      <Tabs defaultValue="course-groups" className="w-full">
        <TabsList className="grid grid-cols-3 gap-2 w-full mb-16">
          <TabsTrigger
            value="course-groups"
            className="flex items-center justify-center"
          >
            <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Groups</span>
          </TabsTrigger>
          <TabsTrigger
            value="batches"
            className="flex items-center justify-center"
          >
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Batches</span>
          </TabsTrigger>
          <TabsTrigger
            value="teachers"
            className="flex items-center justify-center"
          >
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Teachers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="course-groups" className="mt-6">
          <CourseGroupsManagement />
        </TabsContent>

        <TabsContent value="batches" className="mt-6">
          <BatchManagement />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <TeacherManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
