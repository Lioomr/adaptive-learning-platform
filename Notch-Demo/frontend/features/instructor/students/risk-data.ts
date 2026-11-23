import { baselineStudent, conceptsForCourse, findConcept } from "@/data/fixtures";
import { courseAverage } from "@/services/insights";
import { MASTERY_BANDS, nextMastery, PREREQUISITE_READY, recommendation, type Tone } from "@/services/mastery";
import type { Attempt, CourseId, Student } from "@/types";

/**
 * IN13 / IN14 local sample data (SAMPLE / SIMULATED).
 *
 * Fictional practice history that happened *before* the shared demo baseline in
 * data/fixtures.ts. Every entry is checked at module load against the approved
 * mastery rule and the fixture baseline, so the history can never contradict
 * fixture numbers. Diagnosis notes carry no numbers: the prerequisite and every
 * displayed value are derived from the fixtures and shared mastery services.
 */
export type SamplePractice = {
  id: string;
  studentId: string;
  courseId: CourseId;
  conceptId: string;
  /** Concept mastery before this sample attempt. */
  previous: number;
  /** Rounded percentage correct. */
  score: number;
  /** Days before the demo baseline. */
  daysAgo: number;
  /** Optional simulated diagnosis note (no numbers, no personal data). */
  diagnosisNote?: string;
};

export type SamplePracticeEntry = SamplePractice & { mastery: number };

const RAW_HISTORY: SamplePractice[] = [
  // Nour (S-NOUR), Python: Recursion struggles that point to Call Stack.
  { id: "SP-NOUR-PY-1", studentId: "S-NOUR", courseId: "C-PY", conceptId: "PY-STACK", previous: 65, score: 40, daysAgo: 6 },
  { id: "SP-NOUR-PY-2", studentId: "S-NOUR", courseId: "C-PY", conceptId: "PY-REC", previous: 53, score: 33, daysAgo: 3, diagnosisNote: "Incorrect choices clustered on how each call returns to the one that made it." },
  { id: "SP-NOUR-PY-3", studentId: "S-NOUR", courseId: "C-PY", conceptId: "PY-REC", previous: 45, score: 20, daysAgo: 1, diagnosisNote: "Traced the first call correctly but lost track of pending calls while unwinding." },
  // Nour (S-NOUR), Mathematics.
  { id: "SP-NOUR-MA-1", studentId: "S-NOUR", courseId: "C-MATH", conceptId: "MA-DERIV", previous: 58, score: 25, daysAgo: 4 },
  { id: "SP-NOUR-MA-2", studentId: "S-NOUR", courseId: "C-MATH", conceptId: "MA-APP", previous: 41, score: 0, daysAgo: 2, diagnosisNote: "Applied an optimisation setup but could not differentiate the resulting expression." },
  // Ahmed (S-AHMED), Python: Loops.
  { id: "SP-AHMED-PY-1", studentId: "S-AHMED", courseId: "C-PY", conceptId: "PY-LOOP", previous: 45, score: 20, daysAgo: 2, diagnosisNote: "Loop exit conditions were usually reversed." },
  // Mariam (S-MARIAM): foundations in both courses.
  { id: "SP-MARIAM-PY-1", studentId: "S-MARIAM", courseId: "C-PY", conceptId: "PY-VAR", previous: 50, score: 0, daysAgo: 3, diagnosisNote: "Assignment direction was read right-to-left inconsistently." },
  { id: "SP-MARIAM-MA-1", studentId: "S-MARIAM", courseId: "C-MATH", conceptId: "MA-ARITH", previous: 33, score: 25, daysAgo: 5, diagnosisNote: "Order-of-operations errors appeared across most items." },
  // Youssef (S-YOUSSEF): last practice was before the inactivity period.
  { id: "SP-YOUSSEF-PY-1", studentId: "S-YOUSSEF", courseId: "C-PY", conceptId: "PY-LOOP", previous: 46, score: 0, daysAgo: 14, diagnosisNote: "Session ended after the first few loop items." },
];

function validate(entries: SamplePractice[]): SamplePracticeEntry[] {
  const withMastery = entries.map(e => ({ ...e, mastery: nextMastery(e.previous, e.score) }));
  return withMastery.filter(e => {
    const student = baselineStudent(e.studentId);
    const concept = findConcept(e.conceptId);
    if (!student || !concept || concept.courseId !== e.courseId || !student.enrolledCourseIds.includes(e.courseId) || e.daysAgo < student.lastActiveDays) return warn(e, "unknown or inconsistent student, course, concept or date");
    // Chain check: the next later attempt on the same concept must start where this one ended,
    // and the latest attempt must end exactly at the fixture baseline.
    const later = withMastery.filter(o => o.studentId === e.studentId && o.conceptId === e.conceptId && o.daysAgo < e.daysAgo).sort((a, b) => b.daysAgo - a.daysAgo)[0];
    const expected = later ? later.previous : student.mastery[e.conceptId];
    return e.mastery === expected ? true : warn(e, `ends at ${e.mastery}, expected ${expected}`);
  });
}

function warn(e: SamplePractice, reason: string): false {
  if (process.env.NODE_ENV !== "production") console.warn(`[IN14 sample data] Dropped ${e.id}: ${reason}.`);
  return false;
}

export const SAMPLE_HISTORY: readonly SamplePracticeEntry[] = validate(RAW_HISTORY);

export const sampleHistoryFor = (studentId: string, courseId: CourseId) =>
  SAMPLE_HISTORY.filter(e => e.studentId === studentId && e.courseId === courseId).sort((a, b) => a.daysAgo - b.daysAgo);

