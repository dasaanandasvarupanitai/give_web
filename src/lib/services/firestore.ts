/**
 * Firestore Service
 * 
 * Comprehensive service for all Firestore operations matching the mobile app functionality
 */

import { auth, db } from "@/lib/firebase";
import {
  batchToFirestore,
  type Batch,
  type BatchFirestore
} from "@/lib/models/batch";
import type {
  Comment,
  CommentFirestore
} from "@/lib/models/comment";
import type {
  CourseGroup,
  CourseGroupFirestore
} from "@/lib/models/course-group";
import type {
  Enrollment,
  EnrollmentFirestore
} from "@/lib/models/enrollment";
import type {
  Submission,
  SubmissionFirestore
} from "@/lib/models/submission";
import type {
  Task,
  TaskFirestore
} from "@/lib/models/task";
import type {
  User,
  UserFirestore
} from "@/lib/models/user";
import { assignStudentRole, isTeacherEmail, setUserRole } from "@/lib/user-roles";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

// Import conversion functions
import {
  batchFromFirestore
} from "@/lib/models/batch";
import {
  commentFromFirestore,
  commentToFirestore,
} from "@/lib/models/comment";
import {
  courseGroupFromFirestore,
  courseGroupToFirestore,
} from "@/lib/models/course-group";
import {
  enrollmentFromFirestore,
  enrollmentToFirestore,
} from "@/lib/models/enrollment";
import {
  submissionFromFirestore,
  submissionToFirestore,
} from "@/lib/models/submission";
import {
  taskFromFirestore,
  taskToFirestore,
} from "@/lib/models/task";
import {
  userFromFirestore,
} from "@/lib/models/user";
import { Course, CourseFirestore, courseFromFirestore, courseToFirestore } from "../models/course";
import { Quote, QuoteFirestore, quoteFromFirestore, quoteToFirestore } from "../models/quote";
import { TaskBookmark, TaskBookmarkFirestore, taskBookmarkFromFirestore, taskBookmarkToFirestore } from "../models/task-bookmark";
import { Testimonial, TestimonialFirestore, testimonialFromFirestore, testimonialToFirestore } from "../models/testimonial";

// ==================== Course Group Operations ====================

export async function createCourseGroup(
  courseGroup: Omit<CourseGroup, "id">
): Promise<string> {
  try {
    console.log("createCourseGroup called with:", courseGroup);
    
    // Ensure the user document exists and has teacher role
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || userDoc.data()?.role !== "teacher") {
        // Check if the email is in the teachers collection
        const isTeacher = await isTeacherEmail(currentUser.email);
        if (isTeacher) {
          console.log("Creating/updating user document with teacher role");
          // Automatically set the teacher role
          await setUserRole(currentUser.uid, currentUser.email, "teacher");
        } else {
          throw new Error("User is not authorized as a teacher. Please contact an administrator.");
        }
      }
    } else {
      throw new Error("User not authenticated");
    }
    
    const courseGroupRef = doc(collection(db, "courseGroups"));
    const fullCourseGroup = {
      ...courseGroup,
      id: courseGroupRef.id,
    };
    console.log("Full course group object:", fullCourseGroup);
    const courseGroupData: CourseGroupFirestore = courseGroupToFirestore(fullCourseGroup);
    console.log("Course group Firestore data:", courseGroupData);
    await setDoc(courseGroupRef, courseGroupData);
    console.log("Course group document written successfully");
    return courseGroupRef.id;
  } catch (error) {
    console.error("Error in createCourseGroup:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to create course group: ${error}`);
  }
}

export async function updateCourseGroup(
  id: string,
  courseGroup: Partial<CourseGroup>
): Promise<void> {
  try {
    const courseGroupRef = doc(db, "courseGroups", id);
    const updates: Partial<CourseGroupFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (courseGroup.name !== undefined) updates.name = courseGroup.name;
    if (courseGroup.description !== undefined)
      updates.description = courseGroup.description;
    if (courseGroup.imageUrl !== undefined)
      updates.imageUrl = courseGroup.imageUrl;
    if (courseGroup.isActive !== undefined)
      updates.isActive = courseGroup.isActive;

    await updateDoc(courseGroupRef, updates);
  } catch (error) {
    throw new Error(`Failed to update course group: ${error}`);
  }
}

export async function deleteCourseGroup(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "courseGroups", id));
  } catch (error) {
    throw new Error(`Failed to delete course group: ${error}`);
  }
}

