import { concepts as sharedConcepts } from "@/data/fixtures";
import type { Student } from "@/types";
import {
  courseConcepts,
  courses,
  type Course,
  type Copy,
  type CourseId,
} from "@/features/student/portal/data";
import { studentCompletion, studentMastery } from "@/features/instructor/portal/data";

/**
 * Dashboard mock data. Counts on every page come from these structures, so a backend can
 * replace `seed()` later without touching the UI. Student risk is NOT mock: it is derived
 * from the roster's real activity with the explicit rules below.
 */
export type { Copy, CourseId };
/** The demo "today", matching the Student portal's fixed demo date, in Cairo time. */
export const NOW = "2026-11-25T09:00:00+02:00";
export const DEMO_DAY = "2026-11-25";
const c2 = (en: string, ar: string): Copy => [en, ar];

export type Category = "concepts" | "prerequisites" | "questions" | "tutor";
export const categories: Category[] = ["concepts", "prerequisites", "questions", "tutor"];
export const categoryLabel: Record<Category, Copy> = {
  concepts: ["Concepts", "المفاهيم"],
  prerequisites: ["Prerequisite relationships", "علاقات المتطلبات السابقة"],
  questions: ["Generated questions", "الأسئلة المولَّدة"],
  tutor: ["Flagged tutor answers", "إجابات المساعد المُبلَّغ عنها"],
};
export const categoryNoun: Record<Category, [Copy, Copy]> = {
  concepts: [["concept awaiting approval", "مفهوم بانتظار الاعتماد"], ["concepts awaiting approval", "مفاهيم بانتظار الاعتماد"]],
  prerequisites: [["prerequisite relationship awaiting review", "علاقة متطلب بانتظار المراجعة"], ["prerequisite relationships awaiting review", "علاقات متطلبات بانتظار المراجعة"]],
  questions: [["generated question awaiting approval", "سؤال مولَّد بانتظار الاعتماد"], ["generated questions awaiting approval", "أسئلة مولَّدة بانتظار الاعتماد"]],
  tutor: [["flagged tutor answer awaiting review", "إجابة مساعد مُبلَّغ عنها بانتظار المراجعة"], ["flagged tutor answers awaiting review", "إجابات مساعد مُبلَّغ عنها بانتظار المراجعة"]],
};
/** Where the real review tool for each category lives. */
export const queueHref: Record<Category, string> = {
  concepts: "/instructor/semester",
  prerequisites: "/instructor/graph",
  questions: "/instructor/question-bank",
  tutor: "/instructor/out-of-bound?reason=uncertain",
};

export type Approval = {
  id: string;
  courseId: CourseId;
  category: Exclude<Category, "tutor">;
  title: Copy;
  detail: Copy;
  /** Days the item has been waiting. */
  ageDays: number;
  status: "pending" | "approved" | "rejected";
};
export type IssueKind = "failed" | "unreadable" | "indexing" | "coverage";
export const issueLabel: Record<IssueKind, Copy> = {
  failed: ["Failed processing", "فشلت المعالجة"],
  unreadable: ["Unreadable slides", "شرائح غير مقروءة"],
  indexing: ["Awaiting indexing", "بانتظار الفهرسة"],
  coverage: ["Insufficient source coverage", "تغطية مصدر غير كافية"],
};
export type ContentIssue = { id: string; courseId: CourseId; kind: IssueKind; title: Copy; detail: Copy; resolved: boolean };
export type OobReason = "unrelated" | "unsupported" | "outside" | "uncertain";
export const oobReasonLabel: Record<OobReason, Copy> = {
  unrelated: ["Unrelated to the course", "لا علاقة له بالمقرر"],
  unsupported: ["Not supported by your materials", "غير مدعوم بموادك"],
  outside: ["Needs sources outside the course", "يحتاج إلى مصادر خارج المقرر"],
  uncertain: ["Tutor was uncertain", "كان المساعد غير متأكد"],
};
export type OobStatus = "open" | "reviewed" | "answered" | "out-of-scope" | "dismissed";
export type OobQuestion = {
  id: string;
  courseId: CourseId;
  /** Related concept, when the tutor could tell. */
  concept?: Copy;
  /** Names of the students who asked. */
  students: string[];
  question: Copy;
  at: string;
  reason: OobReason;
  /** What the tutor said instead of answering. */
  response: Copy;
  repeats: number;
  status: OobStatus;
  approvedAnswer?: string;
  /** The instructor asked to keep the answer as a reviewed response for future use. */
  reuse?: boolean;
  material?: string;
};
const names = ["Nour", "Ahmed", "Salma", "Youssef", "Mariam", "Laila", "Omar", "Farah", "Karim", "Hana"];
const oobQuestionFor = (reason: OobReason, k: Copy, i: number): Copy =>
  reason === "unrelated"
    ? [c2("Can you recommend a good place to eat near campus?", "هل يمكنك أن توصي بمكان جيد لتناول الطعام قرب الحرم الجامعي؟"), c2("Who do you think will win the football match tonight?", "من تتوقع أن يفوز بمباراة كرة القدم الليلة؟")][i % 2]
    : reason === "unsupported"
      ? c2(`How would “${k[0]}” be handled in a real company project?`, `كيف يُتعامل مع «${k[1]}» في مشروع شركة حقيقي؟`)
      : reason === "outside"
        ? c2(`Can you give me the full proof behind “${k[0]}” from the original research paper?`, `هل يمكنك إعطائي البرهان الكامل وراء «${k[1]}» من البحث الأصلي؟`)
        : c2(`Is it true that “${k[0]}” always gives the same answer in every case?`, `هل صحيح أن «${k[1]}» يعطي الإجابة نفسها في كل الحالات؟`);
