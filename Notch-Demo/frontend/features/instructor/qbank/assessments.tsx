"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete, EmptyState, Field, NativeSelect, Status, TextInput } from "@/features/instructor/portal/forms";
import { PageTitle, SectionTitle } from "@/features/instructor/portal/ui";
import { concepts, qtypes, typeLabel } from "./data";
import { useQb, type AssessmentKind } from "./store";
import { BankBadge, DiffBadge, useQ } from "./shared";

export function AssessmentCenter() {
  const { t, text, num, conceptName } = useQ();
  const questions = useQb((s) => s.questions);
  const assessments = useQb((s) => s.assessments);
  const { createAssessment, updateAssessment, deleteAssessment } = useQb.getState();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [del, setDel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [bank, setBank] = useState("all");
  const [concept, setConcept] = useState("all");
  const [type, setType] = useState("all");
  const active = assessments.find((a) => a.id === activeId) ?? null;
  const kinds: Record<AssessmentKind, [string, string]> = { diagnostic: ["Diagnostic test", "اختبار تشخيصي"], quiz: ["Lecture quiz", "اختبار محاضرة"], practice: ["Practice assessment", "تقييم تدريبي"], exam: ["Actual exam", "امتحان فعلي"] };
  const approved = useMemo(() => questions.filter((x) => x.status === "approved"), [questions]);
  const pool = approved.filter((x) => (bank === "all" || x.bank === bank) && (concept === "all" || x.conceptIds.includes(concept)) && (type === "all" || x.type === type) && (!q.trim() || `${x.id} ${x.text[0]} ${x.text[1]}`.toLowerCase().includes(q.trim().toLowerCase())));
  const items = active?.items ?? [];
  const total = items.reduce((a, i) => a + i.marks, 0);
  const byId = (id: string) => questions.find((x) => x.id === id);
  const unavailable = items.filter((i) => byId(i.questionId)?.status !== "approved");
  return (
    <div className="space-y-7 animate-fade-in">
      <PageTitle
        eyebrow={t("ASSESSMENT CENTER", "مركز التقييم")}
        title={t("Build assessments from approved questions.", "ابنِ التقييمات من الأسئلة المعتمدة.")}
        description={t("Only approved questions can be selected, and only by you. Questions are never moved between banks or assessments automatically.", "لا يمكن اختيار إلا الأسئلة المعتمدة، وبقرارك وحدك. لا تنتقل الأسئلة تلقائيًا بين البنوك أو التقييمات.")}
        action={<div className="flex gap-2"><Button asChild variant="outline"><Link href="/instructor/question-bank">{t("Question Bank", "بنك الأسئلة")}</Link></Button><Button onClick={() => { const id = createAssessment({ title: t("Untitled assessment", "تقييم بلا عنوان"), kind: "quiz", minutes: 30, grading: "auto", items: [] }); setActiveId(id); setNotice(t("Draft created.", "تم إنشاء مسودة.")); }}><Plus aria-hidden="true" />{t("New assessment", "تقييم جديد")}</Button></div>}
      />
      <Status message={notice} />
      <div className="grid items-start gap-6 xl:grid-cols-[18rem_1fr]">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">{t("Your assessments", "تقييماتك")}</h2>
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.id}><button type="button" onClick={() => setActiveId(a.id)} aria-current={a.id === activeId ? "true" : undefined} className={`w-full rounded-lg border p-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${a.id === activeId ? "border-primary bg-secondary/50" : "hover:bg-muted"}`}><span className="block font-medium">{a.title}</span><span className="text-xs text-muted-foreground">{t(kinds[a.kind] as [string, string])} · {t(`${num(a.items.length)} questions`, `${num(a.items.length)} أسئلة`)}</span><Badge tone={a.saved ? "success" : "neutral"} className="ms-2">{a.saved ? t("Saved", "محفوظ") : t("Draft", "مسودة")}</Badge></button></li>
            ))}
          </ul>
          {!assessments.length && <p className="text-sm text-muted-foreground">{t("No assessments yet. Create one to start selecting approved questions.", "لا توجد تقييمات بعد. أنشئ واحدًا لتبدأ اختيار الأسئلة المعتمدة.")}</p>}
        </Card>
        {active ? (
          <div className="space-y-6">
            <Card className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-2"><SectionTitle title={t("Assessment settings", "إعدادات التقييم")} /><Button variant="ghost" className="text-danger" onClick={() => setDel(active.id)}><Trash2 aria-hidden="true" />{t("Delete", "حذف")}</Button></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("Title", "العنوان")}>{({ id }) => <TextInput id={id} maxLength={100} value={active.title} onChange={(e) => updateAssessment(active.id, { title: e.target.value, saved: false })} />}</Field>
                <Field label={t("Type", "النوع")}>{({ id }) => <NativeSelect id={id} value={active.kind} onChange={(e) => updateAssessment(active.id, { kind: e.target.value as AssessmentKind, saved: false })}>{(Object.keys(kinds) as AssessmentKind[]).map((k) => <option key={k} value={k}>{t(kinds[k] as [string, string])}</option>)}</NativeSelect>}</Field>
                <Field label={t("Duration (minutes)", "المدة (بالدقائق)")}>{({ id }) => <TextInput id={id} type="number" min={5} max={300} value={active.minutes} onChange={(e) => updateAssessment(active.id, { minutes: Math.min(300, Math.max(5, Number(e.target.value) || 5)), saved: false })} />}</Field>
                <Field label={t("Grading", "التصحيح")}>{({ id }) => <NativeSelect id={id} value={active.grading} onChange={(e) => updateAssessment(active.id, { grading: e.target.value as "auto" | "mixed", saved: false })}><option value="auto">{t("Automatic where possible", "آلي حيثما أمكن")}</option><option value="mixed">{t("Automatic and manual", "آلي ويدوي")}</option></NativeSelect>}</Field>
              </div>
            </Card>
            <Card className="p-5 sm:p-6">
              <SectionTitle title={t("Selected questions", "الأسئلة المحددة")} description={t(`${num(items.length)} questions · ${num(total)} marks`, `${num(items.length)} أسئلة · ${num(total)} درجة`)}><Button disabled={!items.length || !active.title.trim()} onClick={() => { updateAssessment(active.id, { saved: true }); setNotice(t(`“${active.title}” saved as a draft assessment. It has not been published to students.`, `تم حفظ «${active.title}» كتقييم مسودة. لم يُنشر للطلاب.`)); }}>{t("Save assessment", "حفظ التقييم")}</Button></SectionTitle>
              {unavailable.length > 0 && <p role="alert" className="mb-3 text-sm text-warning">{t(`${num(unavailable.length)} selected question(s) are no longer approved. Remove them before saving.`, `${num(unavailable.length)} سؤالًا محددًا لم يعد معتمدًا. أزله قبل الحفظ.`)}</p>}
              <ul className="space-y-2">
                {items.map((it, n) => {
                  const x = byId(it.questionId);
                  return (
                    <li key={it.questionId} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm">
                      <span className="w-6 tabular-nums text-muted-foreground">{num(n + 1)}</span>
                      <span className="min-w-0 flex-1 basis-48"><span className="font-mono text-xs text-muted-foreground" dir="ltr">{it.questionId}</span> {x && <BankBadge bank={x.bank} />}<span className="line-clamp-1 block">{x ? text(x.text) : t("Unavailable question", "سؤال غير متاح")}</span></span>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">{t("marks", "درجات")}<TextInput aria-label={t(`Marks for ${it.questionId}`, `درجات ${it.questionId}`)} type="number" min={1} max={100} className="h-9 w-16 text-center" value={it.marks} onChange={(e) => updateAssessment(active.id, { items: items.map((z) => (z.questionId === it.questionId ? { ...z, marks: Math.max(1, Number(e.target.value) || 1) } : z)), saved: false })} /></label>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => updateAssessment(active.id, { items: items.filter((z) => z.questionId !== it.questionId), saved: false })} aria-label={t(`Remove ${it.questionId}`, `إزالة ${it.questionId}`)}><Trash2 aria-hidden="true" />{t("Remove", "إزالة")}</Button>
                    </li>
                  );
                })}
              </ul>
              {!items.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("Nothing selected yet. Add approved questions below.", "لم يُحدد شيء بعد. أضف أسئلة معتمدة أدناه.")}</p>}
            </Card>
            <Card className="p-5 sm:p-6">
              <SectionTitle title={t("Approved questions", "الأسئلة المعتمدة")} description={t("Adding copies the question into this assessment. The bank is unchanged. Exam-preparation questions only join an actual exam when you add them here.", "تنسخ الإضافة السؤال إلى هذا التقييم دون تغيير البنك. لا تنضم أسئلة التحضير للامتحان إلى امتحان فعلي إلا عند إضافتها هنا.")} />
              <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="flex items-center gap-2 rounded-lg border bg-card px-3 xl:col-span-1"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><input className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search approved questions", "ابحث في الأسئلة المعتمدة")} placeholder={t("Search", "بحث")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
                <NativeSelect aria-label={t("Bank", "البنك")} value={bank} onChange={(e) => setBank(e.target.value)}><option value="all">{t("Both banks", "كلا البنكين")}</option><option value="practice">{t("Practice", "التدريب")}</option><option value="exam">{t("Exam preparation", "التحضير للامتحان")}</option></NativeSelect>
                <NativeSelect aria-label={t("Concept", "المفهوم")} value={concept} onChange={(e) => setConcept(e.target.value)}><option value="all">{t("All concepts", "كل المفاهيم")}</option>{concepts.filter((c) => c.approved).map((c) => <option key={c.id} value={c.id}>{conceptName(c.id)}</option>)}</NativeSelect>
                <NativeSelect aria-label={t("Type", "النوع")} value={type} onChange={(e) => setType(e.target.value)}><option value="all">{t("All types", "كل الأنواع")}</option>{qtypes.map((k) => <option key={k} value={k}>{t(typeLabel[k])}</option>)}</NativeSelect>
              </div>
              <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                {pool.map((x) => {
                  const added = items.some((i) => i.questionId === x.id);
                  return (
                    <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm">
                      <span className="min-w-0 flex-1 basis-56"><span className="font-mono text-xs text-muted-foreground" dir="ltr">{x.id}</span> <BankBadge bank={x.bank} /> <DiffBadge q={x} /><span className="line-clamp-2 block">{text(x.text)}</span><span className="text-xs text-muted-foreground">{x.conceptIds.map(conceptName).join("، ")} · {num(x.marks)} {t("marks", "درجات")}</span></span>
                      <Button size="sm" variant={added ? "outline" : "default"} disabled={added} onClick={() => { updateAssessment(active.id, { items: [...items, { questionId: x.id, marks: x.marks }], saved: false }); }} aria-label={t(`Add ${x.id}`, `إضافة ${x.id}`)}>{added ? t("Added", "مضاف") : t("Add", "إضافة")}</Button>
                    </li>
                  );
                })}
              </ul>
              {!pool.length && <EmptyState title={t("No approved questions match", "لا توجد أسئلة معتمدة مطابقة")} description={t("Approve questions in the Question Bank or change the filters.", "اعتمد أسئلة في بنك الأسئلة أو غيّر التصفية.")} />}
            </Card>
          </div>
        ) : (
          <EmptyState title={t("Select or create an assessment", "اختر تقييمًا أو أنشئ واحدًا")} description={t("Pick an assessment on the left, or create a new one to start choosing approved questions.", "اختر تقييمًا من اليسار أو أنشئ تقييمًا جديدًا لتبدأ اختيار الأسئلة المعتمدة.")} />
        )}
      </div>
      <ConfirmDelete open={!!del} onOpenChange={(o) => !o && setDel(null)} title={t("Delete this assessment?", "حذف هذا التقييم؟")} description={t("The assessment is removed. The questions stay in their banks.", "يُحذف التقييم وتبقى الأسئلة في بنوكها.")} onConfirm={() => { if (del) deleteAssessment(del); setDel(null); setActiveId(null); setNotice(t("Assessment deleted.", "تم حذف التقييم.")); }} />
    </div>
  );
}
