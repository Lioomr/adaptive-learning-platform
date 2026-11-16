export type CourseId = "C-PY" | "C-MATH";
export type Role = "student" | "instructor" | "advisor";
export type Concept = { id: string; courseId: CourseId; title: string; prerequisites: string[] };
export type Student = { id: string; name: string; lastActiveDays: number; mastery: Record<string, number> };
export type Question = { id: string; courseId: CourseId; conceptId: string; prompt: string; options: string[]; answer: string; explanation: string };
export type Attempt = { id: string; studentId: string; courseId: CourseId; conceptId: string; questionIds: string[]; answers: Record<string,string>; score: number; previous: number; mastery: number; createdAt: string };
