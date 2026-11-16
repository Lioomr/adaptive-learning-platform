import type { CourseId } from "@/types";

/**
 * Local P1 sample data for IN6, IN7, IN10–IN12 and IN16–IN19 (MAH-22).
 * Every record references stable IDs from data/fixtures.ts. All people are
 * fictional; nothing here is real student data and nothing is sent anywhere.
 * Live mastery values always come from the shared demo store, not from here.
 */

/** Routes owned by other Instructor work items. Linked to, never edited here. */
export const instructorLinks = {
  overview: "/instructor",
  onboarding: "/instructor/onboarding",
  materials: "/instructor/materials",
  concepts: "/instructor/concepts",
  graph: "/instructor/graph",
  questions: "/instructor/questions",
  dashboard: "/instructor/dashboard",
  atRisk: "/instructor/at-risk",
  students: "/instructor/students",
  tutorAudit: "/instructor/tutor-audit",
  settings: "/instructor/settings",
  signups: "/instructor/signups",
  lectureDecision: "/instructor/lecture-decision",
  contentGaps: "/instructor/content-gaps",
  examReadiness: "/instructor/exam-readiness",
  report: "/instructor/report",
} as const;

/* ---------- IN6 course rules / settings ---------- */

export type PrerequisiteMode = "advise" | "block";
export type TutorMode = "hints" | "worked";
export type CourseLanguage = "en" | "ar" | "both";

export type CourseRules = {
  masteryTarget: number;
  prerequisiteMode: PrerequisiteMode;
  tutorMode: TutorMode;
  language: CourseLanguage;
  weeklyQuestions: number;
  showMasteryToStudents: boolean;
  tutorCitesSources: boolean;
};

export const defaultRules: Record<CourseId, CourseRules> = {
  "C-PY": { masteryTarget: 70, prerequisiteMode: "advise", tutorMode: "hints", language: "both", weeklyQuestions: 15, showMasteryToStudents: true, tutorCitesSources: true },
  "C-MATH": { masteryTarget: 70, prerequisiteMode: "advise", tutorMode: "hints", language: "both", weeklyQuestions: 12, showMasteryToStudents: true, tutorCitesSources: true },
};

export type ChecklistItem = { id: string; label: string; detail: string; href: string; screen: string; done: boolean };

export const launchChecklist: Record<CourseId, ChecklistItem[]> = {
  "C-PY": [
    { id: "materials", label: "Course materials uploaded", detail: "6 sample lecture files linked to concepts.", href: instructorLinks.materials, screen: "IN2", done: true },
    { id: "concepts", label: "Concepts approved", detail: "10 of 10 Python concepts approved (sample).", href: instructorLinks.concepts, screen: "IN3", done: true },
    { id: "graph", label: "Prerequisite graph reviewed", detail: "Call Stack → Recursion link confirmed.", href: instructorLinks.graph, screen: "IN4", done: true },
    { id: "questions", label: "Question bank reviewed", detail: "Illustrative bank only: 1 of 50 target questions. Release blocker (MAH-28).", href: instructorLinks.questions, screen: "IN5", done: false },
    { id: "rules", label: "Course rules confirmed", detail: "Review the settings on this page.", href: instructorLinks.settings, screen: "IN6", done: false },
  ],
  "C-MATH": [
    { id: "materials", label: "Course materials uploaded", detail: "5 sample lecture files linked to concepts.", href: instructorLinks.materials, screen: "IN2", done: true },
    { id: "concepts", label: "Concepts approved", detail: "10 of 10 Mathematics concepts approved (sample).", href: instructorLinks.concepts, screen: "IN3", done: true },
    { id: "graph", label: "Prerequisite graph reviewed", detail: "Limits → Derivatives link confirmed.", href: instructorLinks.graph, screen: "IN4", done: true },
    { id: "questions", label: "Question bank reviewed", detail: "Illustrative bank only: 1 of 50 target questions. Release blocker (MAH-28).", href: instructorLinks.questions, screen: "IN5", done: false },
    { id: "rules", label: "Course rules confirmed", detail: "Review the settings on this page.", href: instructorLinks.settings, screen: "IN6", done: false },
  ],
};

