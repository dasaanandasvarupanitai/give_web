import { db } from "@/lib/firebase";
import {
    User,
    UserFirestore,
    userFromFirestore,
} from "@/lib/models/user";
import {
    doc,
    getDoc,
    Timestamp,
    updateDoc,
} from "firebase/firestore";

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
