"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Debug: inspect auth user state in the browser console
      // eslint-disable-next-line no-console
      console.log("[useAuthUser] auth state changed:", {
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        displayName: firebaseUser?.displayName,
        photoURL: firebaseUser?.photoURL,
      });
      setUser(firebaseUser);
      setInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, initializing };
}


