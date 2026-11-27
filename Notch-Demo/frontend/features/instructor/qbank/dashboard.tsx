"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, FileCheck2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Status } from "@/features/instructor/portal/forms";
import { Metric, PageTitle, SectionTitle } from "@/features/instructor/portal/ui";
import { concepts, diffs, diffLabel, lectureOf, qtypes, sum, typeLabel, type Bank } from "./data";
import { useQb, type Tab } from "./store";
import { useQ } from "./shared";
import { QbProvider } from "./detail";
import { QuestionTable } from "./repository";
import { PendingReview } from "./pending";
import { ExamStyleEditor } from "./exam-style";
import { GenerateWizard } from "./wizard";
import { ExamSimulation } from "./exam-sim";

function bankStats(all: ReturnType<typeof useQb.getState>["questions"], bank: Bank) {
  const mine = all.filter((q) => q.bank === bank && q.status !== "archived");
  const ok = mine.filter((q) => q.status === "approved");
  const count = <K extends string>(keys: K[], pick: (q: (typeof ok)[number]) => string) => Object.fromEntries(keys.map((k) => [k, ok.filter((q) => pick(q) === k).length])) as Record<K, number>;
  const perConcept = Object.fromEntries(concepts.filter((c) => c.approved).map((c) => [c.id, { approved: ok.filter((q) => q.conceptIds.includes(c.id)).length, total: mine.filter((q) => q.conceptIds.includes(c.id)).length }]));
  return {
    total: mine.filter((q) => q.status !== "rejected").length + mine.filter((q) => q.status === "rejected").length,
    approved: ok.length,
    pending: mine.filter((q) => q.status === "pending").length,
    rejected: mine.filter((q) => q.status === "rejected").length,
    byDiff: count(diffs, (q) => q.difficulty),
    byType: count(qtypes, (q) => q.type),
    perConcept,
    covered: Object.values(perConcept).filter((c) => c.approved > 0).length,
  };
}
type Stats = ReturnType<typeof bankStats>;

function Bars({ rows, total }: { rows: { key: string; label: string; n: number }[]; total: number }) {
  const { num } = useQ();
  return (
    <ul className="space-y-2">
      {rows.filter((r) => r.n > 0 || total === 0).map((r) => (
        <li key={r.key} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-2 text-sm"><span className="truncate">{r.label}</span><Progress value={total ? (r.n / total) * 100 : 0} aria-label={r.label} /><span className="text-end tabular-nums">{num(r.n)}</span></li>
      ))}
    </ul>
  );
}

