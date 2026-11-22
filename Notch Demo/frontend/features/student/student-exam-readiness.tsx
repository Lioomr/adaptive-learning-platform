"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { concepts, findCourse } from "@/data/fixtures";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentExamReadiness() {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseConcepts = useMemo(() => concepts.filter(c => c.courseId === courseId), [courseId]);
  const courseAttempts = useMemo(
    () => attempts.filter(a => a.studentId === studentId && a.courseId === courseId).slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [attempts, studentId, courseId]
  );

  if (!hydrated) return <div className="mx-auto max-w-5xl"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
  if (!course || !student) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Exam readiness is unavailable for the current demo context.", "بيانات الاستعداد للامتحان مش متاحة في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st6">{tr("Back to home", "العودة للرئيسية")}</Link></Button></CardContent></Card></div>;

  const rows = courseConcepts.map(concept => {
    const mastery = student.mastery[concept.id] ?? 0;
    const missingPrerequisites = concept.prerequisites.filter(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY);
    return { concept, mastery, band: masteryBand(mastery).band, missingPrerequisites };
  });
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.mastery, 0) / rows.length) : 0;
  const readyCount = rows.filter(row => row.mastery >= PREREQUISITE_READY && row.missingPrerequisites.length === 0).length;
  const needsReview = rows.filter(row => row.mastery < PREREQUISITE_READY || row.missingPrerequisites.length > 0);
  const readiness = rows.length ? Math.round(100 * readyCount / rows.length) : 0;
  const priority = [...needsReview].sort((a, b) => a.mastery - b.mastery)[0];
  const recent = courseAttempts.slice(0, 3);
  const readinessLabel = readiness >= 80
    ? tr("Strong progress", "تقدم قوي")
    : readiness >= 50
      ? tr("Getting ready", "في طريقك للجاهزية")
      : tr("More review recommended", "محتاج مراجعة أكتر");

  return (
    <div className="mx-auto max-w-5xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st13"><ArrowLeft className="me-2 size-4 rtl:-scale-x-100" />{tr("Back to mastery overview", "العودة لنظرة الإتقان")}</Link></Button>
        <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}>
          <option value="en">English</option><option value="ar">العربية</option>
        </select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="size-4" /> ST14 · {tr("Exam readiness", "الاستعداد للامتحان")} · {course.title}</div>
          <div>
            <h1 className="notch-page-title">{tr("Are you ready for the exam?", "هل أنت مستعد للامتحان؟")}</h1>
            <p className="mt-1 text-muted-foreground">{tr("Use your current concept mastery and prerequisite progress to decide what to review next.", "استخدمي مستوى إتقانك الحالي وتقدمك في المتطلبات السابقة لتحديد ما تحتاجين إلى مراجعته.")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Readiness coverage", "تغطية الجاهزية")}</p><p className="mt-1 text-3xl font-semibold">{readiness}%</p><Progress className="mt-2" value={readiness} /><p className="mt-2 text-xs text-muted-foreground">{readyCount} / {rows.length} {tr("concepts meet the demo threshold", "مفاهيم حققت حد الديمو")}</p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average mastery", "متوسط الإتقان")}</p><p className="mt-1 text-3xl font-semibold">{average}%</p><Progress className="mt-2" value={average} /></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Assessments completed", "التقييمات المكتملة")}</p><p className="mt-1 text-3xl font-semibold">{courseAttempts.length}</p><p className="mt-2 text-xs text-muted-foreground">{tr("Saved in this browser", "المحفوظة على المتصفح ده")}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2"><Badge tone={readiness >= 80 ? "success" : readiness >= 50 ? "warning" : "danger"}>{readinessLabel}</Badge><span className="text-xs text-muted-foreground">{tr("A study-planning signal, not a predicted exam grade.", "مؤشر لتنظيم المذاكرة، وليس توقعًا لدرجة الامتحان.")}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5" />{tr("Your review priorities", "أولويات المراجعة")}</CardTitle><CardDescription>{tr("Concepts below 70% mastery or with an unmet prerequisite are listed first for review.", "المفاهيم الأقل من 70% إتقانًا أو التي لديها متطلب سابق غير محقق تظهر ضمن أولويات المراجعة.")}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {priority ? <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-medium text-muted-foreground">{tr("Suggested first review", "أول مراجعة مقترحة")}</p><p className="mt-1 text-lg font-semibold">{priority.concept.title}</p></div><Badge tone="warning">{priority.mastery}% · {priority.band}</Badge></div>
            {priority.missingPrerequisites.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{tr("Prerequisites to revisit: ", "متطلبات سابقة تحتاج مراجعة: ")}{priority.missingPrerequisites.map(id => concepts.find(c => c.id === id)?.title ?? id).join(", ")}</p>}
            <Button className="mt-3" size="sm" asChild><Link href={`/student/st8/${priority.missingPrerequisites[0] ?? priority.concept.id}`}><BookOpen className="me-2 size-4" />{tr("Review this topic", "راجعي الموضوع ده")}</Link></Button>
          </div> : <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-4"><CheckCircle2 className="size-6 text-success-ink" /><div><p className="font-medium">{tr("All concepts meet the current demo readiness checks.", "كل المفاهيم حققت شروط الجاهزية الحالية في الديمو.")}</p><p className="text-sm text-muted-foreground">{tr("You can still use the mock quiz to practise.", "تقدري تستخدمي الاختبار التجريبي للتدريب برضه.")}</p></div></div>}
          {rows.map(row => <div key={row.concept.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{row.concept.title}</p><p className="text-xs text-muted-foreground">{row.concept.id}{row.missingPrerequisites.length > 0 ? " · " + tr("Prerequisite review needed", "يحتاج مراجعة متطلب سابق") : ""}</p></div><span className="text-sm font-semibold">{row.mastery}% · {row.band}</span></div>
            <Progress className="mt-2" value={row.mastery} />
            <div className="mt-2 flex justify-end"><Button size="sm" variant="ghost" asChild><Link href={`/student/st8/${row.missingPrerequisites[0] ?? row.concept.id}`}>{tr("Review", "مراجعة")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100" /></Link></Button></div>
          </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5" />{tr("Recent assessment results", "أحدث نتائج التقييمات")}</CardTitle><CardDescription>{tr("Your latest saved assessment attempts for this course.", "أحدث محاولات التقييم المسجلة للكورس ده.")}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {recent.length ? recent.map(attempt => <div key={attempt.submissionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{rows.find(row => row.concept.id === attempt.conceptId)?.concept.title ?? attempt.conceptId}</p><p className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="text-end"><p className="font-semibold">{attempt.score}% {tr("score", "النتيجة")}</p><p className="text-xs text-muted-foreground">{tr("Mastery", "الإتقان")}: {attempt.previous}% → {attempt.mastery}%</p></div></div>) : <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{tr("No assessment results have been recorded yet.", "لسه مفيش نتائج تقييمات مسجلة.")}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/student/st13">{tr("Back to mastery overview", "العودة لنظرة الإتقان")}</Link></Button>
        <Button asChild><Link href="/student/st15">{tr("Continue to mock quiz", "الانتقال للاختبار التجريبي")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100" /></Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">{tr("Readiness coverage is the share of concepts at 70% mastery or above with all prerequisites also at 70% or above. It is a deterministic demo indicator, not an exam-grade prediction or validated readiness model.", "تغطية الجاهزية هي نسبة المفاهيم التي وصلت إلى 70% إتقانًا على الأقل مع تحقيق متطلباتها السابقة للنسبة نفسها. ده مؤشر تجريبي ثابت، مش توقع لدرجة الامتحان أو نموذج جاهزية معتمد.")}</p>
    </div>
  );
}
