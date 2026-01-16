import { Timestamp } from "firebase/firestore";

export type UserRole = "teacher" | "student" | "registered";

export interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  whatsappNumber?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserFirestore {
  email: string;
  name: string;
  profileImageUrl?: string;
  whatsappNumber?: string;
  role: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  isActive: boolean;
}

export function userFromFirestore(id: string, data: UserFirestore): User {
  return {
    id,
    email: data.email ?? "",
    name: data.name ?? "",
    profileImageUrl: data.profileImageUrl,
    whatsappNumber: data.whatsappNumber,
    role: (data.role as UserRole) || "registered",
    createdAt: data.createdAt?.toDate() ?? new Date(),
    lastLoginAt: data.lastLoginAt?.toDate(),
    isActive: data.isActive ?? true,
  };
}

export function userToFirestore(user: User): UserFirestore {
  const data: UserFirestore = {
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: Timestamp.fromDate(user.createdAt),
    isActive: user.isActive,
  };
  
  // Only include optional fields if they're defined
  if (user.profileImageUrl !== undefined) {
    data.profileImageUrl = user.profileImageUrl;
  }
  if (user.whatsappNumber !== undefined) {
    data.whatsappNumber = user.whatsappNumber;
  }
  if (user.lastLoginAt !== undefined) {
    data.lastLoginAt = Timestamp.fromDate(user.lastLoginAt);
  }
  
  return data;
}
