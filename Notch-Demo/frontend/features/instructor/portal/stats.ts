import type { Student } from "@/types";
import type { Course } from "@/features/student/portal/data";
import {
  health,
  studentCompletion,
  studentMastery,
  weightedGrade,
  type Content,
  type Health,
} from "./data";

export type StudentRow = {
  student: Student;
  mastery: number;
  completion: number;
  health: Health;
  submitted: number;
  missing: number;
  assignments: number;
  grade: number | null;
};
export type CourseStats = {
  rows: StudentRow[];
  avgMastery: number;
  avgCompletion: number;
  counts: Record<Health, number>;
  toGrade: number;
};
const avg = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

/** Pure derivation of everything the Progress, Courses and Grades views show. */
export function courseStats(
  course: Course,
  students: Student[],
  content: Content,
): CourseStats {
  const assignments = content.assignments.filter(
    (a) => a.courseId === course.id && a.status === "published",
  );
  const subs = content.submissions.filter((s) => s.courseId === course.id);
  const rows = students.map<StudentRow>((student) => {
    const mastery = studentMastery(course, student);
    const mine = subs.filter(
      (s) =>
        s.studentId === student.id &&
        assignments.some((a) => a.id === s.assignmentId),
    );
    return {
      student,
      mastery,
      completion: studentCompletion(course.id, student, mastery),
      health: health(mastery, student.lastActiveDays),
      submitted: mine.filter((s) => s.status !== "missing").length,
      missing: assignments.length - mine.filter((s) => s.status !== "missing").length,
      assignments: assignments.length,
      grade: weightedGrade(assignments, subs, student.id),
    };
  });
  const counts: Record<Health, number> = {
    "on-track": 0,
    attention: 0,
    "at-risk": 0,
  };
  rows.forEach((r) => counts[r.health]++);
  return {
    rows,
    avgMastery: avg(rows.map((r) => r.mastery)),
    avgCompletion: avg(rows.map((r) => r.completion)),
    counts,
    toGrade: subs.filter(
      (s) =>
        s.status === "submitted" &&
        assignments.some((a) => a.id === s.assignmentId),
    ).length,
  };
}