export async function getCourseGroups(teacherId: string): Promise<CourseGroup[]> {
  try {
    // Return all active course groups for all teachers (all teachers should see everything)
    const q = query(
      collection(db, "courseGroups"),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    const courseGroups = snapshot.docs.map((doc) =>
      courseGroupFromFirestore(doc.id, doc.data() as CourseGroupFirestore)
    );
    // Sort in memory by createdAt descending
    courseGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return courseGroups;
  } catch (error) {
    throw new Error(`Failed to get course groups: ${error}`);
  }
}

export function subscribeCourseGroups(
  teacherId: string,
  callback: (courseGroups: CourseGroup[]) => void
): () => void {
  // Subscribe to all active course groups for all teachers (all teachers should see everything)
  const q = query(
    collection(db, "courseGroups"),
    where("isActive", "==", true)
  );

  return onSnapshot(q, (snapshot) => {
    const courseGroups = snapshot.docs.map((doc) =>
      courseGroupFromFirestore(doc.id, doc.data() as CourseGroupFirestore)
    );
    // Sort in memory by createdAt descending
    courseGroups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(courseGroups);
  });
}

export async function getCourseGroupById(id: string): Promise<CourseGroup | null> {
  try {
    const docRef = doc(db, "courseGroups", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return courseGroupFromFirestore(docSnap.id, docSnap.data() as CourseGroupFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get course group: ${error}`);
  }
}

// ==================== Batch Operations ====================

export async function createBatch(batch: Omit<Batch, "id">): Promise<string> {
  try {
    const batchRef = doc(collection(db, "batches"));
    const batchData: BatchFirestore = batchToFirestore({
      ...batch,
      id: batchRef.id,
    });

    const batchWrite = writeBatch(db);
    batchWrite.set(batchRef, batchData);

    // Update course group batch count
    const courseGroupRef = doc(db, "courseGroups", batch.courseGroupId);
    batchWrite.update(courseGroupRef, {
      batchCount: increment(1),
      updatedAt: Timestamp.now(),
    });

    await batchWrite.commit();
    return batchRef.id;
  } catch (error) {
    throw new Error(`Failed to create batch: ${error}`);
  }
}

export async function updateBatch(id: string, batch: Partial<Batch>): Promise<void> {
  try {
    const batchRef = doc(db, "batches", id);
    const updates: Partial<BatchFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (batch.name !== undefined) updates.name = batch.name;
    if (batch.description !== undefined) updates.description = batch.description;
    if (batch.startDate !== undefined)
      updates.startDate = Timestamp.fromDate(batch.startDate);
    if (batch.endDate !== undefined)
      updates.endDate = Timestamp.fromDate(batch.endDate);
    if (batch.schedule !== undefined) updates.schedule = batch.schedule;
    if (batch.location !== undefined) updates.location = batch.location;
    if (batch.logoUrl !== undefined) updates.logoUrl = batch.logoUrl;
    if (batch.isActive !== undefined) updates.isActive = batch.isActive;

    await updateDoc(batchRef, updates);
  } catch (error) {
    throw new Error(`Failed to update batch: ${error}`);
  }
}

export async function deleteBatch(id: string, courseGroupId: string): Promise<void> {
  try {
    const batchWrite = writeBatch(db);

    // Delete batch
    const batchRef = doc(db, "batches", id);
    batchWrite.delete(batchRef);

    // Update course group batch count
    const courseGroupRef = doc(db, "courseGroups", courseGroupId);
    batchWrite.update(courseGroupRef, {
      batchCount: increment(-1),
      updatedAt: Timestamp.now(),
    });

    await batchWrite.commit();
  } catch (error) {
    throw new Error(`Failed to delete batch: ${error}`);
  }
}

export async function getBatchesByCourseGroup(
  courseGroupId: string
): Promise<Batch[]> {
  try {
    // Returns all active batches for the specified course group
    // All teachers can see all batches (no teacher filtering)
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "batches"),
      where("courseGroupId", "==", courseGroupId),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);
    const batches = snapshot.docs.map((doc) =>
      batchFromFirestore(doc.id, doc.data() as BatchFirestore)
    );
    // Sort in memory by createdAt descending
    batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return batches;
  } catch (error) {
    throw new Error(`Failed to get batches: ${error}`);
  }
}

// ==================== About Page Content ====================

export type AboutSectionLayout = "image-left" | "image-right" | "text-only";

export interface AboutSection {
  id: string;
  layout: AboutSectionLayout;
  title?: string;
  subtitle?: string;
  imagePath?: string;
  imageAlt?: string;
  paragraphs: string[];
}

export interface AboutPage {
  slug: string;
  name: string;
  heroTitle?: string;
  heroSubtitle?: string;
  sections: AboutSection[];
  updatedAt: Date;
}

export interface AboutPageFirestore {
  slug: string;
  name: string;
  heroTitle?: string;
  heroSubtitle?: string;
  sections: AboutSection[];
  updatedAt: Timestamp;
}

export function aboutPageFromFirestore(
  data: AboutPageFirestore
): AboutPage {
  return {
    slug: data.slug,
    name: data.name,
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
    sections: data.sections ?? [],
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export function aboutPageToFirestore(
  page: AboutPage
): AboutPageFirestore {
  const base: AboutPageFirestore = {
    slug: page.slug,
    name: page.name,
    sections: page.sections,
    updatedAt: Timestamp.fromDate(page.updatedAt),
  };

  // Only include optional fields if they are non-null/defined –
  // Firestore does not allow `undefined` values in documents.
  if (page.heroTitle != null) {
    base.heroTitle = page.heroTitle;
  }
  if (page.heroSubtitle != null) {
    base.heroSubtitle = page.heroSubtitle;
  }

  return base;
}

/**
 * Get a single About page configuration by slug.
 */
export async function getAboutPage(slug: string): Promise<AboutPage | null> {
  try {
    const ref = doc(db, "aboutPages", slug);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    return aboutPageFromFirestore(snap.data() as AboutPageFirestore);
  } catch (error) {
    console.error("Failed to get about page:", error);
    return null;
  }
}

/**
 * Update or create an About page configuration.
 */
export async function setAboutPage(
  page: Omit<AboutPage, "updatedAt">
): Promise<void> {
  try {
    const ref = doc(db, "aboutPages", page.slug);
    const payload = aboutPageToFirestore({
      ...page,
      updatedAt: new Date(),
    });
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error("Failed to set about page:", error);
    throw error;
  }
}

/**
 * List all About page configurations (for admin dropdowns, etc.).
 */
export async function getAllAboutPages(): Promise<AboutPage[]> {
  try {
    const snapshot = await getDocs(collection(db, "aboutPages"));
    const pages = snapshot.docs.map((docSnap) =>
      aboutPageFromFirestore(docSnap.data() as AboutPageFirestore)
    );
    // Sort by name for nicer dropdown
    pages.sort((a, b) => a.name.localeCompare(b.name));
    return pages;
  } catch (error) {
    console.error("Failed to list about pages:", error);
    return [];
  }
}

export function subscribeBatchesByCourseGroup(
  courseGroupId: string,
  callback: (batches: Batch[]) => void
): () => void {
  // Subscribes to all active batches for the specified course group
  // All teachers can see all batches (no teacher filtering)
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "batches"),
    where("courseGroupId", "==", courseGroupId),
    where("isActive", "==", true)
  );

  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map((doc) =>
      batchFromFirestore(doc.id, doc.data() as BatchFirestore)
    );
    // Sort in memory by createdAt descending
    batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(batches);
  });
}

// Validates class code and returns minimal info needed for enrollment
// Students don't need to read full batch details - just validate the code exists
export async function validateClassCode(classCode: string): Promise<{
  batchId: string;
  courseGroupId: string;
} | null> {
  try {
    const q = query(
      collection(db, "batches"),
      where("classCode", "==", classCode),
      where("isActive", "==", true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as BatchFirestore;
      // Return only the minimal info needed - no full batch details
      return {
        batchId: doc.id,
        courseGroupId: data.courseGroupId,
      };
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to validate class code: ${error}`);
  }
}

// Keep this for teacher/admin use only
export async function getBatchByClassCode(classCode: string): Promise<Batch | null> {
  try {
    const q = query(
      collection(db, "batches"),
      where("classCode", "==", classCode),
      where("isActive", "==", true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return batchFromFirestore(doc.id, doc.data() as BatchFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get batch by class code: ${error}`);
  }
}

export async function getBatchById(id: string): Promise<Batch | null> {
  try {
    const docRef = doc(db, "batches", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return batchFromFirestore(docSnap.id, docSnap.data() as BatchFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get batch: ${error}`);
  }
}

// ==================== Task Operations ====================

export async function createTask(task: Omit<Task, "id">): Promise<string> {
  try {
    const taskRef = doc(collection(db, "tasks"));
    const taskData: TaskFirestore = taskToFirestore({
      ...task,
      id: taskRef.id,
    });
    await setDoc(taskRef, taskData);
    return taskRef.id;
  } catch (error) {
    throw new Error(`Failed to create task: ${error}`);
  }
}

export async function updateTask(id: string, task: Partial<Task>): Promise<void> {
  try {
    const taskRef = doc(db, "tasks", id);
    const updates: Partial<TaskFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (task.title !== undefined) updates.title = task.title;
    if (task.description !== undefined) updates.description = task.description;
    if (task.status !== undefined) updates.status = task.status;
    if (task.startDate !== undefined)
      updates.startDate = Timestamp.fromDate(task.startDate);
    if (task.dueDate !== undefined)
      updates.dueDate = Timestamp.fromDate(task.dueDate);
    if (task.maxPoints !== undefined) updates.maxPoints = task.maxPoints;
    if (task.attachments !== undefined) updates.attachments = task.attachments;
    if (task.allowLateSubmission !== undefined)
      updates.allowLateSubmission = task.allowLateSubmission;
    if (task.lateSubmissionDays !== undefined)
      updates.lateSubmissionDays = task.lateSubmissionDays;
    if (task.instructions !== undefined) updates.instructions = task.instructions;
    if (task.submissionCount !== undefined)
      updates.submissionCount = task.submissionCount;

    await updateDoc(taskRef, updates);
  } catch (error) {
    throw new Error(`Failed to update task: ${error}`);
  }
}

/**
 * Recalculates and updates the submission count for a task.
 * This is useful when the count might be out of sync (e.g., when students create submissions).
 * Only teachers can call this function.
 */
export async function recalculateTaskSubmissionCount(taskId: string): Promise<number> {
  try {
    const submissions = await getSubmissionsByTask(taskId);
    const count = submissions.length;
    
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      submissionCount: count,
      updatedAt: Timestamp.now(),
    });
    
    return count;
  } catch (error) {
    throw new Error(`Failed to recalculate submission count: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "tasks", id));
  } catch (error) {
    throw new Error(`Failed to delete task: ${error}`);
  }
}

export async function getTasksByBatch(
  batchId: string,
  includeFutureTasks: boolean = false
): Promise<Task[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "tasks"),
      where("batchId", "==", batchId)
    );
    const snapshot = await getDocs(q);
    const now = new Date();
    const tasks = snapshot.docs
      .map((doc) => taskFromFirestore(doc.id, doc.data() as TaskFirestore))
      .filter((task) => {
        // If includeFutureTasks is true (for teachers), show all tasks
        if (includeFutureTasks) return true;
        // For students, only show tasks where startDate has passed or is null (backward compatibility)
        if (!task.startDate) return true; // Backward compatibility: show tasks without startDate
        return task.startDate.getTime() <= now.getTime();
      });
    // Sort in memory by startDate (if available) or createdAt descending
    tasks.sort((a, b) => {
      const aDate = a.startDate || a.createdAt;
      const bDate = b.startDate || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
    return tasks;
  } catch (error) {
    throw new Error(`Failed to get tasks: ${error}`);
  }
}

export function subscribeTasksByBatch(
  batchId: string,
  callback: (tasks: Task[]) => void,
  includeFutureTasks: boolean = false // For teachers, show all tasks. For students, filter by startDate
): () => void {
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "tasks"),
    where("batchId", "==", batchId)
  );

  return onSnapshot(q, (snapshot) => {
    const now = new Date();
    const tasks = snapshot.docs
      .map((doc) => taskFromFirestore(doc.id, doc.data() as TaskFirestore))
      .filter((task) => {
        // If includeFutureTasks is true (for teachers), show all tasks
        if (includeFutureTasks) return true;
        // For students, only show tasks where startDate has passed or is null (backward compatibility)
        if (!task.startDate) return true; // Backward compatibility: show tasks without startDate
        return task.startDate.getTime() <= now.getTime();
      });
    // Sort in memory by startDate (if available) or createdAt descending
    tasks.sort((a, b) => {
      const aDate = a.startDate || a.createdAt;
      const bDate = b.startDate || b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });
    callback(tasks);
  });
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const docRef = doc(db, "tasks", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return taskFromFirestore(docSnap.id, docSnap.data() as TaskFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get task: ${error}`);
  }
}

// ==================== Task Bookmark Operations ====================

export async function createTaskBookmark(
  bookmark: Omit<TaskBookmark, "id">
): Promise<string> {
  try {
    // Check if bookmark already exists
    const existingBookmark = await getTaskBookmarkByStudentAndTask(
      bookmark.studentId,
      bookmark.taskId
    );
    if (existingBookmark) {
      return existingBookmark.id;
    }

    const bookmarkRef = doc(collection(db, "taskBookmarks"));
    const bookmarkData: TaskBookmarkFirestore = taskBookmarkToFirestore({
      ...bookmark,
      id: bookmarkRef.id,
    });
    await setDoc(bookmarkRef, bookmarkData);
    return bookmarkRef.id;
  } catch (error) {
    throw new Error(`Failed to create task bookmark: ${error}`);
  }
}

export async function deleteTaskBookmark(bookmarkId: string): Promise<void> {
  try {
    const bookmarkRef = doc(db, "taskBookmarks", bookmarkId);
    await deleteDoc(bookmarkRef);
  } catch (error) {
    throw new Error(`Failed to delete task bookmark: ${error}`);
  }
}

export async function deleteTaskBookmarkByStudentAndTask(
  studentId: string,
  taskId: string
): Promise<void> {
  try {
    const bookmark = await getTaskBookmarkByStudentAndTask(studentId, taskId);
    if (bookmark) {
      await deleteTaskBookmark(bookmark.id);
    }
  } catch (error) {
    throw new Error(`Failed to delete task bookmark: ${error}`);
  }
}

export async function getTaskBookmarkByStudentAndTask(
  studentId: string,
  taskId: string
): Promise<TaskBookmark | null> {
  try {
    const q = query(
      collection(db, "taskBookmarks"),
      where("studentId", "==", studentId),
      where("taskId", "==", taskId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const doc = snapshot.docs[0];
    return taskBookmarkFromFirestore(
      doc.id,
      doc.data() as TaskBookmarkFirestore
    );
  } catch (error) {
    throw new Error(`Failed to get task bookmark: ${error}`);
  }
}

export async function getTaskBookmarksByStudent(
  studentId: string
): Promise<TaskBookmark[]> {
  try {
    const q = query(
      collection(db, "taskBookmarks"),
      where("studentId", "==", studentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
    );
  } catch (error) {
    throw new Error(`Failed to get task bookmarks: ${error}`);
  }
}

export function subscribeTaskBookmarksByStudent(
  studentId: string,
  callback: (bookmarks: TaskBookmark[]) => void
): () => void {
  const q = query(
    collection(db, "taskBookmarks"),
    where("studentId", "==", studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookmarks = snapshot.docs.map((doc) =>
      taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
    );
    callback(bookmarks);
  });
}

export async function getTaskBookmarksByBatch(
  batchId: string,
  studentId: string
): Promise<TaskBookmark[]> {
  try {
    const q = query(
      collection(db, "taskBookmarks"),
      where("studentId", "==", studentId),
      where("batchId", "==", batchId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
    );
  } catch (error) {
    throw new Error(`Failed to get task bookmarks: ${error}`);
  }
}

export function subscribeTaskBookmarksByBatch(
  batchId: string,
  studentId: string,
  callback: (bookmarks: TaskBookmark[]) => void
): () => void {
  const q = query(
    collection(db, "taskBookmarks"),
    where("studentId", "==", studentId),
    where("batchId", "==", batchId)
  );

  return onSnapshot(q, (snapshot) => {
    const bookmarks = snapshot.docs.map((doc) =>
      taskBookmarkFromFirestore(doc.id, doc.data() as TaskBookmarkFirestore)
    );
    callback(bookmarks);
  });
}

// ==================== Submission Operations ====================

export async function createSubmission(
  submission: Omit<Submission, "id">
): Promise<string> {
  try {
    const submissionRef = doc(collection(db, "submissions"));
    const submissionData: SubmissionFirestore = submissionToFirestore({
      ...submission,
      id: submissionRef.id,
    });

    // Create the submission first (students have permission for this)
    await setDoc(submissionRef, submissionData);
    console.log("Submission created successfully:", submissionRef.id);

    // Try to update task submission count (only works if user is a teacher)
    // If this fails, it's okay - the submission is already created
    // The submissionCount can be calculated on-the-fly when needed
    try {
    const taskRef = doc(db, "tasks", submission.taskId);
      await updateDoc(taskRef, {
      submissionCount: increment(1),
      updatedAt: Timestamp.now(),
    });
      console.log("Task submission count updated successfully");
    } catch (taskUpdateError) {
      // Log but don't fail - submission is already created successfully
      // This will fail for students (expected) but work for teachers
      console.warn("Could not update task submission count (expected for students):", taskUpdateError);
    }

    return submissionRef.id;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw new Error(`Failed to create submission: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function updateSubmission(
  id: string,
  submission: Partial<Submission>
): Promise<void> {
  try {
    const submissionRef = doc(db, "submissions", id);
    const updates: Partial<SubmissionFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (submission.status !== undefined) updates.status = submission.status;
    if (submission.submittedAt !== undefined)
      updates.submittedAt = Timestamp.fromDate(submission.submittedAt);
    if (submission.fileUrls !== undefined) updates.fileUrls = submission.fileUrls;
    // Handle recordingUrl: if explicitly set to null, delete the field; otherwise update it
    if (submission.recordingUrl !== undefined) {
      if (submission.recordingUrl === null) {
        (updates as any).recordingUrl = deleteField();
      } else {
        updates.recordingUrl = submission.recordingUrl;
      }
    }
    // Handle notes: if explicitly set to null, delete the field; otherwise update it
    if (submission.notes !== undefined) {
      if (submission.notes === null) {
        (updates as any).notes = deleteField();
      } else {
        updates.notes = submission.notes;
      }
    }
    if (submission.grade !== undefined) updates.grade = submission.grade;
    if (submission.feedback !== undefined) updates.feedback = submission.feedback;
    if (submission.gradedAt !== undefined)
      updates.gradedAt = Timestamp.fromDate(submission.gradedAt);

    await updateDoc(submissionRef, updates);
  } catch (error) {
    throw new Error(`Failed to update submission: ${error}`);
  }
}

export async function getSubmissionByTaskAndStudent(
  taskId: string,
  studentId: string
): Promise<Submission | null> {
  try {
    const q = query(
      collection(db, "submissions"),
      where("taskId", "==", taskId),
      where("studentId", "==", studentId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return submissionFromFirestore(
        doc.id,
        doc.data() as SubmissionFirestore
      );
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get submission: ${error}`);
  }
}

export function subscribeSubmissionByTaskAndStudent(
  taskId: string,
  studentId: string,
  callback: (submission: Submission | null) => void
): () => void {
  const q = query(
    collection(db, "submissions"),
    where("taskId", "==", taskId),
    where("studentId", "==", studentId),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const submission = submissionFromFirestore(
        doc.id,
        doc.data() as SubmissionFirestore
      );
      callback(submission);
    } else {
      callback(null);
    }
  });
}

export async function deleteSubmission(
  id: string,
  fileUrls?: string[]
): Promise<void> {
  try {
    const submissionRef = doc(db, "submissions", id);
    
    // Get submission data before deleting (for taskId to update count)
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }
    const submissionData = submissionDoc.data() as SubmissionFirestore;
    
    // Delete associated files from storage if provided
    if (fileUrls && fileUrls.length > 0) {
      const { deleteFileByUrl } = await import("@/lib/services/storage");
      // Delete files in parallel, but don't fail if some don't exist
      await Promise.allSettled(
        fileUrls.map((url) => deleteFileByUrl(url).catch(() => {}))
      );
    }
    
    // Delete the submission document
    await deleteDoc(submissionRef);
    
    // Try to decrement task submission count (only works if user is a teacher)
    // If this fails, it's okay - the submission is already deleted
    try {
      const taskRef = doc(db, "tasks", submissionData.taskId);
      await updateDoc(taskRef, {
        submissionCount: increment(-1),
        updatedAt: Timestamp.now(),
      });
    } catch (taskUpdateError) {
      // Log but don't fail - submission is already deleted successfully
      console.warn("Could not update task submission count (expected for students):", taskUpdateError);
    }
  } catch (error) {
    throw new Error(`Failed to delete submission: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getSubmissionsByTask(taskId: string): Promise<Submission[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "submissions"),
      where("taskId", "==", taskId)
    );
    const snapshot = await getDocs(q);
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return submissions;
  } catch (error) {
    throw new Error(`Failed to get submissions: ${error}`);
  }
}

export function subscribeSubmissionsByTask(
  taskId: string,
  callback: (submissions: Submission[]) => void
): () => void {
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "submissions"),
    where("taskId", "==", taskId)
  );

  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(submissions);
  });
}

export async function getSubmissionsByStudent(
  studentId: string
): Promise<Submission[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "submissions"),
      where("studentId", "==", studentId)
    );
    const snapshot = await getDocs(q);
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return submissions;
  } catch (error) {
    throw new Error(`Failed to get submissions: ${error}`);
  }
}

export function subscribeSubmissionsByStudent(
  studentId: string,
  callback: (submissions: Submission[]) => void
): () => void {
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "submissions"),
    where("studentId", "==", studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(submissions);
  });
}

export async function getSubmissionsByBatch(
  batchId: string
): Promise<Submission[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "submissions"),
      where("batchId", "==", batchId)
    );
    const snapshot = await getDocs(q);
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return submissions;
  } catch (error) {
    throw new Error(`Failed to get submissions: ${error}`);
  }
}

export function subscribeSubmissionsByBatch(
  batchId: string,
  callback: (submissions: Submission[]) => void
): () => void {
  const q = query(
    collection(db, "submissions"),
    where("batchId", "==", batchId)
  );

  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map((doc) =>
      submissionFromFirestore(doc.id, doc.data() as SubmissionFirestore)
    );
    // Sort in memory by createdAt descending
    submissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    callback(submissions);
  });
}

// ==================== Enrollment Operations ====================

export async function createEnrollment(
  enrollment: Omit<Enrollment, "id">,
  userEmail: string
): Promise<string> {
  try {
    const enrollmentRef = doc(collection(db, "enrollments"));
    const enrollmentData: EnrollmentFirestore = enrollmentToFirestore({
      ...enrollment,
      id: enrollmentRef.id,
    });

    // Only create the enrollment document
    // Don't update batch student count or create membership index yet
    // These will be created when the enrollment is approved (status changes to "active")
    await setDoc(enrollmentRef, enrollmentData);

    // Promote user to student role if needed
    await assignStudentRole(enrollment.studentId, userEmail);

    return enrollmentRef.id;
  } catch (error) {
    throw new Error(`Failed to create enrollment: ${error}`);
  }
}

export async function updateEnrollment(
  id: string,
  enrollment: Partial<Enrollment>
): Promise<void> {
  try {
    const enrollmentRef = doc(db, "enrollments", id);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (!enrollmentDoc.exists()) {
      throw new Error("Enrollment not found");
    }

    const currentData = enrollmentDoc.data() as EnrollmentFirestore;
    const currentStatus = currentData.status;
    const updates: Partial<EnrollmentFirestore> = {};

    if (enrollment.status !== undefined) updates.status = enrollment.status;
    if (enrollment.completedAt !== undefined)
      updates.completedAt = Timestamp.fromDate(enrollment.completedAt);
    if (enrollment.droppedAt !== undefined)
      updates.droppedAt = Timestamp.fromDate(enrollment.droppedAt);
    if (enrollment.notes !== undefined) updates.notes = enrollment.notes;
    if (enrollment.studentName !== undefined) updates.studentName = enrollment.studentName;
    // Handle dikshaName: if explicitly provided (including empty string), update it
    // Empty string means clear the field, undefined means don't change it
    if (enrollment.dikshaName !== undefined) {
      if (enrollment.dikshaName === "") {
        (updates as any).dikshaName = deleteField();
      } else {
        updates.dikshaName = enrollment.dikshaName;
      }
    }
    if (enrollment.whatsappNumber !== undefined) updates.whatsappNumber = enrollment.whatsappNumber;
    // Handle address: if explicitly provided (including empty string), update it
    // Empty string means clear the field, undefined means don't change it
    if (enrollment.address !== undefined) {
      if (enrollment.address === "") {
        (updates as any).address = deleteField();
      } else {
        updates.address = enrollment.address;
      }
    }

    const batchWrite = writeBatch(db);
    batchWrite.update(enrollmentRef, updates);

    // If status changed to "active" (approved), create membership index and update student count
    if (enrollment.status === "active" && currentStatus !== "active") {
      const memberRef = doc(
        db,
        "batches",
        currentData.batchId,
        "members",
        currentData.studentId
      );
      batchWrite.set(memberRef, {
        enrolledAt: Timestamp.now(),
      });

      // Update batch student count
      const batchRef = doc(db, "batches", currentData.batchId);
      batchWrite.update(batchRef, {
        studentCount: increment(1),
        updatedAt: Timestamp.now(),
      });
    }

    // If status changed to "dropped", remove membership index and decrement student count
    if (enrollment.status === "dropped" && currentStatus !== "dropped") {
      const memberRef = doc(
        db,
        "batches",
        currentData.batchId,
        "members",
        currentData.studentId
      );
      batchWrite.delete(memberRef);

      // Update batch student count (only if was previously active)
      if (currentStatus === "active") {
        const batchRef = doc(db, "batches", currentData.batchId);
        batchWrite.update(batchRef, {
          studentCount: increment(-1),
          updatedAt: Timestamp.now(),
        });
      }
    }

    await batchWrite.commit();
  } catch (error) {
    throw new Error(`Failed to update enrollment: ${error}`);
  }
}

export async function deleteEnrollment(
  enrollmentId: string
): Promise<void> {
  try {
    const enrollmentRef = doc(db, "enrollments", enrollmentId);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (!enrollmentDoc.exists()) {
      throw new Error("Enrollment not found");
    }

    const enrollmentData = enrollmentDoc.data() as EnrollmentFirestore;
    
    // Safety check: Only allow deletion of declined or dropped enrollments
    // Students should not be able to delete active, pending, or completed enrollments
    if (enrollmentData.status !== "declined" && enrollmentData.status !== "dropped") {
      throw new Error(`Cannot delete enrollment with status "${enrollmentData.status}". Only declined or dropped enrollments can be removed.`);
    }
    
    // Delete the enrollment document
    await deleteDoc(enrollmentRef);
  } catch (error) {
    throw new Error(`Failed to delete enrollment: ${error}`);
  }
}

export async function getEnrollmentsByStudent(
  studentId: string
): Promise<Enrollment[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "enrollments"),
      where("studentId", "==", studentId)
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map((doc) =>
      enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
    );
    // Sort in memory by enrolledAt descending
    enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
    return enrollments;
  } catch (error) {
    throw new Error(`Failed to get enrollments: ${error}`);
  }
}

export function subscribeEnrollmentsByStudent(
  studentId: string,
  callback: (enrollments: Enrollment[]) => void
): () => void {
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "enrollments"),
    where("studentId", "==", studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const enrollments = snapshot.docs.map((doc) =>
      enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
    );
    // Sort in memory by enrolledAt descending
    enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
    callback(enrollments);
  });
}

export async function getEnrollmentsByBatch(
  batchId: string
): Promise<Enrollment[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "enrollments"),
      where("batchId", "==", batchId)
    );
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map((doc) =>
      enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
    );
    // Sort in memory by enrolledAt descending
    enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
    return enrollments;
  } catch (error) {
    throw new Error(`Failed to get enrollments: ${error}`);
  }
}

export function subscribeEnrollmentsByBatch(
  batchId: string,
  callback: (enrollments: Enrollment[]) => void
): () => void {
  // Query without orderBy to avoid index requirement, then sort in memory
  const q = query(
    collection(db, "enrollments"),
    where("batchId", "==", batchId)
  );

  return onSnapshot(q, (snapshot) => {
    const enrollments = snapshot.docs.map((doc) =>
      enrollmentFromFirestore(doc.id, doc.data() as EnrollmentFirestore)
    );
    // Sort in memory by enrolledAt descending
    enrollments.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime());
    callback(enrollments);
  });
}

// ==================== Comment Operations ====================

export async function createComment(comment: Omit<Comment, "id">): Promise<string> {
  try {
    const commentRef = doc(collection(db, "comments"));
    const commentData: CommentFirestore = commentToFirestore({
      ...comment,
      id: commentRef.id,
    });
    await setDoc(commentRef, commentData);
    return commentRef.id;
  } catch (error) {
    throw new Error(`Failed to create comment: ${error}`);
  }
}

export async function updateComment(
  id: string,
  comment: Partial<Comment>
): Promise<void> {
  try {
    const commentRef = doc(db, "comments", id);
    const updates: Partial<CommentFirestore> = {
      updatedAt: Timestamp.now(),
      isEdited: true,
    };

    if (comment.content !== undefined) updates.content = comment.content;
    if (comment.attachments !== undefined)
      updates.attachments = comment.attachments;

    await updateDoc(commentRef, updates);
  } catch (error) {
    throw new Error(`Failed to update comment: ${error}`);
  }
}

export async function deleteComment(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "comments", id));
  } catch (error) {
    throw new Error(`Failed to delete comment: ${error}`);
  }
}

export async function getCommentsByBatch(batchId: string): Promise<Comment[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "comments"),
      where("batchId", "==", batchId),
      where("type", "==", "public")
    );
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((doc) =>
      commentFromFirestore(doc.id, doc.data() as CommentFirestore)
    );
    // Sort in memory by createdAt descending
    comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return comments;
  } catch (error) {
    throw new Error(`Failed to get comments: ${error}`);
  }
}

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
  try {
    // Query without orderBy to avoid index requirement, then sort in memory
    const q = query(
      collection(db, "comments"),
      where("taskId", "==", taskId)
    );
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((doc) =>
      commentFromFirestore(doc.id, doc.data() as CommentFirestore)
    );
    // Sort in memory by createdAt descending
    comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return comments;
  } catch (error) {
    throw new Error(`Failed to get comments: ${error}`);
  }
}

// ==================== User Operations ====================

export async function getUserById(id: string): Promise<User | null> {
  try {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return userFromFirestore(docSnap.id, docSnap.data() as UserFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get user: ${error}`);
  }
}

export async function updateUser(user: Partial<User> & { id: string }): Promise<void> {
  try {
    const userRef = doc(db, "users", user.id);
    const updates: Partial<UserFirestore> = {};

    if (user.name !== undefined) updates.name = user.name;
    if (user.profileImageUrl !== undefined)
      updates.profileImageUrl = user.profileImageUrl;
    if (user.whatsappNumber !== undefined)
      updates.whatsappNumber = user.whatsappNumber;
    if (user.role !== undefined) updates.role = user.role;
    if (user.lastLoginAt !== undefined)
      updates.lastLoginAt = Timestamp.fromDate(user.lastLoginAt);
    if (user.isActive !== undefined) updates.isActive = user.isActive;

    await updateDoc(userRef, updates);
  } catch (error) {
    throw new Error(`Failed to update user: ${error}`);
  }
}

// ==================== Quote Operations ====================

export async function createQuote(quote: Omit<Quote, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const quoteRef = doc(collection(db, "quotes"));
    const now = new Date();
    const fullQuote: Quote = {
      ...quote,
      id: quoteRef.id,
      createdAt: now,
      updatedAt: now,
    };
    const quoteData: QuoteFirestore = quoteToFirestore(fullQuote);
    await setDoc(quoteRef, quoteData);
    return quoteRef.id;
  } catch (error) {
    throw new Error(`Failed to create quote: ${error}`);
  }
}

export async function updateQuote(id: string, quote: Partial<Quote>): Promise<void> {
  try {
    const quoteRef = doc(db, "quotes", id);
    const updates: Partial<QuoteFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (quote.quote !== undefined) updates.quote = quote.quote;
    if (quote.author !== undefined) updates.author = quote.author;
    if (quote.date !== undefined) updates.date = quote.date;

    await updateDoc(quoteRef, updates);
  } catch (error) {
    throw new Error(`Failed to update quote: ${error}`);
  }
}

export async function deleteQuote(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "quotes", id));
  } catch (error) {
    throw new Error(`Failed to delete quote: ${error}`);
  }
}

