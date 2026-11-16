import { test } from "node:test";
import assert from "node:assert/strict";
import { initialStudents } from "@/data/fixtures";
import {
  assignedStudents,
  diagnosisFor,
  warningsFor,
  validateNudge,
} from "@advisor/services/advisor";
import { recommendation } from "@/services/mastery";
import { evaluateSubmission } from "@/services/assessment";
import { useDemo } from "@/store/demo";
import type { Attempt } from "@/types";

test("advisor sees assigned fixtures only, including all ten students", () => {
  assert.equal(assignedStudents(initialStudents).length, 10);
  assert.equal(
    assignedStudents([
      ...initialStudents,
      { ...initialStudents[0], id: "PRIVATE" },
    ]).length,
    10,
  );
  assert.deepEqual(assignedStudents([]), []);
});
test("Nour's diagnosis uses shared prerequisites and readiness threshold", () => {
  const nour = initialStudents[0];
  assert.equal(nour.mastery["PY-STACK"], 55);
  assert.equal(nour.mastery["PY-REC"], 35);
  const episode = diagnosisFor(nour).find((d) => d.concept.id === "PY-REC")!;
  assert.deepEqual(episode.advice, recommendation(nour, "PY-REC"));
  assert.equal(episode.advice.kind, "review");
  if (episode.advice.kind === "review")
    assert.equal(episode.advice.prerequisiteId, "PY-STACK");
  const ready = { ...nour, mastery: { ...nour.mastery, "PY-STACK": 70 } };
  assert.equal(recommendation(ready, "PY-REC").kind, "ready");
});
test("frozen 14-day activity threshold; baseline never fabricates attempt trends", () => {
  const youssef = initialStudents.find((s) => s.name === "Youssef")!;
  assert.equal(
    warningsFor(youssef, []).find((w) => w.kind === "inactive")?.value,
    14,
  );
  assert.ok(
    !warningsFor({ ...youssef, lastActiveDays: 13 }, []).some(
      (w) => w.kind === "inactive",
    ),
  );
  for (const s of initialStudents)
    assert.ok(
      warningsFor(s, []).every(
        (w) => w.kind !== "repeated" && w.kind !== "declining",
      ),
    );
});
test("two actual simulated attempts trigger repeated prerequisite and declining alerts", () => {
  let students = structuredClone(initialStudents);
  let attempts: Attempt[] = [];
  for (let i = 0; i < 2; i++) {
    const result = evaluateSubmission(
      { students, attempts, studentId: "S-NOUR", courseId: "C-MATH" },
      {
        submissionId: `advisor-${i}`,
        studentId: "S-NOUR",
        courseId: "C-MATH",
        conceptId: "MA-DERIV",
        questionIds: ["MA-DERIV-001"],
        answers: { "MA-DERIV-001": "3" },
      },
      "student",
    );
    assert.ok(result.ok);
    if (!result.ok) throw new Error("assessment failed");
    students = result.data.students;
    attempts = result.data.attempts;
    if (i === 0)
      assert.ok(
        !warningsFor(students[0], attempts).some(
          (w) => w.kind === "repeated" || w.kind === "declining",
        ),
      );
  }
  const warnings = warningsFor(students[0], attempts);
  assert.ok(
    warnings.some((w) => w.kind === "repeated" && w.conceptId === "MA-DERIV"),
  );
  assert.ok(
    warnings.some((w) => w.kind === "declining" && w.courseId === "C-MATH"),
  );
  assert.equal(students[0].mastery["PY-STACK"], 55);
  assert.equal(students[0].mastery["PY-REC"], 35);
  assert.ok(
    !warningsFor(students[1], attempts).some((w) => w.evidence === "attempts"),
  );
});
test("nudge validation denies other roles, unknown recipients, invalid context and blank text", () => {
  const input = {
    id: "nudge-1",
    studentId: "S-NOUR",
    courseId: "all" as const,
    language: "en" as const,
    message: "Hello Nour",
  };
  assert.equal(validateNudge(input, "advisor", initialStudents), null);
  assert.equal(validateNudge(input, "student", initialStudents), "role");
  assert.equal(
    validateNudge(
      { ...input, studentId: "PRIVATE" },
      "advisor",
      initialStudents,
    ),
    "recipient",
  );
  assert.equal(
    validateNudge({ ...input, message: "   " }, "advisor", initialStudents),
    "message",
  );
  assert.equal(
    validateNudge(
      { ...input, message: "a".repeat(1001) },
      "advisor",
      initialStudents,
    ),
    "message",
  );
});
test("shared nudge action is idempotent, does not change mastery, and resets with the demo", () => {
  useDemo.getState().reset("demo");
  const before = structuredClone(useDemo.getState().students);
  const input = {
    id: "nudge-test",
    studentId: "S-NOUR",
    courseId: "C-PY" as const,
    language: "ar" as const,
    message: "مرحباً نور",
  };
  assert.equal(useDemo.getState().sendNudge(input, "instructor").ok, false);
  assert.equal(useDemo.getState().sendNudge(input, "advisor").ok, true);
  assert.equal(useDemo.getState().sendNudge(input, "advisor").ok, true);
  assert.equal(useDemo.getState().nudges.length, 1);
  assert.equal(
    useDemo.getState().sendNudge({ ...input, message: "different" }, "advisor")
      .ok,
    false,
  );
  assert.deepEqual(useDemo.getState().students, before);
  assert.equal(useDemo.getState().attempts.length, 0);
  assert.equal(useDemo.getState().reset("advisor").ok, false);
  assert.equal(useDemo.getState().nudges.length, 1);
  useDemo.getState().reset("demo");
  assert.equal(useDemo.getState().nudges.length, 0);
});

test("a low concept remains flagged when its prerequisites become ready", () => {
  const nour = {
    ...initialStudents[0],
    mastery: { ...initialStudents[0].mastery, "PY-STACK": 70 },
  };
  assert.ok(
    warningsFor(nour, []).some(
      (w) => w.kind === "concept" && w.conceptId === "PY-REC",
    ),
  );
});
