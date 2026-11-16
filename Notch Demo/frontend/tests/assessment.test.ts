import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSubmission } from "@/services/assessment";
import { baselineData, validateDemoData } from "@/services/persistence";
import { masteryBand, nextMastery } from "@/services/mastery";
import { can } from "@/lib/permissions";
import type { AssessmentSubmission, DemoData } from "@/types";

const NOW = () => "2026-11-16T10:00:00.000Z";
const nour = (overrides: Partial<AssessmentSubmission> = {}): AssessmentSubmission => ({
  submissionId: "sub-1",
  studentId: "S-NOUR",
  courseId: "C-PY",
  conceptId: "PY-REC",
  questionIds: ["PY-REC-001"],
  answers: { "PY-REC-001": "A base case" },
  ...overrides,
});
const apply = (data: DemoData, input: unknown, role: "student" | "instructor" | "advisor" | "demo" = "student") => evaluateSubmission(data, input, role, NOW);
const code = (r: ReturnType<typeof apply>) => (r.ok ? "OK" : r.code);

test("approved formula and bands", () => {
  assert.equal(nextMastery(35, 100), 61);
  assert.equal(nextMastery(35, 0), 21);
  assert.equal(nextMastery(100, 100), 100);
  assert.equal(nextMastery(0, 0), 0);
  assert.deepEqual([0, 39, 40, 69, 70, 84, 85, 100].map(v => masteryBand(v).band), ["Needs Support", "Needs Support", "Developing", "Developing", "Proficient", "Proficient", "Mastered", "Mastered"]);
});

test("Nour Recursion 35 → 61 on a correct illustrative answer", () => {
  const r = apply(baselineData(), nour());
  assert.ok(r.ok);
  assert.equal(r.attempt.previous, 35);
  assert.equal(r.attempt.score, 100);
  assert.equal(r.attempt.mastery, 61);
  assert.equal(r.data.students.find(s => s.id === "S-NOUR")!.mastery["PY-REC"], 61);
  assert.equal(r.data.attempts.length, 1);
  assert.equal(validateDemoData(r.data).ok, true, "the resulting state must pass persisted validation");
});

test("role permissions: only Student may submit", () => {
  for (const role of ["instructor", "advisor", "demo"] as const) assert.equal(code(apply(baselineData(), nour(), role)), "ROLE_FORBIDDEN");
  assert.equal(can("demo", "demo:reset"), true);
  assert.equal(can("student", "demo:reset"), false);
  assert.equal(can("student", "context:select-student"), false);
});

test("student, enrollment, context and concept validation", () => {
  const base = baselineData();
  assert.equal(code(apply(base, nour({ studentId: "S-NOBODY" }))), "STUDENT_NOT_FOUND");
  assert.equal(code(apply(base, nour({ courseId: "C-BIO" as never }))), "COURSE_NOT_FOUND");
  const unenrolled: DemoData = { ...base, students: base.students.map(s => (s.id === "S-NOUR" ? { ...s, enrolledCourseIds: ["C-MATH"] } : s)) };
  assert.equal(code(apply(unenrolled, nour())), "NOT_ENROLLED");
  assert.equal(code(apply(base, nour({ studentId: "S-AHMED" }))), "CONTEXT_MISMATCH", "student must be the selected student");
  assert.equal(code(apply({ ...base, courseId: "C-MATH" }, nour())), "CONTEXT_MISMATCH", "course must be the selected course");
  assert.equal(code(apply(base, nour({ conceptId: "MA-DERIV" }))), "CONCEPT_MISMATCH");
  assert.equal(code(apply(base, nour({ conceptId: "PY-LOOP" }))), "QUESTION_MISMATCH");
});