const oobResponse: Record<OobReason, Copy> = {
  unrelated: c2("That is outside what I can help with in this course. I have let your instructor know.", "هذا خارج ما يمكنني المساعدة فيه في هذا المقرر. أبلغت مدرّسك."),
  unsupported: c2("I could not find this in your course materials, so I will not guess. Your instructor has been notified.", "لم أجد هذا في مواد مقررك لذا لن أخمّن. تم إبلاغ مدرّسك."),
  outside: c2("Answering needs sources beyond this course. I have passed your question to your instructor.", "تحتاج الإجابة إلى مصادر خارج هذا المقرر. أحلت سؤالك إلى مدرّسك."),
  uncertain: c2("I am not confident enough to answer this reliably. Please check with your instructor.", "لست واثقًا بما يكفي للإجابة بموثوقية. يُرجى مراجعة مدرّسك."),
};
export type EventKind = "quiz" | "exam" | "assignment" | "lecture";
export const eventLabel: Record<EventKind, Copy> = { quiz: ["Quiz", "اختبار قصير"], exam: ["Exam", "امتحان"], assignment: ["Assignment", "واجب"], lecture: ["Lecture", "محاضرة"] };
export type CalEvent = { id: string; courseId: CourseId; kind: EventKind; title: Copy; date: string };
export type Activity = { id: string; courseId: CourseId; text: Copy; at: string; kind: "submission" | "diagnostic" | "upload" | "approval" | "help" | "assessment" };

const course = (id: CourseId) => courses.find((c) => c.id === id)!;
const ct = (id: CourseId, i: number): Copy => {
  const list = courseConcepts(course(id), sampleStudent);
  return list[i % list.length].title;
};
const sampleStudent = { id: "S-SAMPLE", name: "", enrolledCourseIds: [], lastActiveDays: 0, mastery: {} } as Student;

type Spec = { concepts: number; prereq: number; questions: number; flagged: number; unanswered: number; unsupported: number; repeated: number; failed: number; unreadable: number; indexing: number; coverage: number };
const specs: Record<CourseId, Spec> = {
  python: { concepts: 4, prereq: 3, questions: 6, flagged: 1, unanswered: 3, unsupported: 1, repeated: 2, failed: 1, unreadable: 1, indexing: 1, coverage: 1 },
  algorithms: { concepts: 3, prereq: 2, questions: 5, flagged: 1, unanswered: 2, unsupported: 1, repeated: 1, failed: 1, unreadable: 0, indexing: 1, coverage: 1 },
  ai: { concepts: 5, prereq: 3, questions: 4, flagged: 1, unanswered: 2, unsupported: 2, repeated: 1, failed: 0, unreadable: 1, indexing: 2, coverage: 1 },
  mathematics: { concepts: 2, prereq: 1, questions: 3, flagged: 1, unanswered: 1, unsupported: 0, repeated: 1, failed: 1, unreadable: 0, indexing: 0, coverage: 1 },
  english: { concepts: 1, prereq: 0, questions: 2, flagged: 0, unanswered: 1, unsupported: 0, repeated: 0, failed: 0, unreadable: 0, indexing: 1, coverage: 0 },
};
const rep = (n: number) => Array.from({ length: n }, (_, i) => i);
const qTypes: Copy[] = [c2("multiple-choice", "اختيار من متعدد"), c2("short-answer", "إجابة قصيرة"), c2("true/false", "صح/خطأ"), c2("numerical", "عددي")];

