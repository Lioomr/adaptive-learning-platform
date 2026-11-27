# Instructor Portal — Omar

**Owner:** Omar  
**Document scope:** Instructor screens IN1–IN19.  
**Stage:** Phase 1 simulated UI only.

## Mission
Help an instructor see their own course content, approve concepts/graph/questions, and understand *why* students are stuck. Build desktop-first with clear data provenance.

## P0 tasks — main demonstration
- [ ] **IN2 Materials:** file upload dropzone, simulated extraction progress, file list, low-confidence warning, versions; no actual upload processing.
- [ ] **IN3 Concept approvals:** proposed concepts table, edit/merge/split/approve preview, linked source.
- [ ] **IN4 Graph review:** prerequisite graph with accept/reject edge, direction and cycle warning; local mock state only.
- [ ] **IN5 Question approvals:** flagged items, EN/AR previews, accept/edit/reject flow, sample reviewed questions.
- [ ] **IN8 Weekly dashboard:** weekly status cards, concept heatmap, top roadblocks, at-risk preview, content gaps; show sample-size note.
- [ ] **IN9 Concept detail:** mastery distribution, common wrong choices, prerequisite links, tutor questions, suggested teaching fix.
- [ ] **IN13 At-risk list:** students flagged by explainable preset reasons (e.g. inactivity or repeated prerequisite errors), filters.
- [ ] **IN14 Student view:** Nour progress, recent practice and diagnosis episodes; respect privacy boundaries.
- [ ] **IN15 Tutor audit:** source-backed mock answer, correction/approve actions, content-gap flag.

## P1 screens — after P0 integration
- [ ] IN1 onboarding and instructor boundaries.
- [ ] IN6 course rules/settings, student preview, simulated launch checklist.
- [ ] IN7 sign-up monitoring and *preview only* reminders.
- [ ] IN10 lecture decision summary.
- [ ] IN11 content gaps, IN12 add missing materials.
- [ ] IN16 exam readiness, IN17 review session pack.
- [ ] IN18 course report, IN19 research export approval **preview only**.

## Acceptance tests
- [ ] Access mock instructor dashboard and drill to Recursion → Call Stack roadblock.
- [ ] Student mock diagnosis is reflected as a matching instructor event, without contradictory numbers.
- [ ] Approving graph links/questions changes visible mock UI status only.
- [ ] Upload, launch, notify, approve export are explicitly described as simulated, not real operations.
- [ ] Arabic/English screen layout and accessible table/form controls work.
- [ ] Dashboard percentages and sample counts are labelled sample data.


## Current shared contract

Follow [DEMO-AGREEMENTS.md](../DEMO-AGREEMENTS.md) and the shared contracts. Ten fictional students and numeric mastery replace the earlier five-student scripted 8/10 and 9/10 examples. Begin portal implementation after foundation review. Preserve all assigned screen IDs and submit evidence through Linear.

## Workspace pages added after the IN list

Built as frontend-only, bilingual pages on mock data: Instructor Courses, Semester Preparation, Question Bank, Dashboard with out-of-bound tutor questions, Learning Analytics, Course Reports and Exam Preparation, Assignments / Attendance / Communication, and Settings & Permissions. They are not IN-numbered; details and known gaps are in the [frontend README](../frontend/README.md#instructor-workspace). Overlap with IN8, IN13, IN16 and IN18 should be reconciled at integration review.
