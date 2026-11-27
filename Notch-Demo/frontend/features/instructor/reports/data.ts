import { build, SCALE, type ConceptStat, type Node, type StudentStat } from "@/features/instructor/analytics/data";
import type { Course, Copy } from "@/features/student/portal/data";
import type { Student } from "@/types";

export type { Copy };
const c2 = (en: string, ar: string): Copy => [en, ar];

export const TERMS = [
  { id: "fall-2026", label: c2("Fall 2026 (current)", "خريف 2026 (الحالي)"), current: true },
  { id: "spring-2026", label: c2("Spring 2026", "ربيع 2026"), current: false },
  { id: "fall-2025", label: c2("Fall 2025", "خريف 2025"), current: false },
] as const;

/** Criteria shown to the instructor next to every readiness estimate. */
export const CRITERIA = { readyAt: 70, minEvidenceWeight: 50, prereqLow: SCALE.prereqLow, penaltyPerGap: 3, maxPenalty: 10, thresholds: [50, 60, 70] };

export type ExamDef = { id: string; title: Copy; date: string; scope: "early" | "all" | "foundation" };
export const examsFor = (courseId: string): ExamDef[] => [
  { id: `${courseId}-quiz`, title: c2("Concept quiz", "اختبار المفاهيم"), date: "2026-12-02T10:00:00+02:00", scope: "foundation" },
  { id: `${courseId}-mid`, title: c2("Midterm exam", "امتحان منتصف الفصل"), date: "2026-12-09T10:00:00+02:00", scope: "early" },
  { id: `${courseId}-final`, title: c2("Final exam", "الامتحان النهائي"), date: "2027-01-20T10:00:00+02:00", scope: "all" },
];

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export type Priority = "high" | "medium" | "low";
export type Coverage = "adequate" | "weak" | "uncovered";
export type ConceptRow = {
  node: Node; weight: number; avg: number | null; evidence: number; below: number; lowPrereqs: ConceptStat["lowPrereqs"];
  questions: number; materials: number; coverage: Coverage; priority: Priority; score: number; important: boolean; flagged: boolean;
};
export type ReadyState = "ready" | "revision" | "insufficient";
export type StudentRow = {
  stat: StudentStat; readiness: number | null; state: ReadyState; weak: { node: Node; m: number; weight: number }[];
  prereqGaps: { concept: Node; prereq: Node; m: number }[]; recent: Copy; action: Copy; evidenceShare: number;
};