export async function getQuotes(): Promise<Quote[]> {
  try {
    const snapshot = await getDocs(collection(db, "quotes"));
    const quotes = snapshot.docs.map((doc) =>
      quoteFromFirestore(doc.id, doc.data() as QuoteFirestore)
    );
    // Sort by createdAt ascending (oldest first)
    quotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return quotes;
  } catch (error) {
    throw new Error(`Failed to get quotes: ${error}`);
  }
}

export function subscribeQuotes(
  callback: (quotes: Quote[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "quotes"));

  return onSnapshot(
    q,
    (snapshot) => {
      const quotes = snapshot.docs.map((doc) =>
        quoteFromFirestore(doc.id, doc.data() as QuoteFirestore)
      );
      quotes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(quotes);
    },
    (error) => {
      console.error("Error in quotes subscription:", error);
      if (onError) {
        onError(error);
      }
      // Still call callback with empty array on error so UI can show empty state
      callback([]);
    }
  );
}

// ==================== Testimonial Operations ====================

export async function createTestimonial(testimonial: Omit<Testimonial, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const testimonialRef = doc(collection(db, "testimonials"));
    const now = new Date();
    const fullTestimonial: Testimonial = {
      ...testimonial,
      id: testimonialRef.id,
      createdAt: now,
      updatedAt: now,
    };
    const testimonialData: TestimonialFirestore = testimonialToFirestore(fullTestimonial);
    await setDoc(testimonialRef, testimonialData);
    return testimonialRef.id;
  } catch (error) {
    throw new Error(`Failed to create testimonial: ${error}`);
  }
}

