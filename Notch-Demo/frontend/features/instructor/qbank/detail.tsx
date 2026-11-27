"use client";
import { createContext, useContext, useState } from "react";
import { Dialog } from "radix-ui";
import { Archive, Check, Copy as CopyIcon, ExternalLink, Pencil, RefreshCw, Repeat2, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmDelete, Field, NativeSelect, TextArea, TextInput } from "@/features/instructor/portal/forms";
import { blooms, bloomLabel, concepts, conceptOf, diffs, diffLabel, langLabel, typeLabel, type Copy, type Lang, type Question } from "./data";
import { overall } from "./generator";
import { useQb } from "./store";
import { BankBadge, DiffBadge, Overall, PracticePreview, SourceDialog, StatusBadge, ValidationPanel, useQ } from "./shared";

type Ask = { title: string; description: string; confirm: string; run: () => void } | null;
export type QbUi = {
  detail: { id: string; edit: boolean } | null;
  open: (id: string, edit?: boolean) => void;
  close: () => void;
  source: Question | null;
  setSource: (q: Question | null) => void;
  ask: Ask;
  setAsk: (a: Ask) => void;
  approve: (q: Question) => void;
  reject: (q: Question) => void;
  archive: (ids: string[]) => void;
};
const Ctx = createContext<QbUi | null>(null);
export const useUi = () => useContext(Ctx)!;

export function QbProvider({ children }: { children: React.ReactNode }) {
  const { t } = useQ();
  const [detail, setDetail] = useState<QbUi["detail"]>(null);
  const [source, setSource] = useState<Question | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const s = useQb.getState;
  const ui: QbUi = {
    detail, source, setSource, ask, setAsk,
    open: (id, edit = false) => setDetail({ id, edit }),
    close: () => setDetail(null),
    approve: (q) => {
      const go = () => { s().setStatus(q.id, "approved"); s().notify(t(`${q.id} approved and added to the ${q.bank === "practice" ? "Practice" : "Exam Preparation"} bank.`, `تم اعتماد ${q.id} وإضافته إلى بنك ${q.bank === "practice" ? "التدريب" : "التحضير للامتحان"}.`)); };
      if (overall(q.validation) === "failed") setAsk({ title: t("Approve despite failed checks?", "اعتماد رغم فشل الفحوصات؟"), description: t("The simulated quality checks failed for this question. You can still approve it after reviewing it yourself.", "فشلت فحوصات الجودة المحاكاة لهذا السؤال. يمكنك اعتماده بعد مراجعته بنفسك."), confirm: t("Approve anyway", "اعتماد على أي حال"), run: go });
      else go();
    },
    reject: (q) => setAsk({ title: t("Reject this question?", "رفض هذا السؤال؟"), description: t("It will not appear in the approved bank. You can restore it later from the rejected filter.", "لن يظهر في البنك المعتمد. يمكنك استعادته لاحقًا من تصفية المرفوضة."), confirm: t("Reject", "رفض"), run: () => { s().setStatus(q.id, "rejected"); s().notify(t(`${q.id} rejected.`, `تم رفض ${q.id}.`)); } }),
    archive: (ids) => setAsk({ title: t(`Archive ${ids.length} question(s)?`, `أرشفة ${ids.length} سؤال؟`), description: t("Archived questions leave the bank and cannot be chosen in the Assessment Center. Restore them from the archived filter.", "تغادر الأسئلة المؤرشفة البنك ولا يمكن اختيارها في مركز التقييم. استعدها من تصفية المؤرشفة."), confirm: t("Archive", "أرشفة"), run: () => { s().archive(ids); s().notify(t(`${ids.length} question(s) archived.`, `تمت أرشفة ${ids.length} سؤال.`)); } }),
  };
  return <Ctx.Provider value={ui}>{children}<QbModals /></Ctx.Provider>;
}

