"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Field, TextInput } from "@/features/instructor/portal/forms";
import { NOW } from "@/features/instructor/dashboard/data";
import { concepts as qConcepts, diffLabel, diffs, qtypes, typeLabel, type Diff, type QType, type Question } from "@/features/instructor/qbank/data";
import { useQb } from "@/features/instructor/qbank/store";
import { useQ } from "@/features/instructor/qbank/shared";
import { Section } from "@/features/instructor/analytics/ui";
import { useReports } from "./store";
import type { Page } from "./use-reports";

const chip = "flex items-center gap-2 rounded-lg border p-2.5 text-sm";
const eligibleConcepts = qConcepts.filter((c) => c.approved);

function assemble(bank: Question[], weights: Record<string, number>, total: number, ds: Diff[], ts: QType[], banks: string[]) {
  const used = new Set<string>();
  const items: Question[] = [];
  const gaps: { id: string; target: number; got: number }[] = [];
  for (const [cid, w] of Object.entries(weights)) {
    const target = Math.round((total * w) / 100);
    let left = target;
    const pool = bank.filter((q) => q.status === "approved" && banks.includes(q.bank) && ds.includes(q.difficulty) && ts.includes(q.type) && q.conceptIds.includes(cid) && !used.has(q.id)).sort((a, b) => b.marks - a.marks || a.id.localeCompare(b.id));
    for (const q of pool) if (q.marks <= left) { items.push(q); used.add(q.id); left -= q.marks; }
    gaps.push({ id: cid, target, got: target - left });
  }
  return { items, gaps };
}

