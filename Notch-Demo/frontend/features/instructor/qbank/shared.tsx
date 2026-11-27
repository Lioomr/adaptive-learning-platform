"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { CheckCircle2, CircleHelp, Lightbulb, RotateCcw, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";
import { NativeSelect, TextArea, TextInput } from "@/features/instructor/portal/forms";
import {
  checkKeys, checkLabel, conceptOf, diffLabel, lectureOf, statusLabel,
  type Bank, type CheckStatus, type Copy, type Feedback, type QStatus, type Question,
} from "./data";
import { overall } from "./generator";

/** Question text for the interface language, falling back to the other one when empty. */
export function useQ() {
  const ctx = useInstructor();
  const text = (v: Copy, lang?: "en" | "ar") => {
    const l = lang ?? ctx.language;
    return (l === "ar" ? v[1] || v[0] : v[0] || v[1]) ?? "";
  };
  const conceptName = (id: string) => {
    const k = conceptOf(id);
    return k ? (ctx.language === "ar" ? k.ar : k.en) : id;
  };
  const lectureName = (id: string) => {
    const l = lectureOf(id);
    return l ? ctx.t(`Lecture ${l.number}`, `المحاضرة ${ctx.num(l.number)}`) : id;
  };
  return { ...ctx, text, conceptName, lectureName };
}

const tone = (s: QStatus) => ({ approved: "success", pending: "warning", rejected: "danger", archived: "neutral" })[s] as "success";
export function StatusBadge({ status }: { status: QStatus }) {
  const { t } = useQ();
  return <Badge tone={tone(status)}>{t(statusLabel[status])}</Badge>;
}
export function BankBadge({ bank }: { bank: Bank }) {
  const { t } = useQ();
  return <Badge tone={bank === "practice" ? "progress" : "ai"}>{bank === "practice" ? t("Practice", "تدريب") : t("Exam preparation", "تحضير للامتحان")}</Badge>;
}
export function DiffBadge({ q }: { q: Question }) {
  const { t } = useQ();
  return <Badge tone={q.difficulty === "easy" ? "success" : q.difficulty === "medium" ? "progress" : "warning"}>{t(diffLabel[q.difficulty])}</Badge>;
}
export function CheckBadge({ status }: { status: CheckStatus }) {
  const { t } = useQ();
  const map = { passed: ["success", t("Passed", "ناجح")], review: ["warning", t("Needs review", "يحتاج مراجعة")], failed: ["danger", t("Failed", "فشل")], na: ["neutral", t("n/a", "لا ينطبق")] } as const;
  return <Badge tone={map[status][0]}>{map[status][1]}</Badge>;
}
export function Overall({ q }: { q: Question }) {
  return <CheckBadge status={overall(q.validation)} />;
}

