import { courses, type Copy, type CourseId } from "@/features/student/portal/data";
import { roster, type CourseAssignment } from "@/features/instructor/portal/data";
import { NOW } from "@/features/instructor/dashboard/data";

export type { Copy, CourseId };
const c2 = (en: string, ar: string): Copy => [en, ar];
export const DAY = 86400000;
export const nowMs = () => new Date(NOW).getTime();
export const today = NOW.slice(0, 10);

export function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* ---------- Assignments: settings the shared course record does not hold ---------- */
export type LateMode = "none" | "penalty" | "accept";
export type AExt = {
  description: Copy; start: string; late: { mode: LateMode; penalty: number; days: number };
  fileTypes: string[]; maxMb: number; attempts: number; group: { mode: "individual" | "group"; size: number };
  links: { label: string; url: string }[]; materialIds: string[]; tasks: string[];
  rubric: { id: string; name: string; points: number }[]; feedback: { comments: boolean; rubric: boolean; withGrade: boolean };
  concepts: string[]; scheduledFor?: string; archived: boolean;
};
export const FILE_TYPES = ["PDF", "DOCX", "ZIP", "PY", "IPYNB", "PNG/JPG"];
export const defaultExt = (a?: CourseAssignment): AExt => ({
  description: c2("", ""),
  start: a ? new Date(new Date(a.due).getTime() - 14 * DAY).toISOString().slice(0, 16) : `${today}T09:00`,
  late: { mode: "none", penalty: 10, days: 3 }, fileTypes: ["PDF", "DOCX"], maxMb: 10, attempts: 1, group: { mode: "individual", size: 3 },
  links: [], materialIds: [], tasks: [], rubric: [], feedback: { comments: true, rubric: false, withGrade: true }, concepts: [], archived: false,
});
export type SMeta = { returned?: boolean; resubmit?: boolean; attempts: number; rubric?: Record<string, number> };

export type AStatusKey = "draft" | "scheduled" | "published" | "closed" | "archived";
export const aStatusLabel: Record<AStatusKey, Copy> = { draft: c2("Draft", "مسودة"), scheduled: c2("Scheduled", "مجدول"), published: c2("Published", "منشور"), closed: c2("Closed", "مغلق"), archived: c2("Archived", "مؤرشف") };
export function statusOf(a: CourseAssignment, e: AExt): AStatusKey {
  if (e.archived) return "archived";
  if (a.status === "draft") return e.scheduledFor ? "scheduled" : "draft";
  return new Date(a.due).getTime() < nowMs() ? "closed" : "published";
}

/** Deterministic mock: some graded work arrives a little late, so late tracking has something to show. */
export function submittedAtOf(s: { id: string; status: string; submittedAt?: string }, due: string) {
  if (!s.submittedAt) return undefined;
  if (s.submittedAt === due && hash(s.id) % 7 === 0) return new Date(new Date(due).getTime() + (3 + (hash(s.id) % 40)) * 3600000).toISOString();
  return s.submittedAt;
}
export const lateHours = (at: string | undefined, due: string) => (at ? Math.max(0, Math.round((new Date(at).getTime() - new Date(due).getTime()) / 3600000)) : 0);

/* ---------- Attendance ---------- */
export type AStatus = "present" | "absent" | "late" | "excused";
export const ATT: AStatus[] = ["present", "absent", "late", "excused"];
export const attLabel: Record<AStatus, Copy> = { present: c2("Present", "حاضر"), absent: c2("Absent", "غائب"), late: c2("Late", "متأخر"), excused: c2("Excused", "بعذر") };
export type Session = { id: string; courseId: CourseId; kind: "lecture" | "lab"; title: Copy; date: string; recorded: boolean };
export type Records = Record<string, Record<string, AStatus>>;

