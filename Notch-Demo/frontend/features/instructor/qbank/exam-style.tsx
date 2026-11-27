"use client";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, NativeSelect, TextArea, TextInput } from "@/features/instructor/portal/forms";
import { SectionTitle } from "@/features/instructor/portal/ui";
import { blooms, bloomLabel, diffs, diffLabel, qtypes, sum, typeLabel, wordingLabel, type ExamStyle } from "./data";
import { useQb } from "./store";
import { useQ } from "./shared";

const FILE = /\.(pdf|docx?|pptx?)$/i;
export function styleIssues(s: ExamStyle) {
  const issues: string[] = [];
  if (sum(s.typePct) !== 100) issues.push("type");
  if (sum(s.diffPct) !== 100) issues.push("difficulty");
  if (sum(s.bloomPct) !== 100) issues.push("cognitive");
  return issues;
}
/** Marks implied by the type mix, compared with the configured total. */
export function impliedMarks(s: ExamStyle) {
  return qtypes.reduce((a, k) => a + Math.round(((s.typePct[k] ?? 0) / 100) * s.totalQuestions) * (s.marksByType[k] ?? 1), 0);
}

function Pct({ label, value, onChange }: { label: string; value: number | undefined; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="min-w-0 truncate">{label}</span>
      <span className="flex items-center gap-1">
        <TextInput aria-label={label} type="number" min={0} max={100} className="h-9 w-20 text-end tabular-nums" value={value ?? 0} onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />%
      </span>
    </label>
  );
}
function Total({ value, name }: { value: number; name: string }) {
  const { t, num } = useQ();
  const ok = value === 100;
  return (
    <p role={ok ? undefined : "alert"} className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${ok ? "text-success" : "text-danger"}`}>
      {ok ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <AlertTriangle className="size-4" aria-hidden="true" />}
      {ok ? t(`${name} total: 100%`, `إجمالي ${name}: 100%`) : t(`${name} must total 100% (now ${num(value)}%)`, `يجب أن يبلغ إجمالي ${name} 100% (الآن ${num(value)}%)`)}
    </p>
  );
}

export function ExamStyleEditor({ embedded = false }: { embedded?: boolean }) {
  const { t, num } = useQ();
  const style = useQb((s) => s.style);
  const { setStyle, addExamFiles, removeExamFile, analyzeExamFile, notify } = useQb.getState();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const typeTotal = sum(style.typePct);
  const marks = impliedMarks(style);
  const analyzed = style.files.some((f) => f.status === "analyzed");
  const take = (list: FileList | null) => {
    const ok: { name: string; size: number }[] = [];
    const bad: string[] = [];
    for (const f of Array.from(list ?? [])) { if (FILE.test(f.name) && f.size <= 50 * 1048576) ok.push({ name: f.name, size: f.size }); else bad.push(f.name); }
    setError(bad.length ? t(`Unsupported or too large: ${bad.join(", ")}`, `غير مدعوم أو كبير جدًا: ${bad.join("، ")}`) : "");
    if (ok.length) addExamFiles(ok);
    if (input.current) input.current.value = "";
  };
  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionTitle title={t("Option 1 · Upload previous exams", "الخيار 1 · رفع امتحانات سابقة")} description={t("Add past or sample exams. The analysis below is simulated: Adaptive does not truly learn your style in this demo.", "أضف امتحانات سابقة أو نماذج. التحليل أدناه محاكاة: لا تتعلم المنصة أسلوبك فعليًا في هذا العرض.")} />
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }} className="rounded-xl border-2 border-dashed bg-muted/30 p-5 text-center">
          <UploadCloud className="mx-auto mb-2 size-7 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t("Drop exam files here (PDF, DOC, DOCX, PPT, PPTX)", "أسقط ملفات الامتحانات هنا (PDF وDOC وDOCX وPPT وPPTX)")}</p>
          <input ref={input} type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx" className="sr-only" id="exam-files" onChange={(e) => take(e.target.files)} />
          <Button className="mt-3" variant="outline" onClick={() => input.current?.click()}>{t("Choose exam files", "اختيار ملفات الامتحانات")}</Button>
          <Button className="ms-2 mt-3" variant="ghost" onClick={() => { addExamFiles([{ name: "statistics-midterm-2025.pdf", size: 1.8 * 1048576 }, { name: "statistics-final-2025.pdf", size: 2.4 * 1048576 }]); notify(t("Sample exam files added.", "تمت إضافة ملفات امتحان تجريبية.")); }}>{t("Add sample exams", "إضافة امتحانات تجريبية")}</Button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        {style.files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {style.files.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate" dir="ltr">{f.name}</span><span className="text-xs text-muted-foreground">{(f.size / 1048576).toFixed(1)} MB</span></span>
                <span className="flex items-center gap-2">
                  {f.status === "uploaded" && <><Badge tone="neutral">{t("Not analyzed", "لم يُحلَّل")}</Badge><Button size="sm" variant="outline" onClick={() => analyzeExamFile(f.id)}>{t("Analyze (simulated)", "تحليل (محاكاة)")}</Button></>}
                  {f.status === "analyzing" && <Badge tone="progress"><Loader2 className="animate-spin" aria-hidden="true" />{t("Analyzing", "جارٍ التحليل")}</Badge>}
                  {f.status === "analyzed" && <Badge tone="success">{t("Analyzed", "تم التحليل")}</Badge>}
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => removeExamFile(f.id)} aria-label={t(`Remove ${f.name}`, `حذف ${f.name}`)}><Trash2 aria-hidden="true" />{t("Remove", "حذف")}</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {analyzed && style.traits && (
          <div className="mt-5 rounded-xl border bg-secondary/30 p-4">
            <h3 className="font-semibold">{t("Extracted characteristics (simulated)", "الخصائص المستخرجة (محاكاة)")}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{t("Review and edit. These are mock values, not something the system actually learned.", "راجع وعدّل. هذه قيم تجريبية وليست شيئًا تعلّمته المنصة فعليًا.")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Typical question length (words)", "الطول المعتاد للسؤال (كلمات)")}>{({ id }) => <TextInput id={id} type="number" min={5} max={300} value={style.traits!.lengthWords} onChange={(e) => setStyle({ traits: { ...style.traits!, lengthWords: Math.max(5, Number(e.target.value) || 5) } })} />}</Field>
              <div className="text-sm"><p className="mb-1.5 font-medium">{t("Detected mix", "المزيج المكتشف")}</p><p className="text-muted-foreground">MCQ 30% · {t("Math", "رياضيات")} 40% · {t("Short", "قصير")} 20% · T/F 10% — {t("Easy 30 / Medium 50 / Hard 20", "سهل 30 / متوسط 50 / صعب 20")}</p></div>
              <Field label={t("Problem-solving patterns", "أنماط حل المسائل")} className="sm:col-span-2">{({ id }) => <TextArea id={id} rows={2} value={style.traits!.patterns} onChange={(e) => setStyle({ traits: { ...style.traits!, patterns: e.target.value } })} />}</Field>
              <Field label={t("Wording and marks notes", "ملاحظات الصياغة والدرجات")} className="sm:col-span-2">{({ id }) => <TextArea id={id} rows={2} value={style.traits!.notes} onChange={(e) => setStyle({ traits: { ...style.traits!, notes: e.target.value } })} />}</Field>
            </div>
            <Button className="mt-3" onClick={() => { setStyle({ typePct: { mcq: 30, math: 40, short: 20, tf: 10 }, diffPct: { easy: 30, medium: 50, hard: 20 }, marksByType: { mcq: 2, math: 5, short: 3, tf: 1 }, wording: "scenario" }); notify(t("Detected characteristics applied to the exam structure.", "تم تطبيق الخصائص المكتشفة على هيكل الامتحان.")); }}>{t("Apply to exam structure", "تطبيق على هيكل الامتحان")}</Button>
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle title={t("Option 2 · Define the structure manually", "الخيار 2 · تحديد الهيكل يدويًا")} description={embedded ? undefined : t("This structure is used when generating exam-preparation questions and for the exam simulation.", "يُستخدم هذا الهيكل عند توليد أسئلة التحضير للامتحان وفي محاكاة الامتحان.")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("Number of questions", "عدد الأسئلة")}>{({ id }) => <TextInput id={id} type="number" min={1} max={60} value={style.totalQuestions} onChange={(e) => setStyle({ totalQuestions: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })} />}</Field>
          <Field label={t("Total marks", "إجمالي الدرجات")}>{({ id }) => <TextInput id={id} type="number" min={1} max={500} value={style.totalMarks} onChange={(e) => setStyle({ totalMarks: Math.max(1, Number(e.target.value) || 1) })} />}</Field>
          <Field label={t("Time (minutes)", "الزمن (بالدقائق)")}>{({ id }) => <TextInput id={id} type="number" min={5} max={300} value={style.minutes} onChange={(e) => setStyle({ minutes: Math.min(300, Math.max(5, Number(e.target.value) || 5)) })} />}</Field>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 font-medium">{t("Question types (%) and marks each", "أنواع الأسئلة (٪) ودرجة كل منها")}</legend>
            <div className="space-y-2">
              {qtypes.map((k) => (
                <div key={k} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm">
                  <span>{t(typeLabel[k])}</span>
                  <span className="flex items-center gap-1"><TextInput aria-label={`${t(typeLabel[k])} %`} type="number" min={0} max={100} className="h-9 w-20 text-end" value={style.typePct[k] ?? 0} onChange={(e) => setStyle({ typePct: { ...style.typePct, [k]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } })} />%</span>
                  <TextInput aria-label={`${t(typeLabel[k])} ${t("marks", "درجات")}`} type="number" min={1} max={50} className="h-9 w-16 text-end" value={style.marksByType[k] ?? 1} onChange={(e) => setStyle({ marksByType: { ...style.marksByType, [k]: Math.max(1, Number(e.target.value) || 1) } })} />
                </div>
              ))}
            </div>
            <Total value={typeTotal} name={t("Question types", "أنواع الأسئلة")} />
            <p className={`mt-1 text-sm ${marks === style.totalMarks ? "text-success" : "text-warning"}`}>{t(`Implied marks: ${num(marks)} of ${num(style.totalMarks)}`, `الدرجات الناتجة: ${num(marks)} من ${num(style.totalMarks)}`)}</p>
          </fieldset>
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-2 font-medium">{t("Difficulty distribution", "توزيع الصعوبة")}</legend>
              <div className="space-y-2">{diffs.map((d) => <Pct key={d} label={t(diffLabel[d])} value={style.diffPct[d]} onChange={(n) => setStyle({ diffPct: { ...style.diffPct, [d]: n } })} />)}</div>
              <Total value={sum(style.diffPct)} name={t("Difficulty", "الصعوبة")} />
            </fieldset>
            <fieldset>
              <legend className="mb-2 font-medium">{t("Cognitive-level distribution", "توزيع المستويات المعرفية")}</legend>
              <div className="space-y-2">{blooms.map((b) => <Pct key={b} label={t(bloomLabel[b])} value={style.bloomPct[b]} onChange={(n) => setStyle({ bloomPct: { ...style.bloomPct, [b]: n } })} />)}</div>
              <Total value={sum(style.bloomPct)} name={t("Cognitive levels", "المستويات المعرفية")} />
            </fieldset>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label={t("Wording style", "أسلوب الصياغة")}>{({ id }) => <NativeSelect id={id} value={style.wording} onChange={(e) => setStyle({ wording: e.target.value as ExamStyle["wording"] })}>{(Object.keys(wordingLabel) as ExamStyle["wording"][]).map((w) => <option key={w} value={w}>{t(wordingLabel[w])}</option>)}</NativeSelect>}</Field>
          <label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" className="size-4" checked={style.multiConcept} onChange={(e) => setStyle({ multiConcept: e.target.checked })} />{t("Include questions that cover more than one concept", "تضمين أسئلة تغطي أكثر من مفهوم")}</label>
        </div>
      </Card>
    </div>
  );
}
