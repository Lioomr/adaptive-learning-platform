# Screen inventory and priorities

All screen IDs below come from the agreed **Full User Journey Scenarios** PDF. Priorities are **suggested Phase 1 implementation order**, not alterations to the journey.

## Student — Menna
**P0 (show in primary demo):** ST1 Login, ST2 Consent, ST3 Language/preferences, ST4 Diagnostic, ST5 Skill Map, ST6 Home, ST7 Course home, ST8 Lecture, ST9 Mid-session question, ST10 Mastery assessment, ST11 Diagnosis ladder, ST12 Roadmap, ST17 Tutor.

**P1 (complete visual coverage):** ST13 Mastery view, ST14 Exam readiness, ST15 Mock quiz, ST16 Daily review, ST18 Settings, ST19 Post-test, ST20 Survey, ST21 Summary.

## Instructor — Omar
**P0:** IN2 Upload materials, IN3 Approve concepts, IN4 Check graph, IN5 Approve questions, IN8 Weekly dashboard, IN9 Concept detail, IN13 At-risk students, IN14 Student view, IN15 Tutor audit.

**P1:** IN1 Onboarding, IN6 Settings/launch, IN7 Sign-up monitoring, IN10 Lecture decision, IN11 Content gaps, IN12 Add material, IN16 Exam readiness, IN17 Review session, IN18 Course report, IN19 Approve export.

## Academic Advisor — Mahmoud
**P0:** AD2 Caseload, AD3 Cross-course student view, AD5 Early warning, AD4 Nudge.
**P1:** AD1 Onboarding, AD6 Planning view.

## Shared states — team-wide
SYS1 Error/offline, SYS2 Status page, SYS3 Delete data request. Implement representative simulated states and route transitions, not fake operational promises.

## Suggested first integrated user story
ST1 → ST2 → ST3 → ST4 → ST5 → ST6 → ST7 → ST8 → ST9 → ST10 → ST11 → ST8. In parallel, IN8 → IN9 / IN14 and AD2 → AD3 / AD5 display consistent mock outcomes for the same student's trouble with Call Stack / Recursion.

## Two-course content and shared state coverage

These mappings preserve the IDs and priorities above. “Selected” means either Python or Mathematics based on the active authorized course; “both” means both courses must be available, and “cross-course” means compare them. All listed interactions use the [shared mock contract](MOCK-DATA-CONTRACT.md) and the [demo agreement](DEMO-AGREEMENTS.md). Course selection occurs inside existing screens, not a new ID.

| Screens | Course coverage and shared interactions |
|---|---|
| ST1–ST3 | Both: simulated login, consent and language; enrollment and preferences. |
| ST4–ST5 | Selected: course diagnostic, attempts, concept graph and mastery. |
| ST6 | Both / cross-course: course selection, progress and recommendations. |
| ST7–ST12 | Selected: course lessons, practice, assessment, diagnosis and roadmap. |
| ST13–ST16 | Selected: mastery, readiness, mock quiz and review. |
| ST17 | Selected: scripted tutor and course-specific mock sources. |
| ST18 | Both: shared language, preferences and consent/deletion preview. |
| ST19–ST21 | Selected: post-test, survey and course summary. |
| IN1–IN2 | Assigned course: instructor identity, onboarding and material preview. |
| IN3–IN5 | Assigned course: concept graph, questions and simulated approvals. |
| IN6–IN7 | Assigned course: settings, launch and signup previews. |
| IN8–IN9 | Assigned course: shared mastery, activity and concept analytics. |
| IN10–IN12 | Assigned course: lecture decision, gaps and material preview. |
| IN13–IN15 | Assigned course: at-risk students, progress, diagnosis and tutor audit. |
| IN16–IN19 | Assigned course: readiness, review, reporting and export preview. |
| AD1 | Both: role and privacy boundaries, assigned caseload. |
| AD2–AD3 | Both / cross-course: caseload, mastery and diagnosis summaries. |
| AD4–AD5 | Both / cross-course: simulated nudge and explainable warnings. |
| AD6 | Both / cross-course: planning and prerequisite readiness. |
| SYS1–SYS3 | Shared: simulated error/offline, status and deletion-request states. |
