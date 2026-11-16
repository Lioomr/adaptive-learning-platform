# Shared mock-data contract (provisional, frontend only)

These are *illustrative UI data shapes* and **not** the production database schema or API specification. The team may revise field names before coding, but all three portals must use the same fixture.

## Required entities
- `student`: `id`, `displayName`, `preferredLanguage`, `enrolledCourseIds`, `lastActiveAt`
- `course`: `id`, `titleEn`, `titleAr`, `instructorName`, `week`, `examDate?`
- `concept`: `id`, `courseId`, `titleEn`, `titleAr`, `prerequisiteIds[]`, `status`, `masteryDisplay?`
- `question`: `id`, `conceptId`, `promptEn`, `promptAr`, `options[]`, `correctOptionId`, `approvalStatus`
- `session`: `id`, `studentId`, `courseId`, `conceptId`, `screenId`, `questionIndex`
- `attempt`: `id`, `studentId`, `questionId`, `sessionId`, `answerId`, `isCorrect`, `kind`
- `diagnosis`: `id`, `studentId`, `conceptId`, `cause`, `prerequisiteCheckedId?`, `suggestedAction`, `outcome`
- `recommendation`: `studentId`, `conceptId`, `reasonCode`, `displayText`
- `riskFlag`: `studentId`, `courseId`, `reasonCode`, `severity`, `status`

## Two-course baseline
The authoritative demo fixtures, complete prerequisite edges, baseline statuses and six resettable scenarios are in [DEMO-AGREEMENTS.md](DEMO-AGREEMENTS.md). Use fictional Nour, Ahmed, Salma, Youssef and Mariam in both C-PY and C-MATH. For Nour, PY-STACK and MA-DERIV are needs-review and PY-REC and MA-APP are not-ready; both courses start at 8/10 mastered. Do not substitute a different baseline in any portal.

## Simulated actions
- `startDiagnostic`, `submitDiagnosticAnswer`, `showSkillMap`.
- `startLesson`, `submitPracticeAnswer`, `submitAssessment`, `triggerDiagnosis`.
- `getInstructorCourseOverview`, `getStudentProgress`, `getAdvisorCaseload`.
- `sendNudgePreview`, `showTutorReply`, `previewMaterialUpload`.
Mock responses can be plain local data or a small in-browser state store; no backend is necessary.

## Rules
- Stable IDs and repeatable scenario reset.
- Never replace official question text with live generated content for this demo.
- A wrong answer must not magically certify a new skill. Only scripted, visibly marked mock outcomes may change mastery.
- Attempt, concept, and diagnosis state must agree in Student / Instructor / Advisor views.
- Mark mock timestamps, mastery scores, tutor replies and alert states as simulated.
- No real personal data, real consent storage, or real external actions.

## Proposed shared frontend structures

These structures are illustrative in-browser data, **not a production schema or API**. Identifiers are stable across languages and portals. The initial fixture is read-only; the shared session store applies deterministic events and can reset to it.

```ts
type Course = { id: 'C-PY' | 'C-MATH'; titleEn: string; titleAr: string; instructorId: string };
type Instructor = { id: string; name: string; courseIds: Course['id'][] };
type Student = { id: string; displayName: string; preferredLanguage: 'en' | 'ar'; lastActiveAt: string };
type Enrollment = { studentId: string; courseId: Course['id'] };
type Concept = { id: string; courseId: Course['id']; titleEn: string; titleAr: string; prerequisiteIds: string[] };
type Question = { id: string; courseId: Course['id']; conceptId: string; promptEn: string; promptAr: string; options: string[]; correctOptionId: string; approvalStatus: 'demo-approved' | 'pending' };
type Assessment = { id: string; courseId: Course['id']; conceptId: string; questionIds: string[] };
type Session = { id: string; studentId: string; courseId: Course['id']; screenId: string; questionIndex: number };
type Attempt = { id: string; sessionId: string; studentId: string; courseId: Course['id']; conceptId: string; assessmentId: string; correct: number; total: number };
type Mastery = { studentId: string; courseId: Course['id']; conceptId: string; status: 'mastered' | 'needs-review' | 'not-ready' };
type Diagnosis = { id: string; studentId: string; courseId: Course['id']; conceptId: string; prerequisiteId?: string; reason: string; status: 'open' | 'resolved' };
type Recommendation = { id: string; studentId: string; courseId: Course['id']; conceptId: string; reason: string; action: string };
type AdvisorCaseload = { advisorId: string; studentIds: string[] };
type RiskFlag = { id: string; studentId: string; courseId?: Course['id']; reason: string; status: 'active' | 'resolved'; dataLimit: string };
type DemoEvent = { id: string; scenarioId: string; studentId: string; courseId?: Course['id']; kind: string; simulatedAt: string };
```

Example objects (all synthetic):

```json
{
  "courses": [{"id":"C-PY","titleEn":"Introduction to Python","titleAr":"مقدمة في بايثون","instructorId":"I-PY"},{"id":"C-MATH","titleEn":"Mathematics","titleAr":"الرياضيات","instructorId":"I-MATH"}],
  "instructors": [{"id":"I-PY","name":"Dr. Lina Hassan","courseIds":["C-PY"]},{"id":"I-MATH","name":"Dr. Adam Nabil","courseIds":["C-MATH"]}],
  "student": {"id":"S-NOUR","displayName":"Nour","preferredLanguage":"en","lastActiveAt":"2026-01-14T12:00:00Z"},
  "enrollments": [{"studentId":"S-NOUR","courseId":"C-PY"},{"studentId":"S-NOUR","courseId":"C-MATH"}],
  "concept": {"id":"PY-REC","courseId":"C-PY","titleEn":"Recursion","titleAr":"الاستدعاء الذاتي","prerequisiteIds":["PY-COND","PY-FUNC","PY-STACK"]},
  "mastery": {"studentId":"S-NOUR","courseId":"C-PY","conceptId":"PY-STACK","status":"needs-review"},
  "caseload": {"advisorId":"A-01","studentIds":["S-NOUR","S-AHMED","S-SALMA","S-YOUSSEF","S-MARIAM"]}
}
```

### Invariants and synchronization

- Each enrollment, question, attempt, mastery and diagnosis references a valid student/course/concept in the same course. Every prerequisite references a concept in that course; graphs are acyclic.
- Progress equals mastered concepts divided by the ten concepts in that course. Derive every portal's fraction and percentage from the same mastery records, never separately hard-code them.
- Every scripted action writes one shared event and updates associated state atomically; each authorized portal derives its own view from that state. Deduplicate event IDs. A reset restores baseline fixtures and clears session events and simulated sends.
- Instructor access is the intersection of selected simulated identity and assigned courses; advisor sees only assigned students and no private tutor transcript. Switching course or language never changes mastery.
- Use the fixed demo clock and reasoned warning rule from the agreement. No real notification, upload, consent storage, real student record or backend request is performed.
