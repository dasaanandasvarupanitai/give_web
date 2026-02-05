import type { Batch } from "@/lib/models/batch";
import type { CourseGroup } from "@/lib/models/course-group";
import type { Enrollment } from "@/lib/models/enrollment";
import type { User } from "@/lib/models/user";

export interface StudentData {
    student: User;
    enrollment: Enrollment;
}

export interface BatchData {
    batch: Batch;
    students: StudentData[];
}

export interface GroupData {
    group: CourseGroup;
    batches: BatchData[];
}
