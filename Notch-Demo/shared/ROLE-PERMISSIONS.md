# Simulated role permissions

Defined in `frontend/lib/permissions.ts`. These client-side checks prevent accidental UI misuse in a demo; anyone controlling the browser can change state. They are **not** authentication or security authorization, and no real records belong in the demo.

## How the active role is decided

The role comes from the route layout: `app/student/layout.tsx` renders `<AppShell role="student">`, and so on. Components read it synchronously with `useRole()` and pass it to every permission-checked store action (`submit(input, role)`, `reset(role)`, …).

The previous foundation copied the route-derived role into Zustand with a `useEffect`, so for one render after a portal switch the store could still hold the previous role, and an action fired in that window was authorized against a stale value. The role is no longer stored. A control can only act with the role of the route that rendered it, and the decision does not depend on any effect timing.

## Matrix

| Permission | Student | Instructor | Advisor | Demo Control Center |
|---|:-:|:-:|:-:|:-:|
| `assessment:submit` (for the selected fictional student) | ✓ | | | |
| `practice:use` | ✓ | | | |
| `progress:view-own` | ✓ | | | |
| `course:view` (assigned courses) | | ✓ | | |
| `student-progress:view` (assigned course / caseload) | | ✓ | ✓ | |
| `context:select-student` | | ✓ | ✓ (caseload only) | ✓ |
| `context:select-course` | ✓ (enrolled only) | ✓ | ✓ | ✓ |
| `demo:reset` | | | | ✓ |
| `demo:apply-preset` (MAH-30, not implemented) | | | | ✓ |
| `demo:tour` | | | | ✓ |

Notes:

- **Reset moved**: it was previously available in every view. It is now a confirmed action in the Demo Control Center only, matching the presenter role. Integration step 13 uses `/demo`.
- **Demo Control Center** can select context and reset, but has no `assessment:submit`, so it cannot create or alter assessment results. Story shortcuts change the selection only.
- **Student** sees the student read-only ("Viewing as") and can change the course among enrollments.

## Assignment and caseload contracts

- Instructor: `instructors` fixture assigns `I-PY` → Python and `I-MATH` → Mathematics. `instructorForCourse` picks the persona for the selected course and `canInstructorViewCourse` guards the Instructor view (it shows an error state if unassigned). With one instructor per course every course is visible in the demo; a real per-user restriction requires an instructor identity selector, which is future work.
- Advisor: `advisors` fixture `A-MAIN` has all ten students as caseload. The Advisor portal lists only `canAdvisorViewStudent` students, the student selector offers only caseload students, and a non-caseload selection shows a "Not in caseload" state.
- Simulated approvals, nudges and early-warning actions are portal work (IN/AD screens) and must add their own permissions here.
