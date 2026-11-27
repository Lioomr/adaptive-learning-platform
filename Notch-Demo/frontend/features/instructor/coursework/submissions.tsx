"use client";
import { useState } from "react";
import { CornerDownLeft, Download, FileSearch, GraduationCap, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Field, TextArea, TextInput, editCopy } from "@/features/instructor/portal/forms";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { roster, type CourseAssignment, type StudentSubmission } from "@/features/instructor/portal/data";
import { cellFor, levelOf, nodesFor, type Node } from "@/features/instructor/analytics/data";
import { LevelBadge } from "@/features/instructor/analytics/ui";
import { useReports } from "@/features/instructor/reports/store";
import type { Student } from "@/types";
import { hash, lateHours, nowMs, submittedAtOf, type AExt } from "./data";
import { Confirm, Modal } from "./modal";
import type { Cw } from "./use-coursework";

type State = "none" | "submitted" | "graded" | "returned" | "resubmit";
const stateTone = { none: "neutral", submitted: "warning", graded: "progress", returned: "success", resubmit: "warning" } as const;

function useRowsFor(cw: Cw, a: CourseAssignment, e: AExt) {
  const content = useInstructorPortal((s) => s.content);
  const meta = cw.w.subMeta;
  const course = cw.assigned.find((c) => c.id === a.courseId)!;
  const nodes = nodesFor(course).filter((n) => e.concepts.includes(n.key));
  const rows = roster.map((student) => {
    const sub = content.submissions.find((s) => s.id === `${a.id}:${student.id}`);
    const m = meta[`${a.id}:${student.id}`];
    const sent = !!sub && sub.status !== "missing";
    const at = sent ? submittedAtOf(sub!, a.due) : undefined;
    const hours = lateHours(at, a.due);
    const attempts = sent ? (m?.attempts ?? (hash(sub!.id) % 9 === 0 ? 2 : 1)) : 0;
    const state: State = !sent ? "none" : m?.resubmit ? "resubmit" : m?.returned ? "returned" : sub!.status === "graded" ? "graded" : "submitted";
    const vals = nodes.map((n) => cellFor(course, n, student).mastery).filter((v): v is number => v !== null);
    const mastery = vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null;
    return { student, sub, at, hours, attempts, state, mastery, meta: m };
  });
  return { rows, nodes, course };
}

export function SubmissionsPanel({ cw }: { cw: Cw }) {
  const { t, num, date, pick, w } = cw;
  const content = useInstructorPortal((s) => s.content);
  const a = content.assignments.find((x) => x.id === cw.viewing);
  const [open, setOpen] = useState<string | null>(null);
  const [returnAll, setReturnAll] = useState(false);
  if (!a) return null;
  return <Panel cw={cw} a={a} open={open} setOpen={setOpen} returnAll={returnAll} setReturnAll={setReturnAll} t={t} num={num} date={date} pick={pick} w={w} />;
}

