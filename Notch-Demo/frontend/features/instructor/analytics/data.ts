import { concepts as sharedConcepts } from "@/data/fixtures";
import { courseConcepts, type Course, type Copy, type CourseId } from "@/features/student/portal/data";
import { studentCompletion, studentMastery } from "@/features/instructor/portal/data";
import { assess, NOW, RULES, type Risk } from "@/features/instructor/dashboard/data";
import type { Student } from "@/types";

/**
 * Learning Analytics model. Pure functions over the shared roster: the shape a future
 * analytics API would return. Mastery is an ESTIMATE from practice evidence, never a grade.
 */
export type { Copy, CourseId };
const c2 = (en: string, ar: string): Copy => [en, ar];

export type Level = "low" | "developing" | "high" | "none";
/** Explicit, shared scale. The same thresholds colour every mastery view. */
export const SCALE = { low: 50, high: 75, minEvidence: 3, prereqLow: RULES.prereqBelow, lowShare: 0.3, lowAvg: 60 };
export const levelOf = (m: number | null): Level => (m === null ? "none" : m < SCALE.low ? "low" : m < SCALE.high ? "developing" : "high");
export const levelLabel: Record<Level, Copy> = {
  low: c2("Low", "منخفض"),
  developing: c2("Developing", "قيد التطور"),
  high: c2("High", "مرتفع"),
  none: c2("Insufficient evidence", "أدلة غير كافية"),
};
export const levelRange: Record<Level, Copy> = {
  low: c2(`below ${SCALE.low}%`, `أقل من ${SCALE.low}٪`),
  developing: c2(`${SCALE.low}–${SCALE.high - 1}%`, `${SCALE.low}–${SCALE.high - 1}٪`),
  high: c2(`${SCALE.high}% and above`, `${SCALE.high}٪ فأكثر`),
  none: c2(`fewer than ${SCALE.minEvidence} attempts`, `أقل من ${SCALE.minEvidence} محاولات`),
};

export type Range = 7 | 30 | 90;
export const ranges: { id: Range; label: Copy }[] = [
  { id: 7, label: c2("Last 7 days", "آخر 7 أيام") },
  { id: 30, label: c2("Last 30 days", "آخر 30 يومًا") },
  { id: 90, label: c2("Last 90 days (semester)", "آخر 90 يومًا (الفصل)") },
];
export const groups = [
  { id: "all", label: c2("All students", "كل الطلاب") },
  { id: "A", label: c2("Section A", "الشعبة أ") },
  { id: "B", label: c2("Section B", "الشعبة ب") },
] as const;

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
export const sectionOf = (s: Student) => (hash(s.id + "section") % 2 === 0 ? "A" : "B");

/** Prerequisites for the mock-extension courses (Python and Mathematics come from shared fixtures). */
const extraPrereqs: Record<string, string[]> = {
  ds2: ["ds1"], ds4: ["ds1"], ds3: ["ds1", "ds4"],
  ai2: ["ai1"], ai3: ["ai1"], ai4: ["ai3"],
  en3: ["en1", "en2"], en4: ["en1"],
};

export type Node = { key: string; id: string; course: Course; title: Copy; prereqs: string[]; depth: number; base?: number };
export const nodeKey = (courseId: CourseId, id: string) => `${courseId}:${id}`;

export function nodesFor(course: Course): Node[] {
  const base = courseConcepts(course, { id: "x", name: "x", enrolledCourseIds: [], lastActiveDays: 0, mastery: {} });
  const prereq = (id: string) => (course.sharedId ? (sharedConcepts.find((c) => c.id === id)?.prerequisites ?? []) : (extraPrereqs[id] ?? []));
  const depthMemo = new Map<string, number>();
  const depth = (id: string): number => {
    if (depthMemo.has(id)) return depthMemo.get(id)!;
    const d = prereq(id).length ? 1 + Math.max(...prereq(id).map(depth)) : 0;
    depthMemo.set(id, d);
    return d;
  };
  return base.map((c) => ({ key: nodeKey(course.id, c.id), id: c.id, course, title: c.title, prereqs: prereq(c.id), depth: depth(c.id), base: course.sharedId ? undefined : c.mastery }));
}

export type Cell = { mastery: number | null; raw: number; attempts: number; level: Level };

