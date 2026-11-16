# Academic Advisor Portal — Mahmoud

**Owner:** Mahmoud  
**Document scope:** Advisor screens AD1–AD6.  
**Stage:** Phase 1 simulated UI only.

## Mission
Provide a lighter, planning-focused cross-course view of assigned students. Advisors do not approve content and do not automatically see student chat transcripts or grades from outside the platform.

## P0 tasks — main demonstration
- [ ] **AD2 Caseload:** student list with course mastery state, last activity, explainable flags, search/filter; only assigned mock students.
- [ ] **AD3 Cross-course student:** courses, compact skill map, flags, recent activity, diagnosis episodes and linked rationale.
- [ ] **AD5 Early warning:** scripted inactivity/repeated-prerequisite/declining-progress alerts; each warning shows a reason and data-limit note.
- [ ] **AD4 Nudge:** template selector, editable message, language preview, recipient, simulated send confirmation; no real delivery.

## P1 screens — after P0 integration
- [ ] AD1 onboarding, role and consent visibility limits.
- [ ] AD6 academic planning screen with prerequisite readiness and suggested next courses.

## Acceptance tests
- [ ] Select Nour and see the same Call Stack / Recursion status shown on Student/Instructor views.
- [ ] Warn based on clear mock rule rather than inventing an AI risk score.
- [ ] Clicking "Send nudge" updates demo activity log but never sends a real notification.
- [ ] Advisor cannot access instructor approval screens or private tutor transcripts.
- [ ] Caseload empty/low-evidence states, Arabic RTL and desktop layouts are represented.