export async function updateTestimonial(id: string, testimonial: Partial<Testimonial>): Promise<void> {
  try {
    const testimonialRef = doc(db, "testimonials", id);
    const updates: Partial<TestimonialFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (testimonial.name !== undefined) updates.name = testimonial.name;
    if (testimonial.designation !== undefined) updates.designation = testimonial.designation;
    if (testimonial.address !== undefined) updates.address = testimonial.address;
    if (testimonial.description !== undefined) updates.description = testimonial.description;
    if (testimonial.imageUrl !== undefined) updates.imageUrl = testimonial.imageUrl;

    await updateDoc(testimonialRef, updates);
  } catch (error) {
    throw new Error(`Failed to update testimonial: ${error}`);
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "testimonials", id));
  } catch (error) {
    throw new Error(`Failed to delete testimonial: ${error}`);
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const snapshot = await getDocs(collection(db, "testimonials"));
    const testimonials = snapshot.docs.map((doc) =>
      testimonialFromFirestore(doc.id, doc.data() as TestimonialFirestore)
    );
    // Sort by createdAt descending (newest first)
    testimonials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return testimonials;
  } catch (error) {
    throw new Error(`Failed to get testimonials: ${error}`);
  }
}

export function subscribeTestimonials(
  callback: (testimonials: Testimonial[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "testimonials"));

  return onSnapshot(
    q,
    (snapshot) => {
      const testimonials = snapshot.docs.map((doc) =>
        testimonialFromFirestore(doc.id, doc.data() as TestimonialFirestore)
      );
      testimonials.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(testimonials);
    },
    (error) => {
      console.error("Error in testimonials subscription:", error);
      if (onError) {
        onError(error);
      }
      // Still call callback with empty array on error so UI can show empty state
      callback([]);
    }
  );
}

