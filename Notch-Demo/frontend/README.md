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