export function seedSessions(): { sessions: Session[]; records: Records } {
  const sessions: Session[] = [];
  const records: Records = {};
  for (const c of courses) {
    for (let i = 0; i < 10; i++) {
      const kind = i % 2 === 0 ? "lecture" : "lab";
      const list = kind === "lecture" ? c.lectures : c.labs;
      const date = new Date(`${today}T10:00:00+02:00`).getTime() + (i - 7) * 7 * DAY;
      const id = `${c.id}-s${i + 1}`;
      const recorded = i <= 5;
      sessions.push({ id, courseId: c.id, kind, title: list[Math.floor(i / 2) % list.length].title, date: new Date(date).toISOString(), recorded });
      if (recorded) {
        records[id] = Object.fromEntries(roster.map((s) => {
          const r = (hash(id + s.id) % 1000) / 1000;
          const absent = 0.06 + s.lastActiveDays * 0.03;
          return [s.id, r < absent ? "absent" : r < absent + 0.07 ? "late" : r < absent + 0.11 ? "excused" : "present"] as [string, AStatus];
        }));
      }
    }
  }
  return { sessions, records };
}
export const canRecord = (s: Session) => s.date.slice(0, 10) <= today;

export function attendanceOf(studentId: string, courseId: CourseId, sessions: Session[], records: Records) {
  let present = 0, late = 0, absent = 0, excused = 0;
  const recorded = sessions.filter((s) => s.courseId === courseId && s.recorded).sort((a, b) => a.date.localeCompare(b.date));
  const seq: AStatus[] = [];
  for (const s of recorded) {
    const v = records[s.id]?.[studentId];
    if (!v) continue;
    seq.push(v);
    if (v === "present") present++; else if (v === "late") late++; else if (v === "absent") absent++; else excused++;
  }
  const counted = present + late + absent;
  const consecutive = seq.some((v, i) => v === "absent" && seq[i + 1] === "absent");
  return { present, late, absent, excused, total: seq.length, pct: counted ? Math.round(((present + late) / counted) * 100) : null, repeated: absent >= 3 || consecutive, consecutive };
}

/* ---------- Communication ---------- */
export type CommKind = "announcement" | "assignment" | "assessment" | "revision";
export const commLabel: Record<CommKind, Copy> = { announcement: c2("Announcement", "إعلان"), assignment: c2("Assignment reminder", "تذكير بواجب"), assessment: c2("Assessment reminder", "تذكير بتقييم"), revision: c2("Revision reminder", "تذكير بمراجعة") };
export type Audience = { type: "course" | "group" | "students"; group?: "A" | "B" | "revision"; ids?: string[] };
export type Comm = { id: string; courseId: CourseId; kind: CommKind; audience: Audience; title: Copy; body: Copy; files: string[]; status: "published" | "scheduled"; at: string; recipients: number; important: boolean };
export type Msg = { from: "student" | "instructor"; text: Copy; at: string };
export type Thread = { id: string; courseId: CourseId; studentId: string; subject: Copy; messages: Msg[]; unread: boolean; resolved: boolean };