function QbModals() {
  const ui = useUi();
  const question = useQb((s) => s.questions.find((q) => q.id === ui.detail?.id) ?? null);
  const { t } = useQ();
  return (
    <>
      <Drawer q={question} edit={!!ui.detail?.edit} />
      <SourceDialog q={ui.source} onClose={() => ui.setSource(null)} />
      <ConfirmDelete open={!!ui.ask} onOpenChange={(o) => !o && ui.setAsk(null)} title={ui.ask?.title ?? ""} description={ui.ask?.description ?? ""} onConfirm={() => { ui.ask?.run(); ui.setAsk(null); }} />
      <span className="sr-only">{t("", "")}</span>
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return <div className="grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="text-sm">{children}</dd></div>;
}

function Drawer({ q, edit }: { q: Question | null; edit: boolean }) {
  const ui = useUi();
  const { t, language } = useQ();
  const [tab, setTab] = useState<"details" | "preview" | "checks">("details");
  const otherBank = q?.bank === "practice" ? "exam" : "practice";
  const act = useQb.getState;
  return (
    <Dialog.Root open={!!q} onOpenChange={(o) => { if (!o) { ui.close(); setTab("details"); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content dir={language === "ar" ? "rtl" : "ltr"} aria-describedby={undefined} className="fixed inset-y-0 end-0 z-50 w-full max-w-2xl overflow-y-auto border-s bg-card p-5 shadow-raised sm:p-8">
          {q && (
            <>
              <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t("Close", "إغلاق")}><X /></Button></Dialog.Close>
              <div className="flex flex-wrap items-center gap-2 pe-10"><span className="font-mono text-sm" dir="ltr">{q.id}</span><BankBadge bank={q.bank} /><StatusBadge status={q.status} /><Overall q={q} /></div>
              <Dialog.Title className="mt-2 text-xl font-semibold">{edit ? t("Edit question", "تعديل السؤال") : t("Question details", "تفاصيل السؤال")}</Dialog.Title>
              {edit ? <EditForm key={q.id} q={q} /> : (
                <>
                  <div role="tablist" aria-label={t("Question views", "عروض السؤال")} className="my-4 inline-flex rounded-xl border bg-muted/50 p-1">
                    {([["details", t("Details", "التفاصيل")], ["preview", q.bank === "practice" ? t("Student preview", "معاينة الطالب") : t("Exam format", "صيغة الامتحان")], ["checks", t("Validation", "التحقق")]] as const).map(([id, label]) => <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("min-h-9 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground")}>{label}</button>)}
                  </div>
                  {tab === "details" && <Details q={q} />}
                  {tab === "preview" && (q.bank === "practice" ? <PracticePreview key={q.id} q={q} /> : <ExamFormat q={q} />)}
                  {tab === "checks" && <ValidationPanel q={q} />}
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
                    {q.status === "pending" && <><Button onClick={() => ui.approve(q)}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button><Button variant="outline" onClick={() => ui.open(q.id, true)}><Pencil aria-hidden="true" />{t("Edit and approve", "تعديل واعتماد")}</Button><Button variant="outline" onClick={() => { act().regenerate(q.id); act().notify(t(`${q.id} regenerated. Review the new version.`, `أُعيد توليد ${q.id}. راجع النسخة الجديدة.`)); }}><RefreshCw aria-hidden="true" />{t("Regenerate", "إعادة التوليد")}</Button><Button variant="ghost" className="text-danger" onClick={() => ui.reject(q)}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button></>}
                    {q.status !== "pending" && q.status !== "archived" && <Button variant="outline" onClick={() => ui.open(q.id, true)}><Pencil aria-hidden="true" />{t("Edit", "تعديل")}</Button>}
                    {q.status === "rejected" && <Button variant="outline" onClick={() => { act().restore(q.id); act().notify(t(`${q.id} moved back to review.`, `أُعيد ${q.id} إلى المراجعة.`)); }}>{t("Restore to review", "استعادة للمراجعة")}</Button>}
                    {q.status === "archived" && <Button variant="outline" onClick={() => { act().restore(q.id); act().notify(t(`${q.id} restored to review.`, `تمت استعادة ${q.id} للمراجعة.`)); }}>{t("Restore to review", "استعادة للمراجعة")}</Button>}
                    <Button variant="ghost" onClick={() => { const id = act().duplicate(q.id); if (id) act().notify(t(`Duplicated as ${id} (needs review).`, `تم النسخ باسم ${id} (يحتاج مراجعة).`)); }}><CopyIcon aria-hidden="true" />{t("Duplicate", "نسخ")}</Button>
                    {q.status === "approved" && <Button variant="ghost" onClick={() => { const id = act().duplicate(q.id, otherBank); if (id) act().notify(t(`Copied to the ${otherBank === "exam" ? "Exam Preparation" : "Practice"} bank as ${id}. It needs review there.`, `نُسخ إلى بنك ${otherBank === "exam" ? "التحضير للامتحان" : "التدريب"} باسم ${id}. يحتاج مراجعة هناك.`)); }}><Repeat2 aria-hidden="true" />{otherBank === "exam" ? t("Copy to Exam Preparation", "نسخ إلى التحضير للامتحان") : t("Copy to Practice", "نسخ إلى التدريب")}</Button>}
                    {q.status !== "archived" && <Button variant="ghost" onClick={() => ui.archive([q.id])}><Archive aria-hidden="true" />{t("Archive", "أرشفة")}</Button>}
                  </div>
                </>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExamFormat({ q }: { q: Question }) {
  const { t, text, num } = useQ();
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="mb-2 flex justify-between text-sm font-semibold"><span>{t("Question", "السؤال")}</span><span>{num(q.marks)} {t("marks", "درجات")}</span></p>
      <p className="leading-7">{text(q.text)}</p>
      {q.options.length > 0 && <ul className="mt-3 space-y-2 text-sm">{q.options.map((o, i) => <li key={o.id} className="rounded-lg border p-2.5">{q.type === "mcq" ? `${String.fromCharCode(65 + i)}. ` : ""}{text(o.text)}</li>)}</ul>}
      <p className="mt-3 text-xs text-muted-foreground">{t("Exam format shows no hints, answers or feedback. Use Preview Exam Simulation for the timed experience.", "لا تعرض صيغة الامتحان تلميحات أو إجابات أو تغذية راجعة. استخدم معاينة محاكاة الامتحان للتجربة الزمنية.")}</p>
    </div>
  );
}

function Details({ q }: { q: Question }) {
  const { t, text, num, conceptName, lectureName } = useQ();
  const ui = useUi();
  const both = (c: Copy) => (q.lang === "both" ? <><span>{c[0]}</span><span dir="rtl" lang="ar" className="mt-1 block text-muted-foreground">{c[1]}</span></> : text(c));
  return (
    <dl className="space-y-3">
      <Row k={t("Question", "السؤال")}><div className="whitespace-pre-line font-medium leading-6">{both(q.text)}</div></Row>
      {q.options.length > 0 && <Row k={t("Options", "الخيارات")}><ul className="space-y-2">{q.options.map((o) => <li key={o.id} className={cn("rounded-lg border p-2.5", o.correct && "border-success bg-success-soft")}>{both(o.text)}{o.correct && <Badge tone="success" className="ms-2">{t("Correct", "صحيح")}</Badge>}{!o.correct && o.why && <p className="mt-1 text-xs text-muted-foreground">{text(o.why)}</p>}</li>)}</ul></Row>}
      {q.pairs.length > 0 && <Row k={t("Pairs", "الأزواج")}><ul className="space-y-1">{q.pairs.map((p, i) => <li key={i}>{text(p.left)} → {text(p.right)}</li>)}</ul></Row>}
      {q.answer[0] + q.answer[1] !== "" && <Row k={t("Correct answer", "الإجابة الصحيحة")}>{both(q.answer)}</Row>}
      <Row k={t("Explanation", "الشرح")}>{both(q.explanation)}</Row>
      {q.steps.length > 0 && <Row k={t("Solution steps", "خطوات الحل")}><ol className="list-decimal space-y-1 ps-5">{q.steps.map((s, i) => <li key={i}>{text(s)}</li>)}</ol></Row>}
      <Row k={t("Type", "النوع")}>{t(typeLabel[q.type])}</Row>
      <Row k={t("Concepts", "المفاهيم")}><span className="flex flex-wrap gap-1.5">{q.conceptIds.map((id) => <Badge key={id} tone="brand">{conceptName(id)}</Badge>)}{q.prerequisite && <Badge tone="outline">{t("Prerequisite", "متطلب سابق")}</Badge>}</span></Row>
      <Row k={t("Difficulty", "الصعوبة")}><DiffBadge q={q} /></Row>
      <Row k={t("Cognitive level", "المستوى المعرفي")}>{t(bloomLabel[q.bloom])}</Row>
      <Row k={t("Marks", "الدرجات")}>{num(q.marks)}</Row>
      <Row k={t("Language", "اللغة")}>{t(langLabel[q.lang])}</Row>
      {q.pattern && <Row k={t("Exam pattern", "نمط الامتحان")}>{q.pattern.replace("+multi", "")} {q.pattern.includes("+multi") && <Badge tone="ai">{t("multi-concept", "متعدد المفاهيم")}</Badge>}</Row>}
      <Row k={t("Source", "المصدر")}><Button size="sm" variant="outline" onClick={() => ui.setSource(q)}><ExternalLink aria-hidden="true" />{lectureName(q.source.lectureId)} · {t(`Slide ${num(q.source.slide)}`, `الشريحة ${num(q.source.slide)}`)}</Button></Row>
    </dl>
  );
}

function EditForm({ q }: { q: Question }) {
  const ui = useUi();
  const { t, language } = useQ();
  const [d, setD] = useState({ text: q.text as Copy, options: q.options, answer: q.answer as Copy, explanation: q.explanation as Copy, marks: q.marks, difficulty: q.difficulty, bloom: q.bloom, lang: q.lang as Lang, conceptIds: q.conceptIds });
  const [error, setError] = useState("");
  const show = (i: 0 | 1) => (d.lang === "both" ? true : d.lang === "en" ? i === 0 : i === 1);
  const set = (c: Copy, i: 0 | 1, v: string): Copy => (i === 0 ? [v, c[1]] : [c[0], v]);
  function save(approve: boolean) {
    const langs = ([0, 1] as const).filter(show);
    if (langs.some((i) => !d.text[i].trim())) return setError(t("The question text is required in each selected language.", "نص السؤال مطلوب في كل لغة محددة."));
    if (q.options.length && langs.some((i) => d.options.some((o) => !o.text[i].trim()))) return setError(t("Every option needs text in each selected language.", "كل خيار يحتاج نصًا في كل لغة محددة."));
    if (q.options.length && d.options.filter((o) => o.correct).length !== 1) return setError(t("Choose exactly one correct option.", "اختر خيارًا صحيحًا واحدًا فقط."));
    if (!d.conceptIds.length) return setError(t("Associate at least one approved concept.", "اربط مفهومًا معتمدًا واحدًا على الأقل."));
    if (!(d.marks >= 1 && d.marks <= 100)) return setError(t("Marks must be between 1 and 100.", "يجب أن تكون الدرجات بين 1 و100."));
    const blank = (c: Copy): Copy => [show(0) ? c[0] : "", show(1) ? c[1] : ""];
    const first = conceptOf(d.conceptIds[0])!;
    useQb.getState().edit(q.id, {
      text: blank(d.text), options: d.options.map((o) => ({ ...o, text: blank(o.text), why: o.why && blank(o.why) })), answer: blank(d.answer), explanation: blank(d.explanation),
      marks: d.marks, difficulty: d.difficulty, bloom: d.bloom, lang: d.lang, conceptIds: d.conceptIds,
      source: d.conceptIds[0] === q.conceptIds[0] ? q.source : { lectureId: first.lecture, slide: first.slide, snippet: first.snippet },
    }, approve);
    useQb.getState().notify(approve ? t(`${q.id} edited and approved.`, `تم تعديل ${q.id} واعتماده.`) : t(`${q.id} saved.`, `تم حفظ ${q.id}.`));
    ui.open(q.id, false);
  }
  const f = (label: string, i: 0 | 1, value: string, on: (v: string) => void, area = false) => show(i) && (
    <Field label={`${label} (${i === 0 ? "EN" : "AR"})`}>{({ id }) => area ? <TextArea id={id} rows={3} dir={i === 1 ? "rtl" : "ltr"} value={value} onChange={(e) => on(e.target.value)} /> : <TextInput id={id} dir={i === 1 ? "rtl" : "ltr"} value={value} onChange={(e) => on(e.target.value)} />}</Field>
  );
  return (
    <form className="mt-5 space-y-5" onSubmit={(e) => { e.preventDefault(); save(false); }}>
      <Field label={t("Language versions", "النسخ اللغوية")}>{({ id }) => <NativeSelect id={id} value={d.lang} onChange={(e) => setD({ ...d, lang: e.target.value as Lang })}>{(["en", "ar", "both"] as Lang[]).map((l) => <option key={l} value={l}>{t(langLabel[l])}</option>)}</NativeSelect>}</Field>
      {([0, 1] as const).map((i) => f(t("Question text", "نص السؤال"), i, d.text[i], (v) => setD({ ...d, text: set(d.text, i, v) }), true))}
      {q.options.length > 0 && (
        <fieldset className="space-y-3"><legend className="mb-1 text-sm font-medium">{t("Answer options (select the correct one)", "خيارات الإجابة (حدد الصحيح)")}</legend>
          {d.options.map((o, oi) => (
            <div key={o.id} className="flex items-start gap-3 rounded-lg border p-3">
              <input type="radio" name="correct" className="mt-3" aria-label={t(`Option ${oi + 1} is correct`, `الخيار ${oi + 1} صحيح`)} checked={o.correct} onChange={() => setD({ ...d, options: d.options.map((x, xi) => ({ ...x, correct: xi === oi })) })} />
              <div className="grid flex-1 gap-2">{([0, 1] as const).map((i) => show(i) && <TextInput key={i} aria-label={`${t("Option", "الخيار")} ${oi + 1} ${i === 0 ? "EN" : "AR"}`} dir={i === 1 ? "rtl" : "ltr"} value={o.text[i]} onChange={(e) => setD({ ...d, options: d.options.map((x, xi) => (xi === oi ? { ...x, text: set(x.text, i, e.target.value) } : x)) })} />)}</div>
            </div>
          ))}
        </fieldset>
      )}
      {q.answer[0] + q.answer[1] !== "" && ([0, 1] as const).map((i) => f(t("Correct answer", "الإجابة الصحيحة"), i, d.answer[i], (v) => setD({ ...d, answer: set(d.answer, i, v) })))}
      {([0, 1] as const).map((i) => f(t("Explanation", "الشرح"), i, d.explanation[i], (v) => setD({ ...d, explanation: set(d.explanation, i, v) }), true))}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("Marks", "الدرجات")}>{({ id }) => <TextInput id={id} type="number" min={1} max={100} value={d.marks} onChange={(e) => setD({ ...d, marks: Number(e.target.value) })} />}</Field>
        <Field label={t("Difficulty", "الصعوبة")}>{({ id }) => <NativeSelect id={id} value={d.difficulty} onChange={(e) => setD({ ...d, difficulty: e.target.value as typeof d.difficulty })}>{diffs.map((x) => <option key={x} value={x}>{t(diffLabel[x])}</option>)}</NativeSelect>}</Field>
        <Field label={t("Cognitive level", "المستوى المعرفي")}>{({ id }) => <NativeSelect id={id} value={d.bloom} onChange={(e) => setD({ ...d, bloom: e.target.value as typeof d.bloom })}>{blooms.map((x) => <option key={x} value={x}>{t(bloomLabel[x])}</option>)}</NativeSelect>}</Field>
      </div>
      <fieldset><legend className="mb-2 text-sm font-medium">{t("Associated concepts (approved only)", "المفاهيم المرتبطة (المعتمدة فقط)")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">{concepts.filter((c) => c.approved).map((c) => <label key={c.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><input type="checkbox" className="size-4" checked={d.conceptIds.includes(c.id)} onChange={(e) => setD({ ...d, conceptIds: e.target.checked ? [...d.conceptIds, c.id] : d.conceptIds.filter((x) => x !== c.id) })} />{language === "ar" ? c.ar : c.en}</label>)}</div>
      </fieldset>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button type="submit">{t("Save", "حفظ")}</Button>
        {q.status === "pending" && <Button type="button" variant="secondary" onClick={() => save(true)}>{t("Save and approve", "حفظ واعتماد")}</Button>}
        <Button type="button" variant="outline" onClick={() => ui.open(q.id, false)}>{t("Cancel", "إلغاء")}</Button>
      </div>
    </form>
  );
}
