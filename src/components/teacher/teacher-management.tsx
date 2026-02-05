"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addTeacher, removeTeacher } from "@/lib/user-roles";
import { collection, getDocs } from "firebase/firestore";
import { Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AddTeacherDialog } from "./teachers/add-teacher-dialog";
import { Teacher, TeacherRow } from "./teachers/teacher-row";

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
          <AddTeacherDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            email={email}
            onEmailChange={setEmail}
            onSubmit={handleAddTeacher}
            isAdding={isAdding}
          />
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
              <TeacherRow
                key={teacher.email}
                teacher={teacher}
                onRemove={handleRemoveTeacher}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