/* 6. Mock exam preparation */
export function MockExam({ p }: { p: Page }) {
  const { t, num, course, exam, say, date } = p;
  const q = useQ();
  const bank = useQb((s) => s.questions);
  const saveMock = useReports((s) => s.saveMock);
  const patchMock = useReports((s) => s.patchMock);
  const removeMock = useReports((s) => s.removeMock);
  const all = useReports((s) => s.mockExams);
  const [title, setTitle] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [ds, setDs] = useState<Diff[]>([...diffs]);
  const [ts, setTs] = useState<QType[]>(["mcq", "tf", "math", "numeric", "short"]);
  const [banks, setBanks] = useState<string[]>(["exam", "practice"]);
  const [marks, setMarks] = useState(40);
  const [minutes, setMinutes] = useState(60);
  const [built, setBuilt] = useState<ReturnType<typeof assemble> | null>(null);
  const [answers, setAnswers] = useState(false);
  const [when, setWhen] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const ids = Object.keys(weights);
  const sum = ids.reduce((a, id) => a + (weights[id] || 0), 0);
  const counts = useMemo(() => Object.fromEntries(eligibleConcepts.map((c) => [c.id, bank.filter((x) => x.status === "approved" && x.conceptIds.includes(c.id)).length])), [bank]);
  const excluded = bank.filter((x) => x.status !== "approved").length;
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const setConcept = (id: string) => {
    const next = { ...weights };
    if (id in next) delete next[id]; else next[id] = 0;
    const keys = Object.keys(next);
    keys.forEach((k, i) => { next[k] = Math.floor(100 / keys.length) + (i === 0 ? 100 - Math.floor(100 / keys.length) * keys.length : 0); });
    setWeights(next); setBuilt(null);
  };
  const validate = () => {
    const e: string[] = [];
    if (!ids.length) e.push(t("Select at least one concept.", "اختر مفهومًا واحدًا على الأقل."));
    if (sum !== 100) e.push(t(`Concept weights must total 100% (now ${sum}%).`, `يجب أن يكون مجموع أوزان المفاهيم 100٪ (الآن ${num(sum)}٪).`));
    if (!ds.length || !ts.length || !banks.length) e.push(t("Choose at least one difficulty, question type and bank.", "اختر مستوى صعوبة ونوع سؤال وبنكًا واحدًا على الأقل."));
    if (marks < 5 || marks > 200) e.push(t("Total marks must be between 5 and 200.", "يجب أن يكون مجموع الدرجات بين 5 و200."));
    if (minutes < 10 || minutes > 240) e.push(t("Duration must be between 10 and 240 minutes.", "يجب أن تكون المدة بين 10 و240 دقيقة."));
    setErrors(e);
    return !e.length;
  };
  const build = () => { if (validate()) setBuilt(assemble(bank, weights, marks, ds, ts, banks)); };
  const got = built ? built.items.reduce((a, x) => a + x.marks, 0) : 0;
  const label = title.trim() || t(`Mock ${exam.title[0]}`, `${exam.title[1]} تجريبي`);
  const finish = (status: "draft" | "published" | "scheduled") => {
    if (!built || !built.items.length) { setErrors([t("Build a preview with at least one question first.", "أنشئ معاينة تحتوي على سؤال واحد على الأقل أولًا.")]); return; }
    if (status === "scheduled" && (!when || when < NOW.slice(0, 16))) { setErrors([t("Pick a future date and time to schedule.", "اختر تاريخًا ووقتًا مستقبليين للجدولة.")]); return; }
    setErrors([]);
    const items = built.items.map((x) => ({ questionId: x.id, marks: x.marks }));
    let assessmentId: string | undefined;
    if (status !== "draft") {
      const s = useQb.getState();
      assessmentId = s.createAssessment({ title: label, kind: "exam", minutes, grading: built.items.some((x) => ["short", "essay"].includes(x.type)) ? "mixed" : "auto", items });
      s.updateAssessment(assessmentId, { saved: true });
    }
    saveMock({ courseId: course.id, title: label, minutes, totalMarks: got, items, status, when: status === "scheduled" ? when : undefined, assessmentId });
    say(status === "draft" ? t(`Saved “${label}” as a draft.`, `تم حفظ «${label}» كمسودة.`) : status === "published" ? t(`Published “${label}”. It now appears in the Assessment Center.`, `تم نشر «${label}». يظهر الآن في مركز التقييم.`) : t(`Scheduled “${label}” for ${date(when)}. It appears in the Assessment Center.`, `تمت جدولة «${label}» في ${date(when)}. يظهر في مركز التقييم.`));
  };
  const mine = all.filter((m) => m.courseId === course.id);
  const byDiff = (d: Diff) => built?.items.filter((x) => x.difficulty === d).reduce((a, x) => a + x.marks, 0) ?? 0;
  return (
    <Section id="mock" title={t("Mock exam preparation", "إعداد الامتحان التجريبي")} description={t("Assemble a mock exam from approved questions in the shared Question Bank. Nothing is generated here, and pending or rejected questions are never used.", "جمّع امتحانًا تجريبيًا من الأسئلة المعتمدة في بنك الأسئلة المشترك. لا يُولَّد شيء هنا ولا تُستخدم الأسئلة المعلّقة أو المرفوضة.")}>
      <Card className="space-y-6 p-5 sm:p-6">
        <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">{t(`${bank.filter((x) => x.status === "approved").length} approved questions are available; ${excluded} pending, rejected or archived questions are excluded. The Question Bank currently holds one shared probability course, so its concepts differ from the ${course.code} concepts above.`, `يتوفر ${num(bank.filter((x) => x.status === "approved").length)} سؤالًا معتمدًا؛ واستُبعد ${num(excluded)} سؤالًا معلّقًا أو مرفوضًا أو مؤرشفًا. يحتوي بنك الأسئلة حاليًا على مقرر احتمالات مشترك واحد، لذا تختلف مفاهيمه عن مفاهيم ${course.code} أعلاه.`)}</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t("Mock exam title", "عنوان الامتحان التجريبي")}>{({ id }) => <TextInput id={id} maxLength={80} value={title} placeholder={t(`Mock ${exam.title[0]}`, `${exam.title[1]} تجريبي`)} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <Field label={t("Total marks", "مجموع الدرجات")}>{({ id }) => <TextInput id={id} type="number" min={5} max={200} value={marks} onChange={(e) => { setMarks(Number(e.target.value)); setBuilt(null); }} />}</Field>
          <Field label={t("Duration (minutes)", "المدة (بالدقائق)")}>{({ id }) => <TextInput id={id} type="number" min={10} max={240} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />}</Field>
        </div>
        <fieldset><legend className="mb-2 flex flex-wrap items-center gap-3 text-sm font-medium">{t("Concepts and weights", "المفاهيم والأوزان")}<span className={cn("text-xs font-normal", sum === 100 ? "text-success-ink" : "text-danger")}>{t(`Total ${sum}%`, `المجموع ${num(sum)}٪`)}</span></legend>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{eligibleConcepts.map((c) => (
            <div key={c.id} className={chip}>
              <input type="checkbox" className="size-4 accent-[var(--color-primary)]" id={`mc-${c.id}`} checked={c.id in weights} onChange={() => setConcept(c.id)} />
              <label htmlFor={`mc-${c.id}`} className="flex-1">{t(c.en, c.ar)}<span className="block text-xs text-muted-foreground">{t(`${counts[c.id]} approved`, `${num(counts[c.id])} معتمد`)}</span></label>
              {c.id in weights && <input type="number" min={0} max={100} aria-label={t(`Weight of ${c.en} (%)`, `وزن ${c.ar} (٪)`)} className="h-9 w-16 rounded-md border bg-background px-2 text-sm tabular-nums" value={weights[c.id]} onChange={(e) => { setWeights({ ...weights, [c.id]: Number(e.target.value) }); setBuilt(null); }} />}
            </div>
          ))}</div>
        </fieldset>
        <div className="grid gap-6 lg:grid-cols-3">
          <fieldset><legend className="mb-2 text-sm font-medium">{t("Difficulty", "الصعوبة")}</legend><div className="flex flex-wrap gap-2">{diffs.map((d) => <label key={d} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={ds.includes(d)} onChange={() => { toggle(ds, d, setDs); setBuilt(null); }} />{t(diffLabel[d])}</label>)}</div></fieldset>
          <fieldset className="lg:col-span-1"><legend className="mb-2 text-sm font-medium">{t("Question types", "أنواع الأسئلة")}</legend><div className="flex flex-wrap gap-2">{qtypes.map((x) => <label key={x} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={ts.includes(x)} onChange={() => { toggle(ts, x, setTs); setBuilt(null); }} />{t(typeLabel[x])}</label>)}</div></fieldset>
          <fieldset><legend className="mb-2 text-sm font-medium">{t("Question Bank source", "مصدر بنك الأسئلة")}</legend><div className="flex flex-wrap gap-2">{([["exam", t("Exam preparation bank", "بنك التحضير للامتحان")], ["practice", t("Practice bank", "بنك التدريب")]] as const).map(([id, l]) => <label key={id} className={chip}><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={banks.includes(id)} onChange={() => { toggle(banks, id, setBanks); setBuilt(null); }} />{l}</label>)}</div></fieldset>
        </div>
        {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 ps-5 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <div className="flex flex-wrap gap-2"><Button onClick={build}>{t("Preview mock exam", "معاينة الامتحان التجريبي")}</Button></div>

        {built && (
          <div className="space-y-4 border-t pt-6" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-lg font-semibold">{label}</h3><p className="text-sm text-muted-foreground">{t(`${built.items.length} questions · ${got} of ${marks} marks · ${minutes} minutes`, `${num(built.items.length)} سؤالًا · ${num(got)} من ${num(marks)} درجة · ${num(minutes)} دقيقة`)}</p></div>
              <Button variant="outline" size="sm" onClick={() => setAnswers(!answers)}>{answers ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{answers ? t("Hide model answers", "إخفاء الإجابات النموذجية") : t("Show model answers", "إظهار الإجابات النموذجية")}</Button>
            </div>
            {got !== marks && <p role="status" className="rounded-lg bg-warning-soft p-3 text-sm text-warning-ink">{t(`Only ${got} of ${marks} marks could be filled from approved questions with these settings. Add difficulties, types or banks, or lower the total.`, `أمكن ملء ${num(got)} من ${num(marks)} درجة فقط من الأسئلة المعتمدة بهذه الإعدادات. أضف مستويات أو أنواعًا أو بنوكًا أو خفّض المجموع.`)}</p>}
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">{built.gaps.map((g) => <li key={g.id} className="rounded-lg border p-3"><span className="font-medium">{t(qConcepts.find((c) => c.id === g.id)!.en, qConcepts.find((c) => c.id === g.id)!.ar)}</span><span className={cn("block tabular-nums", g.got < g.target ? "text-warning-ink" : "text-success-ink")}>{num(g.got)} / {num(g.target)} {t("marks", "درجات")}</span></li>)}</ul>
            <p className="text-xs text-muted-foreground">{t(`Marks by difficulty — easy ${byDiff("easy")}, medium ${byDiff("medium")}, hard ${byDiff("hard")}.`, `الدرجات حسب الصعوبة — سهل ${num(byDiff("easy"))}، متوسط ${num(byDiff("medium"))}، صعب ${num(byDiff("hard"))}.`)}</p>
            <ol className="space-y-3">{built.items.map((x, i) => (
              <li key={x.id} className="rounded-xl border p-4 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2"><strong>{t(`Q${i + 1}`, `س${num(i + 1)}`)}</strong><Badge tone="neutral">{t(typeLabel[x.type])}</Badge><Badge tone="neutral">{t(diffLabel[x.difficulty])}</Badge><Badge tone="brand">{num(x.marks)} {t("marks", "درجات")}</Badge><span className="text-xs text-muted-foreground">{x.id} · {q.conceptName(x.conceptIds[0])}</span></div>
                <p dir="auto">{q.text(x.text)}</p>
                {x.options.length > 0 && <ul className="mt-2 space-y-1 ps-4" dir="auto">{x.options.map((o) => <li key={o.id} className={cn("list-disc", answers && o.correct && "font-semibold text-success-ink")}>{q.text(o.text)}</li>)}</ul>}
                {answers && !x.options.length && <p className="mt-2 rounded-lg bg-secondary/50 p-2" dir="auto"><strong>{t("Model answer: ", "الإجابة النموذجية: ")}</strong>{x.pairs.length ? x.pairs.map((pp) => `${q.text(pp.left)} → ${q.text(pp.right)}`).join(" · ") : q.text(x.answer)}</p>}
              </li>
            ))}</ol>
            <div className="flex flex-wrap items-end gap-3 rounded-xl bg-secondary/50 p-4">
              <Button variant="outline" onClick={() => finish("draft")}>{t("Save as draft", "حفظ كمسودة")}</Button>
              <Button onClick={() => finish("published")}>{t("Publish now", "نشر الآن")}</Button>
              <label className="grid gap-1 text-xs text-muted-foreground">{t("Schedule for", "جدولة في")}<input type="datetime-local" min={NOW.slice(0, 16)} value={when} onChange={(e) => setWhen(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground" /></label>
              <Button variant="outline" onClick={() => finish("scheduled")}>{t("Schedule", "جدولة")}</Button>
            </div>
          </div>
        )}
      </Card>
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("Saved mock exams", "الامتحانات التجريبية المحفوظة")} ({num(mine.length)})</h3>
        {mine.length ? <ul className="grid gap-3 md:grid-cols-2">{mine.map((m) => (
          <li key={m.id}><Card className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><p className="font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.id} · {t(`${m.items.length} questions · ${m.totalMarks} marks · ${m.minutes} min`, `${num(m.items.length)} أسئلة · ${num(m.totalMarks)} درجة · ${num(m.minutes)} دقيقة`)}{m.when ? ` · ${date(m.when)}` : ""}</p></div>
            <div className="flex items-center gap-2"><Badge tone={m.status === "published" ? "success" : m.status === "scheduled" ? "progress" : "neutral"}>{m.status === "published" ? t("Published", "منشور") : m.status === "scheduled" ? t("Scheduled", "مجدول") : t("Draft", "مسودة")}</Badge>
              {m.status === "draft" && <Button size="sm" onClick={() => { const s = useQb.getState(); const id = s.createAssessment({ title: m.title, kind: "exam", minutes: m.minutes, grading: "mixed", items: m.items }); s.updateAssessment(id, { saved: true }); patchMock(m.id, { status: "published", assessmentId: id }); say(t(`Published “${m.title}”.`, `تم نشر «${m.title}».`)); }}>{t("Publish", "نشر")}</Button>}
              <Button size="icon-sm" variant="ghost" className="text-danger" onClick={() => { removeMock(m.id); say(t(`Removed ${m.id}. Any copy already in the Assessment Center stays there.`, `تمت إزالة ${m.id}. تبقى أي نسخة موجودة في مركز التقييم.`)); }} aria-label={t(`Remove ${m.id}`, `إزالة ${m.id}`)}><Trash2 /></Button></div>
          </Card></li>
        ))}</ul> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("No mock exams saved yet.", "لا امتحانات تجريبية محفوظة بعد.")}</p>}
      </div>
    </Section>
  );
}
