"use client";
import { useState } from "react";
import { Check, ExternalLink, Pencil, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EditorDialog, EmptyState, NativeSelect, TextInput } from "@/features/instructor/portal/forms";
import { bloomLabel, concepts, conceptOf, diffs, diffLabel, langLabel, typeLabel, type Bank, type Copy, type Question } from "./data";
import { useQb } from "./store";
import { BankBadge, Overall, ValidationPanel, useQ } from "./shared";
import { useUi } from "./detail";

function Both({ c, lang }: { c: Copy; lang: Question["lang"] }) {
  const { text } = useQ();
  return lang === "both" ? <><span>{c[0]}</span><span dir="rtl" lang="ar" className="mt-0.5 block text-muted-foreground">{c[1]}</span></> : <>{text(c)}</>;
}

function ConceptsDialog({ q, onClose }: { q: Question | null; onClose: () => void }) {
  const { t, language } = useQ();
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  return (
    <EditorDialog
      key={q?.id ?? "closed"}
      open={!!q}
      onOpenChange={(o) => { if (!o) { onClose(); setError(""); } }}
      title={t("Change associated concepts", "تغيير المفاهيم المرتبطة")}
      description={t("Only approved concepts can be linked. The source evidence follows the first concept.", "يمكن ربط المفاهيم المعتمدة فقط. يتبع دليل المصدر المفهوم الأول.")}
      submitLabel={t("Save concepts", "حفظ المفاهيم")}
      onSubmit={() => {
        if (!q) return;
        const chosen = ids.length ? ids : q.conceptIds;
        if (!chosen.length) return setError(t("Select at least one concept.", "اختر مفهومًا واحدًا على الأقل."));
        const first = conceptOf(chosen[0])!;
        useQb.getState().edit(q.id, { conceptIds: chosen, source: chosen[0] === q.conceptIds[0] ? q.source : { lectureId: first.lecture, slide: first.slide, snippet: first.snippet } });
        useQb.getState().notify(t(`Concepts updated for ${q.id}.`, `تم تحديث مفاهيم ${q.id}.`));
        onClose();
      }}
    >
      {q && (() => {
        const cur = ids.length ? ids : q.conceptIds;
        return (
          <div className="grid gap-2">
            {concepts.filter((c) => c.approved).map((c) => <label key={c.id} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm"><input type="checkbox" className="size-4" checked={cur.includes(c.id)} onChange={(e) => setIds(e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id))} />{language === "ar" ? c.ar : c.en}</label>)}
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          </div>
        );
      })()}
    </EditorDialog>
  );
}

export function PendingReview({ bank }: { bank: Bank }) {
  const { t, text, num, conceptName, lectureName } = useQ();
  const ui = useUi();
  const questions = useQb((s) => s.questions);
  const [inspect, setInspect] = useState<string | null>(null);
  const [conceptsFor, setConceptsFor] = useState<Question | null>(null);
  const queue = questions.filter((q) => q.bank === bank && q.status === "pending");
  const { edit, regenerate, notify } = useQb.getState();
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t("Generated questions wait here. Nothing is approved automatically, even when the simulated checks pass.", "تنتظر الأسئلة المولَّدة هنا. لا يُعتمد شيء تلقائيًا حتى لو نجحت الفحوصات المحاكاة.")}</p>
      <div className="space-y-4">
        {queue.map((q) => (
          <Card key={q.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm" dir="ltr">{q.id}</span><Badge tone="outline">{t(typeLabel[q.type])}</Badge><Badge tone="outline">{t(langLabel[q.lang])}</Badge><BankBadge bank={q.bank} /></div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{t("Quality checks", "فحوصات الجودة")}</span><Overall q={q} /></div>
            </div>
            <p className="mt-3 whitespace-pre-line text-base font-medium leading-7"><Both c={q.text} lang={q.lang} /></p>
            {q.options.length > 0 && <ul className="mt-3 space-y-1.5 text-sm">{q.options.map((o, i) => <li key={o.id} className={cn("rounded-lg border p-2.5", o.correct && "border-success bg-success-soft")}>{q.type === "mcq" ? `${String.fromCharCode(65 + i)}. ` : ""}<Both c={o.text} lang={q.lang} />{o.correct && <Badge tone="success" className="ms-2">{t("Correct", "صحيح")}</Badge>}</li>)}</ul>}
            {q.pairs.length > 0 && <ul className="mt-3 space-y-1 text-sm">{q.pairs.map((p, i) => <li key={i}>{text(p.left)} → {text(p.right)}</li>)}</ul>}
            {q.answer[0] + q.answer[1] !== "" && <p className="mt-3 text-sm"><strong>{t("Correct answer: ", "الإجابة الصحيحة: ")}</strong><Both c={q.answer} lang={q.lang} /></p>}
            <p className="mt-2 text-sm"><strong>{t("Explanation: ", "الشرح: ")}</strong><span className="text-muted-foreground"><Both c={q.explanation} lang={q.lang} /></span></p>
            {q.steps.length > 0 && <ol className="mt-2 list-decimal space-y-0.5 ps-6 text-sm text-muted-foreground">{q.steps.map((s, i) => <li key={i}>{text(s)}</li>)}</ol>}
            <div className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{t("Difficulty", "الصعوبة")}</span>
                <NativeSelect className="h-10" value={q.difficulty} onChange={(e) => edit(q.id, { difficulty: e.target.value as Question["difficulty"] })}>{diffs.map((d) => <option key={d} value={d}>{t(diffLabel[d])}</option>)}</NativeSelect></label>
              <label className="block"><span className="mb-1 block text-xs text-muted-foreground">{t("Marks", "الدرجات")}</span>
                <TextInput className="h-10" type="number" min={1} max={100} value={q.marks} onChange={(e) => edit(q.id, { marks: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} /></label>
              <div><span className="mb-1 block text-xs text-muted-foreground">{t("Cognitive level", "المستوى المعرفي")}</span><p className="flex h-10 items-center">{t(bloomLabel[q.bloom])}</p></div>
              <div><span className="mb-1 block text-xs text-muted-foreground">{t("Source", "المصدر")}</span><p className="flex h-10 items-center">{lectureName(q.source.lectureId)} · {t(`Slide ${num(q.source.slide)}`, `الشريحة ${num(q.source.slide)}`)}</p></div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm"><span className="text-muted-foreground">{t("Concepts:", "المفاهيم:")}</span>{q.conceptIds.map((id) => <Badge key={id} tone="brand">{conceptName(id)}</Badge>)}<Button size="sm" variant="ghost" onClick={() => setConceptsFor(q)}>{t("Change concepts", "تغيير المفاهيم")}</Button></div>
            {inspect === q.id && <div className="mt-4"><ValidationPanel q={q} /></div>}
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => ui.approve(q)}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button>
              <Button variant="outline" onClick={() => ui.open(q.id, true)}><Pencil aria-hidden="true" />{t("Edit and approve", "تعديل واعتماد")}</Button>
              <Button variant="outline" onClick={() => { regenerate(q.id); notify(t(`${q.id} regenerated. Review the new version.`, `أُعيد توليد ${q.id}. راجع النسخة الجديدة.`)); }}><RefreshCw aria-hidden="true" />{t("Regenerate", "إعادة التوليد")}</Button>
              <Button variant="outline" className="text-danger" onClick={() => ui.reject(q)}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button>
              <Button variant="ghost" onClick={() => ui.setSource(q)}><ExternalLink aria-hidden="true" />{t("View source", "عرض المصدر")}</Button>
              <Button variant="ghost" onClick={() => setInspect(inspect === q.id ? null : q.id)}><ShieldCheck aria-hidden="true" />{inspect === q.id ? t("Hide validation", "إخفاء التحقق") : t("Validation details", "تفاصيل التحقق")}</Button>
              <Button variant="ghost" onClick={() => ui.open(q.id)}>{t("Open details", "فتح التفاصيل")}</Button>
            </div>
          </Card>
        ))}
      </div>
      {!queue.length && <EmptyState title={t("Nothing is waiting for review", "لا شيء بانتظار المراجعة")} description={t("Generate questions to fill this queue. Approved questions move to the repository.", "ولّد أسئلة لتمتلئ هذه القائمة. تنتقل الأسئلة المعتمدة إلى المستودع.")} />}
      <ConceptsDialog q={conceptsFor} onClose={() => setConceptsFor(null)} />
    </div>
  );
}