function Panel({ cw, a, open, setOpen, returnAll, setReturnAll }: { cw: Cw; a: CourseAssignment; open: string | null; setOpen: (v: string | null) => void; returnAll: boolean; setReturnAll: (v: boolean) => void } & Record<string, unknown>) {
  const { t, num, date, pick, w } = cw;
  const e = cw.extOf(a.id, a);
  const { rows, nodes, course } = useRowsFor(cw, a, e);
  const [filter, setFilter] = useState("all");
  const shown = rows.filter((r) => filter === "all" || (filter === "late" ? r.hours > 0 : filter === "ungraded" ? r.state === "submitted" : r.state === filter));
  const ready = rows.filter((r) => r.state === "graded");
  const download = (s: Student, r: (typeof rows)[number]) => {
    const name = `${s.name}-${pick(a.title).replace(/\s+/g, "-").toLowerCase()}.txt`;
    const blob = new Blob([`Mock submission file\nStudent: ${s.name}\nAssignment: ${a.title[0]}\n\n${r.sub ? pick(r.sub.text) : ""}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const l = document.createElement("a"); l.href = url; l.download = name; document.body.appendChild(l); l.click(); l.remove(); URL.revokeObjectURL(url);
    w.say(t(`Downloaded ${name}.`, `تم تنزيل ${name}.`));
  };
  const remediate = (r: (typeof rows)[number]) => {
    useReports.getState().addRevision({ courseId: course.id, examId: "", title: t(`Remediation: ${a.title[0]} (${r.student.name})`, `علاج: ${a.title[1] || a.title[0]} (${r.student.name})`), mode: "targeted", conceptKeys: nodes.map((n) => n.key), studentIds: [r.student.id], start: new Date().toISOString().slice(0, 10), due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), instructions: "", materialIds: e.materialIds, questionIds: [] });
    w.say(t(`Remediation activity assigned to ${r.student.name}. It appears under Reports → Revision planning. Official grades are unchanged.`, `تم تكليف ${r.student.name} بنشاط علاجي. يظهر ضمن التقارير ← تخطيط المراجعة. الدرجات الرسمية لم تتغير.`));
  };
  const label: Record<State, string> = { none: t("Not submitted", "لم يُسلَّم"), submitted: t("Submitted", "مسلَّم"), graded: t("Graded", "مصحَّح"), returned: t("Returned", "مُعاد"), resubmit: t("Resubmission requested", "طُلبت إعادة التسليم") };
  return (
    <Card className="space-y-4 p-5 sm:p-6" id="submissions" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-semibold">{t("Submissions", "التسليمات")}: {pick(a.title)}</h3><p className="text-sm text-muted-foreground">{course.code} · {t(`due ${date(a.due)}`, `الموعد ${date(a.due)}`)} · {t(`${a.maxGrade} marks`, `${num(a.maxGrade)} درجة`)} · {t(`up to ${e.attempts} attempt(s)`, `حتى ${num(e.attempts)} محاولة`)}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label={t("Filter submissions", "تصفية التسليمات")} className="h-10 rounded-lg border bg-background px-3 text-sm" value={filter} onChange={(ev) => setFilter(ev.target.value)}>
            <option value="all">{t("All students", "كل الطلاب")}</option><option value="none">{t("Not submitted", "لم يُسلَّم")}</option><option value="ungraded">{t("Waiting for grading", "بانتظار التصحيح")}</option><option value="late">{t("Late", "متأخر")}</option><option value="resubmit">{t("Resubmission requested", "طُلبت إعادة التسليم")}</option>
          </select>
          <Button variant="outline" disabled={!ready.length} onClick={() => setReturnAll(true)}><CornerDownLeft aria-hidden="true" />{t(`Return ${ready.length} graded`, `إعادة ${num(ready.length)} مصحَّح`)}</Button>
          <Button variant="ghost" onClick={() => cw.setViewing(null)}>{t("Close", "إغلاق")}</Button>
        </div>
      </div>
      {nodes.length > 0 && <p className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">{t(`Linked concepts: ${nodes.map((n) => n.title[0]).join(", ")}. The mastery column is an estimate shown for context. It never changes a grade.`, `المفاهيم المرتبطة: ${nodes.map((n) => n.title[1]).join("، ")}. عمود الإتقان تقدير للسياق فقط ولا يغيّر أي درجة.`)}</p>}
      {shown.length ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[1000px] text-start text-sm">
            <caption className="sr-only">{t("Student submissions", "تسليمات الطلاب")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Submitted", "تاريخ التسليم"), t("Status", "الحالة"), t("Late", "التأخير"), t("Attempts", "المحاولات"), t("Grade", "الدرجة"), ...(nodes.length ? [t("Linked mastery (est.)", "الإتقان المرتبط (تقدير)")] : []), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => {
                const low = nodes.length > 0 && ((r.mastery !== null && r.mastery < 70) || (r.sub?.grade !== undefined && r.sub.grade / a.maxGrade < 0.6));
                return (
                  <tr key={r.student.id} className="border-t align-top">
                    <th scope="row" className="p-3 text-start font-medium">{r.student.name}<span className="block text-xs font-normal text-muted-foreground">{r.student.id}</span></th>
                    <td className="whitespace-nowrap p-3">{r.at ? date(r.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td className="p-3"><Badge tone={stateTone[r.state]}>{label[r.state]}</Badge></td>
                    <td className="p-3">{!r.at ? (new Date(a.due).getTime() < nowMs() ? <Badge tone="danger">{t("Overdue", "متأخر")}</Badge> : "—") : r.hours > 0 ? <Badge tone="danger">{r.hours >= 24 ? t(`${Math.round(r.hours / 24)} d late`, `متأخر ${num(Math.round(r.hours / 24))} يوم`) : t(`${r.hours} h late`, `متأخر ${num(r.hours)} ساعة`)}</Badge> : <Badge tone="success">{t("On time", "في الموعد")}</Badge>}</td>
                    <td className="p-3 tabular-nums">{r.attempts ? <span>{num(r.attempts)} / {num(Math.max(e.attempts, r.attempts))}{r.attempts > 1 && <Badge tone="progress" className="ms-1">{t("Resubmitted", "أُعيد تسليمه")}</Badge>}</span> : "—"}</td>
                    <td className="p-3 tabular-nums">{r.sub?.grade !== undefined ? `${num(r.sub.grade)} / ${num(a.maxGrade)}` : <span className="text-muted-foreground">{r.state === "none" ? "—" : t("Not graded", "غير مصحَّح")}</span>}</td>
                    {nodes.length > 0 && <td className="p-3"><LevelBadge level={levelOf(r.mastery)} value={r.mastery} /></td>}
                    <td className="p-3"><div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setOpen(r.student.id)} aria-label={t(`Open submission: ${r.student.name}`, `فتح تسليم: ${r.student.name}`)}><FileSearch aria-hidden="true" />{t("Open", "فتح")}</Button>
                      {r.sub && r.state !== "none" && <Button size="icon-sm" variant="outline" onClick={() => download(r.student, r)} aria-label={t(`Download files: ${r.student.name}`, `تنزيل ملفات: ${r.student.name}`)} title={t("Download files", "تنزيل الملفات")}><Download /></Button>}
                      {r.state === "graded" && <Button size="icon-sm" variant="outline" onClick={() => { w.setMeta(r.sub!.id, { returned: true, resubmit: false, attempts: r.attempts }); w.say(t(`Returned to ${r.student.name}.`, `تمت إعادته إلى ${r.student.name}.`)); }} aria-label={t(`Return to ${r.student.name}`, `إعادة إلى ${r.student.name}`)} title={t("Return to student", "إعادة إلى الطالب")}><CornerDownLeft /></Button>}
                      {r.state === "none" && <Button size="icon-sm" variant="outline" onClick={() => w.openCompose({ courseId: a.courseId, kind: "assignment", audience: { type: "students", ids: [r.student.id] }, title: `Reminder: ${a.title[0]}`, body: `Hi ${r.student.name}, “${a.title[0]}” is due ${date(a.due)}. Let me know if you need help.` })} aria-label={t(`Remind ${r.student.name}`, `تذكير ${r.student.name}`)} title={t("Send reminder", "إرسال تذكير")}><Bell /></Button>}
                      {low && <Button size="icon-sm" variant="outline" onClick={() => remediate(r)} aria-label={t(`Assign remediation to ${r.student.name}`, `تكليف ${r.student.name} بنشاط علاجي`)} title={t("Assign remediation", "تكليف بنشاط علاجي")}><GraduationCap /></Button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title={t("No submissions in this view", "لا تسليمات في هذا العرض")} description={t("Try another filter.", "جرّب مرشحًا آخر.")} />}
      <ReviewDialog cw={cw} a={a} e={e} rows={rows} nodes={nodes} id={open} close={() => setOpen(null)} />
      <Confirm danger={false} open={returnAll} onOpenChange={setReturnAll} title={t(`Return ${ready.length} graded submissions?`, `إعادة ${num(ready.length)} تسليمات مصحَّحة؟`)} description={t("Students will see their grade and feedback. You can still request resubmissions afterwards.", "سيرى الطلاب درجاتهم وملاحظاتهم. يمكنك طلب إعادة التسليم بعد ذلك.")} action={t("Return all", "إعادة الكل")} onConfirm={() => { ready.forEach((r) => w.setMeta(r.sub!.id, { returned: true, resubmit: false, attempts: r.attempts })); w.say(t(`Returned ${ready.length} submissions.`, `تمت إعادة ${num(ready.length)} تسليمات.`)); }} />
    </Card>
  );
}

function ReviewDialog({ cw, a, e, rows, nodes, id, close }: { cw: Cw; a: CourseAssignment; e: AExt; rows: ReturnType<typeof useRowsFor>["rows"]; nodes: Node[]; id: string | null; close: () => void }) {
  const row = rows.find((r) => r.student.id === id);
  if (!row) return null;
  return <Review key={id} cw={cw} a={a} e={e} row={row} nodes={nodes} close={close} />;
}
function Review({ cw, a, e, row, nodes, close }: { cw: Cw; a: CourseAssignment; e: AExt; row: ReturnType<typeof useRowsFor>["rows"][number]; nodes: Node[]; close: () => void }) {
  const { t, num, date, pick, language, w } = cw;
  const review = useInstructorPortal((s) => s.review);
  const sub = row.sub as StudentSubmission | undefined;
  const [grade, setGrade] = useState(sub?.grade !== undefined ? String(sub.grade) : "");
  const [fb, setFb] = useState(sub?.feedback ?? (["", ""] as const));
  const [rub, setRub] = useState<Record<string, number>>(row.meta?.rubric ?? {});
  const [err, setErr] = useState("");
  const course = cw.assigned.find((c) => c.id === a.courseId)!;
  const rubricSum = e.rubric.reduce((s, r) => s + (rub[r.id] ?? 0), 0);
  const useRubric = e.rubric.length > 0 && e.feedback.rubric;
  const effective = useRubric ? String(rubricSum) : grade;
  const save = (mode: "save" | "return" | "resubmit") => {
    if (!sub || row.state === "none") return;
    const g = effective === "" ? undefined : Number(effective);
    if (mode !== "resubmit" && (g === undefined || Number.isNaN(g) || g < 0 || g > a.maxGrade)) { setErr(t(`Enter marks between 0 and ${a.maxGrade}.`, `أدخل درجة بين 0 و${num(a.maxGrade)}.`)); return; }
    if (useRubric) for (const r of e.rubric) if ((rub[r.id] ?? 0) > r.points) { setErr(t(`“${r.name}” is worth at most ${r.points}.`, `«${r.name}» قيمته ${num(r.points)} كحد أقصى.`)); return; }
    if (mode === "resubmit" && row.attempts >= 5) { setErr(t("Maximum attempts reached.", "تم بلوغ الحد الأقصى للمحاولات.")); return; }
    review(sub.id, { grade: mode === "resubmit" ? sub.grade : g, feedback: fb[0] || fb[1] ? (fb as StudentSubmission["feedback"]) : undefined });
    if (mode === "return") w.setMeta(sub.id, { returned: true, resubmit: false, attempts: row.attempts, rubric: rub });
    else if (mode === "resubmit") { w.setMeta(sub.id, { resubmit: true, returned: false, attempts: row.attempts }); if (e.attempts < row.attempts + 1) w.setExt(a.id, { attempts: row.attempts + 1 }); }
    else w.setMeta(sub.id, { attempts: row.attempts, rubric: rub, returned: row.meta?.returned });
    w.say(mode === "save" ? t(`Saved marks and feedback for ${row.student.name}.`, `تم حفظ الدرجة والملاحظات لـ ${row.student.name}.`) : mode === "return" ? t(`Returned to ${row.student.name} with marks and feedback.`, `تمت إعادته إلى ${row.student.name} بالدرجة والملاحظات.`) : t(`Requested a resubmission from ${row.student.name}. The grade is unchanged until they resubmit.`, `طُلبت إعادة التسليم من ${row.student.name}. تبقى الدرجة كما هي حتى يعيد التسليم.`));
    close();
  };
  const submitted = row.state !== "none";
  return (
    <Modal open onOpenChange={(o) => !o && close()} size="lg" title={t(`${row.student.name}: ${pick(a.title)}`, `${row.student.name}: ${pick(a.title)}`)} description={row.at ? t(`Submitted ${date(row.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}${row.hours > 0 ? ` · ${row.hours} h late` : " · on time"}`, `سُلِّم ${date(row.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}${row.hours > 0 ? ` · متأخر ${num(row.hours)} ساعة` : " · في الموعد"}`) : t("Not submitted yet", "لم يُسلَّم بعد")}
      footer={submitted ? <><Button variant="outline" onClick={() => save("resubmit")}>{t("Request resubmission", "طلب إعادة التسليم")}</Button><Button variant="outline" onClick={() => save("save")}>{t("Save", "حفظ")}</Button><Button onClick={() => save("return")}>{t("Save & return", "حفظ وإعادة")}</Button></> : <Button variant="outline" onClick={close}>{t("Close", "إغلاق")}</Button>}>
      {submitted ? (
        <>
          <div className="rounded-xl border p-4 text-sm"><p className="mb-2 font-medium">{t("Submitted work", "العمل المسلَّم")}</p><p dir="auto" className="whitespace-pre-wrap text-muted-foreground">{sub ? pick(sub.text) : ""}</p>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs"><Download className="size-4" aria-hidden="true" />{`${row.student.name.toLowerCase()}-submission.pdf · ${180 + (hash(row.student.id) % 700)} KB`}</p></div>
          <div className="text-sm"><p className="mb-1 font-medium">{t("Attempt history", "سجل المحاولات")}</p><ul className="space-y-1 text-muted-foreground">{Array.from({ length: row.attempts }, (_, i) => <li key={i}>{t(`Attempt ${i + 1}`, `المحاولة ${num(i + 1)}`)} · {row.at ? date(new Date(new Date(row.at).getTime() - (row.attempts - 1 - i) * 2 * 86400000).toISOString(), { month: "short", day: "numeric" }) : ""}{i === row.attempts - 1 ? ` (${t("latest", "الأحدث")})` : ""}</li>)}</ul></div>
          {useRubric ? <div><p className="mb-2 text-sm font-medium">{t("Rubric scores", "درجات المعيار")}</p><ul className="space-y-2">{e.rubric.map((r) => <li key={r.id} className="grid grid-cols-[1fr_6rem] items-center gap-2 text-sm"><span>{r.name} <span className="text-muted-foreground">/ {num(r.points)}</span></span><TextInput aria-label={r.name} type="number" min={0} max={r.points} value={rub[r.id] ?? ""} onChange={(ev) => setRub({ ...rub, [r.id]: Number(ev.target.value) })} /></li>)}</ul><p className="mt-2 text-sm font-medium">{t(`Total ${rubricSum} / ${a.maxGrade}`, `المجموع ${num(rubricSum)} / ${num(a.maxGrade)}`)}</p></div>
            : <Field label={t(`Marks (out of ${a.maxGrade})`, `الدرجة (من ${num(a.maxGrade)})`)}>{({ id }) => <TextInput id={id} type="number" min={0} max={a.maxGrade} value={grade} onChange={(ev) => setGrade(ev.target.value)} />}</Field>}
          {e.feedback.comments && <Field label={t("Feedback", "الملاحظات")}>{({ id }) => <TextArea id={id} rows={4} value={fb[language === "ar" ? 1 : 0]} onChange={(ev) => setFb(editCopy(fb, language, ev.target.value))} />}</Field>}
          {nodes.length > 0 && <div className="rounded-xl bg-secondary/50 p-4 text-sm"><p className="mb-2 font-medium">{t("Mastery context (estimate)", "سياق الإتقان (تقدير)")}</p><ul className="flex flex-wrap gap-2">{nodes.map((n) => { const v = cellForSafe(course, n, row.student); return <li key={n.key} className="flex items-center gap-1.5">{t(n.title)} <LevelBadge level={levelOf(v)} value={v} /></li>; })}</ul><p className="mt-2 text-xs text-muted-foreground">{t("Mastery estimates are shown for context only and never change this grade.", "تقديرات الإتقان للسياق فقط ولا تغيّر هذه الدرجة أبدًا.")}</p></div>}
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
        </>
      ) : <p className="text-sm text-muted-foreground">{t("There is nothing to grade yet. Send a reminder from the submissions table.", "لا شيء للتصحيح بعد. أرسل تذكيرًا من جدول التسليمات.")}</p>}
    </Modal>
  );
}
const cellForSafe = (course: Parameters<typeof cellFor>[0], n: Node, s: Student) => cellFor(course, n, s).mastery;
