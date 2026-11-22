"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { concepts, findCourse, questions } from "@/data/fixtures";
import { masteryBand } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Attempt } from "@/types";

type Result = { attempts: Attempt[]; error?: string };

export function StudentPostTest() {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const submit = useDemo(s => s.submit);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseQuestions = useMemo(() => questions.filter(q => q.courseId === courseId), [courseId]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof courseQuestions>();
    courseQuestions.forEach(q => map.set(q.conceptId, [...(map.get(q.conceptId) ?? []), q]));
    return [...map.entries()];
  }, [courseQuestions]);
  const answered = courseQuestions.filter(q => !!answers[q.id]).length;
  const allAnswered = courseQuestions.length > 0 && answered === courseQuestions.length;

  if (!hydrated) return <main className="mx-auto max-w-4xl p-6"><div className="h-64 animate-pulse rounded-xl bg-muted" /></main>;
  if (!course || !student) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="space-y-4 p-6"><p>{tr("Post-test is unavailable for the current demo context.", "الاختبار البعدي مش متاح في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st18">{tr("Back to settings", "العودة للإعدادات")}</Link></Button></CardContent></Card></main>;

  const startingMastery = result?.attempts.length
    ? result.attempts.reduce((sum, attempt) => sum + attempt.previous, 0) / result.attempts.length
    : 0;
  const endingMastery = result?.attempts.length
    ? result.attempts.reduce((sum, attempt) => sum + attempt.mastery, 0) / result.attempts.length
    : 0;
  const averageScore = result?.attempts.length
    ? Math.round(result.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / result.attempts.length)
    : 0;

  function submitPostTest() {
    if (!allAnswered || result) return;
    const saved: Attempt[] = [];
    const batchId = Date.now();
    for (const [conceptId, conceptQuestions] of groups) {
      const response = submit({
        submissionId: `st19-${studentId}-${courseId}-${conceptId}-${batchId}`,
        studentId,
        courseId,
        conceptId,
        questionIds: conceptQuestions.map(q => q.id),
        answers: Object.fromEntries(conceptQuestions.map(q => [q.id, answers[q.id]])),
      }, "student");
      if (!response.ok) {
        setResult({ attempts: saved, error: response.error });
        return;
      }
      saved.push(response.attempt);
    }
    setResult({ attempts: saved });
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 pb-12 md:p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st18"><ArrowLeft className="me-2 size-4" />{tr("Back to settings", "العودة للإعدادات")}</Link></Button>
        <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}><option value="en">English</option><option value="ar">العربية</option></select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>ST19 · {tr("Post-test", "الاختبار البعدي")}</span><span>{course.title}</span></div>
          <div className="flex items-start gap-3"><GraduationCap className="mt-1 size-7 text-primary" /><div><h1 className="text-2xl font-semibold">{tr("See what you've learned", "شوفي إيه اللي اتعلمتيه")}</h1><p className="mt-1 text-muted-foreground">{tr("Complete the available course questions to review your learning progress after the study journey.", "جاوبي على أسئلة الكورس المتاحة لمراجعة تقدمك بعد رحلة التعلم.")}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Available questions", "الأسئلة المتاحة")}</p><p className="mt-1 text-2xl font-bold">{courseQuestions.length}</p></div>
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Answered", "تمت الإجابة")}</p><p className="mt-1 text-2xl font-bold">{answered} / {courseQuestions.length}</p></div>
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Concepts covered", "المفاهيم المغطاة")}</p><p className="mt-1 text-2xl font-bold">{groups.length}</p></div>
          </div>
          <Progress value={courseQuestions.length ? answered / courseQuestions.length * 100 : 0} />
        </CardContent>
      </Card>

      {!result && (courseQuestions.length ? <Card>
        <CardHeader><CardTitle>{tr("Post-test questions", "أسئلة الاختبار البعدي")}</CardTitle><CardDescription>{tr("Answer every available question. Your responses will be saved to the shared demo assessment history and update mastery using the agreed formula.", "جاوبي على كل الأسئلة المتاحة. إجاباتك هتتحفظ في سجل التقييمات المشترك بالديمو وهتحدّث مستوى الإتقان بالمعادلة المتفق عليها.")}</CardDescription></CardHeader>
        <CardContent className="space-y-7">
          {courseQuestions.map((q, index) => {
            const concept = concepts.find(c => c.id === q.conceptId);
            return <section key={q.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{tr("Question", "السؤال")} {index + 1} · {concept?.title ?? q.conceptId}</p><Badge tone={answers[q.id] ? "success" : "neutral"}>{answers[q.id] ? tr("Answered", "تمت الإجابة") : tr("Not answered", "لم تتم الإجابة")}</Badge></div>
              <p className="leading-7">{q.prompt}</p>
              <div className="space-y-2">{q.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => setAnswers(current => ({ ...current, [q.id]: option }))} className={`w-full rounded-xl border p-3 text-start transition ${answers[q.id] === option ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}><span className="me-3 inline-flex size-7 items-center justify-center rounded-full border text-sm">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
            </section>;
          })}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{courseQuestions.length - answered} {tr("questions remaining", "أسئلة متبقية")}</p><Button disabled={!allAnswered} onClick={submitPostTest}><ClipboardCheck className="me-2 size-4" />{tr("Submit post-test", "تسليم الاختبار البعدي")}</Button></div>
        </CardContent>
      </Card> : <Card><CardContent className="space-y-3 p-5"><p className="font-medium">{tr("No post-test questions are available for this course.", "مفيش أسئلة اختبار بعدي متاحة للكورس ده.")}</p><p className="text-sm text-muted-foreground">{tr("The shared question bank is illustrative and incomplete, so no result can be produced.", "بنك الأسئلة المشترك توضيحي وغير مكتمل، وبالتالي مش ممكن نطلع نتيجة.")}</p></CardContent></Card>)}

      {result && <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-6 text-primary" />{tr("Post-test results", "نتيجة الاختبار البعدي")}</CardTitle><CardDescription>{tr("Your submitted attempts are recorded in the shared browser demo state.", "محاولاتك اتسجلت في بيانات الديمو المشتركة داخل المتصفح.")}</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {result.error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{result.error}</p>}
          {result.attempts.length > 0 && <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average score", "متوسط النتيجة")}</p><p className="mt-1 text-3xl font-bold">{averageScore}%</p></div>
              <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average previous mastery", "متوسط الإتقان السابق")}</p><p className="mt-1 text-3xl font-bold">{Math.round(startingMastery)}%</p></div>
              <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average updated mastery", "متوسط الإتقان بعد التقييم")}</p><p className="mt-1 text-3xl font-bold">{Math.round(endingMastery)}%</p></div>
            </div>
            <div className="space-y-3">{result.attempts.map(attempt => {
              const concept = concepts.find(c => c.id === attempt.conceptId);
              return <div key={attempt.submissionId} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{concept?.title ?? attempt.conceptId}</p><Badge>{masteryBand(attempt.mastery).band}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><div><p className="text-muted-foreground">{tr("Score", "النتيجة")}</p><p className="font-semibold">{attempt.score}%</p></div><div><p className="text-muted-foreground">{tr("Before", "قبل")}</p><p className="font-semibold">{attempt.previous}%</p></div><div><p className="text-muted-foreground">{tr("After", "بعد")}</p><p className="font-semibold">{attempt.mastery}%</p></div></div><Progress className="mt-3" value={attempt.mastery} /></div>;
            })}</div>
          </>}
          <div className="flex flex-wrap gap-2"><Button asChild><Link href="/student/st20">{tr("Continue to survey", "الانتقال للاستبيان")}<ArrowLeft className="ms-2 size-4" /></Link></Button><Button variant="outline" asChild><Link href="/student/st21">{tr("View learning summary", "عرض ملخص التعلم")}</Link></Button></div>
        </CardContent>
      </Card>}

      <p className="text-xs text-muted-foreground">{tr("Important demo limitation: this is a post-learning check using the small illustrative fixture bank, not a validated pre/post research instrument or a statistically comparable test. It is not evidence of causal learning gain. Submitting it updates mastery through the agreed deterministic demo formula.", "مهم: ده تقييم بعد التعلم باستخدام بنك الأسئلة التوضيحي الصغير، مش أداة قياس قبل/بعد معتمدة أو اختبارين قابلين للمقارنة إحصائيًا. النتيجة مش دليل على تحسن سببه المنصة. التسليم بيحدث الإتقان بالمعادلة التجريبية المتفق عليها.")}</p>
    </main>
  );
}
