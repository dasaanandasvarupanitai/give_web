/**
 * User Roles System
 * 
 * This module handles user roles (teacher/student) stored in Firestore.
 * Matches the mobile app structure using the users collection with a role field.
 * Users are automatically assigned roles based on their actions:
 * - Teachers: Manually assigned in Firestore (via teachers collection)
 * - Students: Automatically assigned when they enroll in a course/batch
 */

import { db } from "@/lib/firebase";
import type { UserRole } from "@/lib/models/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Get user role from Firestore users collection
 * @param userId - The Firebase Auth user ID
 * @returns The user's role or null if not found
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return (data.role as UserRole) || null;
    }

    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Set user role in Firestore users collection
 * @param userId - The Firebase Auth user ID
 * @param email - The user's email address
 * @param role - The role to assign (teacher or student)
 */
export async function setUserRole(
  userId: string,
  email: string,
  role: "teacher" | "student"
): Promise<void> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const now = Timestamp.now();

    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        role,
        updatedAt: now,
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        email: email.toLowerCase().trim(),
        name: email.split("@")[0], // Default name from email
        role,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });
    }
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
}

/**
 * Initialize a teacher in Firestore
 * This should be run once to set up the first teacher
 * @param email - The teacher's email address
 */
export async function initializeTeacher(email: string): Promise<void> {
  try {
    // First, we need to find the user by email
    // Since we don't have the userId, we'll need to search by email
    // For now, we'll create a document with email as the key in a separate collection
    // Or we can use a query to find the user
    
    // Alternative: Store teacher emails in a separate collection
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    await setDoc(teacherRef, {
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      isActive: true,
    });
  } catch (error) {
    console.error("Error initializing teacher:", error);
    throw error;
  }
}

/**
 * Check if an email is a teacher
 * @param email - The email address to check
 * @returns true if the email is registered as a teacher
 */
export async function isTeacherEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  try {
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    const teacherSnap = await getDoc(teacherRef);
    return teacherSnap.exists() && teacherSnap.data()?.isActive === true;
  } catch (error) {
    console.error("Error checking teacher email:", error);
    return false;
  }
}

/**
 * Get user role data (for a specific user by userId)
 * Teacher status is ONLY determined by the teachers collection (single source of truth)
 * The users collection role field is only used for student role
 */
export async function getUserRoleData(
  userId: string,
  email: string | null | undefined
): Promise<UserRole | null> {
  // ONLY check teachers collection for teacher status (single source of truth)
  if (email) {
    const isTeacher = await isTeacherEmail(email);
    if (isTeacher) {
      // Update users collection for consistency (but don't rely on it for teacher validation)
      await setUserRole(userId, email, "teacher");
      return "teacher";
    }
  }

  // If not a teacher, check users collection for student role
  const role = await getUserRole(userId);
  if (role === "student") {
    return "student";
  }

  return null;
}

/**
 * Automatically assign student role when user enrolls in a course/batch
 * This should be called when a user successfully enrolls
 * @param userId - The Firebase Auth user ID
 * @param email - The user's email address
 */
export async function assignStudentRole(
  userId: string,
  email: string
): Promise<void> {
  // Only assign student role if user is not an active teacher
  // Check teachers collection (single source of truth for teacher status)
  const isTeacher = await isTeacherEmail(email);
  if (!isTeacher) {
    await setUserRole(userId, email, "student");
  }
}

/**
 * Add a teacher (only callable by existing teachers)
 * @param email - The email address to add as teacher
 */
export async function addTeacher(email: string): Promise<void> {
  try {
    const teacherRef = doc(db, "teachers", email.toLowerCase().trim());
    await setDoc(teacherRef, {
      email: email.toLowerCase().trim(),
      createdAt: new Date(),
      isActive: true,
    });
  } catch (error) {
    console.error("Error adding teacher:", error);
    throw error;
  }
}

/**
 * Remove a teacher (only callable by existing teachers)
 * @param email - The email address to remove from teachers
 */
export async function removeTeacher(email: string): Promise<void> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Deactivate teacher in teachers collection
    const teacherRef = doc(db, "teachers", normalizedEmail);
    await setDoc(teacherRef, {
      email: normalizedEmail,
      isActive: false,
      deactivatedAt: new Date(),
    }, { merge: true });

    // 2. Update all users with this email to have "student" role instead of "teacher"
    const usersRef = collection(db, "users");
    const usersQuery = query(usersRef, where("email", "==", normalizedEmail));
    const usersSnapshot = await getDocs(usersQuery);
    
    const now = Timestamp.now();
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.role === "teacher") {
        await updateDoc(userDoc.ref, {
          role: "student",
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    console.error("Error removing teacher:", error);
    throw error;
  }
}