export function cellFor(course: Course, node: Node, s: Student): Cell {
  const raw = course.sharedId
    ? (s.mastery[node.id] ?? 0)
    : clamp(Math.round((node.base ?? 60) * 0.6 + studentMastery(course, s) * 0.4) + ((hash(s.id + node.id) % 11) - 5), 5, 99);
  // Struggles are only ever detected from practice, so low cells always have evidence.
  // Concepts a student has simply not practised yet are what show as "insufficient evidence".
  let attempts = 4 + (hash(s.id + node.key) % 10);
  if (raw >= SCALE.low && hash(s.id + node.key + "e") % 100 < (s.lastActiveDays >= 5 ? 32 : 14)) attempts = hash(node.key + s.id) % SCALE.minEvidence;
  const mastery = attempts >= SCALE.minEvidence ? raw : null;
  return { mastery, raw, attempts, level: levelOf(mastery) };
}

export type Filters = { course: string; range: Range; group: string; concept: string; q: string };

export type ConceptStat = {
  node: Node;
  avg: number | null;
  evidence: number;
  struggling: number;
  attempts: number;
  dist: Record<Level, number>;
  share: number;
  low: boolean;
  difficulty: "hard" | "moderate" | "easy" | "unknown";
  /** Struggling students whose prerequisites are all at or above the prerequisite threshold. */
  despite: number;
  lowPrereqs: { node: Node; avg: number }[];
  missed: { prompt: Copy; rate: number; seen: number }[];
  weekly: number[];
  actions: Copy[];
};
export type EdgeStat = { from: Node; to: Node; linked: number; strugglingTo: number; assoc: number };
export type StudentStat = {
  student: Student;
  section: string;
  avg: number | null;
  start: number | null;
  delta: number | null;
  series: (number | null)[];
  sessions: number;
  questions: number;
  weekly: number[];
  assessment: number | null;
  mastered: Node[];
  remediation: Node[];
  evidenceCells: number;
  completion: number;
  active: boolean;
};
export type RiskRow = { risk: Risk; main: Copy; low: Node[]; recent: Copy };

const POINTS = 7;
const weeklyOf = (s: Student, weeks: number) => {
  const w = s.lastActiveDays >= 10 ? 1 : clamp(Math.round(7 - s.lastActiveDays * 0.7 + (hash(s.id) % 3)), 1, 9);
  return Array.from({ length: weeks }, (_, j) => {
    const fromEnd = weeks - 1 - j;
    const v = clamp(w + ((hash(s.id + "w" + j) % 5) - 2) - (s.lastActiveDays >= 10 ? 1 : 0), 0, 12);
    if (fromEnd === 0) return s.lastActiveDays >= 7 ? 0 : s.lastActiveDays >= 5 ? Math.min(1, v) : v;
    return v;
  });
};

