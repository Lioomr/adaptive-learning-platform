"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQb } from "./store";
import { AnswerInput, isCorrect, useQ, type Ans } from "./shared";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Student-facing mock exam. No hints, answers or feedback until the results screen. */
export function ExamSimulation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, text, language, num } = useQ();
  const style = useQb((s) => s.style);
  const all = useQb((s) => s.questions);
  const qs = useMemo(() => all.filter((q) => q.bank === "exam" && q.status === "approved").sort((a, b) => a.id.localeCompare(b.id)).slice(0, style.totalQuestions), [all, style.totalQuestions]);
  const [started, setPhase] = useState<"intro" | "exam" | "review" | "results">("intro");
  const [i, setI] = useState(0);
  const [ans, setAns] = useState<Record<string, Ans>>({});
  const [flag, setFlag] = useState<string[]>([]);
  const [left, setLeft] = useState(style.minutes * 60);
    const [show, setShow] = useState({ score: true, marks: true, correct: false, explanations: false });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reset = () => { setPhase("intro"); setI(0); setAns({}); setFlag([]); setLeft(style.minutes * 60); };
  const timeUp = started === "exam" && left <= 0;
  const phase = timeUp ? "results" : started;
  useEffect(() => {
    if (started !== "exam") return;
    timer.current = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [started]);
  const q = qs[i];
  const answered = qs.filter((x) => ans[x.id] !== undefined && ans[x.id] !== "" && !(Array.isArray(ans[x.id]) && (ans[x.id] as string[]).every((a) => a === ""))).length;
  const result = qs.map((x) => ({ q: x, ok: isCorrect(x, ans[x.id]) }));
  const earned = result.reduce((a, r) => a + (r.ok === true ? r.q.marks : 0), 0);
  const gradable = result.filter((r) => r.ok !== null);
  const totalMarks = qs.reduce((a, x) => a + x.marks, 0);
  const L = language;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content dir={L === "ar" ? "rtl" : "ltr"} aria-describedby={undefined} className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-raised sm:inset-6">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-5 py-3">
            <div className="flex items-center gap-3"><Dialog.Title className="font-semibold">{t("Exam simulation preview", "معاينة محاكاة الامتحان")}</Dialog.Title><Badge tone="ai">{t("Preview only · not published", "معاينة فقط · غير منشور")}</Badge></div>
            <div className="flex items-center gap-3">
              {phase === "exam" && <span className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-sm tabular-nums", left < 300 && "border-danger text-danger")} role="timer" aria-label={t("Time remaining", "الوقت المتبقي")}><Clock className="size-4" aria-hidden="true" />{fmt(Math.max(0, left))}</span>}
              {phase === "exam" && <Button size="sm" variant="ghost" onClick={() => setLeft((s) => Math.max(0, s - 600))}>{t("Skip 10 min (demo)", "تخطي 10 دقائق (عرض)")}</Button>}
              <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={t("Close preview", "إغلاق المعاينة")}><X /></Button></Dialog.Close>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            {qs.length === 0 ? (
              <div className="mx-auto max-w-lg py-10 text-center"><AlertTriangle className="mx-auto mb-3 size-8 text-warning" aria-hidden="true" /><h2 className="text-lg font-semibold">{t("No approved exam questions yet", "لا توجد أسئلة امتحان معتمدة بعد")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("Approve questions in the Exam Preparation bank to preview a simulation.", "اعتمد أسئلة في بنك التحضير للامتحان لمعاينة المحاكاة.")}</p></div>
            ) : phase === "intro" ? (
              <div className="mx-auto max-w-xl space-y-4 py-6 text-center">
                <h2 className="text-2xl font-semibold">{t("Statistics practice exam", "امتحان تجريبي في الإحصاء")}</h2>
                <p className="text-muted-foreground">{t(`${num(qs.length)} questions · ${num(totalMarks)} marks · ${num(style.minutes)} minutes`, `${num(qs.length)} أسئلة · ${num(totalMarks)} درجة · ${num(style.minutes)} دقيقة`)}</p>
                {qs.length < style.totalQuestions && <p className="text-sm text-warning">{t(`Only ${num(qs.length)} of ${num(style.totalQuestions)} configured questions are approved.`, `المعتمد ${num(qs.length)} فقط من ${num(style.totalQuestions)} سؤالًا مهيأً.`)}</p>}
                <ul className="mx-auto max-w-sm list-disc space-y-1 text-start text-sm text-muted-foreground ps-5"><li>{t("No hints or feedback appear during the exam.", "لا تظهر تلميحات أو تغذية راجعة أثناء الامتحان.")}</li><li>{t("You can move between questions and flag them.", "يمكنك التنقل بين الأسئلة ووضع علامة عليها.")}</li><li>{t("Submit when finished or when time runs out.", "سلّم عند الانتهاء أو عند انتهاء الوقت.")}</li></ul>
                <Button size="lg" onClick={() => { setLeft(style.minutes * 60); setPhase("exam"); }}>{t("Start exam", "بدء الامتحان")}</Button>
              </div>
            ) : phase === "exam" && q ? (
              <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_14rem]">
                <section aria-label={t(`Question ${i + 1}`, `السؤال ${i + 1}`)}>
                  <p className="mb-3 flex items-center justify-between text-sm font-semibold"><span>{t(`Question ${num(i + 1)} of ${num(qs.length)}`, `السؤال ${num(i + 1)} من ${num(qs.length)}`)}</span><span>{num(q.marks)} {t("marks", "درجات")}</span></p>
                  <p className="mb-5 whitespace-pre-line text-lg leading-8">{text(q.text, L)}</p>
                  <AnswerInput key={q.id} q={q} value={ans[q.id]} onChange={(v) => setAns({ ...ans, [q.id]: v })} lang={L} />
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2"><Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft className="rtl:-scale-x-100" aria-hidden="true" />{t("Previous", "السابق")}</Button><Button variant="outline" disabled={i === qs.length - 1} onClick={() => setI(i + 1)}>{t("Next", "التالي")}<ChevronRight className="rtl:-scale-x-100" aria-hidden="true" /></Button></div>
                    <div className="flex gap-2"><Button variant="ghost" onClick={() => setFlag(flag.includes(q.id) ? flag.filter((x) => x !== q.id) : [...flag, q.id])} aria-pressed={flag.includes(q.id)}><Flag aria-hidden="true" />{flag.includes(q.id) ? t("Unflag", "إزالة العلامة") : t("Flag", "وضع علامة")}</Button><Button onClick={() => setPhase("review")}>{t("Finish and review", "إنهاء ومراجعة")}</Button></div>
                  </div>
                </section>
                <nav aria-label={t("Question navigator", "متصفح الأسئلة")} className="rounded-xl border bg-card p-3"><p className="mb-2 text-xs text-muted-foreground">{t(`${num(answered)} of ${num(qs.length)} answered`, `تمت الإجابة عن ${num(answered)} من ${num(qs.length)}`)}</p><div className="grid grid-cols-5 gap-1.5">{qs.map((x, n) => <button key={x.id} type="button" onClick={() => setI(n)} aria-label={t(`Question ${n + 1}`, `السؤال ${n + 1}`)} aria-current={n === i ? "true" : undefined} className={cn("relative grid size-9 place-items-center rounded-md border text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring", n === i ? "border-primary bg-primary text-primary-foreground" : ans[x.id] !== undefined && ans[x.id] !== "" ? "bg-secondary" : "hover:bg-muted")}>{n + 1}{flag.includes(x.id) && <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-warning" aria-hidden="true" />}</button>)}</div></nav>
              </div>
            ) : phase === "review" ? (
              <div className="mx-auto max-w-xl space-y-4 py-6 text-center">
                <h2 className="text-2xl font-semibold">{t("Submit your exam?", "تسليم الامتحان؟")}</h2>
                <p className="text-muted-foreground">{t(`${num(answered)} answered, ${num(qs.length - answered)} unanswered, ${num(flag.length)} flagged. Time left ${fmt(Math.max(0, left))}.`, `تمت الإجابة عن ${num(answered)} وبقي ${num(qs.length - answered)} بلا إجابة و${num(flag.length)} موسومة. الوقت المتبقي ${fmt(Math.max(0, left))}.`)}</p>
                {qs.length - answered > 0 && <p role="alert" className="text-sm text-warning">{t("Unanswered questions will score zero.", "الأسئلة بلا إجابة تحصل على صفر.")}</p>}
                <div className="flex justify-center gap-2"><Button variant="outline" onClick={() => setPhase("exam")}>{t("Back to exam", "العودة للامتحان")}</Button><Button onClick={() => setPhase("results")}>{t("Submit exam", "تسليم الامتحان")}</Button></div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">
                {timeUp && <p role="alert" className="rounded-lg bg-warning-soft p-3 text-sm text-warning">{t("Time ran out, so the exam was submitted automatically.", "انتهى الوقت فسُلِّم الامتحان تلقائيًا.")}</p>}
                <h2 className="text-2xl font-semibold">{t("Results preview", "معاينة النتائج")}</h2>
                <fieldset className="rounded-xl border p-4"><legend className="px-1 text-sm font-medium">{t("What students see after submitting (configurable)", "ما يراه الطلاب بعد التسليم (قابل للتهيئة)")}</legend>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">{([["score", t("Total score", "الدرجة الكلية")], ["marks", t("Marks per question", "درجة كل سؤال")], ["correct", t("Correct answers", "الإجابات الصحيحة")], ["explanations", t("Explanations", "الشروح")]] as const).map(([k, label]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" className="size-4" checked={show[k]} onChange={(e) => setShow({ ...show, [k]: e.target.checked })} />{label}</label>)}</div>
                </fieldset>
                {show.score ? <p className="rounded-xl bg-secondary/50 p-4 text-lg font-semibold">{t(`Auto-graded: ${num(earned)} of ${num(gradable.reduce((a, r) => a + r.q.marks, 0))} marks`, `التصحيح الآلي: ${num(earned)} من ${num(gradable.reduce((a, r) => a + r.q.marks, 0))} درجة`)}<span className="block text-sm font-normal text-muted-foreground">{t(`${num(result.length - gradable.length)} open-ended question(s) need manual grading. Total exam marks: ${num(totalMarks)}.`, `${num(result.length - gradable.length)} سؤالًا مفتوحًا يحتاج تصحيحًا يدويًا. إجمالي درجات الامتحان: ${num(totalMarks)}.`)}</span></p> : <p className="text-sm text-muted-foreground">{t("The score is hidden in this configuration.", "الدرجة مخفية في هذا الإعداد.")}</p>}
                <ol className="space-y-3">{result.map((r, n) => <li key={r.q.id} className="rounded-xl border p-4 text-sm"><p className="flex flex-wrap items-center justify-between gap-2 font-medium"><span>{n + 1}. {text(r.q.text, L)}</span>{show.marks && <Badge tone={r.ok === true ? "success" : r.ok === false ? "danger" : "neutral"}>{r.ok === null ? t("Manual grading", "تصحيح يدوي") : `${r.ok ? r.q.marks : 0}/${r.q.marks}`}</Badge>}</p>{show.correct && <p className="mt-2 text-muted-foreground"><strong>{t("Answer: ", "الإجابة: ")}</strong>{r.q.options.length ? text(r.q.options.find((o) => o.correct)!.text, L) : r.q.pairs.length ? r.q.pairs.map((p, k) => `${k + 1}→${text(p.right, L)}`).join(" · ") : text(r.q.answer, L)}</p>}{show.explanations && <p className="mt-1 text-muted-foreground">{text(r.q.explanation, L)}</p>}</li>)}</ol>
                <div className="flex gap-2"><Button variant="outline" onClick={reset}>{t("Run again", "تشغيل مجددًا")}</Button><Button onClick={() => { onClose(); reset(); }}>{t("Close preview", "إغلاق المعاينة")}</Button></div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