function ConceptsView({ bank }: { bank: Bank }) {
  const { t, num, conceptName, lectureName, text } = useQ();
  const questions = useQb((s) => s.questions);
  const other: Bank = bank === "practice" ? "exam" : "practice";
  const sp = useMemo(() => bankStats(questions, "practice"), [questions]);
  const se = useMemo(() => bankStats(questions, "exam"), [questions]);
  const open = (b: Bank, id: string) => { const s = useQb.getState(); s.setBank(b); s.setFilters(b, { concept: id, status: "all" }); s.setTab(b, "questions"); };
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t("Questions are organized by approved knowledge concepts, because Adaptive tracks mastery per concept. A question can belong to several concepts.", "تُنظَّم الأسئلة بحسب المفاهيم المعتمدة لأن المنصة تتتبع الإتقان لكل مفهوم. يمكن أن ينتمي السؤال إلى عدة مفاهيم.")}</p>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <caption className="sr-only">{t("Questions per concept", "الأسئلة لكل مفهوم")}</caption>
          <thead className="bg-muted/60"><tr>{[t("Concept", "المفهوم"), t("Lecture", "المحاضرة"), t("Practice (approved / all)", "التدريب (معتمد / الكل)"), t("Exam prep (approved / all)", "التحضير (معتمد / الكل)"), t("Open", "فتح")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>
            {concepts.filter((c) => c.approved).map((c) => (
              <tr key={c.id} className="border-t">
                <th scope="row" className="p-3 text-start font-medium">{conceptName(c.id)}</th>
                <td className="p-3 text-muted-foreground">{lectureName(c.lecture)} · {text(lectureOf(c.lecture)!.title)}</td>
                <td className="p-3 tabular-nums">{num(sp.perConcept[c.id].approved)} / {num(sp.perConcept[c.id].total)}{sp.perConcept[c.id].approved === 0 && <Badge tone="warning" className="ms-2">{t("No approved", "لا معتمد")}</Badge>}</td>
                <td className="p-3 tabular-nums">{num(se.perConcept[c.id].approved)} / {num(se.perConcept[c.id].total)}</td>
                <td className="p-3"><div className="flex flex-wrap gap-1"><Button size="sm" variant={bank === "practice" ? "default" : "outline"} onClick={() => open("practice", c.id)} aria-label={t(`Practice questions for ${conceptName(c.id)}`, `أسئلة التدريب لـ ${conceptName(c.id)}`)}>{t("Practice", "التدريب")}</Button><Button size="sm" variant={bank === "exam" ? "default" : "outline"} onClick={() => open("exam", c.id)} aria-label={t(`Exam questions for ${conceptName(c.id)}`, `أسئلة الامتحان لـ ${conceptName(c.id)}`)}>{t("Exam prep", "التحضير")}</Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <span className="sr-only">{other}</span>
    </div>
  );
}

function BankPanel({ bank, stats, onSim }: { bank: Bank; stats: Stats; onSim: () => void }) {
  const { t, num } = useQ();
  const style = useQb((s) => s.style);
  const exam = bank === "exam";
  const target = style.typePct;
  const actual = (k: (typeof qtypes)[number]) => (stats.approved ? (stats.byType[k] / stats.approved) * 100 : 0);
  const fit = Math.max(0, Math.round(100 - (qtypes.reduce((a, k) => a + Math.abs(actual(k) - (target[k] ?? 0)), 0) / 2)));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label={t("Total questions", "إجمالي الأسئلة")} value={num(stats.total)} detail={t(`${num(stats.rejected)} rejected`, `${num(stats.rejected)} مرفوض`)} icon={ClipboardList} />
        <Metric label={t("Approved", "المعتمدة")} value={num(stats.approved)} detail={t("Available in Assessment Center", "متاحة في مركز التقييم")} icon={FileCheck2} />
        <Metric label={t("Pending review", "بانتظار المراجعة")} value={num(stats.pending)} detail={t("Needs your decision", "تحتاج قرارك")} />
        <Metric label={exam ? t("Exam-style fit", "ملاءمة أسلوب الامتحان") : t("Concept coverage", "تغطية المفاهيم")} value={exam ? `${num(fit)}%` : `${num(stats.covered)}/${num(Object.keys(stats.perConcept).length)}`} detail={exam ? t("Approved mix vs configured mix", "المزيج المعتمد مقابل المهيأ") : t("Concepts with an approved question", "مفاهيم لها سؤال معتمد")} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5"><SectionTitle title={t("Approved by difficulty", "المعتمد حسب الصعوبة")} /><Bars total={stats.approved} rows={diffs.map((d) => ({ key: d, label: t(diffLabel[d]), n: stats.byDiff[d] }))} /></Card>
        <Card className="p-5"><SectionTitle title={t("Approved by type", "المعتمد حسب النوع")} /><Bars total={stats.approved} rows={qtypes.map((k) => ({ key: k, label: t(typeLabel[k]), n: stats.byType[k] }))} /></Card>
      </div>
      {exam ? (
        <Card className="p-5">
          <SectionTitle title={t("Configured examination structure", "هيكل الامتحان المهيأ")} description={t("Edit it in the Exam style tab. It guides generation and the exam simulation.", "عدّله في تبويب أسلوب الامتحان. يوجّه التوليد ومحاكاة الامتحان.")}>
            <Button onClick={onSim}><Play aria-hidden="true" />{t("Preview Exam Simulation", "معاينة محاكاة الامتحان")}</Button>
          </SectionTitle>
          <div className="grid gap-4 text-sm sm:grid-cols-4">
            <p><span className="block text-muted-foreground">{t("Questions", "الأسئلة")}</span><strong>{num(style.totalQuestions)}</strong></p>
            <p><span className="block text-muted-foreground">{t("Total marks", "إجمالي الدرجات")}</span><strong>{num(style.totalMarks)}</strong></p>
            <p><span className="block text-muted-foreground">{t("Time", "الزمن")}</span><strong>{num(style.minutes)} {t("min", "دقيقة")}</strong></p>
            <p><span className="block text-muted-foreground">{t("Style source", "مصدر الأسلوب")}</span><strong>{style.files.some((f) => f.status === "analyzed") ? t("Analyzed exams (simulated)", "امتحانات محللة (محاكاة)") : t("Manual", "يدوي")}</strong></p>
          </div>
          <table className="mt-4 w-full text-sm"><thead><tr className="text-muted-foreground"><th className="py-1 text-start font-medium">{t("Type", "النوع")}</th><th className="text-end font-medium">{t("Target", "المستهدف")}</th><th className="text-end font-medium">{t("Approved now", "المعتمد حاليًا")}</th></tr></thead>
            <tbody>{qtypes.filter((k) => (target[k] ?? 0) > 0 || stats.byType[k] > 0).map((k) => <tr key={k} className="border-t"><td className="py-1.5">{t(typeLabel[k])}</td><td className="text-end tabular-nums">{num(target[k] ?? 0)}%</td><td className="text-end tabular-nums">{num(Math.round(actual(k)))}%</td></tr>)}</tbody></table>
          {sum(style.typePct) !== 100 && <p role="alert" className="mt-2 text-sm text-danger">{t("The configured type mix does not total 100%.", "لا يبلغ مزيج الأنواع المهيأ 100%.")}</p>}
        </Card>
      ) : (
        <Card className="p-5">
          <SectionTitle title={t("Concept coverage", "تغطية المفاهيم")} />
          <Progress value={(stats.covered / Math.max(1, Object.keys(stats.perConcept).length)) * 100} aria-label={t("Concept coverage", "تغطية المفاهيم")} />
          <p className="mt-2 text-sm text-muted-foreground">{concepts.filter((c) => c.approved && stats.perConcept[c.id].approved === 0).length ? t("Concepts without an approved question: ", "مفاهيم بلا سؤال معتمد: ") + concepts.filter((c) => c.approved && stats.perConcept[c.id].approved === 0).map((c) => c.en).join(", ") : t("Every approved concept has at least one approved question.", "لكل مفهوم معتمد سؤال معتمد واحد على الأقل.")}</p>
        </Card>
      )}
    </div>
  );
}

function Inner() {
  const { t, num } = useQ();
  const questions = useQb((s) => s.questions);
  const bank = useQb((s) => s.bank);
  const tabs = useQb((s) => s.tab);
  const notice = useQb((s) => s.notice);
  const [wizard, setWizard] = useState(false);
  const [sim, setSim] = useState(false);
  const sp = useMemo(() => bankStats(questions, "practice"), [questions]);
  const se = useMemo(() => bankStats(questions, "exam"), [questions]);
  const stats = bank === "practice" ? sp : se;
  const { setBank, setTab } = useQb.getState();
  const tab = tabs[bank];
  const list: [Tab, string, number | null][] = [["questions", t("Question repository", "مستودع الأسئلة"), stats.approved], ["pending", t("Pending Review", "بانتظار المراجعة"), stats.pending], ["concepts", t("Concepts", "المفاهيم"), null], ...(bank === "exam" ? [["style", t("Exam style", "أسلوب الامتحان"), null] as [Tab, string, null]] : [])];
  return (
    <div className="space-y-7 animate-fade-in">
      <PageTitle
        eyebrow={t("QUESTION BANK", "بنك الأسئلة")}
        title={t("Build a trusted question bank.", "ابنِ بنك أسئلة موثوقًا.")}
        description={t("Generate, review and organize questions by approved concept. Probability & Statistics (STAT 201) · mock approved knowledge model. Generation and quality checks are simulated.", "ولّد الأسئلة وراجعها ونظّمها بحسب المفاهيم المعتمدة. الاحتمالات والإحصاء (STAT 201) · نموذج معرفة معتمد تجريبي. التوليد وفحوصات الجودة محاكاة.")}
        action={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/instructor/assessments">{t("Assessment Center", "مركز التقييم")}</Link></Button><Button size="lg" onClick={() => setWizard(true)}><Sparkles aria-hidden="true" />{t("Generate Questions", "توليد الأسئلة")}</Button></div>}
      />
      <div role="status" aria-live="polite" className="min-h-5">{notice && <Status message={notice} />}</div>
      <div role="tablist" aria-label={t("Question banks", "بنوك الأسئلة")} className="grid gap-4 md:grid-cols-2">
        {([["practice", t("Practice Question Bank", "بنك أسئلة التدريب"), t("Learn and master concepts with detailed feedback.", "تعلّم المفاهيم وأتقنها بتغذية راجعة مفصلة."), sp, "border-info"], ["exam", t("Exam Preparation Question Bank", "بنك أسئلة التحضير للامتحان"), t("Rehearse your examination style, marks and format.", "تمرّن على أسلوب امتحانك ودرجاته وصيغته."), se, "border-ai"]] as const).map(([id, title, purpose, s, border]) => (
          <button key={id} role="tab" type="button" id={`bank-${id}`} aria-selected={bank === id} onClick={() => setBank(id)} className={cn("rounded-2xl border-2 bg-card p-5 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", bank === id ? `${border} bg-secondary/30 shadow-xs` : "border-border hover:border-primary/40")}>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{purpose}</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span><strong className="tabular-nums">{num(s.total)}</strong> {t("total", "إجمالي")}</span><span className="text-success"><strong className="tabular-nums">{num(s.approved)}</strong> {t("approved", "معتمد")}</span><span className="text-warning"><strong className="tabular-nums">{num(s.pending)}</strong> {t("pending", "بانتظار")}</span></p>
          </button>
        ))}
      </div>
      <section role="tabpanel" aria-labelledby={`bank-${bank}`} className="space-y-6">
        <BankPanel bank={bank} stats={stats} onSim={() => setSim(true)} />
        <div role="tablist" aria-label={t("Bank sections", "أقسام البنك")} className="inline-flex flex-wrap rounded-xl border bg-muted/50 p-1">
          {list.map(([id, label, n]) => <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(bank, id)} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground")}>{label}{n !== null && <Badge tone={id === "pending" ? "warning" : "neutral"}>{num(n)}</Badge>}</button>)}
        </div>
        {tab === "questions" && <QuestionTable bank={bank} />}
        {tab === "pending" && <PendingReview bank={bank} />}
        {tab === "concepts" && <ConceptsView bank={bank} />}
        {tab === "style" && bank === "exam" && <ExamStyleEditor />}
      </section>
      <GenerateWizard key={wizard ? bank : "closed"} open={wizard} onClose={() => setWizard(false)} initialBank={bank} />
      <ExamSimulation open={sim} onClose={() => setSim(false)} />
    </div>
  );
}

export function QuestionBank() {
  return <QbProvider><Inner /></QbProvider>;
}
