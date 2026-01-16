import { Timestamp } from "firebase/firestore";

export interface Course {
  id: string;
  title: string;
  description: string; // rich text (HTML)
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseFirestore {
  title: string;
  description: string; // rich text (HTML)
  imageUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export function courseFromFirestore(
  id: string,
  data: CourseFirestore
): Course {
  return {
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    imageUrl: data.imageUrl ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  };
}

export function courseToFirestore(
  course: Course
): CourseFirestore {
  return {
    title: course.title,
    description: course.description,
    imageUrl: course.imageUrl,
    createdAt: Timestamp.fromDate(course.createdAt),
    updatedAt: Timestamp.fromDate(course.updatedAt),
  };
}

