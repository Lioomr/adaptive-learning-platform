import { concepts, courses, initialStudents } from "@/data/fixtures";
import { validateAttemptRecord } from "@/services/assessment";
import { isMasteryValue } from "@/services/mastery";
import type { Attempt, CourseId, DemoData, Student } from "@/types";

/**
 * Persisted demo state: localStorage key `adaptlearn-demo`, schema version 2.
 *
 * Migration policy (documented in shared/EVENTS-AND-STATE.md):
 *  - versions other than 2 reset to the baseline (v1 attempts are incompatible);
 *  - v2 data that fails validation below resets to the baseline;
 *  - unreadable JSON or unavailable storage starts from in-memory baseline data.
 */
export const STORAGE_KEY = "adaptlearn-demo";
export const SCHEMA_VERSION = 2;
export const MAX_STORED_ATTEMPTS = 1000;

export const baselineData = (): DemoData => ({
  students: structuredClone(initialStudents),
  attempts: [],
  studentId: "S-NOUR",
  courseId: "C-PY",
});

export type ValidationResult = { ok: true; data: DemoData } | { ok: false; reason: string };
const invalid = (reason: string): ValidationResult => ({ ok: false, reason });

const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function validStudent(value: unknown, baseline: Student): string | null {
  if (!value || typeof value !== "object") return "student is not an object";
  const s = value as Student;
  if (s.name !== baseline.name) return `student ${baseline.id} name changed`;
  if (!Array.isArray(s.enrolledCourseIds) || !sameList(s.enrolledCourseIds, baseline.enrolledCourseIds)) return `student ${baseline.id} enrollment changed`;
  if (!Number.isInteger(s.lastActiveDays) || s.lastActiveDays < 0 || s.lastActiveDays > 3650) return `student ${baseline.id} activity is invalid`;
  if (!s.mastery || typeof s.mastery !== "object" || Array.isArray(s.mastery)) return `student ${baseline.id} mastery is missing`;
  const keys = Object.keys(s.mastery);
  if (keys.length !== concepts.length || !concepts.every(c => isMasteryValue(s.mastery[c.id]))) return `student ${baseline.id} mastery is out of range`;
  return null;
}

/**
 * Strict validation of persisted data, including cross-field consistency:
 * every attempt must be individually valid, and the mastery chain for each
 * student/concept must run from the fixture baseline through each attempt to
 * the student's current mastery. No action other than `submit` can change
 * mastery, so any other difference means the stored data was edited or corrupted.
 */
export function validateDemoData(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid("state is not an object");
  const data = value as DemoData;

  if (!Array.isArray(data.students) || data.students.length !== initialStudents.length) return invalid("student list has the wrong size");
  const seen = new Set<string>();
  for (const s of data.students) {
    const id = (s as Student | null)?.id;
    if (typeof id !== "string" || seen.has(id)) return invalid("student IDs are missing or duplicated");
    seen.add(id);
    const baseline = initialStudents.find(b => b.id === id);
    if (!baseline) return invalid(`unknown student ${id}`);
    const problem = validStudent(s, baseline);
    if (problem) return invalid(problem);
  }

  if (!courses.some(c => c.id === data.courseId)) return invalid("selected course is unknown");
  const selected = data.students.find(s => s.id === data.studentId);
  if (!selected) return invalid("selected student is unknown");
  if (!selected.enrolledCourseIds.includes(data.courseId as CourseId)) return invalid("selected student is not enrolled in the selected course");

  if (!Array.isArray(data.attempts) || data.attempts.length > MAX_STORED_ATTEMPTS) return invalid("attempt history is invalid");
  const ids = new Set<string>();
  let lastTime = -Infinity;
  const chain = new Map<string, number>(); // `${studentId}|${conceptId}` → mastery after the latest attempt
  for (const raw of data.attempts) {
    const record = validateAttemptRecord(raw, data.students);
    if (!record.ok) return invalid(record.error);
    const a: Attempt = record.attempt;
    if (ids.has(a.submissionId)) return invalid("duplicate submission ID in attempt history");
    ids.add(a.submissionId);
    const t = Date.parse(a.createdAt);
    if (t < lastTime) return invalid("attempt history is not in chronological order");
    lastTime = t;
    const key = `${a.studentId}|${a.conceptId}`;
    const expectedPrevious = chain.get(key) ?? initialStudents.find(b => b.id === a.studentId)!.mastery[a.conceptId];
    if (a.previous !== expectedPrevious) return invalid(`attempt ${a.submissionId} does not continue the mastery history`);
    chain.set(key, a.mastery);
  }

  for (const s of data.students) {
    const baseline = initialStudents.find(b => b.id === s.id)!;
    for (const c of concepts) {
      const expected = chain.get(`${s.id}|${c.id}`) ?? baseline.mastery[c.id];
      if (s.mastery[c.id] !== expected) return invalid(`mastery for ${s.id} ${c.id} does not match its attempt history`);
    }
    const hasAttempts = data.attempts.some(a => a.studentId === s.id);
    if (s.lastActiveDays !== (hasAttempts ? 0 : baseline.lastActiveDays)) return invalid(`activity for ${s.id} does not match its attempt history`);
  }

  // Return a clean copy containing only contract fields.
  return {
    ok: true,
    data: {
      students: data.students.map(s => ({ id: s.id, name: s.name, enrolledCourseIds: [...s.enrolledCourseIds], lastActiveDays: s.lastActiveDays, mastery: { ...s.mastery } })),
      attempts: data.attempts.map(a => ({ submissionId: a.submissionId, studentId: a.studentId, courseId: a.courseId, conceptId: a.conceptId, questionIds: [...a.questionIds], answers: { ...a.answers }, score: a.score, previous: a.previous, mastery: a.mastery, createdAt: a.createdAt })),
      studentId: data.studentId,
      courseId: data.courseId as CourseId,
    },
  };
}
