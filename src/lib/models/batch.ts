import { Timestamp } from "firebase/firestore";

export interface Batch {
  id: string;
  name: string;
  description: string;
  courseGroupId: string;
  teacherId: string;
  classCode: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  studentCount: number;
  startDate?: Date;
  endDate?: Date;
  schedule?: string;
  location?: string;
  logoUrl?: string;
}

export interface BatchFirestore {
  name: string;
  description: string;
  courseGroupId: string;
  teacherId: string;
  classCode: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  studentCount: number;
  startDate?: Timestamp;
  endDate?: Timestamp;
  schedule?: string;
  location?: string;
  logoUrl?: string;
}

export function batchFromFirestore(id: string, data: BatchFirestore): Batch {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    courseGroupId: data.courseGroupId ?? "",
    teacherId: data.teacherId ?? "",
    classCode: data.classCode ?? "",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isActive: data.isActive ?? true,
    studentCount: data.studentCount ?? 0,
    startDate: data.startDate?.toDate(),
    endDate: data.endDate?.toDate(),
    schedule: data.schedule,
    location: data.location,
    logoUrl: data.logoUrl,
  };
}

export function batchToFirestore(batch: Batch): BatchFirestore {
  const data: BatchFirestore = {
    name: batch.name,
    description: batch.description,
    courseGroupId: batch.courseGroupId,
    teacherId: batch.teacherId,
    classCode: batch.classCode,
    createdAt: Timestamp.fromDate(batch.createdAt),
    updatedAt: Timestamp.fromDate(batch.updatedAt),
    isActive: batch.isActive,
    studentCount: batch.studentCount,
  };
  
  // Only include optional fields if they're defined
  if (batch.startDate !== undefined) {
    data.startDate = Timestamp.fromDate(batch.startDate);
  }
  if (batch.endDate !== undefined) {
    data.endDate = Timestamp.fromDate(batch.endDate);
  }
  if (batch.schedule !== undefined) {
    data.schedule = batch.schedule;
  }
  if (batch.location !== undefined) {
    data.location = batch.location;
  }
  if (batch.logoUrl !== undefined) {
    data.logoUrl = batch.logoUrl;
  }
  
  return data;
}
