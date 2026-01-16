import type { TaskType } from "@/lib/models/task";
import {
  BookOpen,
  FileQuestion,
  FileText,
  Headphones,
  Megaphone,
} from "lucide-react";

export function getTaskTypeIcon(type: TaskType) {
  switch (type) {
    case "dailyListening":
      return Headphones;
    case "cba":
      return FileQuestion;
    case "oba":
      return FileText;
    case "slokaMemorization":
      return BookOpen;
    case "announcement":
      return Megaphone;
    default:
      return FileText;
  }
}

export function getTaskTypeLabel(type: TaskType): string {
  switch (type) {
    case "dailyListening":
      return "Daily Listening";
    case "cba":
      return "CBA";
    case "oba":
      return "OBA";
    case "slokaMemorization":
      return "Sloka Memorization";
    case "announcement":
      return "Announcement";
    default:
      return "Task";
  }
}

export function getTaskTypeColor(type: TaskType): string {
  switch (type) {
    case "dailyListening":
      return "#3b82f6"; // blue
    case "cba":
      return "#a855f7"; // purple
    case "oba":
      return "#f97316"; // orange
    case "slokaMemorization":
      return "#14b8a6"; // teal
    case "announcement":
      return "#f97316"; // orange
    default:
      return "#6b7280"; // gray
  }
}
