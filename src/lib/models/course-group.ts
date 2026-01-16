import { Timestamp } from "firebase/firestore";

export interface CourseGroup {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  batchCount: number;
}

export interface CourseGroupFirestore {
  name: string;
  description: string;
  imageUrl?: string;
  teacherId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  batchCount: number;
}

export function courseGroupFromFirestore(
  id: string,
  data: CourseGroupFirestore
): CourseGroup {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    imageUrl: data.imageUrl,
    teacherId: data.teacherId ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isActive: data.isActive ?? true,
    batchCount: data.batchCount ?? 0,
  };
}

export function courseGroupToFirestore(
  courseGroup: CourseGroup
): CourseGroupFirestore {
  const data: CourseGroupFirestore = {
    name: courseGroup.name,
    description: courseGroup.description,
    teacherId: courseGroup.teacherId,
    createdAt: Timestamp.fromDate(courseGroup.createdAt),
    updatedAt: Timestamp.fromDate(courseGroup.updatedAt),
    isActive: courseGroup.isActive,
    batchCount: courseGroup.batchCount,
  };
  
  // Only include imageUrl if it's defined (Firestore doesn't allow undefined)
  if (courseGroup.imageUrl !== undefined) {
    data.imageUrl = courseGroup.imageUrl;
  }
  
  return data;
}
