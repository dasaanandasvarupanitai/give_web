import { db } from "@/lib/firebase";
import {
    Comment,
    CommentFirestore,
    commentFromFirestore,
    commentToFirestore,
} from "@/lib/models/comment";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

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
        const q = query(
            collection(db, "comments"),
            where("batchId", "==", batchId),
            where("type", "==", "public")
        );
        const snapshot = await getDocs(q);
        const comments = snapshot.docs.map((doc) =>
            commentFromFirestore(doc.id, doc.data() as CommentFirestore)
        );
        comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return comments;
    } catch (error) {
        throw new Error(`Failed to get comments: ${error}`);
    }
}

export async function getCommentsByTask(taskId: string): Promise<Comment[]> {
    try {
        const q = query(
            collection(db, "comments"),
            where("taskId", "==", taskId)
        );
        const snapshot = await getDocs(q);
        const comments = snapshot.docs.map((doc) =>
            commentFromFirestore(doc.id, doc.data() as CommentFirestore)
        );
        comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return comments;
    } catch (error) {
        throw new Error(`Failed to get comments: ${error}`);
    }
}