const m = (from: Msg["from"], en: string, ar: string, at: string): Msg => ({ from, text: c2(en, ar), at });
export function seedThreads(): Thread[] {
  return [
    { id: "t1", courseId: "algorithms", studentId: "S-KARIM", subject: c2("Extension for the sorting report", "تمديد موعد تقرير الترتيب"), unread: true, resolved: false, messages: [m("student", "Hello Dr. Hana, I was unwell last week. Could I have two more days for the sorting report?", "مرحبًا د. هناء، كنت مريضًا الأسبوع الماضي. هل يمكنني الحصول على يومين إضافيين لتقرير الترتيب؟", "2026-11-25T07:40:00+02:00")] },
    { id: "t2", courseId: "python", studentId: "S-MARIAM", subject: c2("Stuck on recursion exercise", "تعثر في تمرين التكرار الذاتي"), unread: true, resolved: false, messages: [m("student", "I don't understand why the base case stops the function. Can you explain it differently?", "لا أفهم لماذا توقف الحالة الأساسية الدالة. هل يمكنك الشرح بطريقة مختلفة؟", "2026-11-24T18:05:00+02:00")] },
    { id: "t3", courseId: "ai", studentId: "S-OMAR", subject: c2("Model evaluation quiz", "اختبار تقييم النماذج"), unread: false, resolved: false, messages: [m("student", "Will the quiz cover precision and recall?", "هل سيغطي الاختبار الدقة والاستدعاء؟", "2026-11-23T12:10:00+02:00"), m("instructor", "Yes, with one question on each. The study guide has examples.", "نعم، مع سؤال لكل منهما. يحتوي دليل الدراسة على أمثلة.", "2026-11-23T14:00:00+02:00")] },
    { id: "t4", courseId: "mathematics", studentId: "S-AHMED", subject: c2("Derivatives worksheet question 4", "السؤال 4 في ورقة المشتقات"), unread: true, resolved: false, messages: [m("student", "In question 4, do we use the chain rule or the product rule?", "في السؤال 4، هل نستخدم قاعدة السلسلة أم قاعدة الضرب؟", "2026-11-25T08:20:00+02:00")] },
    { id: "t5", courseId: "python", studentId: "S-YOUSSEF", subject: c2("Catching up after absence", "اللحاق بالدراسة بعد الغياب"), unread: false, resolved: true, messages: [m("student", "I was away for two weeks. What should I do first?", "غبت أسبوعين. ماذا أفعل أولًا؟", "2026-11-18T10:00:00+02:00"), m("instructor", "Start with Variables and Data Types practice, then message me.", "ابدأ بتدريب المتغيرات وأنواع البيانات ثم راسلني.", "2026-11-18T11:30:00+02:00"), m("student", "Thank you, that helped.", "شكرًا لك، لقد ساعدني ذلك.", "2026-11-19T09:00:00+02:00")] },
    { id: "t6", courseId: "english", studentId: "S-LAILA", subject: c2("Academic writing feedback", "ملاحظات الكتابة الأكاديمية"), unread: false, resolved: false, messages: [m("student", "Could I resubmit my argument essay after the feedback?", "هل يمكنني إعادة تسليم مقال الحجة بعد الملاحظات؟", "2026-11-22T15:45:00+02:00")] },
    { id: "t7", courseId: "algorithms", studentId: "S-NOUR", subject: c2("Complexity question", "سؤال عن التعقيد"), unread: true, resolved: false, messages: [m("student", "Is O(n log n) always better than O(n²) for small inputs?", "هل O(n log n) أفضل دائمًا من O(n²) للمدخلات الصغيرة؟", "2026-11-25T06:55:00+02:00")] },
  ];
}
export function seedComms(): Comm[] {
  return [
    { id: "c1", courseId: "algorithms", kind: "assignment", audience: { type: "course" }, title: c2("Reminder: sorting report due Sunday", "تذكير: تقرير الترتيب يُسلَّم الأحد"), body: c2("Please submit your sorting comparison report by Sunday 18:00.", "يرجى تسليم تقرير مقارنة الترتيب قبل الأحد 18:00."), files: [], status: "published", at: "2026-11-24T10:00:00+02:00", recipients: 10, important: false },
    { id: "c2", courseId: "python", kind: "announcement", audience: { type: "group", group: "A" }, title: c2("Section A: lab moved to room 204", "الشعبة أ: نُقل المعمل إلى القاعة 204"), body: c2("This week's lab for Section A is in room 204.", "معمل هذا الأسبوع للشعبة أ في القاعة 204."), files: [], status: "published", at: "2026-11-23T09:00:00+02:00", recipients: 5, important: true },
    { id: "c3", courseId: "ai", kind: "assessment", audience: { type: "course" }, title: c2("Model evaluation quiz on Wednesday", "اختبار تقييم النماذج يوم الأربعاء"), body: c2("The quiz covers precision, recall and cross-validation.", "يغطي الاختبار الدقة والاستدعاء والتحقق المتقاطع."), files: ["study-guide.pdf"], status: "scheduled", at: "2026-11-30T08:00:00+02:00", recipients: 10, important: false },
  ];
}