/* ---------- IN7 sign-up monitoring ---------- */

export type SignupStatus = "joined" | "consent-pending" | "not-joined";

export const signupStatusLabel: Record<SignupStatus, string> = {
  joined: "Joined",
  "consent-pending": "Consent pending",
  "not-joined": "Not joined yet",
};

/** Sample sign-up state per fictional student ID. Days = days since the invitation was simulated. */
export const signups: Record<CourseId, Record<string, { status: SignupStatus; invitedDaysAgo: number }>> = {
  "C-PY": {
    "S-NOUR": { status: "joined", invitedDaysAgo: 12 },
    "S-AHMED": { status: "joined", invitedDaysAgo: 12 },
    "S-SALMA": { status: "joined", invitedDaysAgo: 12 },
    "S-YOUSSEF": { status: "not-joined", invitedDaysAgo: 12 },
    "S-MARIAM": { status: "joined", invitedDaysAgo: 12 },
    "S-LAILA": { status: "joined", invitedDaysAgo: 10 },
    "S-OMAR": { status: "consent-pending", invitedDaysAgo: 10 },
    "S-FARAH": { status: "joined", invitedDaysAgo: 10 },
    "S-KARIM": { status: "consent-pending", invitedDaysAgo: 8 },
    "S-HANA": { status: "joined", invitedDaysAgo: 8 },
  },
  "C-MATH": {
    "S-NOUR": { status: "joined", invitedDaysAgo: 11 },
    "S-AHMED": { status: "joined", invitedDaysAgo: 11 },
    "S-SALMA": { status: "joined", invitedDaysAgo: 11 },
    "S-YOUSSEF": { status: "not-joined", invitedDaysAgo: 11 },
    "S-MARIAM": { status: "consent-pending", invitedDaysAgo: 11 },
    "S-LAILA": { status: "joined", invitedDaysAgo: 9 },
    "S-OMAR": { status: "joined", invitedDaysAgo: 9 },
    "S-FARAH": { status: "joined", invitedDaysAgo: 9 },
    "S-KARIM": { status: "not-joined", invitedDaysAgo: 7 },
    "S-HANA": { status: "joined", invitedDaysAgo: 7 },
  },
};

export const reminderTemplates = {
  en: "Hello {name}, your {course} course space is ready. Sign in and confirm your preferences to start practising.",
  ar: "مرحبًا {name}، مساحة مقرر {course} جاهزة. سجّل الدخول وأكّد تفضيلاتك لبدء التدريب.",
} as const;

/* ---------- IN10 lecture decision ---------- */

/** The next scheduled lecture per course (sample timetable). */
export const upcomingLecture: Record<CourseId, { conceptId: string; week: number; day: string }> = {
  "C-PY": { conceptId: "PY-REC", week: 7, day: "Sunday" },
  "C-MATH": { conceptId: "MA-DERIV", week: 7, day: "Monday" },
};

/** Sample common wrong choices per concept, shown as evidence. Counts are sample data. */
export const commonMisconceptions: Record<string, { label: string; count: number }[]> = {
  "PY-STACK": [
    { label: "Believes a returned value stays on the stack", count: 5 },
    { label: "Traces frames in the wrong order", count: 3 },
  ],
  "PY-FUNC": [{ label: "Confuses printing with returning a value", count: 3 }],
  "PY-COND": [{ label: "Misses the else branch when tracing", count: 2 }],
  "MA-LIMIT": [
    { label: "Substitutes directly when the expression is undefined", count: 4 },
    { label: "Treats a one-sided limit as the limit", count: 2 },
  ],
  "MA-FUNC": [{ label: "Reads f(x + 1) as f(x) + 1", count: 3 }],
};

