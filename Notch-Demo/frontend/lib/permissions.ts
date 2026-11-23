import { advisors, instructors } from "@/data/fixtures";
import type { CourseId, Role } from "@/types";

/**
 * Simulated, client-side permission model for the Phase 1 demo.
 * This prevents accidental UI misuse; it is NOT authentication or security
 * authorization. See Notch-Demo/shared/ROLE-PERMISSIONS.md.
 */
export type Permission =
  | "assessment:submit" // record an assessment for the selected fictional student
  | "practice:use" // student-facing practice actions
  | "progress:view-own" // the selected student's own progress
  | "course:view" // course-level data (instructor: assigned courses only)
  | "student-progress:view" // other students' progress (instructor: assigned course; advisor: caseload)
  | "context:select-student" // change the selected fictional student
  | "context:select-course" // change the selected course
  | "demo:reset" // restore baseline fixtures
  | "demo:apply-preset" // initialize an approved scenario preset (MAH-30, not yet implemented)
  | "demo:tour"; // run the guided presentation

const MATRIX: Record<Role, readonly Permission[]> = {
  student: ["assessment:submit", "practice:use", "progress:view-own", "context:select-course"],
  instructor: ["course:view", "student-progress:view", "context:select-course", "context:select-student"],
  advisor: ["student-progress:view", "context:select-student", "context:select-course"],
  demo: ["context:select-student", "context:select-course", "demo:reset", "demo:apply-preset", "demo:tour"],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export const permissionsFor = (role: Role): readonly Permission[] => MATRIX[role] ?? [];

export const ROLE_DENIED_MESSAGE: Record<Permission, string> = {
  "assessment:submit": "Only the simulated Student role can submit an assessment.",
  "practice:use": "Practice actions are available in the Student portal.",
  "progress:view-own": "Only the Student portal shows a student's own learning space.",
  "course:view": "Course data is available to the assigned instructor.",
  "student-progress:view": "Student progress is limited to assigned courses or caseload.",
  "context:select-student": "The student is fixed in this portal. Change it from the Demo Control Center.",
  "context:select-course": "This role cannot change the course.",
  "demo:reset": "Reset is available from the Demo Control Center.",
  "demo:apply-preset": "Scenario presets are available from the Demo Control Center.",
  "demo:tour": "The guided tour starts from the Demo Control Center.",
};

/* ----- Assignment and caseload contracts (Instructor / Advisor) ----- */

/** The fictional instructor assigned to a course. Phase 1 has one persona per course. */
export const instructorForCourse = (courseId: CourseId) => instructors.find(i => i.courseIds.includes(courseId));

/** The fictional advisor whose caseload the Advisor portal shows. */
export const activeAdvisor = () => advisors[0];

export function canInstructorViewCourse(instructorId: string, courseId: CourseId): boolean {
  return instructors.some(i => i.id === instructorId && i.courseIds.includes(courseId));
}

export function canAdvisorViewStudent(advisorId: string, studentId: string): boolean {
  return advisors.some(a => a.id === advisorId && a.studentIds.includes(studentId));
}

/** Student IDs the Advisor portal may show (caseload restriction). */
export const caseloadStudentIds = (advisorId = activeAdvisor()?.id) =>
  advisors.find(a => a.id === advisorId)?.studentIds ?? [];
