"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { LoginDialog } from "./login-dialog";

export function UserMenu() {
  const { user, initializing } = useAuthUser();
  const [showImage, setShowImage] = useState(true);

  if (initializing) {
    // While loading auth state, just show nothing (or could show skeleton)
    return null;
  }

  if (!user) {
    return <LoginDialog />;
  }

  const displayName = user.displayName || user.email || "Student";
  const initials =
    user.displayName
      ?.split(" ")
      .filter(Boolean)
      .map((n) => n[0]?.toUpperCase())
      .join("") ||
    user.email?.[0]?.toUpperCase() ||
    "S";

  async function handleLogout() {
    await signOut(auth);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border border-orange-500 overflow-hidden bg-muted">
          {user.photoURL && showImage ? (
            <img
              src={user.photoURL}
              alt={displayName || "User avatar"}
              className="h-full w-full object-cover"
              onError={() => setShowImage(false)}
            />
          ) : (
            <AvatarFallback className="bg-primary/90 text-primary-foreground text-sm font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {user.email && <span className="text-xs text-muted-foreground truncate">{user.email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile (coming soon)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


