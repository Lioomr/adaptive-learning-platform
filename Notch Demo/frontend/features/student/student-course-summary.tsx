"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Award, BookOpen, CheckCircle2, ClipboardList, GraduationCap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concepts, findCourse } from "@/data/fixtures";
import { masteryBand, MASTERY_BANDS, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentCourseSummary() {
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
    () => attempts.filter(a => a.studentId === studentId && a.courseId === courseId)
      .slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [attempts, studentId, courseId]
  );

  if (!hydrated) return <div className="mx-auto max-w-5xl"><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>;
  if (!course || !student) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("The course summary is unavailable for the current demo context.", "ملخص الكورس مش متاح في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st6">{tr("Back to home", "العودة للرئيسية")}</Link></Button></CardContent></Card></div>;

  const rows = courseConcepts.map(concept => {
    const mastery = student.mastery[concept.id] ?? 0;
    const band = masteryBand(mastery);
    const unmet = concept.prerequisites.filter(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY);
    return { concept, mastery, band, unmet };
  });
  const averageMastery = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.mastery, 0) / rows.length) : 0;
  const mastered = rows.filter(row => row.mastery >= 85).length;
  const proficient = rows.filter(row => row.mastery >= 70 && row.unmet.length === 0).length;
  const needsReview = rows.filter(row => row.mastery < 70 || row.unmet.length > 0).sort((a, b) => a.mastery - b.mastery);
  const averageScore = courseAttempts.length ? Math.round(courseAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / courseAttempts.length) : null;
  const latestAttempts = courseAttempts.slice(0, 5);
  const bandCounts = MASTERY_BANDS.map(band => ({ ...band, count: rows.filter(row => row.band.band === band.band).length }));
  const totalAttemptQuestions = courseAttempts.reduce((sum, attempt) => sum + attempt.questionIds.length, 0);

  return (
    <div lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st20"><ArrowLeft className="me-2 size-4 rtl:-scale-x-100" />{tr("Back to survey", "العودة للاستبيان")}</Link></Button>
        <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}><option value="en">English</option><option value="ar">العربية</option></select>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><GraduationCap className="size-4" />ST21 · {tr("End-of-course summary", "ملخص نهاية الكورس")} · {course.title}</div>
          <div className="flex items-start gap-3"><Award className="mt-1 size-8 text-primary" /><div><h1 className="notch-page-title">{tr("Your learning journey, at a glance", "رحلة تعلمك في ملخص واحد")}</h1><p className="mt-1 text-muted-foreground">{tr("Well done", "أحسنتِ")}، {student.name}! {tr("Here is a summary of your current course progress and the assessment activity recorded in this browser.", "ده ملخص تقدمك الحالي في الكورس والتقييمات المسجلة في المتصفح ده.")}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average mastery", "متوسط الإتقان")}</p><p className="mt-1 text-3xl font-semibold">{averageMastery}%</p><Progress className="mt-2" value={averageMastery} /></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Mastered concepts", "مفاهيم متقنة")}</p><p className="mt-1 text-3xl font-semibold">{mastered}<span className="text-base font-normal text-muted-foreground"> / {rows.length}</span></p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Ready concepts", "مفاهيم جاهزة")}</p><p className="mt-1 text-3xl font-semibold">{proficient}<span className="text-base font-normal text-muted-foreground"> / {rows.length}</span></p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Saved assessments", "التقييمات المسجلة")}</p><p className="mt-1 text-3xl font-semibold">{courseAttempts.length}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" />{tr("Mastery snapshot", "نظرة على الإتقان")}</CardTitle><CardDescription>{tr("How your course concepts are distributed across the agreed mastery bands.", "توزيع مفاهيم الكورس حسب مستويات الإتقان المتفق عليها.")}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {bandCounts.map(item => <div key={item.band} className="space-y-1.5"><div className="flex items-center justify-between gap-3 text-sm"><span>{tr(item.band, item.band === "Needs Support" ? "يحتاج دعم" : item.band === "Developing" ? "في طور التطور" : item.band === "Proficient" ? "متقن" : "إتقان كامل")}</span><strong>{item.count} / {rows.length}</strong></div><Progress value={rows.length ? item.count / rows.length * 100 : 0} /></div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-5" />{tr("Assessment summary", "ملخص التقييمات")}</CardTitle><CardDescription>{tr("Only completed attempts saved in the shared browser demo state are counted.", "المحتسب هنا هو محاولات التقييم المكتملة والمسجلة فعلًا في بيانات الديمو المشتركة بالمتصفح.")}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{tr("Average score", "متوسط الدرجات")}</p><p className="mt-1 text-2xl font-semibold">{averageScore === null ? "—" : averageScore + "%"}</p></div>
              <div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{tr("Questions attempted", "الأسئلة المجاب عنها")}</p><p className="mt-1 text-2xl font-semibold">{totalAttemptQuestions}</p></div>
            </div>
            {latestAttempts.length ? <div className="space-y-2">{latestAttempts.map(attempt => {
              const concept = courseConcepts.find(item => item.id === attempt.conceptId);
              return <div key={attempt.submissionId} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{concept?.title ?? attempt.conceptId}</p><p className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US")}</p></div><div className="text-end"><p className="font-semibold">{attempt.score}%</p><p className="text-xs text-muted-foreground">{attempt.previous}% → {attempt.mastery}%</p></div></div>;
            })}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{tr("No assessment attempts have been saved for this course yet.", "لسه مفيش محاولات تقييم محفوظة للكورس ده.")}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5" />{tr("Your next learning steps", "خطواتك الجاية في التعلم")}</CardTitle><CardDescription>{tr("A practical review list based on current mastery and prerequisite readiness.", "قائمة مراجعة عملية بناءً على مستوى الإتقان الحالي وجاهزية المتطلبات السابقة.")}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {needsReview.length ? needsReview.slice(0, 5).map(row => <div key={row.concept.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="font-medium">{row.concept.title}</p><p className="text-xs text-muted-foreground">{row.unmet.length ? tr("Prerequisites to revisit: ", "متطلبات سابقة تحتاج مراجعة: ") + row.unmet.map(id => concepts.find(c => c.id === id)?.title ?? id).join(", ") : tr("Build confidence with another practice round.", "ثبتي فهمك بجولة تدريب إضافية.")}</p></div><div className="flex items-center gap-2"><Badge tone={row.band.tone}>{row.mastery}%</Badge><Button size="sm" variant="outline" asChild><Link href={`/student/st8/${row.unmet[0] ?? row.concept.id}`}>{tr("Review", "مراجعة")}</Link></Button></div></div>) : <div className="rounded-xl border border-dashed p-4 text-sm"><CheckCircle2 className="mb-2 size-5 text-primary" />{tr("Every concept currently meets the review readiness threshold. Keep practising to maintain your progress.", "كل المفاهيم حاليًا محققة حد الجاهزية للمراجعة. استمري في التدريب للحفاظ على تقدمك.")}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">{tr("A note about your results", "ملاحظة مهمة عن نتائجك")}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{tr("This summary reflects the current fictional demo learner and browser-saved assessment attempts. Mastery is calculated with the agreed deterministic demo formula; it is not a validated measure of learning or a predicted exam grade. The post-test uses a small illustrative question bank, so its score should not be treated as a statistically reliable pre/post comparison.", "الملخص ده بيعكس بيانات طالب تجريبي ومحاولات التقييم المحفوظة في المتصفح الحالي. الإتقان بيتحسب بمعادلة الديمو الثابتة المتفق عليها، ومش مقياس تعليمي مُعتمد أو توقع لدرجة الامتحان. الاختبار البعدي بيعتمد على بنك أسئلة توضيحي صغير، فدرجته مش مقارنة إحصائية موثوقة بين قبل وبعد التعلم.")}</p>
          <p className="text-sm leading-6 text-muted-foreground">{tr("Survey feedback is session-only in this prototype and is not included in this saved summary.", "إجابات الاستبيان موجودة خلال جلسة الصفحة فقط في النموذج ده، ومش داخلة ضمن الملخص المحفوظ.")}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/student/st13">{tr("Detailed mastery", "تفاصيل الإتقان")}</Link></Button>
        <Button variant="outline" asChild><Link href="/student/st14">{tr("Exam readiness", "الاستعداد للامتحان")}</Link></Button>
        <Button asChild><Link href="/student/st6"><CheckCircle2 className="me-2 size-4" />{tr("Finish and return home", "إنهاء والعودة للرئيسية")}</Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">{tr("ST21 · End of the student journey. Your demo learning data remains available in this browser for the other connected screens.", "ST21 · نهاية رحلة الطالب. بيانات التعلم التجريبية هتفضل متاحة في المتصفح ده لباقي الشاشات المرتبطة.")}</p>
    </div>
  );
}
