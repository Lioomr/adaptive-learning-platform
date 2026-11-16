# Academic Advisor Portal — Mahmoud

**Owner:** Mahmoud  
**Document scope:** Advisor screens AD1–AD6.  
**Stage:** Phase 1 simulated UI only.

## Mission
Provide a lighter, planning-focused cross-course view of assigned students. Advisors do not approve content and do not automatically see student chat transcripts or grades from outside the platform.

## P0 tasks — main demonstration
- [x] **AD2 Caseload:** student list with course mastery state, last activity, explainable flags, search/filter; only assigned mock students.
- [x] **AD3 Cross-course student:** courses, compact skill map, flags, recent activity, diagnosis episodes and linked rationale.
- [x] **AD5 Early warning:** scripted inactivity/repeated-prerequisite/declining-progress alerts; each warning shows a reason and data-limit note.
- [x] **AD4 Nudge:** template selector, editable message, language preview, recipient, simulated send confirmation; no real delivery.

## P1 screens — after P0 integration
- [x] AD1 onboarding, role and consent visibility limits.
- [x] AD6 academic planning screen with prerequisite readiness and suggested next courses.

## Acceptance tests
- [x] Select Nour and see the same Call Stack / Recursion status shown on Student/Instructor views.
- [x] Warn based on clear mock rule rather than inventing an AI risk score.
- [x] Clicking "Send nudge" updates demo activity log but never sends a real notification.
- [x] Advisor cannot access instructor approval screens or private tutor transcripts.
- [x] Caseload empty/low-evidence states, Arabic RTL and desktop layouts are represented.


## Current shared contract

Follow [DEMO-AGREEMENTS.md](../DEMO-AGREEMENTS.md) and the shared contracts. Ten fictional students and numeric mastery replace the earlier five-student scripted 8/10 and 9/10 examples. Begin portal implementation after foundation review. Preserve all assigned screen IDs and submit evidence through Linear.

## Implementation submission

AD1–AD6 implemented on `advisor/mah-6-ad1-ad6`. See [run and review instructions](README.md) and [acceptance evidence](ACCEPTANCE.md). Submitted for Integration Lead review; checked items describe implementation and verification, not review approval.