export function readiness(course: Course, roster: Student[], examId: string, threshold: number) {
  const m = build([course], roster, { course: course.id, range: 30, group: "all", concept: "all", q: "" });
  const exam = examsFor(course.id).find((e) => e.id === examId) ?? examsFor(course.id)[2];
  const maxDepth = Math.max(...m.allNodes.map((n) => n.depth));
  const limit = exam.scope === "all" ? maxDepth : exam.scope === "early" ? Math.ceil(maxDepth * 0.6) : Math.floor(maxDepth * 0.35);
  const scope = m.allNodes.filter((n) => n.depth <= limit);
  const raw = scope.map((n) => 5 + (hash(n.key + exam.id) % 11));
  const total = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((r) => Math.round((r / total) * 100));
  weights[weights.indexOf(Math.max(...weights))] += 100 - weights.reduce((a, b) => a + b, 0);
  const wOf = new Map(scope.map((n, i) => [n.key, weights[i]]));
  const avgW = 100 / scope.length;

  const concepts: ConceptRow[] = scope.map((n) => {
    const cs = m.conceptStats.get(n.key)!;
    const weight = wOf.get(n.key)!;
    const below = m.students.filter((s) => { const v = m.cell(s.id, n.key).mastery; return v !== null && v < threshold; }).length;
    const questions = hash(n.key) % 9, materials = hash(n.key + "m") % 4;
    const coverage: Coverage = questions === 0 && materials === 0 ? "uncovered" : questions < 3 || materials === 0 ? "weak" : "adequate";
    const important = weight >= avgW;
    const lowAvg = cs.avg !== null && cs.avg < threshold;
    const flagged = important && (lowAvg || cs.lowPrereqs.length > 0);
    const priority: Priority = important && lowAvg ? "high" : lowAvg || cs.lowPrereqs.length > 0 || below >= 3 || cs.avg === null ? "medium" : "low";
    const score = Math.round(weight * (100 - (cs.avg ?? 50))) / 100 + (cs.lowPrereqs.length ? weight * 0.25 : 0) + below * 0.5;
    return { node: n, weight, avg: cs.avg, evidence: cs.evidence, below, lowPrereqs: cs.lowPrereqs, questions, materials, coverage, priority, score, important, flagged };
  });

  const students: StudentRow[] = m.studentStats.map((stat) => {
    const cells = scope.map((n) => ({ n, w: wOf.get(n.key)!, v: m.cell(stat.student.id, n.key).mastery }));
    const ev = cells.filter((c): c is { n: Node; w: number; v: number } => c.v !== null);
    const evW = ev.reduce((a, c) => a + c.w, 0);
    const prereqGaps = cells.flatMap((c) => (c.v !== null && c.v < threshold + 10 ? m.prereqNodes(c.n).map((p) => ({ concept: c.n, prereq: p, m: m.cell(stat.student.id, p.key).mastery })).filter((x): x is { concept: Node; prereq: Node; m: number } => x.m !== null && x.m < CRITERIA.prereqLow) : []));
    const weak = ev.filter((c) => c.v < threshold).map((c) => ({ node: c.n, m: c.v, weight: c.w })).sort((a, b) => b.weight - a.weight);
    const penalty = Math.min(CRITERIA.maxPenalty, CRITERIA.penaltyPerGap * new Set(prereqGaps.filter((g) => (wOf.get(g.concept.key) ?? 0) >= avgW).map((g) => g.concept.key)).size);
    const r = evW >= CRITERIA.minEvidenceWeight ? Math.max(0, Math.round(ev.reduce((a, c) => a + c.w * c.v, 0) / evW) - penalty) : null;
    const state: ReadyState = r === null ? "insufficient" : r >= CRITERIA.readyAt && !weak.some((w) => w.weight >= avgW) ? "ready" : "revision";
    const days = stat.student.lastActiveDays;
    const recent = days === 0 ? c2("Practised today", "تدرّب اليوم") : c2(`Last practised ${days} days ago · ${stat.weekly.at(-1) ?? 0} sessions this week`, `آخر تدريب قبل ${days} أيام · ${stat.weekly.at(-1) ?? 0} جلسات هذا الأسبوع`);
    const top = weak[0]?.node;
    const action: Copy = state === "insufficient" ? c2("Assign a short diagnostic quiz to gather evidence", "كلّف بامتحان تشخيصي قصير لجمع الأدلة")
      : days >= 5 ? c2("Send a reminder to restart practice", "أرسل تذكيرًا لاستئناف التدريب")
      : state === "revision" && top ? c2(`Assign revision on ${top.title[0]}`, `كلّف بمراجعة ${top.title[1]}`)
      : state === "revision" ? c2("Assign a mixed revision set", "كلّف بمجموعة مراجعة متنوعة")
      : c2("Offer a mock exam under timed conditions", "اعرض امتحانًا تجريبيًا بزمن محدد");
    return { stat, readiness: r, state, weak, prereqGaps, recent, action, evidenceShare: Math.min(100, evW) };
  });

  const rs = students.flatMap((s) => (s.readiness === null ? [] : [s.readiness]));
  const overview = {
    overall: mean(rs), ready: students.filter((s) => s.state === "ready").length, revision: students.filter((s) => s.state === "revision").length,
    insufficient: students.filter((s) => s.state === "insufficient").length, below: concepts.filter((c) => c.avg !== null && c.avg < threshold).length,
    uncovered: concepts.filter((c) => c.coverage !== "adequate").length, uncoveredHard: concepts.filter((c) => c.coverage === "uncovered").length, total: students.length, concepts: concepts.length,
  };
  return { m, exam, concepts, students, overview, avgWeight: avgW };
}
export type Readiness = ReturnType<typeof readiness>;
