"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CalendarClock, CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { concepts, findCourse } from "@/data/fixtures";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentDailyReview() {
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

  if (!hydrated) return <main className="mx-auto max-w-5xl p-6"><div className="h-64 animate-pulse rounded-xl bg-muted" /></main>;
  if (!course || !student) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="space-y-4 p-6"><p>{tr("Daily review is unavailable for the current demo context.", "المراجعة اليومية مش متاحة في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st6">{tr("Back to home", "العودة للرئيسية")}</Link></Button></CardContent></Card></main>;

  const rows = courseConcepts.map(concept => {
    const mastery = student.mastery[concept.id] ?? 0;
    const missing = concept.prerequisites.filter(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY);
    const latestAttempt = courseAttempts.find(attempt => attempt.conceptId === concept.id);
    const needsReview = mastery < PREREQUISITE_READY || missing.length > 0;
    const priority = mastery < 40 ? 0 : missing.length > 0 ? 1 : mastery < PREREQUISITE_READY ? 2 : 3;
    return { concept, mastery, band: masteryBand(mastery).band, missing, latestAttempt, needsReview, priority };
  });
  const queue = rows.filter(row => row.needsReview).sort((a, b) => a.priority - b.priority || a.mastery - b.mastery);
  const masteredCount = rows.filter(row => row.mastery >= 85).length;
  const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.mastery, 0) / rows.length) : 0;
  const recent = courseAttempts.slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-12 md:p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st15"><ArrowLeft className="me-2 size-4" />{tr("Back to mock quiz", "العودة للاختبار التجريبي")}</Link></Button>
        <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}>
          <option value="en">English</option><option value="ar">العربية</option>
        </select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground"><span>ST16 · {tr("Daily review", "المراجعة اليومية")}</span><span>{course.title}</span></div>
          <div>
            <h1 className="text-2xl font-semibold">{tr("A focused review for your next study session", "مراجعة مركزة لجلسة مذاكرتك الجاية")}</h1>
            <p className="mt-1 text-muted-foreground">{tr("Start with concepts that need support, then revisit topics from your latest assessments.", "ابدئي بالمفاهيم اللي محتاجة دعم، وبعدها راجعي الموضوعات اللي ظهرت في أحدث تقييماتك.")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Concepts to review", "مفاهيم للمراجعة")}</p><p className="mt-1 text-3xl font-bold">{queue.length}</p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average mastery", "متوسط الإتقان")}</p><p className="mt-1 text-3xl font-bold">{average}%</p><Progress className="mt-2" value={average} /></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Mastered concepts", "مفاهيم متقنة")}</p><p className="mt-1 text-3xl font-bold">{masteredCount} / {rows.length}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="size-5" />{tr("Your review queue", "قائمة المراجعة")}</CardTitle>
          <CardDescription>{tr("Prioritized from your current mastery and prerequisite progress. The 70% threshold is a demo study guide, not a deadline.", "مرتبة حسب مستوى إتقانك الحالي وتقدم المتطلبات السابقة. حد 70% إرشادي داخل الديمو، مش موعدًا نهائيًا.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length ? queue.map((row, index) => (
            <div key={row.concept.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{index + 1}</span>
                  <div><p className="font-semibold">{row.concept.title}</p><p className="text-xs text-muted-foreground">{row.concept.id} · {row.band}</p></div>
                </div>
                <Badge tone={row.mastery < 40 ? "danger" : "warning"}>{row.mastery}% {tr("mastery", "إتقان")}</Badge>
              </div>
              <Progress className="mt-3" value={row.mastery} />
              {row.missing.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{tr("Prerequisites to review: ", "متطلبات سابقة للمراجعة: ")}{row.missing.map(id => concepts.find(c => c.id === id)?.title ?? id).join(", ")}</p>}
              {row.latestAttempt && <p className="mt-2 text-xs text-muted-foreground">{tr("Latest assessment", "آخر تقييم")}: {row.latestAttempt.score}% · {new Date(row.latestAttempt.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" asChild><Link href={`/student/st8/${row.missing[0] ?? row.concept.id}`}><BookOpen className="me-2 size-4" />{tr("Review lesson", "مراجعة الدرس")}</Link></Button>
                <Button size="sm" variant="outline" asChild><Link href={`/student/st9?conceptId=${row.concept.id}`}><RotateCcw className="me-2 size-4" />{tr("Practice", "تدريب")}</Link></Button>
                <Button size="sm" variant="ghost" asChild><Link href={`/student/st10?conceptId=${row.concept.id}`}>{tr("Assess", "تقييم")}</Link></Button>
              </div>
            </div>
          )) : <div className="flex items-center gap-3 rounded-xl border border-dashed p-5"><CheckCircle2 className="size-6 text-primary" /><div><p className="font-medium">{tr("No concepts are currently below the review threshold.", "مفيش مفاهيم حاليًا أقل من حد المراجعة.")}</p><p className="text-sm text-muted-foreground">{tr("Keep practising to maintain your progress.", "كمّلي تدريب للحفاظ على تقدمك.")}</p></div></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-5" />{tr("Recently assessed topics", "موضوعات اتقيمت مؤخرًا")}</CardTitle><CardDescription>{tr("Based only on assessment attempts saved in this browser.", "بناءً فقط على محاولات التقييم المحفوظة في المتصفح ده.")}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {recent.length ? recent.map(attempt => <div key={attempt.submissionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{rows.find(row => row.concept.id === attempt.conceptId)?.concept.title ?? attempt.conceptId}</p><p className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="text-end"><p className="font-semibold">{attempt.score}% {tr("score", "النتيجة")}</p><p className="text-xs text-muted-foreground">{tr("Mastery", "الإتقان")}: {attempt.previous}% → {attempt.mastery}%</p></div></div>) : <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{tr("No assessment attempts have been saved yet. Your review queue is based on current mastery.", "لسه مفيش محاولات تقييم محفوظة. قائمة المراجعة مبنية على مستوى الإتقان الحالي.")}</p>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href="/student/st15">{tr("Back to mock quiz", "العودة للاختبار التجريبي")}</Link></Button>
        <Button asChild><Link href="/student/st17">{tr("Continue to AI tutor", "الانتقال للمساعد التعليمي")}<ArrowLeft className="ms-2 size-4" /></Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">{tr("This review list is generated deterministically from the shared demo mastery and assessment history. It does not use spaced-repetition scheduling, due dates, reminders, or an AI recommendation model.", "قائمة المراجعة دي بتتحدد بشكل ثابت من مستوى الإتقان وسجل التقييمات في الديمو. مش بتستخدم جدولة مراجعة متباعدة أو مواعيد استحقاق أو تذكيرات أو نموذج توصية بالذكاء الاصطناعي.")}</p>
    </main>
  );
}