export function seed() {
  const approvals: Approval[] = [];
  const issues: ContentIssue[] = [];
  const oob: OobQuestion[] = [];
  for (const c of courses) {
    const s = specs[c.id];
    rep(s.concepts).forEach((i) => approvals.push({ id: `${c.id}-con-${i}`, courseId: c.id, category: "concepts", title: ct(c.id, i + 1), detail: c2(`Extracted from lecture ${i + 2} with moderate confidence`, `مستخرج من المحاضرة ${i + 2} بثقة متوسطة`), ageDays: 1 + ((i * 2) % 6), status: "pending" }));
    rep(s.prereq).forEach((i) => approvals.push({ id: `${c.id}-pre-${i}`, courseId: c.id, category: "prerequisites", title: c2(`${ct(c.id, i)[0]} → ${ct(c.id, i + 1)[0]}`, `${ct(c.id, i)[1]} ← ${ct(c.id, i + 1)[1]}`), detail: c2("Suggested prerequisite link needs a decision", "رابط متطلب مقترح يحتاج إلى قرار"), ageDays: 2 + i, status: "pending" }));
    rep(s.questions).forEach((i) => approvals.push({ id: `${c.id}-q-${i}`, courseId: c.id, category: "questions", title: c2(`Generated ${qTypes[i % 4][0]} question: ${ct(c.id, i + 2)[0]}`, `سؤال ${qTypes[i % 4][1]} مولَّد: ${ct(c.id, i + 2)[1]}`), detail: c2("Candidate question waiting in the review queue", "سؤال مرشح ينتظر في قائمة المراجعة"), ageDays: i % 5, status: "pending" }));
    const plan: { reason: OobReason; repeats: number }[] = [
      ...rep(s.flagged).map(() => ({ reason: "uncertain" as const, repeats: 1 })),
      ...rep(s.unanswered).map((i) => ({ reason: (i % 3 === 2 ? "unrelated" : "outside") as OobReason, repeats: 1 + (i % 2) })),
      ...rep(s.unsupported).map(() => ({ reason: "unsupported" as const, repeats: 1 })),
      ...rep(s.repeated).map((i) => ({ reason: "outside" as const, repeats: 3 + i * 2 })),
    ];
    const ci = courses.findIndex((x) => x.id === c.id);
    plan.forEach((p, i) => {
      const k = ct(c.id, i + 3);
      oob.push({
        id: `${c.id}-oob-${i}`, courseId: c.id, concept: p.reason === "unrelated" ? undefined : k,
        students: rep(Math.min(p.repeats, 3)).map((n) => names[(i + ci * 2 + n * 3) % names.length]),
        question: oobQuestionFor(p.reason, k, i),
        at: new Date(new Date(NOW).getTime() - (25 + i * 97 + ci * 41) * 60000).toISOString(),
        reason: p.reason, response: oobResponse[p.reason], repeats: p.repeats, status: "open",
      });
    });
    const issue = (kind: IssueKind, n: number, title: (i: number) => Copy, detail: Copy) => rep(n).forEach((i) => issues.push({ id: `${c.id}-i-${kind}-${i}`, courseId: c.id, kind, title: title(i), detail, resolved: false }));
    issue("failed", s.failed, (i) => c2(`lecture-0${i + 3}-${c.id}.pptx`, `lecture-0${i + 3}-${c.id}.pptx`), c2("Processing failed: the file could not be read. Re-upload it.", "فشلت المعالجة: تعذّرت قراءة الملف. أعد رفعه."));
    issue("unreadable", s.unreadable, () => c2("lecture-05-notes.pdf · slides 12–14", "lecture-05-notes.pdf · الشرائح 12–14"), c2("Scanned images without selectable text.", "صور ممسوحة بلا نص قابل للتحديد."));
    issue("indexing", s.indexing, (i) => c2(`reference-textbook-${i + 1}.pdf`, `reference-textbook-${i + 1}.pdf`), c2("Uploaded but not indexed yet.", "تم الرفع لكن لم تتم الفهرسة بعد."));
    issue("coverage", s.coverage, (i) => ct(c.id, i + 4), c2("Only one supporting slide. Add material or merge the concept.", "شريحة داعمة واحدة فقط. أضف مادة أو ادمج المفهوم."));
  }
  /** `offset` days after the demo day at `hour` Cairo time (UTC+2). */
  const day = (offset: number, hour = 10) => new Date(Date.UTC(2026, 10, 25 + offset, hour - 2)).toISOString();
  const events: CalEvent[] = courses.flatMap((c, i) => [
    { id: `${c.id}-e1`, courseId: c.id, kind: "lecture" as const, title: c2(`Lecture: ${ct(c.id, 2)[0]}`, `محاضرة: ${ct(c.id, 2)[1]}`), date: day(1 + (i % 3), 10 + i) },
    { id: `${c.id}-e2`, courseId: c.id, kind: "quiz" as const, title: c2(`Quiz: ${ct(c.id, 1)[0]}`, `اختبار قصير: ${ct(c.id, 1)[1]}`), date: day(2 + i, 12) },
    { id: `${c.id}-e3`, courseId: c.id, kind: "assignment" as const, title: c2(`Assignment due: ${ct(c.id, 3)[0]}`, `موعد واجب: ${ct(c.id, 3)[1]}`), date: day(4 + i, 18) },
    ...(i % 2 === 0 ? [{ id: `${c.id}-e4`, courseId: c.id, kind: "exam" as const, title: c2("Midterm exam", "امتحان منتصف الفصل"), date: day(9 + i, 9) }] : []),
  ]);
  const act = (id: string, courseId: CourseId, kind: Activity["kind"], en: string, ar: string, minutesAgo: number): Activity => ({ id, courseId, kind, text: c2(en, ar), at: new Date(new Date(NOW).getTime() - minutesAgo * 60000).toISOString() });
  const activity: Activity[] = [
    act("a1", "python", "submission", "Nour submitted “Functions in practice”", "سلّمت نور «تطبيقات الدوال»", 18),
    act("a2", "algorithms", "diagnostic", "Salma completed the diagnostic test", "أكملت سلمى الاختبار التشخيصي", 52),
    act("a3", "ai", "upload", "New materials uploaded: lecture-06-neural-networks.pptx", "رُفعت مواد جديدة: lecture-06-neural-networks.pptx", 95),
    act("a4", "python", "approval", "A question on “Loops” was approved", "اعتُمد سؤال عن «الحلقات»", 140),
    act("a5", "python", "help", "Youssef asked you for help with recursion", "طلب يوسف مساعدتك في الاستدعاء الذاتي", 210),
    act("a6", "algorithms", "assessment", "“Sorting quiz” was published", "نُشر «اختبار الترتيب»", 330),
    act("a7", "ai", "submission", "Hana submitted “Your first classification plan”", "سلّمت هنا «خطة التصنيف الأولى»", 480),
    act("a8", "mathematics", "diagnostic", "Farah completed the diagnostic test", "أكملت فرح الاختبار التشخيصي", 600),
    act("a9", "english", "upload", "New materials uploaded: essay-structure.pdf", "رُفعت مواد جديدة: essay-structure.pdf", 780),
  ];
  return { approvals, issues, oob, events, activity };
}