export type DiagnosisEpisode = {
  id: string;
  conceptId: string;
  /** First prerequisite below readiness, derived from the fixture baseline. */
  prerequisiteId?: string;
  prerequisiteBaseline?: number;
  note: string;
  source: "sample" | "current";
  daysAgo?: number;
  previous?: number;
  mastery?: number;
  score?: number;
};

/**
 * Diagnosis episodes: sample notes from history plus the current, live
 * recommendation for the student's lowest concept below readiness.
 */
export function diagnosisEpisodesFor(student: Student, courseId: CourseId): DiagnosisEpisode[] {
  const baseline = baselineStudent(student.id);
  const sample: DiagnosisEpisode[] = sampleHistoryFor(student.id, courseId)
    .filter(e => e.diagnosisNote)
    .map(e => {
      const rec = baseline ? recommendation(baseline, e.conceptId) : undefined;
      const prerequisiteId = rec?.kind === "review" ? rec.prerequisiteId : undefined;
      return { id: e.id, conceptId: e.conceptId, prerequisiteId, prerequisiteBaseline: prerequisiteId ? baseline?.mastery[prerequisiteId] : undefined, note: e.diagnosisNote!, source: "sample", daysAgo: e.daysAgo, previous: e.previous, mastery: e.mastery, score: e.score };
    });

  const current: DiagnosisEpisode[] = [];
  const focus = [...conceptsForCourse(courseId)].filter(c => recommendation(student, c.id).kind === "review" && student.mastery[c.id] < PREREQUISITE_READY).sort((a, b) => student.mastery[a.id] - student.mastery[b.id])[0];
  if (focus) {
    const rec = recommendation(student, focus.id);
    if (rec.kind === "review") current.push({ id: `CUR-${student.id}-${focus.id}`, conceptId: focus.id, prerequisiteId: rec.prerequisiteId, note: rec.message, source: "current", mastery: student.mastery[focus.id] });
  }
  return [...current, ...sample];
}

/* ------------------------------------------------------------------ */
/* IN13 explainable at-risk reasons (preset rules, not predictions).   */
/* ------------------------------------------------------------------ */

export type RiskReasonKey = "inactivity" | "low-average" | "prerequisite-gap" | "repeated-low-scores";

export const RISK_RULES: Record<RiskReasonKey, { label: string; rule: string; tone: Tone }> = {
  inactivity: { label: "Inactive", rule: "No simulated activity for 7 or more days.", tone: "warning" },
  "low-average": { label: "Low course average", rule: "Course average is in the Needs Support band (below 40%).", tone: "danger" },
  "prerequisite-gap": { label: "Prerequisite gap", rule: "A concept is below 40% while one of its prerequisites is below the 70% readiness threshold.", tone: "warning" },
  "repeated-low-scores": { label: "Repeated low scores", rule: "Two or more practice attempts on the same concept scored below 50%.", tone: "warning" },
};

export const INACTIVE_AFTER_DAYS = 7;
/** Upper bound of the Needs Support band (39). */
const NEEDS_SUPPORT_MAX = MASTERY_BANDS[0].max;
export const LOW_SCORE_BELOW = 50;

export type RiskReason = { key: RiskReasonKey; detail: string; conceptId?: string };
export type RiskAssessment = { student: Student; average: number; reasons: RiskReason[]; level: "Needs support" | "Monitor" };

/** Explains every flag with the exact values that triggered it. Uses live store values plus sample history. */
export function assessStudent(student: Student, courseId: CourseId, attempts: Attempt[]): RiskAssessment | null {
  const reasons: RiskReason[] = [];
  const average = courseAverage(student, courseId);
  const title = (id: string) => findConcept(id)?.title ?? id;

  if (student.lastActiveDays >= INACTIVE_AFTER_DAYS) reasons.push({ key: "inactivity", detail: `Last simulated activity ${student.lastActiveDays} days ago.` });
  if (average <= NEEDS_SUPPORT_MAX) reasons.push({ key: "low-average", detail: `Course average ${average}%.` });

  const gap = conceptsForCourse(courseId).find(c => student.mastery[c.id] <= NEEDS_SUPPORT_MAX && recommendation(student, c.id).kind === "review");
  if (gap) {
    const rec = recommendation(student, gap.id);
    if (rec.kind === "review") reasons.push({ key: "prerequisite-gap", conceptId: gap.id, detail: `${gap.title} ${student.mastery[gap.id]}% · prerequisite ${title(rec.prerequisiteId)} ${student.mastery[rec.prerequisiteId]}% (below 70%).` });
  }

  const lowScores = new Map<string, number>();
  for (const e of sampleHistoryFor(student.id, courseId)) if (e.score < LOW_SCORE_BELOW) lowScores.set(e.conceptId, (lowScores.get(e.conceptId) ?? 0) + 1);
  for (const a of attempts) if (a.studentId === student.id && a.courseId === courseId && a.score < LOW_SCORE_BELOW) lowScores.set(a.conceptId, (lowScores.get(a.conceptId) ?? 0) + 1);
  const repeated = [...lowScores].find(([, n]) => n >= 2);
  if (repeated) reasons.push({ key: "repeated-low-scores", conceptId: repeated[0], detail: `${repeated[1]} attempts on ${title(repeated[0])} scored below ${LOW_SCORE_BELOW}%.` });

  if (!reasons.length) return null;
  const level = reasons.some(r => RISK_RULES[r.key].tone === "danger") || reasons.length >= 2 ? "Needs support" : "Monitor";
  return { student, average, reasons, level };
}
