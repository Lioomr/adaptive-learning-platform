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
