"use client";
import { useState } from "react";
import { Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditorDialog, NativeSelect, Status } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { groups, ranges, SCALE, type Range } from "./data";
import { useAnalytics, type Analytics } from "./use-analytics";
import { Concepts, Heatmap, Prerequisites } from "./mastery";
import { AtRisk, Engagement, Progress, StudentDrawer } from "./people";
import { Stat } from "./ui";

const SECTIONS = ["heatmap", "concepts", "prerequisites", "progress", "engagement", "risk"] as const;
type SectionId = (typeof SECTIONS)[number];
const sectionLabel: Record<SectionId, [string, string]> = {
  heatmap: ["Mastery heatmap", "خريطة الإتقان"], concepts: ["Concept analytics", "تحليلات المفاهيم"], prerequisites: ["Prerequisite analysis", "تحليل المتطلبات"],
  progress: ["Student progress", "تقدم الطلاب"], engagement: ["Engagement", "المشاركة"], risk: ["At-risk students", "الطلاب المعرضون للتعثر"],
};

const csv = (rows: (string | number | null)[][]) => rows.map((r) => r.map((v) => { const s = v === null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(",")).join("\n");

function buildExport(a: Analytics, chosen: SectionId[]) {
  const { model, filters } = a;
  const en = (c: readonly [string, string]) => c[0];
  const blocks: string[] = [csv([["Learning Analytics export"], ["Course", filters.course], ["Period (days)", filters.range], ["Group", filters.group], ["Note", "Mastery is an estimate from practice evidence, not an official grade. Blank = insufficient evidence."]])];
  const bySection: Record<SectionId, () => string> = {
    heatmap: () => csv([["Student", "Average", ...model.shown.map((n) => `${n.course.code} ${en(n.title)}`)], ...model.studentStats.map((r) => [r.student.name, r.avg, ...model.shown.map((n) => model.cell(r.student.id, n.key).mastery)])]),
    concepts: () => csv([["Concept", "Course", "Average mastery", "Students struggling", "Students with evidence", "Interactions", "Difficulty", "Prerequisites"], ...model.shown.map((n) => { const c = model.conceptStats.get(n.key)!; return [en(n.title), n.course.code, c.avg, c.struggling, c.evidence, c.attempts, c.difficulty, model.prereqNodes(n).map((p) => en(p.title)).join("; ")]; })]),
    prerequisites: () => csv([["Prerequisite", "Concept", "Struggling students", "Also weak in prerequisite"], ...model.edges.map((e) => [en(e.from.title), en(e.to.title), e.strugglingTo, e.linked])]),
    progress: () => csv([["Student", "Mastery (est.)", "Change", "Sessions", "Questions", "Assessment (official)", "Mastered", "Needs remediation"], ...model.studentStats.map((r) => [r.student.name, r.avg, r.delta, r.sessions, r.questions, r.assessment, r.mastered.length, r.remediation.length])]),
    engagement: () => csv([["Student", "Active", "Days since last activity", "Sessions", "Questions", "Completion %"], ...model.studentStats.map((r) => [r.student.name, r.active ? "yes" : "no", r.student.lastActiveDays, r.sessions, r.questions, r.completion])]),
    risk: () => csv([["Student", "Course", "Severity", "Main difficulty", "Low-mastery concepts", "Reasons", "Suggested action"], ...model.risks.map((r) => [r.risk.student.name, r.risk.course.code, r.risk.severity, en(r.main), r.low.map((n) => en(n.title)).join("; "), r.risk.reasons.map((x) => en(x.text)).join("; "), en(r.risk.action)])]),
  };
  for (const id of chosen) blocks.push(`# ${en(sectionLabel[id])}\n${bySection[id]()}`);
  return blocks.join("\n\n");
}

export function LearningAnalytics() {
  const a = useAnalytics();
  const { t, num, model, filters, assigned, date } = a;
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<SectionId[]>([...SECTIONS]);
  const [notice, setNotice] = useState("");
  const o = model.overview;
  const doExport = () => {
    if (!chosen.length) return;
    const blob = new Blob(["﻿" + buildExport(a, chosen)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `learning-analytics-${filters.course}-${filters.range}d.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setNotice(t(`Exported ${chosen.length} section(s) as CSV.`, `تم تصدير ${num(chosen.length)} قسم بصيغة CSV.`)); setOpen(false);
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle eyebrow={t("LEARNING ANALYTICS", "تحليلات التعلم")} title={t("Learning Analytics", "تحليلات التعلم")} description={t("Analyze student progress, knowledge mastery, and learning difficulties across your courses.", "حلّل تقدم الطلاب وإتقان المعرفة وصعوبات التعلم عبر مقرراتك.")}
        action={<Button onClick={() => setOpen(true)}><Download aria-hidden="true" />{t("Export report", "تصدير التقرير")}</Button>} />
      <div role="search" aria-label={t("Analytics filters", "مرشحات التحليلات")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Course", "المقرر")}<NativeSelect value={filters.course} onChange={(e) => { a.setCourse(e.target.value); a.setConcept("all"); a.setFocus(null); }}><option value="all">{t("All my courses", "كل مقرراتي")}</option>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Date range", "الفترة الزمنية")}<NativeSelect value={filters.range} onChange={(e) => a.setRange(Number(e.target.value) as Range)}>{ranges.map((r) => <option key={r.id} value={r.id}>{t(r.label)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Student group", "مجموعة الطلاب")}<NativeSelect value={filters.group} onChange={(e) => a.setGroup(e.target.value)}>{groups.map((g) => <option key={g.id} value={g.id}>{t(g.label)}</option>)}</NativeSelect></label>
        <p className="self-end pb-3 text-xs text-muted-foreground">{date(model.period.from)} – {date(model.period.to)}</p>
      </div>
      <div role="status" aria-live="polite" className="-mt-4 min-h-5">{notice && <Status message={notice} />}</div>

      <section aria-label={t("Overview", "نظرة عامة")} className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <Stat label={t("Enrolled students", "الطلاب المسجلون")} value={num(o.enrolled)} note={t(`${model.inScope.length} course(s)`, `${num(model.inScope.length)} مقرر`)} />
          <Stat label={t("Active students", "الطلاب النشطون")} value={num(o.active)} note={t("Practised in the last 3 days", "تدرّبوا خلال آخر 3 أيام")} />
          <Stat label={t("Average knowledge mastery", "متوسط إتقان المعرفة")} tag={t("Estimated", "تقديري")} value={o.avgMastery === null ? "—" : `${num(o.avgMastery)}%`} note={t("From practice evidence. Not a grade.", "من أدلة التدريب. ليس درجة.")} />
          <Stat label={t("Students at risk", "طلاب معرضون للتعثر")} tone={o.atRisk ? "danger" : undefined} value={num(o.atRisk)} note={<a href="#risk" className="text-primary hover:underline">{t("See why", "اعرف السبب")}</a>} />
          <Stat label={t("Concepts with low mastery", "مفاهيم منخفضة الإتقان")} tone={o.lowConcepts ? "warning" : undefined} value={`${num(o.lowConcepts)}`} note={t(`of ${o.conceptCount} concepts`, `من ${num(o.conceptCount)} مفهومًا`)} />
          <Stat label={t("Progress vs previous period", "التقدم مقارنة بالفترة السابقة")} tone={o.delta === null ? undefined : o.delta >= 0 ? "success" : "danger"} value={o.delta === null ? "—" : `${o.delta > 0 ? "+" : ""}${num(o.delta)}`} note={t(`points of est. mastery since ${date(model.period.from)}`, `نقطة إتقان تقديري منذ ${date(model.period.from)}`)} />
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t(`Knowledge mastery is an estimate the platform builds from practice (at least ${SCALE.minEvidence} attempts per concept). It does not replace official grades, which come from graded assessments and appear separately.`, `إتقان المعرفة تقدير تبنيه المنصة من التدريب (ما لا يقل عن ${num(SCALE.minEvidence)} محاولات لكل مفهوم). لا يحل محل الدرجات الرسمية التي تأتي من التقييمات المصحّحة وتظهر منفصلة.`)}</p>
      </section>

      <nav aria-label={t("Sections", "الأقسام")} className="sticky top-16 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-xl border bg-card/95 p-2 backdrop-blur">
        {SECTIONS.map((id) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{t(sectionLabel[id][0], sectionLabel[id][1])}</a>)}
      </nav>

      <Heatmap a={a} />
      <Concepts a={a} />
      <Prerequisites a={a} />
      <Progress a={a} />
      <Engagement a={a} />
      <AtRisk a={a} />
      <StudentDrawer a={a} />

      <EditorDialog open={open} onOpenChange={setOpen} title={t("Export analytics", "تصدير التحليلات")} description={t("Choose what to include. The export respects your current course, date range and group filters.", "اختر ما تريد تضمينه. يراعي التصدير مرشحات المقرر والفترة والمجموعة الحالية.")} submitLabel={t("Download CSV", "تنزيل CSV")} onSubmit={doExport}>
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">{t("Sections", "الأقسام")}</legend>
          {SECTIONS.map((id) => <label key={id} className="flex items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={chosen.includes(id)} onChange={() => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))} />{t(sectionLabel[id][0], sectionLabel[id][1])}</label>)}
          {!chosen.length && <p className="text-sm text-danger">{t("Select at least one section.", "اختر قسمًا واحدًا على الأقل.")}</p>}
        </fieldset>
      </EditorDialog>
      <Card className="sr-only"><span>{num(model.students.length)}</span></Card>
    </div>
  );
}
