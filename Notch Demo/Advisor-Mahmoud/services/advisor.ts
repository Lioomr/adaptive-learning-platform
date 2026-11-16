import { concepts, conceptsForCourse } from "@/data/fixtures";
import { activeAdvisor, canAdvisorViewStudent } from "@/lib/permissions";
import { INACTIVITY_DAYS, courseAverage } from "@/services/insights";
import { PREREQUISITE_READY, recommendation } from "@/services/mastery";
import type { Attempt, CourseId, Role, Student } from "@/types";

export type Language = "en" | "ar";
export type WarningKind =
  | "inactive"
  | "support"
  | "concept"
  | "prerequisite"
  | "repeated"
  | "declining";
export type Warning = {
  id: string;
  studentId: string;
  kind: WarningKind;
  courseId?: CourseId;
  conceptId?: string;
  prerequisiteId?: string;
  value: number;
  evidence: "snapshot" | "attempts";
};
export const assignedStudents = (students: Student[]) =>
  students.filter((s) => canAdvisorViewStudent(activeAdvisor().id, s.id));
/** Relative fixture days are a frozen demo clock; wall-clock time never creates an alert. */
export function warningsFor(student: Student, attempts: Attempt[]): Warning[] {
  const result: Warning[] = [];
  const add = (id: string, warning: Omit<Warning, "id" | "studentId">) =>
    result.push({
      ...warning,
      id: `${student.id}-${id}`,
      studentId: student.id,
    });
  if (student.lastActiveDays >= INACTIVITY_DAYS)
    add("inactive", {
      kind: "inactive",
      value: student.lastActiveDays,
      evidence: "snapshot",
    });
  for (const courseId of student.enrolledCourseIds) {
    if (courseAverage(student, courseId) < 40)
      add(`support-${courseId}`, {
        kind: "support",
        courseId,
        value: courseAverage(student, courseId),
        evidence: "snapshot",
      });
    for (const concept of conceptsForCourse(courseId)) {
      const advice = recommendation(student, concept.id);
      if (
        student.mastery[concept.id] < 40 &&
        advice.kind === "ready" &&
        courseAverage(student, courseId) >= 40
      )
        add(`concept-${concept.id}`, {
          kind: "concept",
          courseId,
          conceptId: concept.id,
          value: student.mastery[concept.id],
          evidence: "snapshot",
        });
      if (
        student.mastery[concept.id] < PREREQUISITE_READY &&
        advice.kind === "review"
      )
        add(`prerequisite-${concept.id}`, {
          kind: "prerequisite",
          courseId,
          conceptId: concept.id,
          prerequisiteId: advice.prerequisiteId,
          value: student.mastery[advice.prerequisiteId],
          evidence: "snapshot",
        });
      const history = attempts
        .filter((a) => a.studentId === student.id && a.conceptId === concept.id)
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const lastTwo = history.slice(-2);
      if (
        lastTwo.length === 2 &&
        lastTwo.every((a) => a.mastery < PREREQUISITE_READY) &&
        concepts.some((c) => c.prerequisites.includes(concept.id))
      )
        add(`repeated-${concept.id}`, {
          kind: "repeated",
          courseId,
          conceptId: concept.id,
          value: lastTwo[1].mastery,
          evidence: "attempts",
        });
      if (lastTwo.length === 2 && lastTwo.every((a) => a.mastery < a.previous))
        add(`declining-${concept.id}`, {
          kind: "declining",
          courseId,
          conceptId: concept.id,
          value: lastTwo[1].mastery,
          evidence: "attempts",
        });
    }
  }
  return result;
}
export const diagnosisFor = (student: Student) =>
  student.enrolledCourseIds.flatMap((courseId) =>
    conceptsForCourse(courseId)
      .filter((c) => student.mastery[c.id] < PREREQUISITE_READY)
      .map((concept) => ({
        concept,
        advice: recommendation(student, concept.id),
      })),
  );
export type NudgeInput = {
  id: string;
  studentId: string;
  courseId: CourseId | "all";
  language: Language;
  message: string;
};
export type Nudge = NudgeInput & { createdAt: string };
export function validateNudge(
  input: NudgeInput,
  actor: Role,
  students: Student[],
): "role" | "recipient" | "course" | "message" | "language" | "id" | null {
  if (actor !== "advisor") return "role";
  const student = assignedStudents(students).find(
    (s) => s.id === input.studentId,
  );
  if (!student) return "recipient";
  if (
    input.courseId !== "all" &&
    !student.enrolledCourseIds.includes(input.courseId)
  )
    return "course";
  if (
    typeof input.message !== "string" ||
    !input.message.trim() ||
    input.message.trim().length > 1000
  )
    return "message";
  if (input.language !== "en" && input.language !== "ar") return "language";
  if (typeof input.id !== "string" || !input.id || input.id.length > 100)
    return "id";
  return null;
}
