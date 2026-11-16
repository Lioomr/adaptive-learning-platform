# Data contract

[TypeScript interfaces](../frontend/types/index.ts) define courses, concepts, students, instructors, advisors, questions, assessment submissions, attempts, error codes and the persisted `DemoData`. [Fixtures](../frontend/data/fixtures.ts) are the single source of fictional data. Fixture IDs are stable and were not changed by the foundation hardening.

- **Courses:** `C-PY` Introduction to Python, `C-MATH` Mathematics (`shortTitle` added for compact UI).
- **Concepts:** 20 (10 per course) with prerequisite IDs.
- **Students:** 10 fictional students, each enrolled in both courses, integer mastery 0–100 for all 20 concepts. Nour: Recursion 35, Call Stack 55.
- **Instructors (new):** `I-PY` → `C-PY`, `I-MATH` → `C-MATH`. Course assignment for the Instructor restriction contract.
- **Advisors (new):** `A-MAIN` with all ten students as caseload. Caseload for the Advisor restriction contract.
- **Questions:** 2 illustrative questions (`PY-REC-001`, `MA-DERIV-001`). This is **not** the reviewed 100-question bank (MAH-28).

## Submission

`AssessmentSubmission = { submissionId, studentId, courseId, conceptId, questionIds, answers }`. `submissionId` is an idempotency key: 1–128 characters, letters/digits and `._:-`, unique per intended attempt and reused for a retry. `answers` maps question ID → selected option; omitted questions are unanswered and count as incorrect.

`Attempt` adds `score` (rounded % correct), `previous`, `mastery` (`round(0.6 × previous + 0.4 × score)`) and an ISO `createdAt`.

Results are `{ ok: true, attempt, duplicate }` or `{ ok: false, code, error }`. Error codes: `ROLE_FORBIDDEN`, `INVALID_SUBMISSION`, `STUDENT_NOT_FOUND`, `COURSE_NOT_FOUND`, `NOT_ENROLLED`, `CONTEXT_MISMATCH`, `CONCEPT_MISMATCH`, `NO_QUESTIONS`, `DUPLICATE_QUESTION`, `UNKNOWN_QUESTION`, `QUESTION_MISMATCH`, `UNEXPECTED_ANSWER`, `INVALID_OPTION`, `INVALID_MASTERY`, `SUBMISSION_ID_CONFLICT`, `INVALID_RECORD`.

Validation and scoring live only in `services/assessment.ts`; components must call the store's `submit` action and never write mastery. Future question types, difficulty metadata and richer profiles belong to MAH-28 and portal work and need Integration Lead review because they change this contract.
