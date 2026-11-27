"use client";
import { useState } from "react";
import { ClipboardPlus, Info, Send, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EditorDialog, EmptyState, Field, NativeSelect, TextArea, TextInput } from "@/features/instructor/portal/forms";
import { NOW } from "@/features/instructor/dashboard/data";
import { levelOf } from "@/features/instructor/analytics/data";
import { LevelBadge, Section, Stat } from "@/features/instructor/analytics/ui";
import { CRITERIA, type ConceptRow, type Coverage, type Priority, type StudentRow } from "./data";
import { useReports } from "./store";
import type { Page } from "./use-reports";

const plusDays = (n: number) => new Date(new Date(NOW).getTime() + n * 86400000).toISOString().slice(0, 10);
const prTone = { high: "danger", medium: "warning", low: "success" } as const;
const covTone = { adequate: "success", weak: "warning", uncovered: "danger" } as const;

export function PriorityBadge({ p, t }: { p: Priority; t: Page["t"] }) {
  return <Badge tone={prTone[p]}>{{ high: t("High", "مرتفعة"), medium: t("Medium", "متوسطة"), low: t("Low", "منخفضة") }[p]}</Badge>;
}
export function CoverageBadge({ c, t }: { c: Coverage; t: Page["t"] }) {
  return <Badge tone={covTone[c]}>{{ adequate: t("Adequate", "كافية"), weak: t("Weak", "ضعيفة"), uncovered: t("Uncovered", "غير مغطاة") }[c]}</Badge>;
}

/* 2. Exam readiness overview */
export function Overview({ p }: { p: Page }) {
  const { t, num, model, threshold } = p;
  const o = model.overview;
  return (
    <section aria-label={t("Exam readiness overview", "نظرة عامة على الجاهزية للامتحان")} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <Stat label={t("Overall exam readiness", "الجاهزية العامة للامتحان")} tag={t("Estimate", "تقدير")} value={o.overall === null ? "—" : `${num(o.overall)}%`} note={o.overall === null ? t("Not enough evidence yet", "لا توجد أدلة كافية بعد") : t(`Average of ${o.total - o.insufficient} students with enough evidence`, `متوسط ${num(o.total - o.insufficient)} طلاب لديهم أدلة كافية`)} />
        <Stat label={t("Students ready", "طلاب جاهزون")} tone="success" value={num(o.ready)} note={t(`of ${o.total} students`, `من ${num(o.total)} طلاب`)} />
        <Stat label={t("Students requiring revision", "طلاب يحتاجون إلى مراجعة")} tone={o.revision ? "warning" : undefined} value={num(o.revision)} note={o.insufficient ? t(`+ ${o.insufficient} without enough evidence`, `+ ${num(o.insufficient)} بلا أدلة كافية`) : undefined} />
        <Stat label={t("Concepts below mastery threshold", "مفاهيم دون عتبة الإتقان")} tone={o.below ? "danger" : undefined} value={num(o.below)} note={t(`of ${o.concepts} on this exam · threshold ${threshold}%`, `من ${num(o.concepts)} في هذا الامتحان · العتبة ${num(threshold)}٪`)} />
        <Stat label={t("Uncovered or weakly covered", "مفاهيم غير مغطاة أو ضعيفة التغطية")} tone={o.uncovered ? "warning" : undefined} value={num(o.uncovered)} note={t(`${o.uncoveredHard} with no questions or materials`, `${num(o.uncoveredHard)} بلا أسئلة أو مواد`)} />
      </div>
      <details className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
        <summary className="flex cursor-pointer items-center gap-2 font-medium text-foreground"><Info className="size-4 text-primary" aria-hidden="true" />{t("How readiness is calculated — an estimate, not a prediction", "كيف تُحسب الجاهزية — تقدير وليست توقعًا")}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-6">
          <li>{t("Each student's readiness is the average estimated mastery of the exam's concepts, weighted by the concept's share of the exam.", "جاهزية الطالب هي متوسط الإتقان التقديري لمفاهيم الامتحان مرجّحًا بحصة كل مفهوم من الامتحان.")}</li>
          <li>{t(`Only concepts with enough practice count. If less than ${CRITERIA.minEvidenceWeight}% of the exam weight has evidence, no estimate is shown.`, `تُحتسب المفاهيم ذات التدريب الكافي فقط. إن كان أقل من ${num(CRITERIA.minEvidenceWeight)}٪ من وزن الامتحان مدعومًا بأدلة فلا يظهر تقدير.`)}</li>
          <li>{t(`${CRITERIA.penaltyPerGap} points are deducted for each above-average-weight concept built on a prerequisite below ${CRITERIA.prereqLow}% (at most ${CRITERIA.maxPenalty}).`, `تُخصم ${num(CRITERIA.penaltyPerGap)} نقاط لكل مفهوم ذي وزن أعلى من المتوسط مبني على متطلب أقل من ${num(CRITERIA.prereqLow)}٪ (بحد أقصى ${num(CRITERIA.maxPenalty)}).`)}</li>
          <li>{t(`Ready = estimate of ${CRITERIA.readyAt}% or more and no above-average-weight concept below the ${threshold}% mastery threshold.`, `جاهز = تقدير ${num(CRITERIA.readyAt)}٪ أو أكثر ولا مفهوم ذو وزن أعلى من المتوسط دون عتبة الإتقان ${num(threshold)}٪.`)}</li>
          <li>{t("Readiness is not a grade and does not predict the exam result. Official grades come only from graded assessments.", "الجاهزية ليست درجة ولا تتنبأ بنتيجة الامتحان. الدرجات الرسمية تأتي فقط من التقييمات المصححة.")}</li>
        </ul>
      </details>
    </section>
  );
}

