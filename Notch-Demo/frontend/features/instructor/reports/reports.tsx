"use client";
import { Download, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/features/instructor/portal/forms";
import { NOW } from "@/features/instructor/dashboard/data";
import { SCALE, type Level } from "@/features/instructor/analytics/data";
import { Bars, DistBar, Section, Trend } from "@/features/instructor/analytics/ui";
import { CRITERIA, type Copy } from "./data";
import type { Page } from "./use-reports";

export type Cat = "progress" | "gaps" | "assessment" | "readiness";
export const CATS: { id: Cat; title: Copy; blurb: Copy; sections: { id: string; title: Copy }[] }[] = [
  { id: "progress", title: ["Course Progress Report", "تقرير تقدم المقرر"], blurb: ["Completion, activity, mastery and learning progress.", "الإنجاز والنشاط والإتقان وتقدم التعلم."], sections: [
    { id: "completion", title: ["Course completion", "إنجاز المقرر"] }, { id: "activity", title: ["Student activity", "نشاط الطلاب"] }, { id: "mastery", title: ["Concept mastery", "إتقان المفاهيم"] }, { id: "learning", title: ["Learning progress", "تقدم التعلم"] }] },
  { id: "gaps", title: ["Knowledge Gaps Report", "تقرير الفجوات المعرفية"], blurb: ["Weak concepts, bottlenecks and students needing remediation.", "المفاهيم الضعيفة والعوائق والطلاب المحتاجون إلى علاج."], sections: [
    { id: "weak", title: ["Weak concepts", "المفاهيم الضعيفة"] }, { id: "bottlenecks", title: ["Prerequisite bottlenecks", "عوائق المتطلبات"] }, { id: "remediation", title: ["Students requiring remediation", "طلاب يحتاجون إلى علاج"] }] },
  { id: "assessment", title: ["Assessment Performance Report", "تقرير أداء التقييمات"], blurb: ["Official scores, question-level results and frequently missed concepts.", "الدرجات الرسمية ونتائج الأسئلة والمفاهيم الأكثر إخفاقًا."], sections: [
    { id: "scores", title: ["Assessment scores (official)", "درجات التقييمات (رسمية)"] }, { id: "questions", title: ["Question-level performance", "الأداء على مستوى الأسئلة"] }, { id: "missed", title: ["Concepts frequently missed", "المفاهيم الأكثر إخفاقًا"] }] },
  { id: "readiness", title: ["Exam Readiness Report", "تقرير الجاهزية للامتحان"], blurb: ["Readiness estimates, revision needs and concepts to reteach.", "تقديرات الجاهزية واحتياجات المراجعة والمفاهيم المطلوب إعادة تدريسها."], sections: [
    { id: "estimates", title: ["Readiness estimates", "تقديرات الجاهزية"] }, { id: "revision", title: ["Students requiring revision", "طلاب يحتاجون إلى مراجعة"] }, { id: "teaching", title: ["Concepts requiring additional teaching", "مفاهيم تحتاج تدريسًا إضافيًا"] }] },
];
export const defaultChosen = (): Record<Cat, string[]> => ({ progress: CATS[0].sections.map((s) => s.id), gaps: CATS[1].sections.map((s) => s.id), assessment: CATS[2].sections.map((s) => s.id), readiness: CATS[3].sections.map((s) => s.id) });

type Table = { head: string[]; rows: (string | number)[][]; note?: string; chart?: React.ReactNode };

/** One source for the on-screen preview and the CSV, so what you see is what you export. */
function tables(p: Page, cat: Cat): Record<string, Table> {
  const { t, num, model, course, threshold, content } = p;
  const m = model.m;
  const pct = (v: number | null) => (v === null ? t("n/a", "غير متاح") : `${num(v)}%`);
  const stats = m.studentStats;
  const out: Record<string, Table> = {};
  if (cat === "progress") {
    out.completion = { head: [t("Student", "الطالب"), t("Course completion", "إنجاز المقرر"), t("Last active (days)", "آخر نشاط (أيام)")], rows: stats.map((s) => [s.student.name, pct(s.completion), s.student.lastActiveDays]), note: t(`Average completion ${pct(stats.length ? Math.round(stats.reduce((a, s) => a + s.completion, 0) / stats.length) : null)} of lectures and labs.`, `متوسط الإنجاز ${pct(stats.length ? Math.round(stats.reduce((a, s) => a + s.completion, 0) / stats.length) : null)} من المحاضرات والمعامل.`) };
    const weeks = Math.max(...stats.map((s) => s.weekly.length), 1);
    out.activity = { head: [t("Student", "الطالب"), t("Practice sessions (30 days)", "جلسات التدريب (30 يومًا)"), t("Questions answered", "أسئلة مجابة"), t("Active now", "نشط الآن")], rows: stats.map((s) => [s.student.name, s.sessions, s.questions, s.active ? t("Yes", "نعم") : t("No", "لا")]),
      chart: <Bars values={Array.from({ length: weeks }, (_, j) => stats.reduce((a, s) => a + (s.weekly[j + s.weekly.length - weeks] ?? 0), 0))} label={t("Weekly sessions", "الجلسات الأسبوعية")} className="h-20" /> };
    const dist: Record<Level, number> = { low: 0, developing: 0, high: 0, none: 0 };
    for (const s of m.students) for (const n of m.allNodes) dist[m.cell(s.id, n.key).level]++;
    out.mastery = { head: [t("Concept", "المفهوم"), t("Average mastery (estimate)", "متوسط الإتقان (تقدير)"), t("Students struggling", "طلاب متعثرون"), t("Students with evidence", "طلاب لديهم أدلة")], rows: m.allNodes.map((n) => { const c = m.conceptStats.get(n.key)!; return [t(n.title), pct(c.avg), c.struggling, c.evidence]; }), chart: <DistBar dist={dist} label={t("Mastery distribution across all student-concept pairs", "توزيع الإتقان عبر كل أزواج الطالب-المفهوم")} /> };
    const series = Array.from({ length: stats[0]?.series.length ?? 0 }, (_, i) => { const v = stats.flatMap((s) => (s.series[i] == null ? [] : [s.series[i] as number])); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; });
    out.learning = { head: [t("Student", "الطالب"), t("Mastery now (estimate)", "الإتقان الآن (تقدير)"), t("Change over 30 days (points)", "التغيّر خلال 30 يومًا (نقاط)")], rows: stats.map((s) => [s.student.name, pct(s.avg), s.delta === null ? t("n/a", "غير متاح") : `${s.delta > 0 ? "+" : ""}${num(s.delta)}`]), chart: <Trend values={series} label={t("Class mastery trend", "اتجاه إتقان الصف")} labels={[p.date(m.period.from), p.date(m.period.to)]} className="max-w-md" /> };
  }
  if (cat === "gaps") {
    const weak = [...m.conceptStats.values()].filter((c) => c.low).sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0));
    out.weak = { head: [t("Concept", "المفهوم"), t("Average mastery (estimate)", "متوسط الإتقان (تقدير)"), t("Students struggling", "طلاب متعثرون"), t("Suggested action", "الإجراء المقترح")], rows: weak.map((c) => [t(c.node.title), pct(c.avg), c.struggling, t(c.actions[0])]) };
    out.bottlenecks = { head: [t("Prerequisite", "المتطلب"), t("Average mastery (estimate)", "متوسط الإتقان (تقدير)"), t("Struggling students traced to it", "متعثرون مرتبطون به"), t("Holds back", "يعيق")], rows: m.bottlenecks.map((b) => [t(b.node.title), pct(b.avg), b.linked, b.dependents.map((d) => t(d.title)).join(", ")]) };
    out.remediation = { head: [t("Student", "الطالب"), t("Concepts below 50%", "مفاهيم دون 50٪"), t("Last active (days)", "آخر نشاط (أيام)")], rows: stats.filter((s) => s.remediation.length).map((s) => [s.student.name, s.remediation.map((n) => t(n.title)).join(", "), s.student.lastActiveDays]) };
  }
  if (cat === "assessment") {
    const list = content.assignments.filter((a) => a.courseId === course.id).map((a) => {
      const graded = content.submissions.filter((s) => s.assignmentId === a.id && s.status === "graded" && s.grade != null);
      const avg = graded.length ? Math.round(graded.reduce((x, s) => x + ((s.grade as number) / a.maxGrade) * 100, 0) / graded.length) : null;
      return { a, n: graded.length, avg };
    }).filter((x) => x.n > 0);
    out.scores = { head: [t("Assessment", "التقييم"), t("Type", "النوع"), t("Graded submissions", "التسليمات المصححة"), t("Average score (official)", "متوسط الدرجة (رسمي)"), t("Course weight", "وزن المقرر")], rows: list.map((x) => [t(x.a.title), x.a.kind, x.n, pct(x.avg), `${num(x.a.weight)}%`]) };
    const missed = [...m.conceptStats.values()].flatMap((c) => c.missed.map((q) => ({ c, q }))).sort((a, b) => b.q.rate - a.q.rate).slice(0, 8);
    out.questions = { head: [t("Question", "السؤال"), t("Concept", "المفهوم"), t("Missed", "نسبة الإخفاق"), t("Attempts", "المحاولات")], rows: missed.map((x) => [t(x.q.prompt), t(x.c.node.title), `${num(x.q.rate)}%`, x.q.seen]), note: t("Question-level figures are estimated from practice attempts, not from graded exams.", "أرقام الأسئلة تقديرية من محاولات التدريب وليست من امتحانات مصححة.") };
    out.missed = { head: [t("Concept", "المفهوم"), t("Average missed rate", "متوسط نسبة الإخفاق"), t("Students struggling", "طلاب متعثرون")], rows: [...m.conceptStats.values()].map((c) => ({ c, r: Math.round(c.missed.reduce((a, q) => a + q.rate, 0) / Math.max(1, c.missed.length)) })).sort((a, b) => b.r - a.r).slice(0, 8).map((x) => [t(x.c.node.title), `${num(x.r)}%`, x.c.struggling]) };
  }
  if (cat === "readiness") {
    out.estimates = { head: [t("Student", "الطالب"), t("Readiness (estimate)", "الجاهزية (تقدير)"), t("Status", "الحالة")], rows: [...model.students].sort((a, b) => (a.readiness ?? 101) - (b.readiness ?? 101)).map((s) => [s.stat.student.name, pct(s.readiness), s.state === "ready" ? t("Ready", "جاهز") : s.state === "revision" ? t("Revision needed", "يحتاج مراجعة") : t("Not enough evidence", "أدلة غير كافية")]), note: t(`Overall estimate ${pct(model.overview.overall)}. Estimates are not grades or predictions.`, `التقدير العام ${pct(model.overview.overall)}. التقديرات ليست درجات أو توقعات.`) };
    out.revision = { head: [t("Student", "الطالب"), t("Concepts to revise", "مفاهيم للمراجعة"), t("Suggested action", "الإجراء المقترح")], rows: model.students.filter((s) => s.state === "revision").map((s) => [s.stat.student.name, s.weak.map((w) => `${t(w.node.title)} (${num(w.m)}%)`).join(", ") || "—", t(s.action)]) };
    out.teaching = { head: [t("Concept", "المفهوم"), t("Exam weight", "وزن الامتحان"), t("Average mastery (estimate)", "متوسط الإتقان (تقدير)"), t("Priority", "الأولوية")], rows: [...model.concepts].filter((c) => c.priority !== "low").sort((a, b) => b.score - a.score).map((c) => [t(c.node.title), `${num(c.weight)}%`, pct(c.avg), c.priority === "high" ? t("High", "مرتفعة") : t("Medium", "متوسطة")]) , note: t(`Mastery threshold ${threshold}%.`, `عتبة الإتقان ${num(threshold)}٪.`) };
  }
  return out;
}

