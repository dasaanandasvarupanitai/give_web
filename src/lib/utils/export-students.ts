import { BatchData } from "@/lib/types/student-management";
import { Enrollment } from "@/lib/models/enrollment";
import * as XLSX from "xlsx";

export const downloadBatchAsExcel = (batchData: BatchData) => {
    // Prepare data for Excel (excluding Google name)
    const rows = batchData.students.map((studentData) => {
        const enrollment = studentData.enrollment;
        return {
            "Email": studentData.student.email || "",
            "Certificate Name": enrollment.studentName || "",
            "Diksha Name": enrollment.dikshaName || "",
            "WhatsApp Number": enrollment.whatsappNumber || "",
            "Address": enrollment.address || "",
            "Enrolled Date": new Date(enrollment.enrolledAt).toLocaleDateString(),
        };
    });

    // Sort rows by Certificate Name in ascending order (case-insensitive)
    rows.sort((a, b) => a["Certificate Name"].localeCompare(b["Certificate Name"]));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns based on content
    const columnWidths = [
        { wch: 35 }, // Email
        { wch: 25 }, // Certificate Name
        { wch: 30 }, // Diksha Name
        { wch: 20 }, // WhatsApp Number
        { wch: 20 }, // Address
        { wch: 15 }, // Enrolled Date
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Generate Excel file and download
    XLSX.writeFile(workbook, `${batchData.batch.name}_students.xlsx`);
};

export const downloadSlokaSubmissionsAsExcel = (
    taskName: string,
    enrollments: Enrollment[],
    submittedStudentIds: Set<string>
) => {
    // Prepare rows for all enrolled students
    const rows = enrollments.map((enrollment) => {
        const hasSubmitted = submittedStudentIds.has(enrollment.studentId);
        return {
            "Certificate Name": enrollment.studentName || "",
            "Initiation Name": enrollment.dikshaName || "",
            "WhatsApp Number": enrollment.whatsappNumber || "",
            "Submitted": hasSubmitted ? "Yes" : "",
        };
    });

    // Sort rows alphabetically by Certificate Name
    rows.sort((a, b) => a["Certificate Name"].localeCompare(b["Certificate Name"]));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns based on content
    const columnWidths = [
        { wch: 25 }, // Certificate Name
        { wch: 25 }, // Initiation (Diksha) Name
        { wch: 20 }, // WhatsApp Number
        { wch: 15 }, // Submitted
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

    // Clean task name for filename
    const sanitizedTaskName = taskName.replace(/[^a-zA-Z0-9]/g, "_");

    // Generate Excel file and download
    XLSX.writeFile(workbook, `${sanitizedTaskName}_Submissions.xlsx`);
};