export function ValidationPanel({ q }: { q: Question }) {
  const { t, text } = useQ();
  return (
    <div>
      <ul className="divide-y rounded-xl border">
        {checkKeys.map((k) => (
          <li key={k} className="flex flex-wrap items-start justify-between gap-2 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{t(checkLabel[k])}</p>
              <p className="text-muted-foreground">{text(q.validation[k].note)}</p>
            </div>
            <CheckBadge status={q.validation[k].status} />
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("Simulated rule-based checks, not real AI validation. Passing still requires your approval.", "فحوصات محاكاة قائمة على قواعد وليست تحققًا حقيقيًا بالذكاء الاصطناعي. النجاح فيها لا يغني عن اعتمادك.")}
      </p>
    </div>
  );
}

export function SourceDialog({ q, onClose }: { q: Question | null; onClose: () => void }) {
  const { t, text, language, num, lectureName } = useQ();
  const lecture = q && lectureOf(q.source.lectureId);
  return (
    <Dialog.Root open={!!q} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content dir={language === "ar" ? "rtl" : "ltr"} aria-describedby={undefined} className="fixed start-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-raised rtl:translate-x-1/2">
          {q && lecture && (
            <>
              <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t("Close", "إغلاق")}><X /></Button></Dialog.Close>
              <Dialog.Title className="pe-8 text-lg font-semibold">{t("Source evidence", "دليل المصدر")}</Dialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">{lectureName(lecture.id)} · {text(lecture.title)} · {t(`Slide ${num(q.source.slide)}`, `الشريحة ${num(q.source.slide)}`)}</p>
              <article dir="ltr" className="mt-4 aspect-video overflow-hidden rounded-lg border bg-white p-[4%] text-slate-900 [container-type:inline-size]">
                <p className="text-[2.2cqw] text-slate-500">{lecture.title[0]} · {q.source.slide}</p>
                <h3 className="mt-[2cqw] text-[3.6cqw] font-semibold text-blue-700">{q.conceptIds.map((id) => conceptOf(id)?.en).filter(Boolean).join(" · ")}</h3>
                <p className="mt-[2cqw] rounded-[0.8cqw] border-2 border-blue-600 bg-blue-50 p-[2cqw] text-[2.6cqw] leading-snug">{q.source.snippet[0]}</p>
              </article>
              <p className="mt-3 text-xs text-muted-foreground">{t("Representative mock slide for the demo.", "شريحة تمثيلية تجريبية للعرض.")}</p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type Ans = string | string[];
const rotated = (n: number) => Array.from({ length: n }, (_, i) => (i + 1) % n);

/** Correctness for auto-gradable types; null means the answer needs manual grading. */
export function isCorrect(q: Question, ans: Ans | undefined): boolean | null {
  if (ans === undefined || ans === "" || (Array.isArray(ans) && ans.some((a) => a === ""))) return q.type === "mcq" || q.type === "tf" ? false : q.type === "short" || q.type === "essay" || q.type === "math" ? null : false;
  if (q.type === "mcq" || q.type === "tf") return q.options.find((o) => o.id === ans)?.correct ?? false;
  if (q.type === "matching") return Array.isArray(ans) && ans.every((a, i) => Number(a) === i);
  if (q.type === "fill") return [q.answer[0], q.answer[1]].some((a) => a && a.trim().toLowerCase() === String(ans).trim().toLowerCase());
  if (q.type === "numeric") return Math.abs(Number(ans) - Number(q.answer[0] || q.answer[1])) <= 0.01;
  return null;
}

export function AnswerInput({ q, value, onChange, disabled, lang }: { q: Question; value: Ans | undefined; onChange: (v: Ans) => void; disabled?: boolean; lang: "en" | "ar" }) {
  const { t } = useQ();
  const pick = (v: Copy) => (lang === "ar" ? v[1] || v[0] : v[0] || v[1]);
  if (q.type === "mcq" || q.type === "tf")
    return (
      <div role="radiogroup" aria-label={t("Answer options", "خيارات الإجابة")} className="space-y-2">
        {q.options.map((o, i) => (
          <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm", value === o.id && "border-primary bg-secondary/50", disabled && "cursor-default")}>
            <input type="radio" name={`q-${q.id}`} className="mt-1" checked={value === o.id} disabled={disabled} onChange={() => onChange(o.id)} />
            <span><strong className="me-1.5">{q.type === "mcq" ? String.fromCharCode(65 + i) + "." : ""}</strong>{pick(o.text)}</span>
          </label>
        ))}
      </div>
    );
  if (q.type === "matching") {
    const order = rotated(q.pairs.length);
    const v = Array.isArray(value) ? value : q.pairs.map(() => "");
    return (
      <ul className="space-y-2">
        {q.pairs.map((p, i) => (
          <li key={i} className="grid items-center gap-2 text-sm sm:grid-cols-[10rem_1fr]">
            <span className="font-medium">{i + 1}. {pick(p.left)}</span>
            <NativeSelect aria-label={pick(p.left)} disabled={disabled} value={v[i]} onChange={(e) => { const n = [...v]; n[i] = e.target.value; onChange(n); }}>
              <option value="">{t("Choose…", "اختر…")}</option>
              {order.map((j) => <option key={j} value={String(j)}>{pick(q.pairs[j].right)}</option>)}
            </NativeSelect>
          </li>
        ))}
      </ul>
    );
  }
  if (q.type === "short" || q.type === "essay" || q.type === "math")
    return <TextArea aria-label={t("Your answer", "إجابتك")} rows={q.type === "essay" ? 6 : 3} disabled={disabled} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  return <TextInput aria-label={t("Your answer", "إجابتك")} inputMode={q.type === "numeric" ? "decimal" : undefined} disabled={disabled} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
}

/** Student-facing practice preview with the configured feedback. */
export function PracticePreview({ q, feedback, lang }: { q: Question; feedback?: Feedback; lang?: "en" | "ar" }) {
  const { t, text, language, num, conceptName, lectureName } = useQ();
  const fb = feedback ?? q.feedback;
  const L = lang ?? (q.lang === "both" ? language : q.lang);
  const [ans, setAns] = useState<Ans | undefined>();
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [steps, setSteps] = useState(false);
  const result = checked ? isCorrect(q, ans) : null;
  const locked = checked && (result === true || !fb.multipleAttempts);
  const wrong = q.options.find((o) => o.id === ans && !o.correct);
  const correct = q.options.find((o) => o.correct);
  const answerText = q.options.length ? text(correct?.text ?? ["", ""], L) : q.pairs.length ? q.pairs.map((p, i) => `${i + 1}→${text(p.right, L)}`).join(" · ") : text(q.answer, L);
  return (
    <div dir={L === "ar" ? "rtl" : "ltr"} lang={L} className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge tone="progress">{t("Practice", "تدريب")}</Badge>
        <span>{q.conceptIds.map(conceptName).join(", ")}</span>·<span>{t(diffLabel[q.difficulty])}</span>·<span>{num(q.marks)} {t("marks", "درجات")}</span>·<span>{lectureName(q.source.lectureId)} · {t(`Slide ${num(q.source.slide)}`, `الشريحة ${num(q.source.slide)}`)}</span>
      </div>
      <p className="mb-4 whitespace-pre-line text-base font-medium leading-7">{text(q.text, L)}</p>
      <AnswerInput q={q} value={ans} onChange={(v) => { setAns(v); }} disabled={locked} lang={L} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!locked && <Button size="sm" disabled={ans === undefined || ans === ""} onClick={() => { setChecked(true); setAttempts((n) => n + 1); }}>{t("Check answer", "تحقق من الإجابة")}</Button>}
        {checked && !locked && fb.multipleAttempts && <Button size="sm" variant="outline" onClick={() => setChecked(false)}><RotateCcw aria-hidden="true" />{t("Try again", "حاول مجددًا")}</Button>}
        {fb.hints && !checked && <Button size="sm" variant="ghost" onClick={() => setHint(true)}><Lightbulb aria-hidden="true" />{t("Show hint", "عرض تلميح")}</Button>}
        {fb.steps && q.steps.length > 0 && <Button size="sm" variant="ghost" onClick={() => setSteps(true)}>{t("Show solution steps", "عرض خطوات الحل")}</Button>}
        {attempts > 0 && <span className="text-xs text-muted-foreground">{t(`Attempt ${num(attempts)}`, `المحاولة ${num(attempts)}`)}</span>}
      </div>
      {hint && !checked && <p className="mt-3 flex gap-2 rounded-lg bg-info-soft p-3 text-sm"><Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{text(q.hint, L)}</p>}
      {checked && (
        <div role="status" className="mt-4 space-y-3 text-sm">
          <p className={cn("flex items-center gap-2 font-semibold", result === true ? "text-success" : result === false ? "text-danger" : "text-muted-foreground")}>
            {result === true ? <CheckCircle2 className="size-5" aria-hidden="true" /> : result === false ? <XCircle className="size-5" aria-hidden="true" /> : <CircleHelp className="size-5" aria-hidden="true" />}
            {result === true ? t("Correct", "صحيح") : result === false ? t("Not quite", "ليس تمامًا") : t("Compare with the model answer", "قارن بالإجابة النموذجية")}
          </p>
          {fb.showCorrect && (result !== true || true) && <p><strong>{t("Correct answer: ", "الإجابة الصحيحة: ")}</strong>{answerText}</p>}
          {fb.explainWrong && wrong?.why && <p className="rounded-lg bg-danger-soft p-3 text-danger-ink"><strong>{t("Why that option is wrong: ", "لماذا هذا الخيار خاطئ: ")}</strong>{text(wrong.why, L)}</p>}
          {fb.explanations && <p className="rounded-lg bg-muted/60 p-3"><strong>{t("Explanation: ", "الشرح: ")}</strong>{text(q.explanation, L)}</p>}
        </div>
      )}
      {(steps || (checked && fb.steps && q.steps.length > 0)) && q.steps.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 rounded-lg border p-3 ps-8 text-sm">{q.steps.map((s, i) => <li key={i}>{text(s, L)}</li>)}</ol>
      )}
      {!fb.showCorrect && !fb.explanations && !fb.hints && !fb.steps && <p className="mt-3 text-xs text-muted-foreground">{t("All feedback is switched off for this configuration.", "كل أنواع التغذية الراجعة متوقفة في هذا الإعداد.")}</p>}
    </div>
  );
}