// ==================== Course Operations (for public display) ====================

export async function createCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const courseRef = doc(collection(db, "courses"));
    const now = new Date();
    const fullCourse: Course = {
      ...course,
      id: courseRef.id,
      createdAt: now,
      updatedAt: now,
    };
    const courseData: CourseFirestore = courseToFirestore(fullCourse);
    await setDoc(courseRef, courseData);
    return courseRef.id;
  } catch (error) {
    throw new Error(`Failed to create course: ${error}`);
  }
}

export async function updateCourse(id: string, course: Partial<Course>): Promise<void> {
  try {
    const courseRef = doc(db, "courses", id);
    const updates: Partial<CourseFirestore> = {
      updatedAt: Timestamp.now(),
    };

    if (course.title !== undefined) updates.title = course.title;
    if (course.description !== undefined) updates.description = course.description;
    if (course.imageUrl !== undefined) updates.imageUrl = course.imageUrl;

    await updateDoc(courseRef, updates);
  } catch (error) {
    throw new Error(`Failed to update course: ${error}`);
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "courses", id));
  } catch (error) {
    throw new Error(`Failed to delete course: ${error}`);
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const courseRef = doc(db, "courses", id);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      return courseFromFirestore(courseSnap.id, courseSnap.data() as CourseFirestore);
    }
    return null;
  } catch (error) {
    throw new Error(`Failed to get course: ${error}`);
  }
}

export async function getCourses(): Promise<Course[]> {
  try {
    const snapshot = await getDocs(collection(db, "courses"));
    const courses = snapshot.docs.map((doc) =>
      courseFromFirestore(doc.id, doc.data() as CourseFirestore)
    );
    // Sort by createdAt ascending (oldest first)
    courses.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return courses;
  } catch (error) {
    throw new Error(`Failed to get courses: ${error}`);
  }
}

export function subscribeCourses(
  callback: (courses: Course[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "courses"));

  return onSnapshot(
    q,
    (snapshot) => {
      const courses = snapshot.docs.map((doc) =>
        courseFromFirestore(doc.id, doc.data() as CourseFirestore)
      );
      courses.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      callback(courses);
    },
    (error) => {
      console.error("Error in courses subscription:", error);
      if (onError) {
        onError(error);
      }
      callback([]);
    }
  );
}

// ==================== Helper Functions ====================

/**
 * Generate a random batch code (6 characters alphanumeric)
 */
export function generateBatchCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}