import { auth, db } from "@/lib/firebase";
import {
    Course,
    CourseFirestore,
    courseFromFirestore,
    courseToFirestore,
} from "@/lib/models/course";
import {
    CourseGroup,
    CourseGroupFirestore,
    courseGroupFromFirestore,
    courseGroupToFirestore,
} from "@/lib/models/course-group";
import { isTeacherEmail, setUserRole } from "@/lib/user-roles";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

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
        const q = query(
            collection(db, "courseGroups"),
            where("isActive", "==", true)
        );
        const snapshot = await getDocs(q);
        const courseGroups = snapshot.docs.map((doc) =>
            courseGroupFromFirestore(doc.id, doc.data() as CourseGroupFirestore)
        );
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
    const q = query(
        collection(db, "courseGroups"),
        where("isActive", "==", true)
    );

    return onSnapshot(q, (snapshot) => {
        const courseGroups = snapshot.docs.map((doc) =>
            courseGroupFromFirestore(doc.id, doc.data() as CourseGroupFirestore)
        );
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
