"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addTeacher, removeTeacher } from "@/lib/user-roles";
import { collection, getDocs } from "firebase/firestore";
import { Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Teacher {
  email: string;
  isActive: boolean;
  createdAt?: any;
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      setLoading(true);
      const teachersRef = collection(db, "teachers");
      const snapshot = await getDocs(teachersRef);
      const teachersList: Teacher[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive) {
          teachersList.push({
            email: doc.id,
            isActive: data.isActive,
            createdAt: data.createdAt,
          });
        }
      });

      setTeachers(teachersList);
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      await addTeacher(email.trim());
      toast({
        title: "Success",
        description: `Teacher ${email} added successfully`,
      });
      setEmail("");
      setIsDialogOpen(false);
      await loadTeachers();
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add teacher",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemoveTeacher(teacherEmail: string) {
    if (!confirm(`Are you sure you want to remove ${teacherEmail} as a teacher?`)) {
      return;
    }

    try {
      await removeTeacher(teacherEmail);
      toast({
        title: "Success",
        description: `Teacher ${teacherEmail} removed successfully`,
      });
      await loadTeachers();
    } catch (error: any) {
      console.error("Error removing teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove teacher",
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher Management
            </CardTitle>
            <CardDescription>
              Add or remove teachers from the system
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
              <form onSubmit={handleAddTeacher}>
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Enter the email address of the teacher to add. They will
                    have access to the Teacher Dashboard once they log in.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teacher@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add Teacher"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No teachers found. Add your first teacher above.
          </div>
        ) : (
          <div className="space-y-2">
            {teachers.map((teacher) => (
              <div
                key={teacher.email}
                className="flex flex-row items-center justify-between gap-3 p-3 border rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{teacher.email}</p>
                  {teacher.createdAt && (
                    <p className="text-sm text-muted-foreground">
                      Added:{" "}
                      {teacher.createdAt?.toDate
                        ? teacher.createdAt.toDate().toLocaleDateString()
                        : teacher.createdAt instanceof Date
                          ? teacher.createdAt.toLocaleDateString()
                          : "N/A"}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTeacher(teacher.email)}
                  className="text-destructive hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
