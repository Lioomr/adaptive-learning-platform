"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Field, NativeSelect, TextArea, TextInput } from "@/features/instructor/portal/forms";
import { NOW } from "@/features/instructor/dashboard/data";
import { concepts as qConcepts } from "@/features/instructor/qbank/data";
import { useQb } from "@/features/instructor/qbank/store";
import { useQ } from "@/features/instructor/qbank/shared";
import { Section } from "@/features/instructor/analytics/ui";
import { useReports } from "./store";
import type { Page } from "./use-reports";

const day = (n: number) => new Date(new Date(NOW).getTime() + n * 86400000).toISOString().slice(0, 10);
const chip = "flex items-center gap-3 rounded-lg border p-2.5 text-sm";

/* 5. Revision planning */
export function Revision({ p, initial }: { p: Page; initial: { keys: string[]; ids: string[] } }) {
  const { t, num, model, course, exam, say, date } = p;
  const q = useQ();
  const add = useReports((s) => s.addRevision);
  const all = useReports((s) => s.revisions);
  const remove = useReports((s) => s.removeRevision);
  const bank = useQb((s) => s.questions);
  const [mode, setMode] = useState<"class" | "targeted">(initial.ids.length ? "targeted" : "class");
  const [title, setTitle] = useState("");
  const [keys, setKeys] = useState<string[]>(initial.keys.length ? initial.keys : model.concepts.filter((c) => c.priority === "high").map((c) => c.node.key));
  const [ids, setIds] = useState<string[]>(initial.ids);
  const [start, setStart] = useState(day(0));
  const [due, setDue] = useState(day(7));
  const [note, setNote] = useState("");
  const [mats, setMats] = useState<string[]>([]);
  const [qs, setQs] = useState<string[]>([]);
  const [qc, setQc] = useState("all");
  const [errors, setErrors] = useState<string[]>([]);
  const everyone = model.students.map((s) => s.stat.student.id);
  const withGaps = (ks: string[]) => model.students.filter((s) => s.weak.some((w) => ks.includes(w.node.key))).map((s) => s.stat.student.id);
  const target = mode === "class" ? everyone : ids;
  const materials = p.content.materials.filter((m) => m.courseId === course.id);
  const approved = bank.filter((x) => x.bank === "practice" && x.status === "approved" && (qc === "all" || x.conceptIds.includes(qc)));
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const mine = all.filter((r) => r.courseId === course.id);
  const create = () => {
    const e: string[] = [];
    if (!keys.length) e.push(t("Select at least one concept.", "اختر مفهومًا واحدًا على الأقل."));
    if (!target.length) e.push(t("Select at least one student.", "اختر طالبًا واحدًا على الأقل."));
    if (due < start) e.push(t("The due date must not be before the start date.", "يجب ألا يسبق تاريخ التسليم تاريخ البدء."));
    if (start < day(0)) e.push(t("The start date cannot be in the past.", "لا يمكن أن يكون تاريخ البدء في الماضي."));
    setErrors(e);
    if (e.length) return;
    const label = title.trim() || t(`${exam.title[0]} revision`, `مراجعة ${exam.title[1]}`);
    add({ courseId: course.id, examId: exam.id, title: label, mode, conceptKeys: keys, studentIds: target, start, due, instructions: note, materialIds: mats, questionIds: qs });
    say(t(`Revision activity “${label}” created for ${target.length} student(s). Demo only: nothing is sent.`, `تم إنشاء نشاط المراجعة «${label}» لـ ${num(target.length)} طالب. للعرض فقط: لا يُرسل شيء.`));
    setTitle(""); setNote(""); setMats([]); setQs([]);
  };
  return (
    <Section id="revision" title={t("Revision planning", "تخطيط المراجعة")} description={t("Build a revision activity for the whole class or for students with specific gaps.", "أنشئ نشاط مراجعة للصف كله أو للطلاب ذوي الفجوات المحددة.")}>
      <Card className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Activity title", "عنوان النشاط")}>{({ id }) => <TextInput id={id} maxLength={80} value={title} placeholder={t(`${exam.title[0]} revision`, `مراجعة ${exam.title[1]}`)} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <div role="radiogroup" aria-label={t("Audience", "الفئة المستهدفة")} className="grid gap-1.5 text-sm font-medium">{t("Audience", "الفئة المستهدفة")}
            <div className="inline-flex w-fit rounded-xl border bg-muted/50 p-1">
              {([["class", t("Whole class", "الصف كله")], ["targeted", t("Targeted (knowledge gaps)", "موجّه (فجوات معرفية)")]] as const).map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => { setMode(id); if (id === "targeted" && !ids.length) setIds(withGaps(keys)); }} className={cn("min-h-10 rounded-lg px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", mode === id ? "bg-card font-semibold text-primary shadow-xs" : "text-muted-foreground")}>{label}</button>)}
            </div>
          </div>
        </div>
        <fieldset><legend className="mb-2 text-sm font-medium">{t("Concepts to revise", "المفاهيم المطلوب مراجعتها")}</legend>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{[...model.concepts].sort((a, b) => b.score - a.score).map((c) => <label key={c.node.key} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={keys.includes(c.node.key)} onChange={() => { const next = keys.includes(c.node.key) ? keys.filter((k) => k !== c.node.key) : [...keys, c.node.key]; setKeys(next); if (mode === "targeted") setIds(withGaps(next)); }} /><span className="flex-1">{t(c.node.title)}</span><Badge tone={c.priority === "high" ? "danger" : c.priority === "medium" ? "warning" : "success"}>{c.priority === "high" ? t("High", "مرتفعة") : c.priority === "medium" ? t("Medium", "متوسطة") : t("Low", "منخفضة")}</Badge></label>)}</div>
        </fieldset>
        <fieldset><legend className="mb-2 flex flex-wrap items-center gap-2 text-sm font-medium">{t("Students", "الطلاب")} <span className="font-normal text-muted-foreground">({num(target.length)} {t("selected", "محدد")})</span></legend>
          {mode === "class" ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t(`All ${model.students.length} students in ${course.title[0]} receive this activity.`, `يتلقى جميع الطلاب (${num(model.students.length)}) في ${course.title[1]} هذا النشاط.`)}</p> : (
            <>
              <div className="mb-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setIds(withGaps(keys))}>{t("Students with gaps in chosen concepts", "طلاب لديهم فجوات في المفاهيم المختارة")}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIds(model.students.filter((s) => s.state === "revision").map((s) => s.stat.student.id))}>{t("All needing revision", "كل من يحتاج مراجعة")}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIds(model.students.filter((s) => s.stat.section === "A").map((s) => s.stat.student.id))}>{t("Section A", "الشعبة أ")}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIds(model.students.filter((s) => s.stat.section === "B").map((s) => s.stat.student.id))}>{t("Section B", "الشعبة ب")}</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIds([])}>{t("Clear", "مسح")}</Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{model.students.map((s) => <label key={s.stat.student.id} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={ids.includes(s.stat.student.id)} onChange={() => toggle(ids, setIds, s.stat.student.id)} />{s.stat.student.name}<span className="ms-auto text-xs text-muted-foreground">{s.readiness === null ? "—" : `${num(s.readiness)}%`}</span></label>)}</div>
            </>
          )}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Start date", "تاريخ البدء")}>{({ id }) => <TextInput id={id} type="date" min={day(0)} value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
          <Field label={t("Due date", "تاريخ التسليم")}>{({ id }) => <TextInput id={id} type="date" min={start} max={exam.date.slice(0, 10)} value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
        </div>
        <Field label={t("Instructions", "التعليمات")}>{({ id }) => <TextArea id={id} rows={3} value={note} placeholder={t("What should students do, and how long should it take?", "ماذا يفعل الطلاب وكم يستغرق ذلك؟")} onChange={(e) => setNote(e.target.value)} />}</Field>
        <div className="grid gap-6 lg:grid-cols-2">
          <fieldset><legend className="mb-2 text-sm font-medium">{t("Attach existing course materials", "إرفاق مواد المقرر الحالية")}</legend>
            {materials.length ? <div className="grid gap-2">{materials.map((m) => <label key={m.id} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={mats.includes(m.id)} onChange={() => toggle(mats, setMats, m.id)} />{q.text(m.title)}</label>)}</div> : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t("No materials in this course yet. Add them under My Courses → Extra Materials.", "لا مواد في هذا المقرر بعد. أضفها من مقرراتي ← مواد إضافية.")}</p>}</fieldset>
          <fieldset><legend className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm font-medium"><span>{t("Assign approved practice questions", "تكليف بأسئلة تدريب معتمدة")}</span>
            <NativeSelect aria-label={t("Filter questions by concept", "تصفية الأسئلة حسب المفهوم")} className="h-9 w-auto text-xs" value={qc} onChange={(e) => setQc(e.target.value)}><option value="all">{t("All concepts", "كل المفاهيم")}</option>{qConcepts.filter((c) => c.approved).map((c) => <option key={c.id} value={c.id}>{t(c.en, c.ar)}</option>)}</NativeSelect></legend>
            <p className="mb-2 text-xs text-muted-foreground">{t("Only approved questions from the shared Question Bank can be assigned. Nothing is generated here.", "يمكن تكليف الأسئلة المعتمدة فقط من بنك الأسئلة المشترك. لا يُولَّد شيء هنا.")}</p>
            <div className="grid max-h-56 gap-2 overflow-y-auto pe-1">{approved.map((x) => <label key={x.id} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={qs.includes(x.id)} onChange={() => toggle(qs, setQs, x.id)} /><span className="min-w-0 flex-1"><span className="block truncate" dir="auto">{q.text(x.text)}</span><span className="text-xs text-muted-foreground">{x.id} · {q.conceptName(x.conceptIds[0])} · {num(x.marks)} {t("marks", "درجات")}</span></span></label>)}{!approved.length && <p className="text-sm text-muted-foreground">{t("No approved practice questions for this concept.", "لا أسئلة تدريب معتمدة لهذا المفهوم.")}</p>}</div></fieldset>
        </div>
        {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 ps-5 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="flex justify-end"><Button onClick={create}>{t("Create revision activity", "إنشاء نشاط المراجعة")}</Button></div>
      </Card>
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("Revision activities", "أنشطة المراجعة")} ({num(mine.length)})</h3>
        {mine.length ? <ul className="grid gap-3 md:grid-cols-2">{mine.map((r) => (
          <li key={r.id}><Card className="space-y-2 p-4 text-sm">
            <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.id} · {date(r.start)} → {date(r.due)}</p></div><Button size="icon-sm" variant="ghost" className="text-danger" onClick={() => { remove(r.id); say(t(`Removed ${r.id}.`, `تمت إزالة ${r.id}.`)); }} aria-label={t(`Remove ${r.id}`, `إزالة ${r.id}`)}><Trash2 /></Button></div>
            <div className="flex flex-wrap gap-1.5"><Badge tone={r.mode === "class" ? "brand" : "warning"}>{r.mode === "class" ? t("Whole class", "الصف كله") : t("Targeted", "موجّه")}</Badge><Badge tone="neutral">{t(`${r.studentIds.length} students`, `${num(r.studentIds.length)} طلاب`)}</Badge><Badge tone="neutral">{t(`${r.materialIds.length} materials`, `${num(r.materialIds.length)} مواد`)}</Badge><Badge tone="neutral">{t(`${r.questionIds.length} questions`, `${num(r.questionIds.length)} أسئلة`)}</Badge></div>
            <p className="text-muted-foreground">{r.conceptKeys.map((k) => { const n = model.m.nodeBy.get(k); return n ? t(n.title) : k; }).join(" · ")}</p>
          </Card></li>
        ))}</ul> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("No revision activities yet.", "لا أنشطة مراجعة بعد.")}</p>}
      </div>
    </Section>
  );
}
