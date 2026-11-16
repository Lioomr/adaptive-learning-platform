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

## One baseline fixture
Use fictional **Nour** in **Introduction to Python** with the chain Variables → Functions → Call Stack → Recursion. Start with Variables and Functions mastered, Call Stack in progress, Recursion not ready. Use consistent identifiers across portal fixtures.

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