test("question and answer validation", () => {
  const base = baselineData();
  assert.equal(code(apply(base, nour({ questionIds: [] }))), "NO_QUESTIONS");
  assert.equal(code(apply(base, nour({ questionIds: ["PY-REC-001", "PY-REC-001"] }))), "DUPLICATE_QUESTION");
  assert.equal(code(apply(base, nour({ questionIds: ["PY-REC-999"], answers: {} }))), "UNKNOWN_QUESTION");
  assert.equal(code(apply(base, nour({ questionIds: ["MA-DERIV-001"], answers: {} }))), "QUESTION_MISMATCH");
  assert.equal(code(apply(base, nour({ answers: { "PY-REC-001": "A loop" } }))), "INVALID_OPTION");
  assert.equal(code(apply(base, nour({ answers: { "PY-REC-001": "A base case", "MA-DERIV-001": "6" } }))), "UNEXPECTED_ANSWER");
  assert.equal(code(apply(base, { ...nour(), answers: { "PY-REC-001": 1 } })), "INVALID_SUBMISSION");
  assert.equal(code(apply(base, nour({ submissionId: "" }))), "INVALID_SUBMISSION");
  assert.equal(code(apply(base, nour({ submissionId: "x".repeat(129) }))), "INVALID_SUBMISSION");
  assert.equal(code(apply(base, null)), "INVALID_SUBMISSION");
});

test("unanswered questions count as incorrect", () => {
  const r = apply(baselineData(), nour({ answers: {} }));
  assert.ok(r.ok);
  assert.equal(r.attempt.score, 0);
  assert.equal(r.attempt.mastery, 21);
});

test("idempotent retry, conflicting reuse and separate attempts", () => {
  const first = apply(baselineData(), nour());
  assert.ok(first.ok);
  const retry = apply(first.data, nour());
  assert.ok(retry.ok);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.data, first.data, "a retry must not change state");
  assert.equal(code(apply(first.data, nour({ answers: { "PY-REC-001": "A comment" } }))), "SUBMISSION_ID_CONFLICT");
  const second = apply(first.data, nour({ submissionId: "sub-2" }));
  assert.ok(second.ok);
  assert.equal(second.attempt.previous, 61);
  assert.equal(second.attempt.mastery, 77);
  assert.equal(validateDemoData(second.data).ok, true);
});

test("invalid stored mastery is rejected before scoring", () => {
  const base = baselineData();
  const broken: DemoData = { ...base, students: base.students.map(s => (s.id === "S-NOUR" ? { ...s, mastery: { ...s.mastery, "PY-REC": 35.5 } } : s)) };
  assert.equal(code(apply(broken, nour())), "INVALID_MASTERY");
});

test("persisted state validation rejects malformed and inconsistent data", () => {
  const ok = apply(baselineData(), nour());
  assert.ok(ok.ok);
  const good = ok.data;
  const cases: [string, unknown][] = [
    ["null", null],
    ["array", []],
    ["missing students", { ...good, students: good.students.slice(1) }],
    ["unknown course", { ...good, courseId: "C-BIO" }],
    ["unknown student", { ...good, studentId: "S-NOBODY" }],
    ["mastery out of range", { ...good, students: good.students.map((s, i) => (i === 1 ? { ...s, mastery: { ...s.mastery, "PY-VAR": 140 } } : s)) }],
    ["mastery edited without attempt", { ...good, students: good.students.map((s, i) => (i === 1 ? { ...s, mastery: { ...s.mastery, "PY-VAR": 99 } } : s)) }],
    ["tampered attempt score", { ...good, attempts: [{ ...good.attempts[0], score: 0 }] }],
    ["tampered attempt mastery", { ...good, attempts: [{ ...good.attempts[0], mastery: 99 }] }],
    ["attempt removed but mastery kept", { ...good, attempts: [] }],
    ["duplicate submission IDs", { ...good, attempts: [good.attempts[0], good.attempts[0]] }],
    ["bad timestamp", { ...good, attempts: [{ ...good.attempts[0], createdAt: "yesterday" }] }],
    ["question from other course", { ...good, attempts: [{ ...good.attempts[0], questionIds: ["MA-DERIV-001"], answers: {} }] }],
  ];
  for (const [name, value] of cases) assert.equal(validateDemoData(value).ok, false, name);
  assert.equal(validateDemoData(baselineData()).ok, true);
  assert.equal(validateDemoData(JSON.parse(JSON.stringify(good))).ok, true, "round-trips through JSON");
});
