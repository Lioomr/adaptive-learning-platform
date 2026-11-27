"use client";
import { useState } from "react";
import { Archive, Bell, Copy as CopyIcon, Eye, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, NativeSelect, TextInput, newId } from "@/features/instructor/portal/forms";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { roster, assignmentKindLabels, type CourseAssignment } from "@/features/instructor/portal/data";
import { Stat } from "@/features/instructor/analytics/ui";
import { DAY, aStatusLabel, nowMs, statusOf, type AExt, type AStatusKey } from "./data";
import { Confirm, Modal, iso16, toIso } from "./modal";
import { useWork } from "./store";
import { SubmissionsPanel } from "./submissions";
import type { Cw } from "./use-coursework";

const tone = { draft: "neutral", scheduled: "progress", published: "success", closed: "warning", archived: "neutral" } as const;

export function useRows(cw: Cw) {
  const content = useInstructorPortal((s) => s.content);
  useWork((s) => s.ext);
  return content.assignments.filter((a) => cw.inScope(a.courseId)).map((a) => {
    const e = cw.extOf(a.id, a);
    const subs = content.submissions.filter((s) => s.assignmentId === a.id);
    const submitted = subs.filter((s) => s.status !== "missing").length;
    const graded = subs.filter((s) => s.status === "graded").length;
    return { a, e, status: statusOf(a, e), assigned: roster.length, submitted, graded, waiting: subs.filter((s) => s.status === "submitted").length };
  }).sort((x, y) => y.a.due.localeCompare(x.a.due));
}

