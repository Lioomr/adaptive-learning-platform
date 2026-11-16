/**
 * Shared Phase 1 data contract. Every portal reads these shapes from the single
 * shared store; see Notch Demo/shared/DATA-CONTRACT.md.
 */
export type CourseId = "C-PY" | "C-MATH";

/** Simulated role. Derived from the route segment, never from user input. */
export type Role = "student" | "instructor" | "advisor" | "demo";

export type Course = { id: CourseId; title: string; shortTitle: string };

export type Concept = { id: string; courseId: CourseId; title: string; prerequisites: string[] };

export type Student = {
  id: string;
  name: string;
  enrolledCourseIds: CourseId[];
  lastActiveDays: number;
  /** Integer mastery 0–100 for every concept ID in both courses. */
  mastery: Record<string, number>;
};

/** Fictional instructor persona. `courseIds` is the assignment used for course-level restrictions. */
export type Instructor = { id: string; name: string; courseIds: CourseId[] };

/** Fictional advisor persona. `studentIds` is the caseload used for student-level restrictions. */
export type Advisor = { id: string; name: string; studentIds: string[] };

export type Question = {
  id: string;
  courseId: CourseId;
  conceptId: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type AssessmentSubmission = {
  /** Idempotency key: the same ID must be reused for a retry of the same attempt. */
  submissionId: string;
  studentId: string;
  courseId: CourseId;
  conceptId: string;
  questionIds: string[];
  /** Question ID → selected option. Omitted questions are unanswered and count as incorrect. */
  answers: Record<string, string>;
};

export type Attempt = AssessmentSubmission & {
  /** Rounded percentage correct, 0–100. */
  score: number;
  /** Concept mastery before this attempt. */
  previous: number;
  /** Concept mastery after this attempt: round(0.6 × previous + 0.4 × score). */
  mastery: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
};

export type MasteryBand = "Needs Support" | "Developing" | "Proficient" | "Mastered";

export type SubmissionErrorCode =
  | "ROLE_FORBIDDEN"
  | "INVALID_SUBMISSION"
  | "STUDENT_NOT_FOUND"
  | "COURSE_NOT_FOUND"
  | "NOT_ENROLLED"
  | "CONTEXT_MISMATCH"
  | "CONCEPT_MISMATCH"
  | "NO_QUESTIONS"
  | "DUPLICATE_QUESTION"
  | "UNKNOWN_QUESTION"
  | "QUESTION_MISMATCH"
  | "UNEXPECTED_ANSWER"
  | "INVALID_OPTION"
  | "INVALID_MASTERY"
  | "SUBMISSION_ID_CONFLICT"
  | "INVALID_RECORD";

export type SubmissionResult =
  | { ok: true; attempt: Attempt; duplicate: boolean }
  | { ok: false; code: SubmissionErrorCode; error: string };

/** The persisted portion of the shared demo state (schema version 2). */
export type DemoData = {
  students: Student[];
  attempts: Attempt[];
  studentId: string;
  courseId: CourseId;
};
