import { StudentAnalytics } from "@/lib/types/analytics";
import { Batch } from "@/lib/models/batch";
import { format } from "date-fns";
import ExcelJS from "exceljs";

interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

export const exportAnalyticsToExcel = async (
    analytics: StudentAnalytics[],
    batch: Batch | null,
    dateRange: DateRange
) => {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily Listening Analytics");

    // Define columns (headers will be in row 2 after we insert date range row)
    worksheet.columns = [
        { header: "Student Name", key: "studentName", width: 25 },
        { header: "Diksha Name", key: "dikshaName", width: 25 },
        { header: "WhatsApp Number", key: "whatsappNumber", width: 18 },
        { header: "Student Email", key: "studentEmail", width: 30 },
        { header: "Total Daily Listening Tasks", key: "totalTasks", width: 25 },
        { header: "Submitted Count", key: "submittedCount", width: 18 },
        { header: "Percentage (%)", key: "percentage", width: 15 },
        { header: "Status", key: "status", width: 20 },
    ];

    // Insert a row at the beginning for date range info
    worksheet.insertRow(1, []);

    // Add date range info row (row 1)
    let dateRangeText = "Date Range: All Time";
    if (dateRange.from || dateRange.to) {
        if (dateRange.from && dateRange.to) {
            dateRangeText = `Date Range: ${format(dateRange.from, "MMM dd, yyyy")} to ${format(dateRange.to, "MMM dd, yyyy")}`;
        } else if (dateRange.from) {
            dateRangeText = `Date Range: From ${format(dateRange.from, "MMM dd, yyyy")}`;
        } else if (dateRange.to) {
            dateRangeText = `Date Range: Up to ${format(dateRange.to, "MMM dd, yyyy")}`;
        }
    }

    worksheet.mergeCells(1, 1, 1, worksheet.columns.length);
    const dateRangeRow = worksheet.getRow(1);
    dateRangeRow.getCell(1).value = dateRangeText;
    dateRangeRow.getCell(1).font = { bold: true };
    dateRangeRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F0F0" },
    };
    dateRangeRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    dateRangeRow.height = 20;

    // Style the header row (row 2) - column headers
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
    };

    // Add data rows - uses filtered analytics based on date range
    analytics.forEach((item) => {
        worksheet.addRow({
            studentName: item.enrollment.studentName || item.student.name || "Unknown",
            dikshaName: item.enrollment.dikshaName || "",
            whatsappNumber: item.enrollment.whatsappNumber || "",
            studentEmail: item.student.email || "No email",
            totalTasks: item.totalDailyListeningTasks,
            submittedCount: item.submittedCount,
            percentage: item.percentage,
            status:
                item.percentage === 100
                    ? "Complete"
                    : item.percentage >= 80
                        ? "Good"
                        : item.percentage >= 50
                            ? "Average"
                            : "Needs Improvement",
        });
    });

    // Generate filename with batch name, date range, and export date
    const batchName = batch?.name || "Batch";
    const sanitizedBatchName = batchName.replace(/[^a-zA-Z0-9]/g, "_");
    const exportDate = new Date().toISOString().split("T")[0];

    let dateRangeSuffix = "";
    if (dateRange.from || dateRange.to) {
        if (dateRange.from && dateRange.to) {
            const fromStr = format(dateRange.from, "yyyy-MM-dd");
            const toStr = format(dateRange.to, "yyyy-MM-dd");
            dateRangeSuffix = `_${fromStr}_to_${toStr}`;
        } else if (dateRange.from) {
            const fromStr = format(dateRange.from, "yyyy-MM-dd");
            dateRangeSuffix = `_from_${fromStr}`;
        } else if (dateRange.to) {
            const toStr = format(dateRange.to, "yyyy-MM-dd");
            dateRangeSuffix = `_to_${toStr}`;
        }
    } else {
        dateRangeSuffix = "_All_Time";
    }

    const filename = `Daily_Listening_Analytics_${sanitizedBatchName}${dateRangeSuffix}_exported_${exportDate}.xlsx`;

    // Write file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
