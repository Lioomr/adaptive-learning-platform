"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, NativeSelect, TextArea, TextInput, editCopy, newId } from "@/features/instructor/portal/forms";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { assignmentKindLabels, type AssignmentKind, type CourseAssignment } from "@/features/instructor/portal/data";
import { nodesFor } from "@/features/instructor/analytics/data";
import { DAY, FILE_TYPES, defaultExt, nowMs, type AExt, type LateMode } from "./data";
import { Modal, checkbox, iso16, row, toIso } from "./modal";
import type { Cw } from "./use-coursework";

type Draft = { a: CourseAssignment; e: AExt };
const STEPS = [["Basic information", "المعلومات الأساسية"], ["Content", "المحتوى"], ["Submission settings", "إعدادات التسليم"], ["Grading & publishing", "التقدير والنشر"]] as const;

function blank(courseId: string): Draft {
  const due = new Date(nowMs() + 7 * DAY).toISOString();
  return {
    a: { id: newId("as"), courseId: courseId as CourseAssignment["courseId"], kind: "assignment", title: ["", ""], instructions: ["", ""], due, maxGrade: 100, weight: 10, attachments: [], status: "draft" },
    e: { ...defaultExt(), start: iso16(new Date(nowMs() + DAY).toISOString()) },
  };
}

export function AssignmentWizard({ cw }: { cw: Cw }) {
  const id = cw.w.wizard;
  const content = useInstructorPortal((s) => s.content);
  if (!id) return null;
  const existing = id === "new" ? null : content.assignments.find((a) => a.id === id) ?? null;
  const start: Draft = existing ? { a: existing, e: cw.extOf(existing.id, existing) } : blank(cw.scope[0]?.id ?? cw.assigned[0].id);
  return <Wizard key={id} cw={cw} initial={start} isNew={!existing} />;
}