const csvCell = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function downloadCsv(p: Page, cat: Cat, ids: string[]) {
  const def = CATS.find((c) => c.id === cat)!;
  const data = tables(p, cat);
  const lines = [[p.t(def.title)], [p.t("Course", "المقرر"), `${p.course.code} ${p.t(p.course.title)}`], [p.t("Academic term", "الفصل الأكاديمي"), p.t(p.term.label)], [p.t("Generated", "تاريخ الإنشاء"), NOW.slice(0, 10)], [p.t("Note", "ملاحظة"), p.t("Mastery and readiness are estimates, not official grades.", "الإتقان والجاهزية تقديران وليسا درجات رسمية.")], []].map((r) => r.map(csvCell).join(","));
  for (const s of def.sections.filter((x) => ids.includes(x.id))) {
    const tb = data[s.id];
    lines.push(`# ${p.t(s.title)}`, tb.head.map(csvCell).join(","), ...tb.rows.map((r) => r.map(csvCell).join(",")), "");
  }
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${cat}-report-${p.course.id}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

const printCss = `@media print{body *{visibility:hidden!important}#report-print,#report-print *{visibility:visible!important}#report-print{position:absolute;inset:0;width:100%;border:0!important;box-shadow:none!important}}`;

/* 7 and 8. Course reports */
export function Reports({ p, cat, setCat, chosen, setChosen }: { p: Page; cat: Cat; setCat: (c: Cat) => void; chosen: Record<Cat, string[]>; setChosen: (c: Record<Cat, string[]>) => void }) {
  const { t, num, model, course, term, date } = p;
  const def = CATS.find((c) => c.id === cat)!;
  const ids = chosen[cat];
  const data = tables(p, cat);
  const m = model.m;
  const cells = m.students.length * m.allNodes.length;
  const withEv = m.students.reduce((a, s) => a + m.allNodes.filter((n) => m.cell(s.id, n.key).mastery !== null).length, 0);
  const noReadiness = cat === "readiness" && !term.current;
  const toggle = (id: string) => setChosen({ ...chosen, [cat]: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
  const measure = (label: Copy, tone: "ai" | "progress" | "success", body: Copy) => <li className="flex items-start gap-2"><Badge tone={tone} className="mt-0.5">{t(label)}</Badge><span>{t(body)}</span></li>;
  return (
    <Section id="reports" title={t("Course reports", "تقارير المقرر")} description={t("Preview a report, choose its sections, then export it as CSV or save it as PDF.", "عاين التقرير واختر أقسامه ثم صدّره بصيغة CSV أو احفظه PDF.")}>
      <style>{printCss}</style>
      <div role="tablist" aria-label={t("Report categories", "فئات التقارير")} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {CATS.map((c) => <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={cn("rounded-xl border bg-card p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", cat === c.id ? "border-primary bg-secondary/40" : "hover:border-primary/40")}><FileText className="mb-2 size-5 text-primary" aria-hidden="true" /><span className="block font-semibold">{t(c.title)}</span><span className="mt-1 block text-sm text-muted-foreground">{t(c.blurb)}</span></button>)}
      </div>
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
        <fieldset className="flex flex-wrap items-center gap-3"><legend className="sr-only">{t("Report sections", "أقسام التقرير")}</legend>
          {def.sections.map((s) => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={ids.includes(s.id)} onChange={() => toggle(s.id)} />{t(s.title)}</label>)}
        </fieldset>
        <div className="ms-auto flex flex-wrap gap-2">
          <Button variant="outline" disabled={!ids.length || noReadiness} onClick={() => { downloadCsv(p, cat, ids); p.say(t(`Downloaded ${def.title[0]} as CSV.`, `تم تنزيل ${def.title[1]} بصيغة CSV.`)); }}><Download aria-hidden="true" />{t("Download CSV", "تنزيل CSV")}</Button>
          <Button disabled={!ids.length || noReadiness} onClick={() => window.print()}><Printer aria-hidden="true" />{t("Save as PDF", "حفظ بصيغة PDF")}</Button>
        </div>
      </Card>
      <p className="-mt-2 text-xs text-muted-foreground">{t("PDF opens your browser's print dialog: choose “Save as PDF”.", "يفتح PDF مربع الطباعة في المتصفح: اختر «حفظ بصيغة PDF».")}</p>
      {noReadiness ? <EmptyState title={t("No readiness report for past terms", "لا تقرير جاهزية للفصول السابقة")} description={t("Exam readiness is only estimated for the current term, from live practice evidence.", "تُقدَّر الجاهزية للامتحان للفصل الحالي فقط، من أدلة التدريب الحية.")} /> : !ids.length ? <EmptyState title={t("No sections selected", "لم تُحدَّد أقسام")} description={t("Select at least one section to preview the report.", "حدّد قسمًا واحدًا على الأقل لمعاينة التقرير.")} /> : (
        <article id="report-print" aria-label={t(def.title)} className="space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
          <header className="space-y-2 border-b pb-5">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{t("Course report", "تقرير المقرر")}</p>
            <h3 className="text-2xl font-semibold tracking-tight">{t(def.title)}</h3>
            <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-muted-foreground">{t("Course", "المقرر")}</dt><dd className="font-medium">{course.code} · {t(course.title)}</dd></div>
              <div><dt className="text-muted-foreground">{t("Academic term", "الفصل الأكاديمي")}</dt><dd className="font-medium">{t(term.label)}</dd></div>
              <div><dt className="text-muted-foreground">{t("Generated", "تاريخ الإنشاء")}</dt><dd className="font-medium">{date(NOW, { day: "numeric", month: "long", year: "numeric" })}</dd></div>
              {cat === "readiness" && <div><dt className="text-muted-foreground">{t("Exam", "الامتحان")}</dt><dd className="font-medium">{t(p.exam.title)} · {date(p.exam.date)}</dd></div>}
            </dl>
            {!term.current && <p className="rounded-lg bg-warning-soft p-2 text-sm text-warning-ink">{t("Archived term: figures are a mock snapshot built from the current roster.", "فصل مؤرشف: الأرقام لقطة تجريبية مبنية على قائمة الطلاب الحالية.")}</p>}
          </header>
          {ids.map((id) => {
            const s = def.sections.find((x) => x.id === id)!;
            const tb = data[id];
            return (
              <section key={id} aria-label={t(s.title)} className="space-y-3 break-inside-avoid">
                <h4 className="text-lg font-semibold">{t(s.title)}</h4>
                {tb.chart}
                {tb.rows.length ? (
                  <div className="overflow-x-auto rounded-xl border"><table className="w-full text-start text-sm"><thead className="bg-muted/60"><tr>{tb.head.map((h) => <th key={h} scope="col" className="p-2.5 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{tb.rows.map((r, i) => <tr key={i} className="border-t">{r.map((v, j) => j === 0 ? <th key={j} scope="row" className="p-2.5 text-start font-medium">{v}</th> : <td key={j} className="p-2.5">{v}</td>)}</tr>)}</tbody></table></div>
                ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("Nothing to report here: there is no data, or not enough evidence, for this section.", "لا شيء للإبلاغ عنه هنا: لا توجد بيانات أو أدلة كافية لهذا القسم.")}</p>}
                {tb.note && <p className="text-xs text-muted-foreground">{tb.note}</p>}
              </section>
            );
          })}
          <footer className="grid gap-6 border-t pt-5 text-sm md:grid-cols-2">
            <div><h4 className="mb-2 font-semibold">{t("Definitions", "التعريفات")}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {measure(["Mastery estimate", "تقدير الإتقان"], "ai", [`How well a student appears to know a concept, estimated from practice (3+ attempts). Low below ${SCALE.low}%, high from ${SCALE.high}%. Not a grade.`, `مدى إتقان الطالب لمفهوم، مقدّرًا من التدريب (3 محاولات فأكثر). منخفض أقل من ${SCALE.low}٪ ومرتفع من ${SCALE.high}٪. ليس درجة.`])}
                {measure(["Readiness estimate", "تقدير الجاهزية"], "progress", [`Mastery of an exam's concepts weighted by exam share, less a prerequisite deduction (≤ ${CRITERIA.maxPenalty} points). Not a prediction.`, `إتقان مفاهيم الامتحان مرجّحًا بحصتها منه، بعد خصم للمتطلبات (حتى ${CRITERIA.maxPenalty} نقاط). ليس توقعًا.`])}
                {measure(["Official grade", "الدرجة الرسمية"], "success", ["A score from a graded assessment, recorded by the instructor. Only these are grades.", "درجة من تقييم مصحَّح سجّلها المدرّس. هذه وحدها هي الدرجات."])}
              </ul></div>
            <div><h4 className="mb-2 font-semibold">{t("Data coverage", "تغطية البيانات")}</h4>
              <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
                <li>{t(`${m.students.length} students, ${m.allNodes.length} concepts, last 30 days up to ${date(NOW)}.`, `${num(m.students.length)} طلاب و${num(m.allNodes.length)} مفهومًا، آخر 30 يومًا حتى ${date(NOW)}.`)}</li>
                <li>{t(`${cells ? Math.round((withEv / cells) * 100) : 0}% of student–concept pairs have enough practice evidence.`, `${num(cells ? Math.round((withEv / cells) * 100) : 0)}٪ من أزواج الطالب-المفهوم لديها أدلة تدريب كافية.`)}</li>
                <li>{t(`${model.overview.insufficient} students lack enough evidence for a readiness estimate.`, `${num(model.overview.insufficient)} طلاب بلا أدلة كافية لتقدير الجاهزية.`)}</li>
                <li>{t("Demo data: fictional students and mock activity.", "بيانات تجريبية: طلاب وهميون ونشاط افتراضي.")}</li>
              </ul></div>
          </footer>
        </article>
      )}
    </Section>
  );
}
