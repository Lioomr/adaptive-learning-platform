import { findConcept, findCourse, findQuestion } from "@/data/fixtures";
import { can, ROLE_DENIED_MESSAGE } from "@/lib/permissions";
import { isMasteryValue, nextMastery, scorePercent } from "@/services/mastery";
import type { AssessmentSubmission, Attempt, DemoData, Role, Student, SubmissionErrorCode } from "@/types";

/**
 * Pure assessment rules shared by the store and the persisted-state validator.
 * No React or browser APIs here, so the rules are unit-testable (npm test).
 */
export const MAX_SUBMISSION_ID_LENGTH = 128;
export const MAX_QUESTIONS_PER_SUBMISSION = 50;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export type Failure = { ok: false; code: SubmissionErrorCode; error: string };
export type EvaluateResult =
  | { ok: true; attempt: Attempt; duplicate: boolean; data: DemoData }
  | Failure;

const fail = (code: SubmissionErrorCode, error: string): Failure => ({ ok: false, code, error });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export const isValidSubmissionId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_SUBMISSION_ID_LENGTH && SUBMISSION_ID_PATTERN.test(value);

/** Runtime shape check: TypeScript types do not protect against callers or stored data. */
export function isSubmissionShape(value: unknown): value is AssessmentSubmission {
  if (!isPlainObject(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    isValidSubmissionId(v.submissionId) &&
    typeof v.studentId === "string" &&
    typeof v.courseId === "string" &&
    typeof v.conceptId === "string" &&
    Array.isArray(v.questionIds) &&
    v.questionIds.every(id => typeof id === "string") &&
    isPlainObject(v.answers) &&
    Object.values(v.answers).every(a => typeof a === "string")
  );
}

/** Same submission content? Used to distinguish an idempotent retry from a conflicting reuse. */
export function sameSubmission(a: AssessmentSubmission, b: AssessmentSubmission): boolean {
  const entries = (x: Record<string, string>) => JSON.stringify(Object.entries(x).sort(([k1], [k2]) => k1.localeCompare(k2)));
  return (
    a.submissionId === b.submissionId &&
    a.studentId === b.studentId &&
    a.courseId === b.courseId &&
    a.conceptId === b.conceptId &&
    a.questionIds.length === b.questionIds.length &&
    a.questionIds.every((id, i) => id === b.questionIds[i]) &&
    entries(a.answers) === entries(b.answers)
  );
}

/**
 * Validates question IDs and answers against the bank for a course/concept and
 * returns the score. Shared by live submissions and persisted attempts.
 */
export function gradeSubmission(input: Pick<AssessmentSubmission, "courseId" | "conceptId" | "questionIds" | "answers">): Failure | { ok: true; score: number } {
  const ids = input.questionIds;
  if (ids.length === 0) return fail("NO_QUESTIONS", "Select at least one assessment question.");
  if (ids.length > MAX_QUESTIONS_PER_SUBMISSION) return fail("INVALID_SUBMISSION", "Too many questions in one assessment.");
  if (new Set(ids).size !== ids.length) return fail("DUPLICATE_QUESTION", "Each question can appear only once per assessment.");
  const selected = [];
  for (const id of ids) {
    const q = findQuestion(id);
    if (!q) return fail("UNKNOWN_QUESTION", `Unknown question ${id}.`);
    if (q.courseId !== input.courseId || q.conceptId !== input.conceptId) return fail("QUESTION_MISMATCH", `Question ${id} does not belong to this course concept.`);
    selected.push(q);
  }
  for (const [id, answer] of Object.entries(input.answers)) {
    if (!ids.includes(id)) return fail("UNEXPECTED_ANSWER", `An answer was provided for question ${id}, which is not in this assessment.`);
    const q = selected.find(x => x.id === id)!;
    if (!q.options.includes(answer)) return fail("INVALID_OPTION", `The selected answer is not an option for question ${id}.`);
  }
  // Unanswered questions (no key in `answers`) count as incorrect.
  const correct = selected.filter(q => input.answers[q.id] === q.answer).length;
  return { ok: true, score: scorePercent(correct, ids.length) };
}

/**
 * Cross-field validation of one stored attempt against the fixtures and the
 * current students. Chain consistency across attempts is checked by persistence.
 */
export function validateAttemptRecord(value: unknown, students: Student[]): Failure | { ok: true; attempt: Attempt } {
  if (!isSubmissionShape(value)) return fail("INVALID_RECORD", "Attempt has an invalid shape.");
  const a = value as Attempt;
  const student = students.find(s => s.id === a.studentId);
  if (!student) return fail("INVALID_RECORD", "Attempt refers to an unknown student.");
  if (!findCourse(a.courseId) || !student.enrolledCourseIds.includes(a.courseId)) return fail("INVALID_RECORD", "Attempt refers to a course the student is not enrolled in.");
  if (findConcept(a.conceptId)?.courseId !== a.courseId) return fail("INVALID_RECORD", "Attempt concept does not belong to its course.");
  const graded = gradeSubmission(a);
  if (!graded.ok) return fail("INVALID_RECORD", `Attempt questions are invalid: ${graded.error}`);
  if (!isMasteryValue(a.score) || a.score !== graded.score) return fail("INVALID_RECORD", "Attempt score does not match its answers.");
  if (!isMasteryValue(a.previous) || !isMasteryValue(a.mastery)) return fail("INVALID_RECORD", "Attempt mastery values are out of range.");
  if (a.mastery !== nextMastery(a.previous, a.score)) return fail("INVALID_RECORD", "Attempt mastery does not follow the approved formula.");
  if (typeof a.createdAt !== "string" || Number.isNaN(Date.parse(a.createdAt)) || new Date(a.createdAt).toISOString() !== a.createdAt) return fail("INVALID_RECORD", "Attempt timestamp is invalid.");
  return { ok: true, attempt: a };
}

/**
 * Validates and applies an assessment submission. Returns the next data on
 * success; never mutates its inputs. `actor` is the role of the route that
 * rendered the control (see components/layout/role-context.tsx).
 */
export function evaluateSubmission(data: DemoData, input: unknown, actor: Role, now: () => string = () => new Date().toISOString()): EvaluateResult {
  // 10. Simulated role permission
  if (!can(actor, "assessment:submit")) return fail("ROLE_FORBIDDEN", ROLE_DENIED_MESSAGE["assessment:submit"]);
  if (!isSubmissionShape(input)) return fail("INVALID_SUBMISSION", "The assessment submission is malformed.");

  // 11–13. Idempotency: an identical retry returns the original attempt without mutating mastery.
  const existing = data.attempts.find(a => a.submissionId === input.submissionId);
  if (existing) {
    return sameSubmission(existing, input)
      ? { ok: true, attempt: existing, duplicate: true, data }
      : fail("SUBMISSION_ID_CONFLICT", "This submission ID was already used for a different assessment.");
  }

  // 1–2. Student existence and enrollment
  const student = data.students.find(s => s.id === input.studentId);
  if (!student) return fail("STUDENT_NOT_FOUND", "The selected student does not exist.");
  if (!findCourse(input.courseId)) return fail("COURSE_NOT_FOUND", "The selected course does not exist.");
  if (!student.enrolledCourseIds.includes(input.courseId)) return fail("NOT_ENROLLED", "Student is not enrolled in this course.");

  // 3–4. Selected student and course context
  if (input.studentId !== data.studentId || input.courseId !== data.courseId) return fail("CONTEXT_MISMATCH", "Assessment does not match the selected student and course.");

  // 5. Course/concept consistency
  if (findConcept(input.conceptId)?.courseId !== input.courseId) return fail("CONCEPT_MISMATCH", "The concept does not belong to the selected course.");

  // 6–9. Question IDs, duplicates, answer options, unanswered behaviour
  const graded = gradeSubmission(input);
  if (!graded.ok) return graded;

  // 14. Valid mastery values
  const previous = student.mastery[input.conceptId];
  if (!isMasteryValue(previous)) return fail("INVALID_MASTERY", "Stored mastery for this concept is invalid. Reset the demo.");

  const attempt: Attempt = {
    submissionId: input.submissionId,
    studentId: input.studentId,
    courseId: input.courseId,
    conceptId: input.conceptId,
    questionIds: [...input.questionIds],
    answers: { ...input.answers },
    score: graded.score,
    previous,
    mastery: nextMastery(previous, graded.score),
    createdAt: now(),
  };

  // 15. The record we are about to persist must itself be valid.
  const record = validateAttemptRecord(attempt, data.students);
  if (!record.ok) return record;

  return {
    ok: true,
    attempt,
    duplicate: false,
    data: {
      ...data,
      students: data.students.map(s => (s.id === student.id ? { ...s, lastActiveDays: 0, mastery: { ...s.mastery, [input.conceptId]: attempt.mastery } } : s)),
      attempts: [...data.attempts, attempt],
    },
  };
}