function Wizard({ cw, initial, isNew }: { cw: Cw; initial: Draft; isNew: boolean }) {
  const { t, num, language, assigned, w } = cw;
  const upsert = useInstructorPortal((s) => s.upsert);
  const content = useInstructorPortal((s) => s.content);
  const [d, setD] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [link, setLink] = useState({ label: "", url: "" });
  const [task, setTask] = useState("");
  const [when, setWhen] = useState(initial.e.scheduledFor ? iso16(initial.e.scheduledFor) : "");
  const { a, e } = d;
  const setA = (p: Partial<CourseAssignment>) => setD((x) => ({ ...x, a: { ...x.a, ...p } }));
  const setE = (p: Partial<AExt>) => setD((x) => ({ ...x, e: { ...x.e, ...p } }));
  const course = assigned.find((c) => c.id === a.courseId)!;
  const nodes = nodesFor(course);
  const materials = content.materials.filter((m) => m.courseId === a.courseId);
  const rubricTotal = e.rubric.reduce((s, r) => s + (Number(r.points) || 0), 0);
  const dueLocal = iso16(a.due);
  const check = (s: number, publishing?: "now" | "schedule"): string[] => {
    const out: string[] = [];
    if (s === 0 && !a.title[language === "ar" ? 1 : 0].trim()) out.push(t("Add an assignment title.", "أضف عنوان الواجب."));
    if (s === 0 && !a.instructions[language === "ar" ? 1 : 0].trim()) out.push(t("Add instructions for students.", "أضف تعليمات للطلاب."));
    if (s === 2) {
      if (!e.start || !dueLocal) out.push(t("Set a start and a due date.", "حدّد تاريخ بدء وتاريخ تسليم."));
      else if (dueLocal <= e.start) out.push(t("The due date must be after the start date.", "يجب أن يكون تاريخ التسليم بعد تاريخ البدء."));
      if (!e.fileTypes.length) out.push(t("Accept at least one file type.", "اقبل نوع ملف واحدًا على الأقل."));
      if (e.maxMb < 1 || e.maxMb > 100) out.push(t("Maximum file size must be 1–100 MB.", "يجب أن يكون الحد الأقصى لحجم الملف 1–100 ميغابايت."));
    }
    if (s === 3) {
      if (a.maxGrade < 1 || a.maxGrade > 1000) out.push(t("Total marks must be 1–1000.", "يجب أن يكون مجموع الدرجات 1–1000."));
      if (a.weight < 0 || a.weight > 100) out.push(t("Course weight must be 0–100%.", "يجب أن يكون وزن المقرر 0–100٪."));
      if (e.rubric.length && rubricTotal !== a.maxGrade) out.push(t(`Rubric points total ${rubricTotal}, but total marks are ${a.maxGrade}.`, `مجموع نقاط المعيار ${num(rubricTotal)} لكن مجموع الدرجات ${num(a.maxGrade)}.`));
      if (e.rubric.some((r) => !r.name.trim())) out.push(t("Name every rubric criterion.", "سمِّ كل معيار في المعيار التقييمي."));
      if (publishing === "now" && new Date(a.due).getTime() <= nowMs()) out.push(t("Cannot publish: the due date has already passed.", "لا يمكن النشر: انقضى تاريخ التسليم."));
      if (publishing === "schedule" && (!when || toIso(when) <= new Date(nowMs()).toISOString() || toIso(when) >= a.due)) out.push(t("Pick a schedule time after now and before the due date.", "اختر وقت جدولة بعد الآن وقبل تاريخ التسليم."));
    }
    return out;
  };
  const next = () => { const er = check(step); setErrors(er); if (!er.length) setStep(step + 1); };
  const save = (mode: "draft" | "now" | "schedule") => {
    const er = [0, 2, 3].flatMap((s) => check(s, mode === "draft" ? undefined : mode));
    setErrors(er);
    if (er.length) return;
    upsert("assignments", { ...a, status: mode === "now" ? "published" : "draft" });
    w.setExt(a.id, { ...e, scheduledFor: mode === "schedule" ? toIso(when) : undefined, archived: false });
    w.say(mode === "draft" ? t("Saved as a draft.", "تم الحفظ كمسودة.") : mode === "now" ? t("Published. Students can see it from the start date.", "تم النشر. يراه الطلاب من تاريخ البدء.") : t("Scheduled for publication.", "تمت جدولة النشر."));
    w.openWizard(null);
  };
  const attach = (files: FileList | null) => { if (!files) return; setA({ attachments: [...a.attachments, ...Array.from(files).map((f) => ({ name: f.name, size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` }))] }); };
  const footer = (
    <>
      {step > 0 && <Button variant="outline" onClick={() => { setErrors([]); setStep(step - 1); }}>{t("Back", "رجوع")}</Button>}
      {step < 3 ? <Button onClick={next}>{t("Next", "التالي")}</Button> : (
        <>
          <Button variant="outline" onClick={() => save("draft")}>{t("Save as draft", "حفظ كمسودة")}</Button>
          <Button variant="outline" onClick={() => save("schedule")}>{t("Schedule", "جدولة")}</Button>
          <Button onClick={() => save("now")}>{t("Publish now", "نشر الآن")}</Button>
        </>
      )}
    </>
  );
  return (
    <Modal open onOpenChange={(o) => !o && w.openWizard(null)} size="xl" title={isNew ? t("Create assignment", "إنشاء واجب") : t("Edit assignment", "تعديل الواجب")} description={t(`Step ${step + 1} of 4 · ${STEPS[step][0]}`, `الخطوة ${num(step + 1)} من 4 · ${STEPS[step][1]}`)} footer={footer}>
      <ol className="flex flex-wrap gap-2 text-xs" aria-label={t("Steps", "الخطوات")}>{STEPS.map((s, i) => <li key={i} aria-current={i === step ? "step" : undefined} className={cn("rounded-full border px-3 py-1", i === step ? "border-primary bg-secondary font-semibold text-primary" : i < step ? "text-foreground" : "text-muted-foreground")}>{num(i + 1)}. {t(s[0], s[1])}</li>)}</ol>
      {step === 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Assignment title", "عنوان الواجب")} className="md:col-span-2">{({ id }) => <TextInput id={id} maxLength={120} value={a.title[language === "ar" ? 1 : 0]} onChange={(ev) => setA({ title: editCopy(a.title, language, ev.target.value) })} />}</Field>
          <Field label={t("Course", "المقرر")}>{({ id }) => <NativeSelect id={id} value={a.courseId} onChange={(ev) => setD((x) => ({ a: { ...x.a, courseId: ev.target.value as never }, e: { ...x.e, concepts: [], materialIds: [] } }))}>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect>}</Field>
          <Field label={t("Type", "النوع")}>{({ id }) => <NativeSelect id={id} value={a.kind} onChange={(ev) => setA({ kind: ev.target.value as AssignmentKind })}>{(Object.keys(assignmentKindLabels) as AssignmentKind[]).map((k) => <option key={k} value={k}>{t(assignmentKindLabels[k])}</option>)}</NativeSelect>}</Field>
          <Field label={t("Description", "الوصف")} className="md:col-span-2">{({ id }) => <TextArea id={id} rows={2} value={e.description[language === "ar" ? 1 : 0]} onChange={(ev) => setE({ description: editCopy(e.description, language, ev.target.value) })} />}</Field>
          <Field label={t("Instructions", "التعليمات")} className="md:col-span-2">{({ id }) => <TextArea id={id} rows={4} value={a.instructions[language === "ar" ? 1 : 0]} onChange={(ev) => setA({ instructions: editCopy(a.instructions, language, ev.target.value) })} />}</Field>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          <div><p className="mb-2 text-sm font-medium">{t("Upload or attach files", "رفع ملفات أو إرفاقها")}</p>
            <input type="file" multiple aria-label={t("Attach files", "إرفاق ملفات")} onChange={(ev) => { attach(ev.target.files); ev.target.value = ""; }} className="block w-full text-sm file:me-3 file:rounded-lg file:border file:bg-secondary file:px-3 file:py-2" />
            <ul className="mt-2 space-y-1.5 text-sm">{a.attachments.map((f, i) => <li key={i} className={row}><span className="flex-1">{f.name} <span className="text-muted-foreground">({f.size})</span></span><Button size="icon-sm" variant="ghost" onClick={() => setA({ attachments: a.attachments.filter((_, j) => j !== i) })} aria-label={t(`Remove ${f.name}`, `إزالة ${f.name}`)}><Trash2 /></Button></li>)}</ul>
            <p className="mt-1 text-xs text-muted-foreground">{t("Demo: only file names are kept; nothing is uploaded.", "عرض: تُحفظ أسماء الملفات فقط ولا يُرفع شيء.")}</p></div>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("Link course materials", "ربط مواد المقرر")}</legend>
            {materials.length ? <div className="grid gap-2 sm:grid-cols-2">{materials.map((m) => <label key={m.id} className={row}><input type="checkbox" className={checkbox} checked={e.materialIds.includes(m.id)} onChange={() => setE({ materialIds: e.materialIds.includes(m.id) ? e.materialIds.filter((x) => x !== m.id) : [...e.materialIds, m.id] })} />{cw.pick(m.title)}</label>)}</div> : <p className="text-sm text-muted-foreground">{t("This course has no materials yet.", "لا مواد في هذا المقرر بعد.")}</p>}
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
              <TextInput aria-label={t("Link label", "عنوان الرابط")} placeholder={t("Label", "العنوان")} value={link.label} onChange={(ev) => setLink({ ...link, label: ev.target.value })} />
              <TextInput aria-label={t("Link URL", "عنوان URL")} placeholder="https://" value={link.url} onChange={(ev) => setLink({ ...link, url: ev.target.value })} />
              <Button type="button" variant="outline" disabled={!link.label.trim() || !/^https?:\/\//.test(link.url)} onClick={() => { setE({ links: [...e.links, link] }); setLink({ label: "", url: "" }); }}><Plus aria-hidden="true" />{t("Add link", "إضافة رابط")}</Button>
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">{e.links.map((l, i) => <li key={i} className={row}><span className="flex-1">{l.label} <span className="text-muted-foreground">{l.url}</span></span><Button size="icon-sm" variant="ghost" onClick={() => setE({ links: e.links.filter((_, j) => j !== i) })} aria-label={t(`Remove ${l.label}`, `إزالة ${l.label}`)}><Trash2 /></Button></li>)}</ul></fieldset>
          <div><p className="mb-2 text-sm font-medium">{t("Questions or tasks", "الأسئلة أو المهام")}</p>
            <div className="flex gap-2"><TextInput aria-label={t("New task", "مهمة جديدة")} placeholder={t("e.g. Explain the base case in your own words", "مثال: اشرح الحالة الأساسية بكلماتك")} value={task} onChange={(ev) => setTask(ev.target.value)} /><Button type="button" variant="outline" disabled={!task.trim()} onClick={() => { setE({ tasks: [...e.tasks, task.trim()] }); setTask(""); }}><Plus aria-hidden="true" />{t("Add", "إضافة")}</Button></div>
            <ol className="mt-2 list-decimal space-y-1.5 ps-5 text-sm">{e.tasks.map((x, i) => <li key={i}><span className="inline-flex w-[calc(100%-0.5rem)] items-center gap-2"><span className="flex-1" dir="auto">{x}</span><Button size="icon-sm" variant="ghost" onClick={() => setE({ tasks: e.tasks.filter((_, j) => j !== i) })} aria-label={t("Remove task", "إزالة المهمة")}><Trash2 /></Button></span></li>)}</ol></div>
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("Start date", "تاريخ البدء")}>{({ id }) => <TextInput id={id} type="datetime-local" value={e.start} onChange={(ev) => setE({ start: ev.target.value })} />}</Field>
          <Field label={t("Due date", "تاريخ التسليم")}>{({ id }) => <TextInput id={id} type="datetime-local" value={dueLocal} onChange={(ev) => ev.target.value && setA({ due: toIso(ev.target.value) })} />}</Field>
          <div className="md:col-span-2"><Field label={t("Late submission policy", "سياسة التسليم المتأخر")}>{({ id }) => <NativeSelect id={id} value={e.late.mode} onChange={(ev) => setE({ late: { ...e.late, mode: ev.target.value as LateMode } })}><option value="none">{t("No late submissions", "لا تسليم متأخر")}</option><option value="accept">{t("Accept late, no penalty", "قبول المتأخر بلا خصم")}</option><option value="penalty">{t("Accept late with a penalty", "قبول المتأخر مع خصم")}</option></NativeSelect>}</Field>
            {e.late.mode !== "none" && <div className="mt-2 grid gap-3 sm:grid-cols-2"><Field label={t("Accept for (days after due)", "القبول لمدة (أيام بعد الموعد)")}>{({ id }) => <TextInput id={id} type="number" min={1} max={14} value={e.late.days} onChange={(ev) => setE({ late: { ...e.late, days: Number(ev.target.value) } })} />}</Field>
              {e.late.mode === "penalty" && <Field label={t("Penalty (% per day)", "الخصم (٪ لكل يوم)")} hint={t("Applied only because you chose this policy for this assignment.", "يُطبَّق فقط لأنك اخترت هذه السياسة لهذا الواجب.")}>{({ id }) => <TextInput id={id} type="number" min={1} max={50} value={e.late.penalty} onChange={(ev) => setE({ late: { ...e.late, penalty: Number(ev.target.value) } })} />}</Field>}</div>}</div>
          <fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-medium">{t("Accepted file types", "أنواع الملفات المقبولة")}</legend><div className="flex flex-wrap gap-2">{FILE_TYPES.map((f) => <label key={f} className={row}><input type="checkbox" className={checkbox} checked={e.fileTypes.includes(f)} onChange={() => setE({ fileTypes: e.fileTypes.includes(f) ? e.fileTypes.filter((x) => x !== f) : [...e.fileTypes, f] })} />{f}</label>)}</div></fieldset>
          <Field label={t("Maximum file size (MB)", "الحد الأقصى لحجم الملف (ميغابايت)")}>{({ id }) => <TextInput id={id} type="number" min={1} max={100} value={e.maxMb} onChange={(ev) => setE({ maxMb: Number(ev.target.value) })} />}</Field>
          <Field label={t("Number of attempts", "عدد المحاولات")}>{({ id }) => <NativeSelect id={id} value={e.attempts} onChange={(ev) => setE({ attempts: Number(ev.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{num(n)}</option>)}</NativeSelect>}</Field>
          <Field label={t("Submission type", "نوع التسليم")}>{({ id }) => <NativeSelect id={id} value={e.group.mode} onChange={(ev) => setE({ group: { ...e.group, mode: ev.target.value as "individual" | "group" } })}><option value="individual">{t("Individual", "فردي")}</option><option value="group">{t("Group", "جماعي")}</option></NativeSelect>}</Field>
          {e.group.mode === "group" && <Field label={t("Group size", "حجم المجموعة")}>{({ id }) => <TextInput id={id} type="number" min={2} max={8} value={e.group.size} onChange={(ev) => setE({ group: { ...e.group, size: Number(ev.target.value) } })} />}</Field>}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Total marks", "مجموع الدرجات")}>{({ id }) => <TextInput id={id} type="number" min={1} max={1000} value={a.maxGrade} onChange={(ev) => setA({ maxGrade: Number(ev.target.value) })} />}</Field>
            <Field label={t("Share of course grade (%)", "حصة الواجب من درجة المقرر (٪)")}>{({ id }) => <TextInput id={id} type="number" min={0} max={100} value={a.weight} onChange={(ev) => setA({ weight: Number(ev.target.value) })} />}</Field>
          </div>
          <div><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{t("Rubric or grading criteria (optional)", "المعيار التقييمي (اختياري)")}</p><Button type="button" size="sm" variant="outline" onClick={() => setE({ rubric: [...e.rubric, { id: newId("r"), name: "", points: 0 }] })}><Plus aria-hidden="true" />{t("Add criterion", "إضافة معيار")}</Button></div>
            <ul className="space-y-2">{e.rubric.map((r, i) => <li key={r.id} className="grid grid-cols-[1fr_6rem_auto] gap-2"><TextInput aria-label={t("Criterion name", "اسم المعيار")} placeholder={t("e.g. Correctness", "مثال: الصحة")} value={r.name} onChange={(ev) => setE({ rubric: e.rubric.map((x, j) => (j === i ? { ...x, name: ev.target.value } : x)) })} /><TextInput aria-label={t("Points", "النقاط")} type="number" min={0} value={r.points} onChange={(ev) => setE({ rubric: e.rubric.map((x, j) => (j === i ? { ...x, points: Number(ev.target.value) } : x)) })} /><Button size="icon" variant="ghost" onClick={() => setE({ rubric: e.rubric.filter((_, j) => j !== i) })} aria-label={t("Remove criterion", "إزالة المعيار")}><Trash2 /></Button></li>)}</ul>
            {e.rubric.length > 0 && <p className={cn("mt-2 text-xs", rubricTotal === a.maxGrade ? "text-success-ink" : "text-danger")}>{t(`Rubric total ${rubricTotal} of ${a.maxGrade} marks`, `مجموع المعيار ${num(rubricTotal)} من ${num(a.maxGrade)} درجة`)}</p>}</div>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("Feedback options", "خيارات الملاحظات")}</legend><div className="grid gap-2 sm:grid-cols-3">
            {([["comments", t("Written comments", "تعليقات مكتوبة")], ["rubric", t("Rubric breakdown", "تفصيل المعيار")], ["withGrade", t("Release feedback with the grade", "إتاحة الملاحظات مع الدرجة")]] as const).map(([k, l]) => <label key={k} className={row}><input type="checkbox" className={checkbox} checked={e.feedback[k]} onChange={() => setE({ feedback: { ...e.feedback, [k]: !e.feedback[k] } })} />{l}</label>)}</div></fieldset>
          <fieldset><legend className="mb-1 text-sm font-medium">{t("Link to knowledge concepts", "الربط بالمفاهيم المعرفية")}</legend><p className="mb-2 text-xs text-muted-foreground">{t("Linked concepts show students' mastery estimates next to their results. Mastery never changes an official grade.", "تعرض المفاهيم المرتبطة تقديرات إتقان الطلاب بجانب نتائجهم. لا يغيّر الإتقان أي درجة رسمية.")}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{nodes.map((n) => <label key={n.key} className={row}><input type="checkbox" className={checkbox} checked={e.concepts.includes(n.key)} onChange={() => setE({ concepts: e.concepts.includes(n.key) ? e.concepts.filter((x) => x !== n.key) : [...e.concepts, n.key] })} />{t(n.title)}</label>)}</div></fieldset>
          <Field label={t("Schedule publication for (only used by “Schedule”)", "جدولة النشر في (يُستخدم مع «جدولة» فقط)")}>{({ id }) => <TextInput id={id} type="datetime-local" value={when} onChange={(ev) => setWhen(ev.target.value)} />}</Field>
        </div>
      )}
      {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 ps-5 text-sm text-danger">{errors.map((x) => <li key={x}>{x}</li>)}</ul>}
    </Modal>
  );
}
