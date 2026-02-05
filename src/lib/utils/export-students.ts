import { BatchData } from "@/lib/types/student-management";
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