/* 3. Concept-level readiness */
export function ConceptTable({ p, onPlan }: { p: Page; onPlan: (keys: string[]) => void }) {
  const { t, num, model, threshold } = p;
  const [sort, setSort] = useState("priority");
  const rows = [...model.concepts].sort((a, b) =>
    sort === "weight" ? b.weight - a.weight : sort === "low" ? (a.avg ?? 101) - (b.avg ?? 101) : sort === "struggling" ? b.below - a.below : b.score - a.score);
  const prereq = (c: ConceptRow) => (c.lowPrereqs.length ? <span className="text-warning-ink">{t("Weak: ", "ضعيف: ")}{c.lowPrereqs.map((x) => `${t(x.node.title)} (${num(x.avg)}%)`).join(", ")}</span> : c.node.prereqs.length ? <span className="text-success-ink">{t("Solid", "قوي")}</span> : <span className="text-muted-foreground">{t("Foundation", "أساسي")}</span>);
  return (
    <Section id="concepts" title={t("Exam readiness analysis", "تحليل الجاهزية للامتحان")} description={t("Concepts on this exam, ranked by where revision will pay off most. Highlighted rows are heavily weighted concepts that are weak or rest on weak prerequisites.", "مفاهيم هذا الامتحان مرتبة حسب أكثر ما تفيده المراجعة. الصفوف المظللة مفاهيم عالية الوزن ضعيفة أو مبنية على متطلبات ضعيفة.")}
      actions={<NativeSelect aria-label={t("Sort concepts", "ترتيب المفاهيم")} className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}><option value="priority">{t("Revision priority", "أولوية المراجعة")}</option><option value="weight">{t("Exam weight", "وزن الامتحان")}</option><option value="low">{t("Lowest mastery", "الأقل إتقانًا")}</option><option value="struggling">{t("Most students struggling", "الأكثر تعثرًا")}</option></NativeSelect>}>
      {!rows.length ? <EmptyState title={t("No concepts on this exam", "لا مفاهيم في هذا الامتحان")} description={t("Choose another exam.", "اختر امتحانًا آخر.")} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-start text-sm">
            <caption className="sr-only">{t("Concept readiness", "جاهزية المفاهيم")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Concept", "المفهوم"), t("Exam weight", "وزن الامتحان"), t("Average mastery (est.)", "متوسط الإتقان (تقديري)"), t(`Below ${threshold}%`, `دون ${num(threshold)}٪`), t("Prerequisites", "المتطلبات"), t("Material coverage", "تغطية المواد"), t("Revision priority", "أولوية المراجعة"), ""].map((h, i) => <th key={i} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.node.key} className={cn("border-t align-top", c.flagged && "bg-warning-soft/40")}>
                  <th scope="row" className="p-3 text-start font-medium">{t(c.node.title)}{c.flagged && <Badge tone="warning" className="ms-2">{t("Important gap", "فجوة مهمة")}</Badge>}</th>
                  <td className="p-3"><div className="flex items-center gap-2"><span className="h-2 w-16 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${Math.min(100, c.weight * 4)}%` }} /></span><span className="tabular-nums">{num(c.weight)}%</span></div></td>
                  <td className="p-3"><LevelBadge level={levelOf(c.avg)} value={c.avg} /></td>
                  <td className="p-3 tabular-nums">{num(c.below)} <span className="text-muted-foreground">/ {num(c.evidence)}</span></td>
                  <td className="p-3">{prereq(c)}</td>
                  <td className="p-3"><CoverageBadge c={c.coverage} t={t} /><span className="mt-1 block text-xs text-muted-foreground">{t(`${c.questions} approved questions · ${c.materials} materials`, `${num(c.questions)} أسئلة معتمدة · ${num(c.materials)} مواد`)}</span></td>
                  <td className="p-3"><PriorityBadge p={c.priority} t={t} /></td>
                  <td className="p-3"><Button size="sm" variant="outline" onClick={() => onPlan([c.node.key])}><ClipboardPlus aria-hidden="true" />{t("Plan revision", "خطط المراجعة")}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Section>
  );
}

const stateTone = { ready: "success", revision: "warning", insufficient: "neutral" } as const;
/* 4. Student readiness */
export function StudentTable({ p, onPlan }: { p: Page; onPlan: (keys: string[], ids: string[]) => void }) {
  const { t, num, model, course, exam } = p;
  const reminders = useReports((s) => s.reminders);
  const [filter, setFilter] = useState("all");
  const [assign, setAssign] = useState<StudentRow | null>(null);
  const [remind, setRemind] = useState<StudentRow | null>(null);
  const rows = model.students.filter((s) => filter === "all" || s.state === filter).sort((a, b) => (a.readiness ?? 101) - (b.readiness ?? 101));
  const rkey = (s: StudentRow) => `${course.id}:${exam.id}:${s.stat.student.id}`;
  return (
    <Section id="students" title={t("Student exam readiness", "جاهزية الطلاب للامتحان")} description={t("Estimates only. Nothing here assigns or changes an academic grade.", "تقديرات فقط. لا شيء هنا يمنح درجة أكاديمية أو يغيّرها.")}
      actions={<NativeSelect aria-label={t("Filter students", "تصفية الطلاب")} className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">{t("All students", "كل الطلاب")}</option><option value="revision">{t("Requiring revision", "يحتاجون إلى مراجعة")}</option><option value="ready">{t("Ready", "جاهزون")}</option><option value="insufficient">{t("Not enough evidence", "أدلة غير كافية")}</option></NativeSelect>}>
      {!rows.length ? <EmptyState title={t("No students in this view", "لا يوجد طلاب في هذا العرض")} description={t("Try another filter.", "جرّب مرشحًا آخر.")} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-start text-sm">
            <caption className="sr-only">{t("Student readiness", "جاهزية الطلاب")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Readiness (est.)", "الجاهزية (تقديرية)"), t("Concepts needing revision", "مفاهيم تحتاج مراجعة"), t("Prerequisite difficulties", "صعوبات المتطلبات"), t("Recent practice", "التدريب الأخير"), t("Suggested action", "الإجراء المقترح"), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.stat.student.id} className="border-t align-top">
                  <th scope="row" className="p-3 text-start font-medium">{r.stat.student.name}</th>
                  <td className="p-3">{r.readiness === null ? <Badge tone="neutral">{t("Not enough evidence", "أدلة غير كافية")}</Badge> : <><span className="font-semibold tabular-nums">{num(r.readiness)}%</span> <Badge tone={stateTone[r.state]}>{r.state === "ready" ? t("Ready", "جاهز") : t("Revision", "مراجعة")}</Badge></>}</td>
                  <td className="p-3">{r.weak.length ? <span className="flex flex-wrap gap-1">{r.weak.slice(0, 3).map((w) => <Badge key={w.node.key} tone="danger">{t(w.node.title)} {num(w.m)}%</Badge>)}{r.weak.length > 3 && <span className="text-xs text-muted-foreground">+{num(r.weak.length - 3)}</span>}</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-3">{r.prereqGaps.length ? <ul className="space-y-0.5 text-xs">{r.prereqGaps.slice(0, 2).map((g) => <li key={g.concept.key + g.prereq.key}>{t(g.prereq.title)} ({num(g.m)}%) → {t(g.concept.title)}</li>)}</ul> : <span className="text-muted-foreground">{t("None", "لا يوجد")}</span>}</td>
                  <td className="p-3">{t(r.recent)}</td>
                  <td className="p-3">{t(r.action)}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => p.setStudent(r.stat.student.id)} aria-label={t(`Open learning profile: ${r.stat.student.name}`, `فتح ملف التعلم: ${r.stat.student.name}`)}><User aria-hidden="true" />{t("Profile", "الملف")}</Button>
                    <Button size="sm" variant="outline" onClick={() => setAssign(r)} aria-label={t(`Assign revision to ${r.stat.student.name}`, `تكليف ${r.stat.student.name} بمراجعة`)}><ClipboardPlus aria-hidden="true" />{t("Assign revision", "تكليف بمراجعة")}</Button>
                    {reminders.includes(rkey(r)) ? <Badge tone="success">{t("Reminded", "تم التذكير")}</Badge> : <Button size="sm" variant="ghost" onClick={() => setRemind(r)} aria-label={t(`Remind ${r.stat.student.name}`, `تذكير ${r.stat.student.name}`)}><Send aria-hidden="true" />{t("Remind", "تذكير")}</Button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <AssignDialog key={assign?.stat.student.id ?? "a"} p={p} row={assign} onClose={() => setAssign(null)} onPlan={onPlan} />
      <RemindDialog key={`r${remind?.stat.student.id ?? ""}`} p={p} row={remind} onClose={() => setRemind(null)} rkey={remind ? rkey(remind) : ""} />
    </Section>
  );
}

function AssignDialog({ p, row, onClose, onPlan }: { p: Page; row: StudentRow | null; onClose: () => void; onPlan: (keys: string[], ids: string[]) => void }) {
  const { t, course, exam, say } = p;
  const add = useReports((s) => s.addRevision);
  const [picked, setPicked] = useState<string[]>(row ? row.weak.slice(0, 3).map((w) => w.node.key) : []);
  const [due, setDue] = useState(plusDays(7));
  const [note, setNote] = useState("");
  const options = row ? (row.weak.length ? row.weak.map((w) => w.node) : p.model.concepts.map((c) => c.node)) : [];
  return (
    <EditorDialog open={!!row} onOpenChange={(o) => !o && onClose()} title={t(`Assign revision to ${row?.stat.student.name ?? ""}`, `تكليف ${row?.stat.student.name ?? ""} بمراجعة`)} description={t("Creates a targeted revision activity for this student. Demo only: nothing is sent.", "ينشئ نشاط مراجعة موجّهًا لهذا الطالب. للعرض فقط: لا يُرسل شيء.")} submitLabel={t("Create revision activity", "إنشاء نشاط المراجعة")}
      onSubmit={() => {
        if (!row || !picked.length || due < plusDays(0)) return;
        add({ courseId: course.id, examId: exam.id, title: `${t(exam.title)}: ${row.stat.student.name}`, mode: "targeted", conceptKeys: picked, studentIds: [row.stat.student.id], start: plusDays(0), due, instructions: note, materialIds: [], questionIds: [] });
        say(t(`Revision activity created for ${row.stat.student.name}. See Revision planning below.`, `تم إنشاء نشاط مراجعة لـ ${row.stat.student.name}. راجع تخطيط المراجعة أدناه.`)); onClose();
      }}>
      <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">{t("Concepts", "المفاهيم")}</legend>
        {options.map((n) => <label key={n.key} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={picked.includes(n.key)} onChange={() => setPicked((x) => (x.includes(n.key) ? x.filter((k) => k !== n.key) : [...x, n.key]))} />{t(n.title)}</label>)}
        {!picked.length && <p className="text-sm text-danger">{t("Select at least one concept.", "اختر مفهومًا واحدًا على الأقل.")}</p>}
      </fieldset>
      <Field label={t("Due date", "تاريخ التسليم")}>{({ id }) => <TextInput id={id} type="date" min={plusDays(0)} value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
      <Field label={t("Instructions (optional)", "تعليمات (اختياري)")}>{({ id }) => <TextArea id={id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      <Button type="button" variant="ghost" size="sm" onClick={() => { if (row) { onPlan(picked, [row.stat.student.id]); onClose(); } }}>{t("Open full planner instead", "فتح مخطط المراجعة الكامل بدلًا من ذلك")}</Button>
    </EditorDialog>
  );
}

function RemindDialog({ p, row, onClose, rkey }: { p: Page; row: StudentRow | null; onClose: () => void; rkey: string }) {
  const { t, exam, date, say } = p;
  const remind = useReports((s) => s.remind);
  const [text, setText] = useState(row ? t(`Hi ${row.stat.student.name}, the ${exam.title[0]} is on ${date(exam.date)}. A short practice session on ${row.weak[0]?.node.title[0] ?? "the course concepts"} will help. This is a reminder, not a grade.`, `مرحبًا ${row.stat.student.name}، موعد ${exam.title[1]} في ${date(exam.date)}. جلسة تدريب قصيرة على ${row.weak[0]?.node.title[1] ?? "مفاهيم المقرر"} ستفيدك. هذا تذكير وليس درجة.`) : "");
  return (
    <EditorDialog open={!!row} onOpenChange={(o) => !o && onClose()} title={t(`Revision reminder for ${row?.stat.student.name ?? ""}`, `تذكير بالمراجعة لـ ${row?.stat.student.name ?? ""}`)} description={t("Demo only: nothing is sent. Sending records the reminder.", "للعرض فقط: لا يُرسل شيء. يسجّل الإرسال التذكير.")} submitLabel={t("Send reminder (demo)", "إرسال التذكير (عرض)")}
      onSubmit={() => { if (!row || !text.trim()) return; remind(rkey); say(t(`Reminder to ${row.stat.student.name} recorded (demo, not sent).`, `تم تسجيل التذكير إلى ${row.stat.student.name} (عرض، لم يُرسل).`)); onClose(); }}>
      <TextArea aria-label={t("Message", "الرسالة")} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
    </EditorDialog>
  );
}

/* Learning profile drawer: weak concepts and prerequisite problems for one student */
export function ProfileSheet({ p }: { p: Page }) {
  const { t, num, student: r, language, model } = p;
  return (
    <Sheet open={!!r} onOpenChange={(o) => !o && p.setStudent(null)}>
      <SheetContent side="end" dir={language === "ar" ? "rtl" : "ltr"} closeLabel={t("Close", "إغلاق")} className="w-[min(100vw,28rem)] overflow-y-auto bg-card p-6">
        {r && (
          <div className="space-y-5">
            <div className="pe-10"><SheetTitle className="text-xl font-semibold">{r.stat.student.name}</SheetTitle><SheetDescription className="mt-1 text-sm text-muted-foreground">{t(r.recent)}</SheetDescription></div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("Readiness (estimate)", "الجاهزية (تقدير)")}</p><p className="text-xl font-semibold tabular-nums">{r.readiness === null ? "—" : `${num(r.readiness)}%`}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("Mastery (estimate)", "الإتقان (تقدير)")}</p><LevelBadge level={levelOf(r.stat.avg)} value={r.stat.avg} /></div>
            </div>
            <div><h3 className="mb-2 text-sm font-semibold">{t("Weak concepts for this exam", "مفاهيم ضعيفة في هذا الامتحان")}</h3>
              {r.weak.length ? <ul className="space-y-1.5 text-sm">{r.weak.map((w) => <li key={w.node.key} className="flex items-center justify-between gap-2"><span>{t(w.node.title)} <span className="text-xs text-muted-foreground">({num(w.weight)}% {t("of exam", "من الامتحان")})</span></span><LevelBadge level={levelOf(w.m)} value={w.m} /></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("No concept is below the threshold.", "لا مفهوم دون العتبة.")}</p>}</div>
            <div><h3 className="mb-2 text-sm font-semibold">{t("Prerequisite difficulties", "صعوبات المتطلبات")}</h3>
              {r.prereqGaps.length ? <ul className="list-disc space-y-1 ps-5 text-sm">{r.prereqGaps.map((g) => <li key={g.concept.key + g.prereq.key}>{t(g.prereq.title)} ({num(g.m)}%) {t("before", "قبل")} {t(g.concept.title)}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t("None found.", "لا يوجد.")}</p>}</div>
            <div className="rounded-xl bg-secondary/50 p-4 text-sm"><p className="font-semibold">{t("Suggested action", "الإجراء المقترح")}</p><p className="mt-1">{t(r.action)}</p></div>
            <p className="text-xs text-muted-foreground">{t(`Estimate from ${num(model.concepts.length)} exam concepts. Not a grade.`, `تقدير من ${num(model.concepts.length)} مفهومًا في الامتحان. ليس درجة.`)}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
