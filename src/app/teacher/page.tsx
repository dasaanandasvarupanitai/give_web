"use client";

import { BatchManagement } from "@/components/teacher/batch-management";
import { CourseGroupsManagement } from "@/components/teacher/course-groups";
import { TeacherManagement } from "@/components/teacher/teacher-management";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthUser } from "@/hooks/use-auth";
import { useTeacher } from "@/hooks/use-teacher";
import {
  getBatchesByCourseGroup,
  getCourseGroups,
  getEnrollmentsByBatch,
} from "@/lib/services/firestore";
import { FileText, Folder, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeacherDashboardPage() {
  const { isTeacher, initializing, user } = useTeacher();
  const { user: authUser } = useAuthUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    courseGroups: 0,
    batches: 0,
    students: 0,
    pendingEnrollments: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    // Redirect if not a teacher (after auth state is determined)
    if (!initializing && (!user || !isTeacher)) {
      router.push("/");
    }
  }, [isTeacher, initializing, user, router]);

  useEffect(() => {
    if (!authUser?.uid || !isTeacher) return;

    loadStats();
  }, [authUser?.uid, isTeacher]);

  const loadStats = async () => {
    if (!authUser?.uid) return;

    try {
      const courseGroups = await getCourseGroups(authUser.uid);
      let totalBatches = 0;
      let totalStudents = 0;
      let pendingEnrollments = 0;

      for (const cg of courseGroups) {
        const batches = await getBatchesByCourseGroup(cg.id);
        totalBatches += batches.length;

        for (const batch of batches) {
          const enrollments = await getEnrollmentsByBatch(batch.id);
          totalStudents += enrollments.filter((e) => e.status === "active").length;
          pendingEnrollments += enrollments.filter((e) => e.status === "pending").length;
        }
      }

      setStats({
        courseGroups: courseGroups.length,
        batches: totalBatches,
        students: totalStudents,
        pendingEnrollments,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Show loading state while checking auth
  if (initializing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting (or show access denied message)
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

      {/* Dashboard Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Groups</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "..." : stats.courseGroups}
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
              {loadingStats ? "..." : stats.batches}
            </div>
            <p className="text-xs text-muted-foreground">Active batches</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => router.push("/teacher/students")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? "..." : stats.students}
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
              {loadingStats ? "..." : stats.pendingEnrollments}
            </div>
            <p className="text-xs text-muted-foreground">Enrollment requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Tabs */}
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
