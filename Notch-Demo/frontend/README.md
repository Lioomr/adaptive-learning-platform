# Notch-Demo frontend

Shared Next.js application for the Notch Phase 1 demo. Everything is fictional and simulated; see [shared architecture](../shared/ARCHITECTURE.md) and the [demo agreement](../DEMO-AGREEMENTS.md).

Requires Node 22.18 or later (for `npm test`).

```
npm ci
npm run dev        # http://localhost:3000 → /demo
npm run lint
npm run typecheck
npm test           # assessment, permission and persistence rules
npm run build
```

Structure: `app/` routes and portal layouts · `components/` shared UI · `features/<portal>/` portal views · `services/` pure rules · `store/` shared state · `lib/` routes, permissions, utils · `data/` fixtures · `types/` contracts · `tests/` unit tests.

Run lint, typecheck, test and build before requesting review.

## Student workspace

The Student sidebar has Home (`/student`), Dashboard (`/student/dashboard`),
Courses (`/student/courses`), and Chatbot (`/student/chatbot`). Each of the five
courses has Progress, Announcements, Lectures, Labs, Submissions, Grades, and
Extra Materials under `/student/courses/<courseId>/<section>`. Existing ST1–ST21
routes remain available. Instructor and Advisor retain their existing portals.

The implementation is in `features/student/portal/`:

- `data.ts`: typed bilingual fixtures, lessons, labs, assessments, calendar,
  announcements, and temporary learning-preference questions.
- `store.ts`: validated, versioned browser persistence per fictional student for
  onboarding, completed activities, drafts, submissions, and course conversations.
- `tutor.ts`: deterministic course-grounded replies, with no model or backend call.
- `context.tsx`: language, RTL, hydration, and shared-shell integration.

Python and Mathematics read concept mastery from the existing shared demo store.
The three additional courses are Student-only mock extensions requested for this
workspace; existing shared enrollment and instructor/advisor contracts are intact.
Completing a lesson updates completion across Student views, not assessed mastery.
Calendar fixtures intentionally use 24 November 2026 as the demo date, in Cairo time.
Learning preferences are an editable question-bank scaffold, not a fixed diagnosis.

Run `npm run test:student` for the eight browser flows, including onboarding,
all 35 course sections, draft restoration, completion, tutor conversations, calendar,
downloads, invalid routes, Arabic RTL, and desktop/tablet/mobile layouts. The suite
uses `localhost` to match Next's dev origin and saves visual evidence under the
ignored `test-results/student/` directory. `npm test` requires Node 22.18+.

## Instructor workspace

The Instructor sidebar (`features/instructor/portal/navigation.tsx`) opens a bilingual (EN/AR, RTL) workspace built on mock data and a fixed demo clock (25 November 2026, Cairo time).

| Route | Code | What it does |
|---|---|---|
| `/instructor` | `features/instructor/dashboard/` | Dashboard: week status, roadblocks, out-of-bound tutor questions |
| `/instructor/courses` | `features/instructor/portal/` | My Courses: lessons, materials, announcements, grades, progress, submissions |
| `/instructor/semester` | `features/instructor/semester/` | Semester Preparation |
| `/instructor/question-bank` | `features/instructor/qbank/` | Question Bank with review states |
| `/instructor/approvals`, `/student-management`, `/assessments`, `/chatbot`, `/calendar`, `/out-of-bound`, `/content-issues` | `features/instructor/portal/` | Approvals, students, assessments, tutor chatbot, calendar, unanswerable tutor questions, content issues |
| `/instructor/analytics` | `features/instructor/analytics/` | Learning Analytics: mastery heatmap, concepts, prerequisites, progress, engagement, at-risk, export |
| `/instructor/reports` | `features/instructor/reports/` | Course Reports and exam preparation: readiness, revision plans, mock exams from approved questions, four report types (CSV, print to PDF) |
| `/instructor/coursework` | `features/instructor/coursework/` | Assignments, attendance and communication |
| `/instructor/preferences` | `features/instructor/settings/` | Settings & Permissions: six sections, role-gated, save/discard/reset |

The older IN-numbered screens (`/instructor/settings`, `/instructor/students`, and so on) are unchanged.

Rules that apply across these pages:

- Estimated mastery is shown separately from official grades and never changes a grade. Attendance never penalises a student unless a course policy says so.
- Missing evidence (fewer than 3 attempts) shows as "Insufficient evidence", never zero. Scale: Low under 50, Developing 50-74, High 75 and above.
- Readiness is an estimate. Mock exams use approved Question Bank items only.
- Settings are role-gated (Course Instructor, TA, Coordinator, Dept Admin) with a request-access flow; administrator rights cannot be self-granted. The tutor stays grounded in permitted materials and no setting claims to remove errors.
- State: the portal store and the settings store (`notch-instructor-settings-v1`) persist in the browser; coursework, reports, dashboard and question-bank extension stores are session-only.
- Not yet wired: mastery threshold, strictness and tutor settings are stored but do not change analytics, reports or the tutor.
- Testing: these pages are covered by typecheck, lint and manual browser runs. The Playwright suites cover only student and advisor flows.
