"use client";

import { useAuthUser } from "@/hooks/use-auth";
import { getUserRoleData } from "@/lib/user-roles";
import { useEffect, useState } from "react";

/**
 * Hook to check if the current authenticated user is a teacher
 * Teacher validation ONLY comes from the teachers collection (single source of truth)
 * This also ensures the user's role is set in the users collection for Firestore rules consistency
 * @returns Object with isTeacher boolean and loading state
 */
export function useTeacher() {
  const { user, initializing: authInitializing } = useAuthUser();
  const [isTeacher, setIsTeacher] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    async function checkTeacherRole() {
      if (!user) {
        setIsTeacher(false);
        setRoleLoading(false);
        return;
      }

      try {
        // getUserRoleData checks ONLY the teachers collection for teacher status
        // It also updates the users collection for consistency but doesn't rely on it
        const role = await getUserRoleData(user.uid, user.email || null);
        const isTeacherUser = role === "teacher";
        setIsTeacher(isTeacherUser);
      } catch (error) {
        console.error("Error checking teacher role:", error);
        setIsTeacher(false);
      } finally {
        setRoleLoading(false);
      }
    }

    if (!authInitializing) {
      checkTeacherRole();
    }
  }, [user, authInitializing]);

  return {
    isTeacher,
    initializing: authInitializing || roleLoading,
    user,
  };
}
