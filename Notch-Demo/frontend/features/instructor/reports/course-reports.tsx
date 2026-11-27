"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, NativeSelect, Status } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { CRITERIA, TERMS } from "./data";
import { useReportsPage } from "./use-reports";
import { ConceptTable, Overview, ProfileSheet, StudentTable } from "./readiness";
import { Revision } from "./revision";
import { MockExam } from "./mock-exam";
import { defaultChosen, downloadCsv, Reports, type Cat } from "./reports";

const NAV = [["concepts", "Readiness analysis", "تحليل الجاهزية"], ["students", "Students", "الطلاب"], ["revision", "Revision planning", "تخطيط المراجعة"], ["mock", "Mock exam", "امتحان تجريبي"], ["reports", "Reports", "التقارير"]] as const;

export function CourseReports() {
  const p = useReportsPage();
  const { t, num, assigned, course, term, exams, exam, threshold, model, date } = p;
  const [cat, setCat] = useState<Cat>("readiness");
  const [chosen, setChosen] = useState(defaultChosen);
  const [plan, setPlan] = useState({ n: 0, keys: [] as string[], ids: [] as string[] });
  const onPlan = (keys: string[], ids: string[] = []) => {
    setPlan((x) => ({ n: x.n + 1, keys, ids }));
    requestAnimationFrame(() => document.getElementById("revision")?.scrollIntoView({ behavior: "smooth" }));
  };
  const archived = !term.current;
  const days = Math.max(0, Math.round((new Date(exam.date).getTime() - new Date("2026-11-25T09:00:00+02:00").getTime()) / 86400000));
  const exportActive = () => {
    if (archived && cat === "readiness") { p.say(t("Readiness reports are only available for the current term.", "تقارير الجاهزية متاحة للفصل الحالي فقط.")); return; }
    downloadCsv(p, cat, chosen[cat]);
    p.say(t("Exported the selected report as CSV. Change it under Course reports.", "تم تصدير التقرير المحدد بصيغة CSV. غيّره من تقارير المقرر."));
  };
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle eyebrow={t("REPORTS", "التقارير")} title={t("Course Reports & Exam Preparation", "تقارير المقرر والتحضير للامتحان")} description={t("Prepare students for assessments and generate reports on course progress and learning outcomes.", "جهّز الطلاب للتقييمات وأنشئ تقارير عن تقدم المقرر ونواتج التعلم.")}
        action={<Button onClick={exportActive}><Download aria-hidden="true" />{t("Export report", "تصدير التقرير")}</Button>} />
      <div role="search" aria-label={t("Report filters", "مرشحات التقارير")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Course", "المقرر")}<NativeSelect value={course.id} onChange={(e) => p.setCourse(e.target.value)}>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Academic term", "الفصل الأكاديمي")}<NativeSelect value={term.id} onChange={(e) => p.setTerm(e.target.value)}>{TERMS.map((x) => <option key={x.id} value={x.id}>{t(x.label)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Exam or assessment", "الامتحان أو التقييم")}<NativeSelect value={exam.id} onChange={(e) => p.setExam(e.target.value)}>{exams.map((x) => <option key={x.id} value={x.id}>{t(x.title)} · {date(x.date)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Mastery threshold", "عتبة الإتقان")}<NativeSelect value={threshold} onChange={(e) => p.setThreshold(Number(e.target.value))}>{CRITERIA.thresholds.map((n) => <option key={n} value={n}>{num(n)}%</option>)}</NativeSelect></label>
      </div>
      <div role="status" aria-live="polite" className="-mt-4 min-h-5">{p.notice && <Status message={p.notice} />}</div>
      {!archived && <p className="-mt-4 text-sm text-muted-foreground">{t(`${exam.title[0]} is in ${days} days (${date(exam.date)}) and covers ${model.concepts.length} concepts.`, `${exam.title[1]} بعد ${num(days)} يومًا (${date(exam.date)}) ويغطي ${num(model.concepts.length)} مفهومًا.`)}</p>}

      {archived ? (
        <>
          <EmptyState title={t("Exam preparation is for the current term", "التحضير للامتحان للفصل الحالي")} description={t("Readiness, revision planning and mock exams work from live practice evidence, so they are hidden for past terms. Reports below still preview an archived snapshot.", "تعتمد الجاهزية وتخطيط المراجعة والامتحانات التجريبية على أدلة التدريب الحية، لذا تُخفى للفصول السابقة. ما زالت التقارير أدناه تعرض لقطة مؤرشفة.")} action={<Button variant="outline" onClick={() => p.setTerm(TERMS[0].id)}>{t("Switch to the current term", "التبديل إلى الفصل الحالي")}</Button>} />
        </>
      ) : (
        <>
          <Overview p={p} />
          <nav aria-label={t("Sections", "الأقسام")} className="sticky top-16 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-xl border bg-card/95 p-2 backdrop-blur">
            {NAV.map(([id, en, ar]) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{t(en, ar)}</a>)}
          </nav>
          <ConceptTable p={p} onPlan={(k) => onPlan(k)} />
          <StudentTable p={p} onPlan={onPlan} />
          <Revision key={`${course.id}-${exam.id}-${plan.n}`} p={p} initial={{ keys: plan.keys, ids: plan.ids }} />
          <MockExam key={`mock-${course.id}`} p={p} />
        </>
      )}
      <Reports p={p} cat={cat} setCat={setCat} chosen={chosen} setChosen={setChosen} />
      <ProfileSheet p={p} />
    </div>
  );
}