export function build(courses: Course[], roster: Student[], f: Filters) {
  const inScope = f.course === "all" ? courses : courses.filter((c) => c.id === f.course);
  const students = roster.filter((s) => f.group === "all" || sectionOf(s) === f.group);
  const allNodes = inScope.flatMap(nodesFor);
  const cells = new Map<string, Cell>();
  for (const c of inScope) for (const n of allNodes.filter((x) => x.course.id === c.id)) for (const s of roster) cells.set(`${s.id}|${n.key}`, cellFor(c, n, s));
  const cell = (sid: string, key: string) => cells.get(`${sid}|${key}`)!;
  const nodeBy = new Map(allNodes.map((n) => [n.key, n]));
  const prereqNodes = (n: Node) => n.prereqs.map((p) => nodeBy.get(nodeKey(n.course.id, p))).filter((x): x is Node => !!x);

  const conceptStats = new Map<string, ConceptStat>();
  const stat = (n: Node): ConceptStat => {
    const all = students.map((s) => cell(s.id, n.key));
    const withEv = all.filter((c) => c.mastery !== null);
    const avg = mean(withEv.map((c) => c.mastery as number));
    const dist: Record<Level, number> = { low: 0, developing: 0, high: 0, none: 0 };
    for (const c of all) dist[c.level]++;
    const share = withEv.length ? dist.low / withEv.length : 0;
    const low = avg !== null && (avg < SCALE.lowAvg || share >= SCALE.lowShare);
    const strugglers = students.filter((s) => cell(s.id, n.key).level === "low");
    const pre = prereqNodes(n);
    const despite = pre.length ? strugglers.filter((s) => pre.every((p) => (cell(s.id, p.key).mastery ?? 100) >= SCALE.prereqLow)).length : 0;
    const attempts = all.reduce((a, c) => a + c.attempts, 0);
    const missRate = clamp(100 - (avg ?? 60) + (hash(n.key) % 9), 8, 92);
    const prompts: Copy[] = [
      c2(`Tracing a short example of ${n.title[0]}`, `تتبّع مثال قصير على ${n.title[1]}`),
      c2(`Choosing the correct definition of ${n.title[0]}`, `اختيار التعريف الصحيح لـ ${n.title[1]}`),
      c2(`Spotting the mistake in a ${n.title[0]} exercise`, `اكتشاف الخطأ في تمرين ${n.title[1]}`),
    ];
    const missed = prompts.map((prompt, i) => ({ prompt, rate: clamp(missRate - i * 9 + (hash(n.key + i) % 7), 5, 95), seen: Math.max(3, Math.round(attempts / (3 + i))) })).sort((a, b) => b.rate - a.rate);
    const weekly = Array.from({ length: 6 }, (_, j) => Math.max(0, Math.round((attempts / 6) * (0.6 + ((hash(n.key + "k" + j) % 9) / 10)))));
    return { node: n, avg, evidence: withEv.length, struggling: strugglers.length, attempts, dist, share, low, difficulty: avg === null ? "unknown" : low ? "hard" : avg < 72 ? "moderate" : "easy", despite, lowPrereqs: [], missed, weekly, actions: [] };
  };
  for (const n of allNodes) conceptStats.set(n.key, stat(n));
  for (const cs of conceptStats.values()) {
    cs.lowPrereqs = prereqNodes(cs.node).map((p) => ({ node: p, avg: conceptStats.get(p.key)!.avg ?? 100 })).filter((p) => p.avg < SCALE.prereqLow);
  }

  const edges: EdgeStat[] = allNodes.flatMap((to) =>
    prereqNodes(to).map((from) => {
      const strugglers = students.filter((s) => cell(s.id, to.key).level === "low");
      const linked = strugglers.filter((s) => (cell(s.id, from.key).mastery ?? 100) < SCALE.prereqLow).length;
      return { from, to, linked, strugglingTo: strugglers.length, assoc: strugglers.length ? linked / strugglers.length : 0 };
    }),
  );
  const bottlenecks = allNodes
    .map((n) => ({ node: n, avg: conceptStats.get(n.key)!.avg, linked: edges.filter((e) => e.from.key === n.key).reduce((a, e) => a + e.linked, 0), dependents: edges.filter((e) => e.from.key === n.key && e.linked > 0).map((e) => e.to) }))
    .filter((b) => b.avg !== null && b.avg < SCALE.prereqLow + 8 && b.linked >= 3)
    .sort((a, b) => b.linked - a.linked);
  const bottleneckKeys = new Set(bottlenecks.map((b) => b.node.key));

  for (const cs of conceptStats.values()) {
    const a: Copy[] = [];
    const n = cs.node;
    const worst = [...cs.lowPrereqs].sort((x, y) => x.avg - y.avg)[0];
    if (worst) a.push(c2(`Revisit ${worst.node.title[0]} (${worst.avg}% average) before teaching ${n.title[0]}.`, `راجع ${worst.node.title[1]} (متوسط ${worst.avg}٪) قبل تدريس ${n.title[1]}.`));
    if (cs.low && cs.despite > 0) a.push(c2(`${cs.despite} student(s) struggle despite solid prerequisites: add worked examples and live practice on ${n.title[0]}.`, `${cs.despite} طالب يتعثرون رغم إتقان المتطلبات: أضف أمثلة محلولة وتدريبًا مباشرًا على ${n.title[1]}.`));
    if (cs.low) a.push(c2(`Allocate extra teaching time to ${n.title[0]} and assign a targeted practice set.`, `خصّص وقتًا تدريسيًا إضافيًا لـ ${n.title[1]} وكلّف الطلاب بمجموعة تدريب موجّهة.`));
    if (bottleneckKeys.has(n.key)) a.push(c2(`${n.title[0]} is a bottleneck for later concepts: schedule a short review session.`, `${n.title[1]} يعيق مفاهيم لاحقة: حدّد جلسة مراجعة قصيرة.`));
    if (cs.dist.none >= students.length / 2) a.push(c2("Too little evidence yet: assign a short diagnostic quiz to measure real mastery.", "الأدلة قليلة حتى الآن: كلّف الطلاب باختبار تشخيصي قصير لقياس الإتقان الفعلي."));
    if (!a.length) a.push(c2("On track. No intervention needed; consider an extension task for strong students.", "على المسار الصحيح. لا حاجة لتدخل؛ فكّر في مهمة إثرائية للطلاب المتميزين."));
    cs.actions = a;
  }

  const shown = f.concept === "all" ? allNodes : allNodes.filter((n) => n.key === f.concept);
  const studentStats: StudentStat[] = students.map((s) => {
    const mine = allNodes.map((n) => ({ n, c: cell(s.id, n.key) }));
    const ev = mine.filter((x) => x.c.mastery !== null);
    const avg = mean(ev.map((x) => x.c.mastery as number));
    const drift = s.lastActiveDays >= 10 ? -3 : (hash(s.id + "d") % 9) - 1;
    const total = Math.round((drift * f.range) / 30);
    const series = Array.from({ length: POINTS }, (_, i) => (avg === null ? null : clamp(avg - Math.round(total * (1 - i / (POINTS - 1))), 0, 100)));
    const weeks = Math.max(1, Math.round(f.range / 7));
    const weekly = weeklyOf(s, Math.min(12, weeks));
    const sessions = weekly.reduce((a, b) => a + b, 0) * Math.max(1, Math.round(weeks / weekly.length));
    const comps = inScope.map((c) => studentCompletion(c.id, s, studentMastery(c, s)));
    return {
      student: s, section: sectionOf(s), avg, start: series[0], delta: avg === null || series[0] === null ? null : avg - series[0], series,
      sessions, questions: sessions * (5 + (hash(s.id + "q") % 6)), weekly,
      assessment: avg === null ? null : clamp(Math.round(avg * 0.9 + (hash(s.id + "a") % 12)), 20, 100),
      mastered: ev.filter((x) => (x.c.mastery as number) >= SCALE.high).map((x) => x.n),
      remediation: ev.filter((x) => (x.c.mastery as number) < SCALE.low).map((x) => x.n),
      evidenceCells: ev.length, completion: mean(comps) ?? 0, active: s.lastActiveDays <= 3,
    };
  });
  const stat0 = (s: Student) => studentStats.find((x) => x.student.id === s.id)!;

  const risks: RiskRow[] = inScope.flatMap((c) => students.map((s) => assess(c, s)).filter((r): r is Risk => !!r)).map((risk) => {
    const mine = allNodes.filter((n) => n.course.id === risk.course.id).map((n) => ({ n, m: cell(risk.student.id, n.key).mastery })).filter((x): x is { n: Node; m: number } => x.m !== null && x.m < SCALE.low).sort((a, b) => a.m - b.m);
    const inactive = risk.reasons.some((r) => r.key === "inactive");
    const main: Copy = mine.length && !inactive ? c2(`Weak on ${mine[0].n.title[0]} (${mine[0].m}%)`, `ضعف في ${mine[0].n.title[1]} (${mine[0].m}٪)`) : inactive ? c2("Not practising", "لا يمارس التدريب") : risk.reasons[0].text;
    const st = stat0(risk.student);
    const recent = risk.student.lastActiveDays === 0 ? c2("Active today", "نشط اليوم") : c2(`Last active ${risk.student.lastActiveDays} days ago · ${st.weekly.at(-1) ?? 0} sessions this week`, `آخر نشاط قبل ${risk.student.lastActiveDays} أيام · ${st.weekly.at(-1) ?? 0} جلسات هذا الأسبوع`);
    return { risk, main, low: mine.map((x) => x.n).slice(0, 3), recent };
  });

  const avgNow = mean(studentStats.flatMap((s) => (s.avg === null ? [] : [s.avg])));
  const avgStart = mean(studentStats.flatMap((s) => (s.start === null ? [] : [s.start])));
  const from = new Date(new Date(NOW).getTime() - f.range * 86400000).toISOString();
  return {
    inScope, students, allNodes, shown, cell, nodeBy, prereqNodes, conceptStats, edges, bottlenecks, bottleneckKeys, studentStats, risks, period: { from, to: NOW },
    overview: {
      enrolled: students.length,
      active: students.filter((s) => s.lastActiveDays <= 3).length,
      avgMastery: avgNow,
      delta: avgNow !== null && avgStart !== null ? avgNow - avgStart : null,
      atRisk: new Set(risks.map((r) => r.risk.student.id)).size,
      lowConcepts: [...conceptStats.values()].filter((c) => c.low).length,
      conceptCount: allNodes.length,
    },
  };
}
export type Model = ReturnType<typeof build>;