export type Reason = { key: "inactive" | "stuck" | "prerequisite" | "behind" | "mastery"; text: Copy };
export type Risk = {
  id: string;
  student: Student;
  course: Course;
  mastery: number;
  completion: number;
  severity: "high" | "medium";
  reasons: Reason[];
  action: Copy;
};
/** Explicit, explainable thresholds. Shown to the instructor on the Students page. */
export const RULES = { inactiveDays: 5, stuckBelow: 40, prereqBelow: 60, stuckPrereqConcept: 50, behindBelow: 50, expectedProgress: 70, lowMastery: 45 };

export function assess(c: Course, s: Student): Risk | null {
  const reasons: Reason[] = [];
  const list = courseConcepts(c, s);
  const mastery = studentMastery(c, s);
  const completion = studentCompletion(c.id, s, mastery);
  if (s.lastActiveDays >= RULES.inactiveDays) reasons.push({ key: "inactive", text: c2(`Inactive for ${s.lastActiveDays} days`, `غير نشط منذ ${s.lastActiveDays} يومًا`) });
  const shared = sharedConcepts.filter((x) => x.courseId === c.sharedId);
  let action: Copy | null = null;
  if (c.sharedId) {
    const gap = list.find((k) => {
      const meta = shared.find((x) => x.id === k.id);
      return k.mastery < RULES.stuckPrereqConcept && meta?.prerequisites.some((p) => (s.mastery[p] ?? 100) < RULES.prereqBelow);
    });
    if (gap) {
      const pre = shared.find((x) => x.id === gap.id)!.prerequisites.find((p) => (s.mastery[p] ?? 100) < RULES.prereqBelow)!;
      const preTitle = list.find((k) => k.id === pre)!.title;
      reasons.push({ key: "prerequisite", text: c2(`Struggling with ${preTitle[0]} before ${gap.title[0]} (${s.mastery[pre]}% / ${gap.mastery}%)`, `يتعثر في ${preTitle[1]} قبل ${gap.title[1]} (${s.mastery[pre]}٪ / ${gap.mastery}٪)`) });
      action = c2(`Recommend the ${preTitle[0]} review set`, `اقترح مجموعة مراجعة ${preTitle[1]}`);
    }
    const stuck = list.filter((k) => k.mastery < RULES.stuckBelow && k.id !== gap?.id).sort((a, b) => a.mastery - b.mastery)[0];
    if (stuck) {
      reasons.push({ key: "stuck", text: c2(`Mastery ${stuck.mastery}% in ${stuck.title[0]} (below ${RULES.stuckBelow}%)`, `الإتقان ${stuck.mastery}٪ في ${stuck.title[1]} (أقل من ${RULES.stuckBelow}٪)`) });
      action = action ?? c2(`Assign targeted practice on ${stuck.title[0]}`, `خصّص تدريبًا موجّهًا على ${stuck.title[1]}`);
    }
  } else if (mastery < RULES.lowMastery) {
    reasons.push({ key: "mastery", text: c2(`Overall mastery ${mastery}% (below ${RULES.lowMastery}%)`, `الإتقان العام ${mastery}٪ (أقل من ${RULES.lowMastery}٪)`) });
    action = c2("Assign targeted practice on weak concepts", "خصّص تدريبًا موجّهًا على المفاهيم الضعيفة");
  }
  if (completion < RULES.behindBelow) {
    reasons.push({ key: "behind", text: c2(`Completed ${completion}% of lectures and labs; about ${RULES.expectedProgress}% expected by now`, `أكمل ${completion}٪ من المحاضرات والمعامل؛ المتوقع نحو ${RULES.expectedProgress}٪ حتى الآن`) });
    action = action ?? c2("Share the catch-up plan and office hours", "شارك خطة اللحاق والساعات المكتبية");
  }
  if (!reasons.length) return null;
  if (reasons.some((r) => r.key === "inactive")) action = c2("Send a check-in message", "أرسل رسالة متابعة");
  return { id: `${c.id}:${s.id}`, student: s, course: c, mastery, completion, severity: reasons.length >= 2 || s.lastActiveDays >= 10 ? "high" : "medium", reasons, action: action! };
}

/** Mock "detector" feed: questions that arrive while the instructor is using the dashboard. */
export const incomingFeed: { courseId: CourseId; reason: OobReason; conceptIndex: number; student: string; question?: Copy; duplicate?: boolean }[] = [
  { courseId: "python", reason: "unsupported", conceptIndex: 5, student: "Laila" },
  { courseId: "ai", reason: "unrelated", conceptIndex: 0, student: "Omar", question: c2("What is the best phone to buy this year?", "ما أفضل هاتف يُشترى هذا العام؟") },
  { courseId: "algorithms", reason: "outside", conceptIndex: 6, student: "Farah" },
  { courseId: "python", reason: "uncertain", conceptIndex: 3, student: "Karim", duplicate: true },
];
export const oobFor = (courseId: CourseId, reason: OobReason, conceptIndex: number) => ({
  concept: ct(courseId, conceptIndex),
  question: oobQuestionFor(reason, ct(courseId, conceptIndex), conceptIndex),
  response: oobResponse[reason],
});
