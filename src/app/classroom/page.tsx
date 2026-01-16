"use client";

import { StudentDashboard } from "@/components/student/student-dashboard";
import { useAuthUser } from "@/hooks/use-auth";

export default function ClassroomPage() {
  const { user, initializing } = useAuthUser();

  if (initializing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold mb-4">Classroom</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access your classroom.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Classroom</h1>
        <p className="text-muted-foreground">
          Manage your courses and batches here
        </p>
      </div>

      <StudentDashboard />
    </div>
  );
}
