export type CourseId = "C-PY" | "C-MATH";
export type Role = "student" | "instructor" | "advisor" | "demo";
export type Concept = { id: string; courseId: CourseId; title: string; prerequisites: string[] };
export type Student = { id: string; name: string; enrolledCourseIds: CourseId[]; lastActiveDays: number; mastery: Record<string, number> };
export type Question = { id: string; courseId: CourseId; conceptId: string; prompt: string; options: string[]; answer: string; explanation: string };
export type AssessmentSubmission = { submissionId: string; studentId: string; courseId: CourseId; conceptId: string; questionIds: string[]; answers: Record<string, string> };
export type Attempt = AssessmentSubmission & { score: number; previous: number; mastery: number; createdAt: string };
export type SubmissionResult = { ok: true; attempt: Attempt; duplicate: boolean } | { ok: false; error: string };
