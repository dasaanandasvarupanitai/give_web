"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";
import { getUserById, updateEnrollment } from "@/lib/services/firestore";

export function useEnrollmentCard(enrollment: Enrollment) {
    const { toast } = useToast();
    const [student, setStudent] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalValues, setOriginalValues] = useState({
        studentName: "",
        dikshaName: "",
        whatsappNumber: "",
        address: "",
    });
    const [editForm, setEditForm] = useState({
        studentName: enrollment.studentName || "",
        dikshaName: enrollment.dikshaName || "",
        whatsappNumber: enrollment.whatsappNumber || "",
        address: enrollment.address || "",
    });

    useEffect(() => {
        loadStudent();
    }, [enrollment.studentId]);

    const loadStudent = async () => {
        try {
            const studentData = await getUserById(enrollment.studentId);
            setStudent(studentData);
        } catch (error) {
            console.error("Failed to load student:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        const initialValues = {
            studentName: enrollment.studentName || "",
            dikshaName: enrollment.dikshaName || "",
            whatsappNumber: enrollment.whatsappNumber || "",
            address: enrollment.address || "",
        };
        setOriginalValues(initialValues);
        setEditForm(initialValues);
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (!editForm.studentName.trim()) {
            toast({
                title: "Validation Error",
                description: "Certificate name is required",
                variant: "destructive",
            });
            return;
        }

        if (!editForm.whatsappNumber.trim()) {
            toast({
                title: "Validation Error",
                description: "WhatsApp number is required",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const trimmedStudentName = editForm.studentName.trim();
            const trimmedDikshaName = editForm.dikshaName.trim();
            const trimmedWhatsapp = editForm.whatsappNumber.trim();
            const trimmedAddress = editForm.address.trim();

            const updates: Partial<Enrollment> = {};

            const originalStudentName = (originalValues.studentName || "").trim();
            if (trimmedStudentName !== originalStudentName) {
                updates.studentName = trimmedStudentName;
            }

            const originalWhatsapp = (originalValues.whatsappNumber || "").trim();
            if (trimmedWhatsapp !== originalWhatsapp) {
                updates.whatsappNumber = trimmedWhatsapp;
            }

            const originalDikshaName = (originalValues.dikshaName || "").trim();
            if (trimmedDikshaName !== originalDikshaName) {
                updates.dikshaName = trimmedDikshaName || "";
            }

            const originalAddress = (originalValues.address || "").trim();
            if (trimmedAddress !== originalAddress) {
                updates.address = trimmedAddress || "";
            }

            await updateEnrollment(enrollment.id, updates);
            toast({
                title: "Success",
                description: "Student information updated successfully",
            });
            setShowEditDialog(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update student information",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return {
        student,
        loading,
        showDetails,
        setShowDetails,
        showEditDialog,
        setShowEditDialog,
        isSaving,
        editForm,
        setEditForm,
        handleEdit,
        handleSaveEdit,
    };
}
