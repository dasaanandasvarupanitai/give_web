import { Timestamp } from "firebase/firestore";

export type CommentType = "public" | "private";

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  type: CommentType;
  batchId?: string;
  taskId?: string;
  submissionId?: string;
  parentCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  attachments: string[];
}

export interface CommentFirestore {
  content: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  type: string;
  batchId?: string;
  taskId?: string;
  submissionId?: string;
  parentCommentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  attachments: string[];
}

export function commentFromFirestore(
  id: string,
  data: CommentFirestore
): Comment {
  return {
    id,
    content: data.content ?? "",
    authorId: data.authorId ?? "",
    authorName: data.authorName ?? "",
    authorImageUrl: data.authorImageUrl,
    type: (data.type as CommentType) || "public",
    batchId: data.batchId,
    taskId: data.taskId,
    submissionId: data.submissionId,
    parentCommentId: data.parentCommentId,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isEdited: data.isEdited ?? false,
    attachments: data.attachments ?? [],
  };
}

export function commentToFirestore(comment: Comment): CommentFirestore {
  const data: CommentFirestore = {
    content: comment.content,
    authorId: comment.authorId,
    authorName: comment.authorName,
    type: comment.type,
    createdAt: Timestamp.fromDate(comment.createdAt),
    updatedAt: Timestamp.fromDate(comment.updatedAt),
    isEdited: comment.isEdited,
    attachments: comment.attachments,
  };
  
  // Only include optional fields if they're defined
  if (comment.authorImageUrl !== undefined) {
    data.authorImageUrl = comment.authorImageUrl;
  }
  if (comment.batchId !== undefined) {
    data.batchId = comment.batchId;
  }
  if (comment.taskId !== undefined) {
    data.taskId = comment.taskId;
  }
  if (comment.submissionId !== undefined) {
    data.submissionId = comment.submissionId;
  }
  if (comment.parentCommentId !== undefined) {
    data.parentCommentId = comment.parentCommentId;
  }
  
  return data;
}
