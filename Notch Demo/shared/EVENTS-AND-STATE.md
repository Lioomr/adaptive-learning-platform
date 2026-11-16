# Events and state

`frontend/store/demo.ts` is the single shared Zustand store. All portals read it; data changes only through its actions.

## Persisted data

- Key `adaptlearn-demo` in `localStorage`, **schema version 2** (unchanged shape: `students`, `attempts`, `studentId`, `courseId`).
- Not persisted: the storage status. The **role is not in the store at all**; it comes from the route layout (see [permissions](ROLE-PERMISSIONS.md)).
- Storage is per browser; it does not synchronize across browsers or devices. Other tabs of the same browser follow changes through the `storage` event.

## Hydration

The store is created with `skipHydration` and reads `localStorage` once when the client module loads. During React hydration `useHydrated()` reports the server value (`false`), so store-dependent regions render their skeletons on both server and client; React then re-renders with stored data. No effect copies state, and there is no artificial delay.

## Validation, migration and reset behaviour

Persisted data is validated by `services/persistence.ts` before use:

1. Unreadable JSON or a missing `version`/`state` → baseline fixtures, notice "unreadable or inconsistent".
2. Any version other than 2 → baseline fixtures, notice "older demo version" (v1 attempts are incompatible).
3. Version 2 that fails validation → baseline fixtures, same notice. Validation is strict and cross-field:
   - exactly the ten fixture students, unchanged names and enrollments, integer `lastActiveDays`, integer mastery 0–100 for all 20 concepts;
   - selected student exists and is enrolled in the selected course;
   - each attempt is a valid submission for an enrolled student, its concept belongs to its course, its questions belong to that concept, answers are valid options, `score` matches the answers, `mastery` follows the formula, `createdAt` is a canonical ISO timestamp;
   - submission IDs are unique; attempts are chronological;
   - the mastery chain for every student/concept runs from the fixture baseline through each attempt (`previous` = prior `mastery`) to the student's current value; concepts without attempts equal the baseline; `lastActiveDays` is 0 if the student has attempts, otherwise the baseline.
4. Storage blocked → the demo runs in memory with a notice that progress will not survive a refresh.

After an automatic reset the clean baseline is written back immediately. Because no action other than `submit` may change mastery, any future mutation path (for example MAH-30 scenario presets) must extend this validator and bump the schema version, with a documented migration.

## Actions

| Action | Permission | Behaviour |
|---|---|---|
| `setStudent(id, role)` | `context:select-student` | Selects a fictional student; keeps the course if enrolled, else the first enrollment |
| `setCourse(id, role)` | `context:select-course` | Selects an enrolled course |
| `submit(input, role)` | `assessment:submit` | Validates and atomically records the attempt and new mastery |
| `reset(role)` | `demo:reset` | Restores baseline fixtures, clears attempts, selects Nour / Python |

`submit` order: role → shape → idempotency (identical retry returns the original attempt with `duplicate: true` and no state change; different content with a used ID → `SUBMISSION_ID_CONFLICT`) → student exists → course exists → enrollment → selected student and course → concept belongs to course → question IDs (non-empty, ≤50, unique, known, same course/concept) → answers (only for listed questions, valid options) → stored mastery is a valid integer → record validated with the persisted-attempt validator. Unanswered questions count as incorrect. Scores round to the nearest integer; new mastery is `round((6 × previous + 4 × score) / 10)` (integer arithmetic, identical to `0.6/0.4`), clamped 0–100. Repeated deliberate submissions use new IDs and are separate attempts. Prerequisites below 70 produce a review recommendation but do not block practice.

The UI creates one submission ID when an attempt starts and keeps it until "Start a new attempt", so double submission of the same attempt is idempotent.