export function Assignments({ cw }: { cw: Cw }) {
  const { t, num, date, w, pick, archived } = cw;
  const upsert = useInstructorPortal((s) => s.upsert);
  const remove = useInstructorPortal((s) => s.remove);
  const all = useRows(cw);
  const [filter, setFilter] = useState("active");
  const [q, setQ] = useState("");
  const [publish, setPublish] = useState<string | null>(null);
  const [when, setWhen] = useState("");
  const [err, setErr] = useState("");
  const [arch, setArch] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const live = all.filter((r) => r.status !== "archived");
  const open = live.filter((r) => r.status === "published");
  const next7 = open.filter((r) => new Date(r.a.due).getTime() - nowMs() <= 7 * DAY);
  const shown = all.filter((r) => (filter === "active" ? r.status !== "archived" : filter === "all" || r.status === filter) && (!q.trim() || pick(r.a.title).toLowerCase().includes(q.trim().toLowerCase())));
  const course = (id: string) => cw.assigned.find((c) => c.id === id)!;
  const duplicate = (a: CourseAssignment, e: AExt) => {
    const id = newId("as");
    upsert("assignments", { ...a, id, title: [`Copy of ${a.title[0]}`, `نسخة من ${a.title[1] || a.title[0]}`], status: "draft", due: new Date(nowMs() + 7 * DAY).toISOString() });
    w.setExt(id, { ...e, scheduledFor: undefined, archived: false });
    w.say(t(`Duplicated as a draft: “Copy of ${a.title[0]}”.`, `تم النسخ كمسودة: «نسخة من ${a.title[1] || a.title[0]}».`));
  };
  const setStatus = (id: string, mode: "now" | "schedule" | "draft") => {
    const r = all.find((x) => x.a.id === id)!;
    if (mode === "schedule" && (!when || toIso(when) <= new Date(nowMs()).toISOString() || toIso(when) >= r.a.due)) { setErr(t("Pick a time after now and before the due date.", "اختر وقتًا بعد الآن وقبل تاريخ التسليم.")); return; }
    if (mode === "now" && new Date(r.a.due).getTime() <= nowMs()) { setErr(t("Cannot publish: the due date has passed. Edit the due date first.", "لا يمكن النشر: انقضى تاريخ التسليم. عدّل الموعد أولًا.")); return; }
    upsert("assignments", { ...r.a, status: mode === "now" ? "published" : "draft" });
    w.setExt(id, { scheduledFor: mode === "schedule" ? toIso(when) : undefined });
    w.say(mode === "now" ? t("Published.", "تم النشر.") : mode === "schedule" ? t("Scheduled for publication.", "تمت جدولة النشر.") : t("Moved back to draft.", "أُعيد إلى المسودة."));
    setPublish(null); setErr("");
  };
  const target = all.find((r) => r.a.id === publish);
  return (
    <div className="space-y-6">
      <section aria-label={t("Assignment overview", "نظرة عامة على الواجبات")} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t("Total assignments", "إجمالي الواجبات")} value={num(live.length)} note={t(`${all.length - live.length} archived`, `${num(all.length - live.length)} مؤرشف`)} />
        <Stat label={t("Published", "المنشورة")} tone="success" value={num(live.filter((r) => r.status === "published" || r.status === "closed").length)} />
        <Stat label={t("Upcoming deadlines", "مواعيد قادمة")} tone={next7.length ? "warning" : undefined} value={num(next7.length)} note={t("due within 7 days", "خلال 7 أيام")} />
        <Stat label={t("Pending submissions", "تسليمات منتظرة")} value={num(open.reduce((s, r) => s + (r.assigned - r.submitted), 0))} note={t("on open assignments", "في الواجبات المفتوحة")} />
        <Stat label={t("Pending grading", "بانتظار التصحيح")} tone={live.some((r) => r.waiting) ? "warning" : undefined} value={num(live.reduce((s, r) => s + r.waiting, 0))} />
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput aria-label={t("Search assignments", "البحث في الواجبات")} placeholder={t("Search assignments", "البحث في الواجبات")} className="max-w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        <NativeSelect aria-label={t("Filter by status", "التصفية حسب الحالة")} className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="active">{t("Active (not archived)", "النشطة (غير المؤرشفة)")}</option><option value="all">{t("All, including archived", "الكل بما فيها المؤرشفة")}</option>{(Object.keys(aStatusLabel) as AStatusKey[]).map((k) => <option key={k} value={k}>{t(aStatusLabel[k])}</option>)}</NativeSelect>
        <Button className="ms-auto" disabled={archived} onClick={() => w.openWizard("new")}><Plus aria-hidden="true" />{t("Create assignment", "إنشاء واجب")}</Button>
      </div>
      {shown.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-start text-sm">
            <caption className="sr-only">{t("Assignments", "الواجبات")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Assignment", "الواجب"), t("Course", "المقرر"), t("Due", "الموعد"), t("Marks", "الدرجات"), t("Assigned", "المكلّفون"), t("Submitted", "المسلَّم"), t("Graded", "المصحَّح"), t("Status", "الحالة"), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map(({ a, e, status, assigned, submitted, graded }) => (
                <tr key={a.id} className="border-t align-top">
                  <th scope="row" className="p-3 text-start font-medium"><button type="button" onClick={() => cw.setViewing(a.id)} className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{pick(a.title)}</button><span className="mt-1 flex flex-wrap gap-1"><Badge tone="neutral">{t(assignmentKindLabels[a.kind])}</Badge>{e.concepts.length > 0 && <Badge tone="ai">{t(`${e.concepts.length} concepts`, `${num(e.concepts.length)} مفاهيم`)}</Badge>}</span></th>
                  <td className="whitespace-nowrap p-3">{course(a.courseId).code}</td>
                  <td className="whitespace-nowrap p-3">{date(a.due)}<span className="block text-xs text-muted-foreground">{date(a.due, { hour: "2-digit", minute: "2-digit" })}</span></td>
                  <td className="p-3 tabular-nums">{num(a.maxGrade)}</td>
                  <td className="p-3 tabular-nums">{num(assigned)}</td>
                  <td className="p-3"><Progress value={submitted} max={assigned} label={t("Submission progress", "تقدم التسليم")} /></td>
                  <td className="p-3"><Progress value={graded} max={submitted} label={t("Grading progress", "تقدم التصحيح")} /></td>
                  <td className="p-3"><Badge tone={tone[status]}>{t(aStatusLabel[status])}</Badge>{status === "scheduled" && e.scheduledFor && <span className="mt-1 block text-xs text-muted-foreground">{date(e.scheduledFor)}</span>}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    <Button size="sm" onClick={() => cw.setViewing(a.id)}><Eye aria-hidden="true" />{t("Submissions", "التسليمات")}</Button>
                    <Button size="icon-sm" variant="outline" disabled={archived} onClick={() => w.openWizard(a.id)} aria-label={t(`Edit ${pick(a.title)}`, `تعديل ${pick(a.title)}`)} title={t("Edit", "تعديل")}><Pencil /></Button>
                    <Button size="icon-sm" variant="outline" disabled={archived} onClick={() => duplicate(a, e)} aria-label={t(`Duplicate ${pick(a.title)}`, `نسخ ${pick(a.title)}`)} title={t("Duplicate", "نسخ")}><CopyIcon /></Button>
                    {status !== "archived" && <Button size="icon-sm" variant="outline" disabled={archived} onClick={() => { setPublish(a.id); setWhen(e.scheduledFor ? iso16(e.scheduledFor) : ""); setErr(""); }} aria-label={t(`Publish or schedule ${pick(a.title)}`, `نشر أو جدولة ${pick(a.title)}`)} title={t("Publish / schedule", "نشر / جدولة")}><Send /></Button>}
                    {(status === "published") && <Button size="icon-sm" variant="outline" onClick={() => w.openCompose({ courseId: a.courseId, kind: "assignment", audience: { type: "course" }, title: `Reminder: ${a.title[0]} is due ${date(a.due)}`, body: `Please submit “${a.title[0]}” by ${date(a.due)}.` })} aria-label={t(`Send reminder for ${pick(a.title)}`, `إرسال تذكير بشأن ${pick(a.title)}`)} title={t("Send reminder", "إرسال تذكير")}><Bell /></Button>}
                    {status === "archived" ? <Button size="sm" variant="outline" onClick={() => { w.setExt(a.id, { archived: false }); w.say(t("Restored from archive.", "تمت الاستعادة من الأرشيف.")); }}>{t("Restore", "استعادة")}</Button> : <Button size="icon-sm" variant="outline" disabled={archived} onClick={() => setArch(a.id)} aria-label={t(`Archive ${pick(a.title)}`, `أرشفة ${pick(a.title)}`)} title={t("Archive", "أرشفة")}><Archive /></Button>}
                    {status === "draft" && <Button size="icon-sm" variant="ghost" className="text-danger" onClick={() => setDel(a.id)} aria-label={t(`Delete ${pick(a.title)}`, `حذف ${pick(a.title)}`)} title={t("Delete", "حذف")}><Trash2 /></Button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState title={t("No assignments", "لا توجد واجبات")} description={all.length ? t("No assignment matches these filters.", "لا واجب يطابق هذه المرشحات.") : t("Create your first assignment to get started.", "أنشئ أول واجب للبدء.")} action={<Button disabled={archived} onClick={() => w.openWizard("new")}>{t("Create assignment", "إنشاء واجب")}</Button>} />}
      {cw.viewing && <SubmissionsPanel cw={cw} />}

      <Modal open={!!target} onOpenChange={(o) => !o && setPublish(null)} title={t("Publish or schedule", "نشر أو جدولة")} description={target ? pick(target.a.title) : ""}
        footer={target && <>{target.status !== "draft" && target.status !== "scheduled" ? <Button variant="outline" onClick={() => setStatus(target.a.id, "draft")}>{t("Unpublish (back to draft)", "إلغاء النشر (العودة إلى مسودة)")}</Button> : null}<Button variant="outline" onClick={() => setStatus(target.a.id, "schedule")}>{t("Schedule", "جدولة")}</Button><Button onClick={() => setStatus(target.a.id, "now")}>{t("Publish now", "نشر الآن")}</Button></>}>
        <label className="grid gap-1.5 text-sm font-medium">{t("Publish at", "النشر في")}<TextInput type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
        <p className="text-sm text-muted-foreground">{t("Choose “Publish now” to open it immediately, or pick a time and choose “Schedule”.", "اختر «نشر الآن» لفتحه فورًا، أو حدّد وقتًا واختر «جدولة».")}</p>
        {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      </Modal>
      <Confirm open={!!arch} onOpenChange={(o) => !o && setArch(null)} title={t("Archive this assignment?", "أرشفة هذا الواجب؟")} description={t("Archived assignments disappear from the active list and from students. Submissions and grades are kept, and you can restore it later.", "تختفي الواجبات المؤرشفة من القائمة النشطة ومن الطلاب. تُحفظ التسليمات والدرجات ويمكنك الاستعادة لاحقًا.")} action={t("Archive", "أرشفة")} onConfirm={() => { if (arch) { w.setExt(arch, { archived: true }); w.say(t("Archived. Find it under “All, including archived”.", "تمت الأرشفة. ستجده ضمن «الكل بما فيها المؤرشفة».")); } setArch(null); }} />
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title={t("Delete this draft?", "حذف هذه المسودة؟")} description={t("The draft and its settings are removed permanently. This cannot be undone.", "تُحذف المسودة وإعداداتها نهائيًا. لا يمكن التراجع.")} action={t("Delete", "حذف")} onConfirm={() => { if (del) { remove("assignments", del); w.say(t("Draft deleted.", "تم حذف المسودة.")); } setDel(null); }} />
    </div>
  );
}

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return <div className="w-28"><span className="text-xs tabular-nums">{value}/{max}</span><span role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></span></div>;
}