/* ---------- IN11 / IN12 content gaps ---------- */

export type GapKind = "worked-example" | "arabic" | "questions" | "tutor-source";
export const gapKindLabel: Record<GapKind, string> = {
  "worked-example": "No worked example",
  arabic: "Arabic version missing",
  questions: "Too few practice questions",
  "tutor-source": "Tutor could not cite a source",
};

export type ContentGap = { id: string; courseId: CourseId; conceptId: string; kind: GapKind; evidence: string; signal: number; origin: string };

export const contentGaps: ContentGap[] = [
  { id: "GAP-PY-01", courseId: "C-PY", conceptId: "PY-STACK", kind: "worked-example", evidence: "Students asked the tutor to trace a call stack step by step; no traced example exists in the materials.", signal: 9, origin: "Tutor questions (IN15)" },
  { id: "GAP-PY-02", courseId: "C-PY", conceptId: "PY-REC", kind: "tutor-source", evidence: "Tutor answers about base cases had no matching lecture section to cite.", signal: 6, origin: "Tutor audit (IN15)" },
  { id: "GAP-PY-03", courseId: "C-PY", conceptId: "PY-DICT", kind: "arabic", evidence: "Lecture slides exist in English only.", signal: 3, origin: "Material review (IN2)" },
  { id: "GAP-MA-01", courseId: "C-MATH", conceptId: "MA-LIMIT", kind: "worked-example", evidence: "Students repeatedly asked how to handle 0/0 forms; slides show only the final result.", signal: 7, origin: "Tutor questions (IN15)" },
  { id: "GAP-MA-02", courseId: "C-MATH", conceptId: "MA-DERIV", kind: "tutor-source", evidence: "Tutor explained the chain rule without a citable source in course materials.", signal: 5, origin: "Tutor audit (IN15)" },
  { id: "GAP-MA-03", courseId: "C-MATH", conceptId: "MA-GRAPH", kind: "arabic", evidence: "Graph-reading worksheet has no Arabic version.", signal: 2, origin: "Material review (IN2)" },
];

/** Target illustrative questions per concept (100 questions / 20 concepts). */
export const QUESTIONS_PER_CONCEPT_TARGET = 5;

/* ---------- IN16 / IN17 exam readiness ---------- */

export const examInfo: Record<CourseId, { title: string; inDays: number; scope: string[] }> = {
  "C-PY": { title: "Midterm exam (sample)", inDays: 12, scope: ["PY-FUNC", "PY-LIST", "PY-DICT", "PY-STACK", "PY-REC"] },
  "C-MATH": { title: "Midterm exam (sample)", inDays: 14, scope: ["MA-FUNC", "MA-GRAPH", "MA-QUAD", "MA-LIMIT", "MA-DERIV"] },
};

/** Ready threshold reuses PREREQUISITE_READY (70) from the shared mastery service. */

/* ---------- IN19 research export ---------- */

export type ExportField = { id: string; label: string; detail: string; allowed: boolean; defaultOn: boolean };

export const exportFields: ExportField[] = [
  { id: "pseudo-id", label: "Pseudonymous participant ID", detail: "Replaces student IDs with P-01, P-02 …", allowed: true, defaultOn: true },
  { id: "mastery", label: "Concept mastery values (0–100)", detail: "Simulated values from the demo formula.", allowed: true, defaultOn: true },
  { id: "attempt-count", label: "Number of assessment attempts", detail: "Counts only, no answers.", allowed: true, defaultOn: true },
  { id: "activity", label: "Days since last activity", detail: "Rounded to whole days.", allowed: true, defaultOn: false },
  { id: "names", label: "Student names", detail: "Never exported. Direct identifiers are excluded.", allowed: false, defaultOn: false },
  { id: "tutor-text", label: "Tutor conversation text", detail: "Never exported. Free text may contain personal data.", allowed: false, defaultOn: false },
];
