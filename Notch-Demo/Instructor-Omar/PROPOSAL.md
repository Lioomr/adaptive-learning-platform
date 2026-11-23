# Instructor Portal — Work Proposal (Phase 1)

**Owner:** Omar · **Branch:** `notch/instructor-omar` · **Linear:** MAH-5 (parent), MAH-15, MAH-17, MAH-18, MAH-19, MAH-21, MAH-22
**Status:** Built and checked locally (type check, lint, production build pass). Awaiting review.

## 1. What this is
A clickable, simulated Instructor portal covering all 19 instructor screens (IN1–IN19) in the Notch demo. It shows how an instructor would set up a course, approve what the system extracted from their materials, and understand *why* students are stuck — without any real backend, AI, uploads or notifications.

## 2. Why it was built
- **Show the instructor side of the adaptive-learning story.** The student portal shows a learner getting stuck; the instructor portal shows the teacher seeing the same event and acting on it.
- **Prove the core idea — "the instructor stays in control".** Every AI-looking output (concepts, prerequisite links, questions, tutor answers, teaching fixes) passes through an instructor approval step.
- **Validate the design before engineering.** Stakeholders can click through the real flow and give feedback before any Django/ML work is committed.
- **Stay honest.** Every number is labelled sample data, and every action that would be real (upload, launch, notify, export) is labelled simulated.

## 3. What was built, and what each part is for

### Course setup (before teaching)
| Screen | Page | What it is for |
|---|---|---|
| IN1 Onboarding | `/instructor/onboarding` | Explains what an instructor can and cannot see (privacy boundaries) before they start. |
| IN2 Materials | `/instructor/materials` | Upload course files; shows simulated extraction progress, low-confidence warnings and file versions. |
| IN3 Concepts | `/instructor/concepts` | Review concepts the system proposed from the materials: approve, edit, merge or split, with the source excerpt. |
| IN4 Graph | `/instructor/graph` | Review the prerequisite map: accept/reject/flip links, with cycle and direction warnings. |
| IN5 Questions | `/instructor/questions` | Approve flagged practice questions with side-by-side English/Arabic previews. |
| IN6 Rules & launch | `/instructor/settings` | Course rules, student preview and a launch checklist (launch is simulated). |
| IN7 Sign-ups | `/instructor/signups` | See who joined; preview reminders (nothing is sent). |

### During teaching
| Screen | Page | What it is for |
|---|---|---|
| IN8 Weekly dashboard | `/instructor/dashboard` | One-glance weekly status: mastery heatmap, top roadblocks, at-risk preview, content gaps. |
| IN9 Concept detail | `/instructor/concepts/[id]` | Drill into a stuck concept: mastery spread, common wrong answers, prerequisites, suggested teaching fix. |
| IN10 Lecture decision | `/instructor/lecture-decision` | Decide whether to revisit a prerequisite in the next lecture, based on readiness. |
| IN11–12 Content gaps | `/instructor/content-gaps` | See missing material/questions and draft what to add. |
| IN13 At-risk | `/instructor/at-risk` | Students flagged for clear, explained reasons (inactivity, low average, prerequisite gap, repeated low scores). |
| IN14 Student view | `/instructor/students/[id]` | One student's course progress and diagnosis episodes, limited to course data only. |
| IN15 Tutor audit | `/instructor/tutor-audit` | Check scripted AI-tutor answers against sources; approve, correct or flag a content gap. |

### End of course
| Screen | Page | What it is for |
|---|---|---|
| IN16–17 Exam readiness | `/instructor/exam-readiness` | Readiness per exam topic and a generated review-session pack. |
| IN18–19 Report & export | `/instructor/report` | Course report and a research-export approval with pseudonymous IDs (preview only, no file created). |

A screen menu at the top of the instructor portal links all of these.

## 4. Key demo flow (acceptance test)
Dashboard → top roadblock **Recursion (60%) → Call Stack (62%)** → Recursion concept detail → Nour's student view. This roadblock is calculated from the shared mock data, not hard-coded, so it matches what the student portal shows.

## 5. How it follows the team rules
- Uses only the shared fixtures (10 fictional students, 2 courses) and the agreed mastery bands (0–39 / 40–69 / 70–84 / 85–100; prerequisite ready at ≥70).
- No shared files changed (sidebar, routes, fixtures, store); everything lives in `app/instructor/` and `features/instructor/`.
- No real names, logins, uploads, AI or notifications.

## 6. Known gaps / next steps
- Page text is English only; layouts mirror for Arabic, and the Arabic previews need a native-speaker check.
- Decisions on IN2–IN5 reset on reload; sharing them across screens needs a store change reviewed by the Integration Lead.
- Main sidebar links to these screens need Integration Lead approval.
- Question bank is still the 2-question illustrative set (see MAH-28).
- Only the dashboard and concept detail have been checked visually in a browser; full click-through review and screenshots are still needed.
