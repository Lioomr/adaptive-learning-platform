"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Field, NativeSelect, TextInput } from "@/features/instructor/portal/forms";
import {
  blooms, bloomLabel, concepts, conceptOf, diffs, diffLabel, lectures, qtypes, typeLabel, langLabel,
  type Bank, type Bloom, type Diff, type Feedback, type Lang, type QType, type Question,
} from "./data";
import { generate, overall, type GenSpec } from "./generator";
import { fullFeedback, useQb } from "./store";
import { ExamStyleEditor, styleIssues } from "./exam-style";
import { PracticePreview, AnswerInput, useQ } from "./shared";

type Mode = "individual" | "lectures" | "all";
const MAX = 60;
const approved = concepts.filter((c) => c.approved);

/** Expand percentages into n labels using the largest-remainder rule, then mix them. */
function expand<K extends string>(pct: Partial<Record<K, number>>, n: number, seed: number): K[] {
  const keys = (Object.keys(pct) as K[]).filter((k) => (pct[k] ?? 0) > 0);
  if (!keys.length) return [];
  const raw = keys.map((k) => ({ k, v: ((pct[k] ?? 0) / 100) * n }));
  const base = raw.map((r) => ({ ...r, n: Math.floor(r.v) }));
  let left = n - base.reduce((a, b) => a + b.n, 0);
  [...base].sort((a, b) => b.v - b.n - (a.v - a.n)).forEach((b) => { if (left-- > 0) b.n++; });
  const list = base.flatMap((b) => Array<K>(b.n).fill(b.k));
  let s = seed;
  for (let i = list.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; const j = s % (i + 1); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}
const balance = (total: number): Record<Diff, number> => {
  const easy = Math.round(total * 0.3), hard = Math.round(total * 0.2);
  return { easy, medium: Math.max(0, total - easy - hard), hard };
};

export function GenerateWizard({ open, onClose, initialBank }: { open: boolean; onClose: () => void; initialBank: Bank }) {
  const { t, num, language, text, conceptName, lectureName } = useQ();
  const style = useQb((s) => s.style);
  const [step, setStep] = useState(0);
  const [bank, setBank] = useState<Bank>(initialBank);
  const [mode, setMode] = useState<Mode>("individual");
  const [chosen, setChosen] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [lectureFilter, setLectureFilter] = useState("all");
  const [types, setTypes] = useState<QType[]>(["mcq", "math"]);
  const [typeMarks, setTypeMarks] = useState<Partial<Record<QType, number>>>({});
  const [defaultMarks, setDefaultMarks] = useState(2);
  const [total, setTotal] = useState(12);
  const [diff, setDiff] = useState<Record<Diff, number>>(balance(12));
  const [lang, setLang] = useState<Lang>("both");
  const [levels, setLevels] = useState<Bloom[]>(["understand", "apply"]);
  const [learning, setLearning] = useState({ misconceptions: true, understanding: true, application: true, prerequisite: false });
  const [feedback, setFeedback] = useState<Feedback>(fullFeedback);
  const [examCount, setExamCount] = useState(style.totalQuestions);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [stage, setStage] = useState(0);
  const [summary, setSummary] = useState({ passed: 0, review: 0, failed: 0, count: 0 });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const reset = () => { setStep(0); setPhase("idle"); setStage(0); setChosen([]); setSearch(""); setLectureFilter("all"); setMode("individual"); setBank(initialBank); setExamCount(useQb.getState().style.totalQuestions); };
  const visible = approved.filter((c) => (lectureFilter === "all" || c.lecture === lectureFilter) && `${c.en} ${c.ar}`.toLowerCase().includes(search.trim().toLowerCase()));
  const setMany = (ids: string[], on: boolean) => setChosen((cur) => (on ? [...new Set([...cur, ...ids])] : cur.filter((x) => !ids.includes(x))));
  const perConcept = chosen.length ? Math.max(1, Math.round(total / chosen.length)) : 0;
  const diffSum = diffs.reduce((a, d) => a + diff[d], 0);
  const issues = styleIssues(style);
  const count = bank === "practice" ? total : examCount;
  const practiceOk = types.length > 0 && levels.length > 0 && total >= 1 && diffSum === total;
  const examOk = issues.length === 0 && examCount >= 1;
  const stepOk = [true, chosen.length > 0, bank === "practice" ? practiceOk : examOk, true][step];
  const tooMany = count > MAX;

  /** Turn the configuration into one spec per question. */
  function plan(seedBase: number): GenSpec[] {
    const n = Math.min(count, MAX);
    const ids = chosen.length ? chosen : [approved[0].id];
    const prereqs = learning.prerequisite && bank === "practice" ? [...new Set(ids.flatMap((id) => conceptOf(id)?.prereq ?? []))].filter((p) => !ids.includes(p)) : [];
    const typeList = bank === "practice" ? Array.from({ length: n }, (_, i) => types[i % types.length]) : expand(style.typePct, n, 11);
    const diffList = bank === "practice" ? (["easy", "medium", "hard"] as Diff[]).flatMap((d) => Array<Diff>(diff[d]).fill(d)).slice(0, n) : expand(style.diffPct, n, 23);
    const bloomList = bank === "practice" ? Array.from({ length: n }, (_, i) => levels[i % levels.length]) : expand(style.bloomPct, n, 37);
    return Array.from({ length: n }, (_, i) => {
      const type = typeList[i] ?? "mcq";
      const prereq = prereqs.length > 0 && i % 5 === 4;
      const main = prereq ? prereqs[(i / 5) | 0 % prereqs.length] ?? prereqs[0] : ids[i % ids.length];
      const second = bank === "exam" && style.multiConcept && ids.length > 1 && (type === "short" || type === "mcq") && i % 3 === 0 ? ids[(i + 1) % ids.length] : undefined;
      return {
        bank, type, difficulty: diffList[i] ?? "medium", bloom: bloomList[i] ?? "understand",
        marks: bank === "practice" ? typeMarks[type] ?? defaultMarks : style.marksByType[type] ?? 1,
        lang, conceptIds: second && second !== main ? [main, second] : [main],
        feedback: bank === "practice" ? feedback : { showCorrect: false, explanations: false, explainWrong: false, hints: false, steps: false, multipleAttempts: false },
        seed: seedBase + i * 17, targetMisconceptions: bank === "practice" ? learning.misconceptions : false,
        wording: bank === "exam" ? style.wording : undefined, prerequisite: prereq,
      };
    });
  }
  const sample = useMemo<Question | null>(() => {
    if (step < 2 || !chosen.length) return null;
    const first = plan(7)[0];
    return first ? generate({ ...first, seed: 7 }, "preview") : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, chosen, bank, types, levels, lang, feedback, learning, typeMarks, defaultMarks, style, total, examCount]);

  function run() {
    if (tooMany) return;
    setPhase("running"); setStage(0);
    let s = 0;
    timer.current = setInterval(() => {
      s++;
      if (s < 4) return setStage(s);
      clearInterval(timer.current!);
      const store = useQb.getState();
      const specs = plan(Date.now() % 100000);
      const ids = store.nextIds(bank, specs.length);
      const made: Question[] = [];
      specs.forEach((sp, i) => {
        // Retry with a new variant a few times so the batch does not repeat existing questions.
        let q = generate(sp, ids[i], [...store.questions, ...made]);
        for (let tries = 1; tries <= 8 && q.validation.duplicate.status !== "passed"; tries++) q = generate({ ...sp, seed: sp.seed + tries * 1009 }, ids[i], [...store.questions, ...made]);
        made.push(q);
      });
      store.addGenerated(made);
      const o = made.map((q) => overall(q.validation));
      setSummary({ count: made.length, passed: o.filter((x) => x === "passed").length, review: o.filter((x) => x === "review").length, failed: o.filter((x) => x === "failed").length });
      store.setBank(bank);
      store.notify(t(`${num(made.length)} candidate questions are waiting in Pending Review.`, `${num(made.length)} سؤالًا مرشحًا بانتظار المراجعة.`));
      setPhase("done");
    }, 700);
  }
  const stages = [t("Selecting source evidence", "اختيار أدلة المصدر"), t("Drafting questions", "صياغة الأسئلة"), t("Running quality checks", "تشغيل فحوصات الجودة"), t("Queueing for your review", "وضع الأسئلة في طابور مراجعتك")];
  const stepNames = [t("Destination", "الوجهة"), t("Concepts", "المفاهيم"), t("Configure", "الإعداد"), t("Review and generate", "المراجعة والتوليد")];
  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o && phase !== "running") { onClose(); reset(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content dir={language === "ar" ? "rtl" : "ltr"} aria-describedby={undefined} className="fixed start-1/2 top-1/2 z-50 flex max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-card shadow-raised rtl:translate-x-1/2">
          <div className="border-b p-5 sm:px-8">
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t("Close", "إغلاق")} disabled={phase === "running"}><X /></Button></Dialog.Close>
            <Dialog.Title className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="size-5 text-primary" aria-hidden="true" />{t("Generate questions", "توليد الأسئلة")}</Dialog.Title>
            <ol className="mt-3 flex flex-wrap gap-2 text-sm" aria-label={t("Steps", "الخطوات")}>
              {stepNames.map((n, i) => <li key={n} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2 rounded-full border px-3 py-1", i === step ? "border-primary bg-secondary text-primary" : i < step ? "text-success" : "text-muted-foreground")}><span className="tabular-nums">{num(i + 1)}</span>{n}</li>)}
            </ol>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:px-8">
            {phase !== "idle" ? (
              <div className="mx-auto max-w-xl py-8 text-center" aria-live="polite">
                {phase === "running" ? (
                  <>
                    <Badge tone="progress">{t("Simulated generation", "توليد محاكى")}</Badge>
                    <h3 className="mt-3 text-lg font-semibold">{stages[stage]}…</h3>
                    <Progress className="mt-4" value={((stage + 1) / 4) * 100} aria-label={t("Generation progress", "تقدم التوليد")} />
                    <p className="mt-3 text-sm text-muted-foreground">{t("This is a mock workflow. No AI model is running.", "هذا مسار تجريبي. لا يعمل أي نموذج ذكاء اصطناعي.")}</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden="true" />
                    <h3 className="mt-3 text-lg font-semibold">{t(`${num(summary.count)} candidate questions created`, `تم إنشاء ${num(summary.count)} سؤالًا مرشحًا`)}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t(`Simulated checks: ${num(summary.passed)} passed, ${num(summary.review)} need review, ${num(summary.failed)} failed. None are approved yet; every question needs your decision.`, `الفحوصات المحاكاة: ${num(summary.passed)} ناجحة و${num(summary.review)} تحتاج مراجعة و${num(summary.failed)} فاشلة. لم يُعتمد أي سؤال بعد؛ كل سؤال يحتاج قرارك.`)}</p>
                    <Button className="mt-5" onClick={() => { useQb.getState().setTab(bank, "pending"); onClose(); reset(); }}>{t("Open Pending Review", "فتح قائمة المراجعة")}</Button>
                  </>
                )}
              </div>
            ) : step === 0 ? (
              <div className="grid gap-4 md:grid-cols-2" role="radiogroup" aria-label={t("Destination bank", "بنك الوجهة")}>
                {([["practice", t("Practice Question Bank", "بنك أسئلة التدريب"), t("Learning-focused questions with rich feedback to build understanding and mastery of each concept.", "أسئلة تعليمية بتغذية راجعة غنية لبناء الفهم وإتقان كل مفهوم."), "bg-info-soft"], ["exam", t("Exam Preparation Question Bank", "بنك أسئلة التحضير للامتحان"), t("Questions that follow your examination style: formats, mark weights and problem patterns, answered without immediate feedback.", "أسئلة تتبع أسلوب امتحانك: الصيغ وأوزان الدرجات وأنماط المسائل، دون تغذية راجعة فورية."), "bg-ai-soft"]] as const).map(([id, title, body, bg]) => (
                  <label key={id} className={cn("cursor-pointer rounded-2xl border-2 p-5 transition-colors", bank === id ? "border-primary bg-secondary/40" : "hover:border-primary/40")}>
                    <input type="radio" name="bank" className="sr-only" checked={bank === id} onChange={() => setBank(id)} />
                    <span className={cn("mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold", bg)}>{id === "practice" ? t("Learn", "تعلّم") : t("Exam style", "أسلوب الامتحان")}</span>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                    {bank === id && <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary"><Check className="size-4" aria-hidden="true" />{t("Selected", "محدد")}</p>}
                  </label>
                ))}
              </div>
            ) : step === 1 ? (
              <div>
                <div role="tablist" aria-label={t("Coverage mode", "نمط التغطية")} className="mb-4 inline-flex flex-wrap rounded-xl border bg-muted/50 p-1">
                  {([["individual", t("Individual concepts", "مفاهيم محددة")], ["lectures", t("Entire lectures", "محاضرات كاملة")], ["all", t("All approved concepts", "كل المفاهيم المعتمدة")]] as const).map(([id, label]) => (
                    <button key={id} role="tab" type="button" aria-selected={mode === id} onClick={() => { setMode(id); if (id === "all") setChosen(approved.map((c) => c.id)); }} className={cn("min-h-10 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", mode === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground")}>{label}</button>
                  ))}
                </div>
                {mode === "lectures" ? (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {lectures.map((l) => {
                      const ids = approved.filter((c) => c.lecture === l.id).map((c) => c.id);
                      const all = ids.length > 0 && ids.every((id) => chosen.includes(id));
                      return (
                        <li key={l.id}><label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm", all && "border-primary bg-secondary/40")}>
                          <input type="checkbox" className="mt-1 size-4" checked={all} onChange={(e) => setMany(ids, e.target.checked)} />
                          <span><strong>{lectureName(l.id)}</strong> · {text(l.title)}<br /><span className="text-muted-foreground">{ids.map(conceptName).join(", ")}</span></span>
                        </label></li>
                      );
                    })}
                  </ul>
                ) : (
                  <>
                    <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_16rem]">
                      <TextInput aria-label={t("Search concepts", "ابحث عن مفهوم")} placeholder={t("Search concepts", "ابحث عن مفهوم")} value={search} onChange={(e) => setSearch(e.target.value)} />
                      <NativeSelect aria-label={t("Filter by lecture", "تصفية حسب المحاضرة")} value={lectureFilter} onChange={(e) => setLectureFilter(e.target.value)}>
                        <option value="all">{t("All lectures", "كل المحاضرات")}</option>
                        {lectures.map((l) => <option key={l.id} value={l.id}>{lectureName(l.id)} · {text(l.title)}</option>)}
                      </NativeSelect>
                    </div>
                    <div className="mb-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setMany(visible.map((c) => c.id), true)}>{t("Select shown", "تحديد المعروض")}</Button><Button size="sm" variant="ghost" onClick={() => setChosen([])}>{t("Clear", "مسح")}</Button></div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {visible.map((c) => (
                        <li key={c.id}><label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm", chosen.includes(c.id) && "border-primary bg-secondary/40")}>
                          <input type="checkbox" className="mt-1 size-4" checked={chosen.includes(c.id)} onChange={(e) => setMany([c.id], e.target.checked)} />
                          <span><strong>{language === "ar" ? c.ar : c.en}</strong><br /><span className="text-muted-foreground">{lectureName(c.lecture)} · {t(`Slide ${num(c.slide)}`, `الشريحة ${num(c.slide)}`)}</span></span>
                        </label></li>
                      ))}
                      {concepts.filter((c) => !c.approved).map((c) => (
                        <li key={c.id}><div className="flex items-start gap-3 rounded-xl border border-dashed p-3 text-sm opacity-70"><input type="checkbox" disabled className="mt-1 size-4" aria-label={c.en} /><span><strong>{language === "ar" ? c.ar : c.en}</strong> <Badge tone="warning">{t("Not approved", "غير معتمد")}</Badge><br /><span className="text-muted-foreground">{t("Unapproved concepts cannot be used as generation targets.", "لا يمكن استخدام المفاهيم غير المعتمدة أهدافًا للتوليد.")}</span></span></div></li>
                      ))}
                    </ul>
                    {!visible.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{t("No approved concepts match.", "لا توجد مفاهيم معتمدة مطابقة.")}</p>}
                  </>
                )}
                <p className="mt-4 text-sm" aria-live="polite"><strong>{num(chosen.length)}</strong> {t("concepts selected", "مفاهيم محددة")}{chosen.length === 0 && <span className="ms-2 text-danger">{t("Select at least one approved concept.", "اختر مفهومًا معتمدًا واحدًا على الأقل.")}</span>}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{chosen.map((id) => <Badge key={id} tone="brand">{conceptName(id)} · {lectureName(conceptOf(id)!.lecture)}</Badge>)}</div>
              </div>
            ) : step === 2 && bank === "practice" ? (
              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-6">
                  <fieldset><legend className="mb-2 font-medium">{t("Question types", "أنواع الأسئلة")}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {qtypes.map((k) => (
                        <div key={k} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                          <label className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={types.includes(k)} onChange={() => toggle(types, k, setTypes)} />{t(typeLabel[k])}</label>
                          <label className="flex items-center gap-1 text-xs text-muted-foreground">{t("marks", "درجات")}<TextInput aria-label={`${t(typeLabel[k])} ${t("marks", "درجات")}`} type="number" min={1} max={50} className="h-8 w-14 px-1.5 text-center" value={typeMarks[k] ?? defaultMarks} onChange={(e) => setTypeMarks({ ...typeMarks, [k]: Math.max(1, Number(e.target.value) || 1) })} /></label>
                        </div>
                      ))}
                    </div>
                    {!types.length && <p role="alert" className="mt-1 text-sm text-danger">{t("Choose at least one type.", "اختر نوعًا واحدًا على الأقل.")}</p>}
                  </fieldset>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={t("Total questions", "إجمالي الأسئلة")} error={tooMany ? t(`Maximum ${MAX} per batch.`, `الحد الأقصى ${MAX} في الدفعة.`) : undefined}>{({ id }) => <TextInput id={id} type="number" min={1} value={total} onChange={(e) => { const n = Math.max(1, Number(e.target.value) || 1); setTotal(n); setDiff(balance(n)); }} />}</Field>
                    <Field label={t("Per concept", "لكل مفهوم")} hint={chosen.length ? undefined : t("Select concepts first", "حدد المفاهيم أولًا")}>{({ id }) => <TextInput id={id} type="number" min={1} disabled={!chosen.length} value={perConcept} onChange={(e) => { const n = Math.max(1, Number(e.target.value) || 1) * chosen.length; setTotal(n); setDiff(balance(n)); }} />}</Field>
                    <Field label={t("Default marks", "الدرجات الافتراضية")}>{({ id }) => <TextInput id={id} type="number" min={1} max={50} value={defaultMarks} onChange={(e) => setDefaultMarks(Math.max(1, Number(e.target.value) || 1))} />}</Field>
                  </div>
                  <fieldset><legend className="mb-2 font-medium">{t("Questions per difficulty", "الأسئلة حسب الصعوبة")}</legend>
                    <div className="grid grid-cols-3 gap-3">{diffs.map((d) => <Field key={d} label={t(diffLabel[d])}>{({ id }) => <TextInput id={id} type="number" min={0} value={diff[d]} onChange={(e) => setDiff({ ...diff, [d]: Math.max(0, Number(e.target.value) || 0) })} />}</Field>)}</div>
                    <p role={diffSum === total ? undefined : "alert"} className={cn("mt-2 flex flex-wrap items-center gap-2 text-sm", diffSum === total ? "text-success" : "text-danger")}>
                      {diffSum === total ? t("Difficulty counts match the total.", "أعداد الصعوبة تطابق الإجمالي.") : t(`Counts add up to ${num(diffSum)}, not ${num(total)}.`, `مجموع الأعداد ${num(diffSum)} وليس ${num(total)}.`)}
                      <Button size="sm" variant="outline" onClick={() => setDiff(balance(total))}>{t("Auto-balance 30/50/20", "موازنة تلقائية 30/50/20")}</Button>
                    </p>
                  </fieldset>
                  <fieldset><legend className="mb-2 font-medium">{t("Cognitive levels", "المستويات المعرفية")}</legend>
                    <div className="flex flex-wrap gap-2">{blooms.map((b) => <label key={b} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm", levels.includes(b) && "border-primary bg-secondary/50")}><input type="checkbox" className="size-4" checked={levels.includes(b)} onChange={() => toggle(levels, b, setLevels)} />{t(bloomLabel[b])}</label>)}</div>
                    {!levels.length && <p role="alert" className="mt-1 text-sm text-danger">{t("Choose at least one level.", "اختر مستوى واحدًا على الأقل.")}</p>}
                  </fieldset>
                  <Field label={t("Language", "اللغة")}>{({ id }) => <NativeSelect id={id} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>{(["en", "ar", "both"] as Lang[]).map((l) => <option key={l} value={l}>{t(langLabel[l])}</option>)}</NativeSelect>}</Field>
                  <fieldset><legend className="mb-2 font-medium">{t("Learning-focused characteristics", "خصائص تعليمية")}</legend>
                    <div className="space-y-2 text-sm">
                      <p className="rounded-lg bg-muted/50 p-2.5">{t("Concept-specific questions across several difficulty levels (always on).", "أسئلة خاصة بالمفهوم عبر مستويات صعوبة متعددة (دائمًا).")}</p>
                      {([["misconceptions", t("Target common misconceptions", "استهداف المفاهيم الخاطئة الشائعة")], ["understanding", t("Test understanding, not just memorization", "اختبار الفهم لا الحفظ فقط")], ["application", t("Include application and problem-solving", "تضمين التطبيق وحل المسائل")], ["prerequisite", t("Also target prerequisite knowledge (explicit)", "استهداف المعرفة السابقة أيضًا (صريح)")]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={learning[k]} onChange={(e) => setLearning({ ...learning, [k]: e.target.checked })} />{label}</label>)}
                    </div>
                  </fieldset>
                  <fieldset><legend className="mb-2 font-medium">{t("Feedback students will see", "التغذية الراجعة التي سيراها الطلاب")}</legend>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {([["showCorrect", t("Show correct answers", "إظهار الإجابات الصحيحة")], ["explanations", t("Detailed explanations", "شروح مفصلة")], ["explainWrong", t("Explain why wrong options are wrong", "شرح سبب خطأ الخيارات الخاطئة")], ["hints", t("Hints", "تلميحات")], ["steps", t("Step-by-step math solutions", "حلول رياضية خطوة بخطوة")], ["multipleAttempts", t("Allow multiple attempts", "السماح بمحاولات متعددة")]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={feedback[k]} onChange={(e) => setFeedback({ ...feedback, [k]: e.target.checked })} />{label}</label>)}
                    </div>
                  </fieldset>
                </div>
                <aside className="lg:sticky lg:top-0 lg:self-start">
                  <p className="mb-2 text-sm font-medium">{t("Live student preview", "معاينة الطالب المباشرة")}</p>
                  {sample && <PracticePreview key={JSON.stringify(feedback) + sample.id + lang + types.join()} q={sample} feedback={feedback} />}
                </aside>
              </div>
            ) : step === 2 ? (
              <div className="space-y-5">
                <p className="rounded-xl bg-secondary/40 p-3 text-sm">{t("Exam-preparation questions follow the structure below (the same one used on the Exam Preparation tab). Style, not just difficulty, shapes them.", "تتبع أسئلة التحضير للامتحان الهيكل أدناه (نفسه المستخدم في تبويب التحضير للامتحان). الأسلوب لا الصعوبة وحدها هو ما يشكّلها.")}</p>
                <ExamStyleEditor embedded />
                <Card className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field label={t("Questions to generate in this batch", "عدد الأسئلة في هذه الدفعة")} error={tooMany ? t(`Maximum ${MAX} per batch.`, `الحد الأقصى ${MAX} في الدفعة.`) : undefined}>{({ id }) => <TextInput id={id} type="number" min={1} value={examCount} onChange={(e) => setExamCount(Math.max(1, Number(e.target.value) || 1))} />}</Field>
                  <Field label={t("Language", "اللغة")}>{({ id }) => <NativeSelect id={id} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>{(["en", "ar", "both"] as Lang[]).map((l) => <option key={l} value={l}>{t(langLabel[l])}</option>)}</NativeSelect>}</Field>
                </Card>
                {issues.length > 0 && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-danger"><AlertTriangle className="size-4" aria-hidden="true" />{t("Fix the distributions that do not total 100% to continue.", "أصلح التوزيعات التي لا يبلغ مجموعها 100% للمتابعة.")}</p>}
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="space-y-2 p-5 text-sm">
                  <h3 className="font-semibold">{t("Summary", "الملخص")}</h3>
                  <p>{bank === "practice" ? t("Practice Question Bank", "بنك أسئلة التدريب") : t("Exam Preparation Question Bank", "بنك أسئلة التحضير للامتحان")}</p>
                  <p>{t(`${num(Math.min(count, MAX))} questions · ${num(chosen.length)} concepts · ${t(langLabel[lang])}`, `${num(Math.min(count, MAX))} سؤالًا · ${num(chosen.length)} مفهومًا · ${t(langLabel[lang])}`)}</p>
                  <p className="text-muted-foreground">{bank === "practice" ? `${types.map((k) => t(typeLabel[k])).join(" · ")} — ${levels.map((b) => t(bloomLabel[b])).join(" · ")}` : `${qtypes.filter((k) => (style.typePct[k] ?? 0) > 0).map((k) => `${t(typeLabel[k])} ${style.typePct[k]}%`).join(" · ")}`}</p>
                  <p className="text-muted-foreground">{t("Every generated question goes to Pending Review. Nothing is approved automatically.", "كل سؤال مولَّد يذهب إلى المراجعة. لا شيء يُعتمد تلقائيًا.")}</p>
                  {tooMany && <p role="alert" className="flex items-center gap-2 font-medium text-danger"><AlertTriangle className="size-4" aria-hidden="true" />{t(`Too many questions for one batch (max ${MAX}). Reduce the number to continue.`, `عدد الأسئلة كبير جدًا للدفعة (الحد الأقصى ${MAX}). قلّل العدد للمتابعة.`)}</p>}
                </Card>
                <div>
                  <p className="mb-2 text-sm font-medium">{bank === "practice" ? t("Sample student view", "عرض طالب نموذجي") : t("Sample in exam format", "نموذج بصيغة الامتحان")}</p>
                  {sample && (bank === "practice" ? <PracticePreview key={sample.id + lang} q={sample} feedback={feedback} /> : (
                    <div dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-2xl border bg-card p-5">
                      <p className="mb-2 flex justify-between text-sm font-semibold"><span>{t("Question 1", "السؤال 1")}</span><span>{num(sample.marks)} {t("marks", "درجات")}</span></p>
                      <p className="mb-3 leading-7">{text(sample.text, lang === "both" ? undefined : lang)}</p>
                      <AnswerInput q={sample} value={undefined} onChange={() => undefined} lang={lang === "ar" ? "ar" : language === "ar" && lang === "both" ? "ar" : "en"} />
                      <p className="mt-3 text-xs text-muted-foreground">{t("No hints, answers or feedback are shown in exam format.", "لا تُعرض تلميحات أو إجابات أو تغذية راجعة بصيغة الامتحان.")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {phase === "idle" && (
            <div className="flex items-center justify-between gap-2 border-t p-4 sm:px-8">
              <Button variant="outline" onClick={() => (step === 0 ? (onClose(), reset()) : setStep(step - 1))}><ArrowLeft className="rtl:-scale-x-100" aria-hidden="true" />{step === 0 ? t("Cancel", "إلغاء") : t("Back", "السابق")}</Button>
              {step < 3 ? <Button disabled={!stepOk} onClick={() => setStep(step + 1)}>{t("Next", "التالي")}<ArrowRight className="rtl:-scale-x-100" aria-hidden="true" /></Button> : <Button disabled={tooMany} onClick={run}><Sparkles aria-hidden="true" />{t("Generate (simulated)", "توليد (محاكاة)")}</Button>}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
