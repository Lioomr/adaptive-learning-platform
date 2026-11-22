"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Flag, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { concepts, findCourse, questions } from "@/data/fixtures";
import { masteryBand } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";
import type { Attempt } from "@/types";

const QUIZ_DURATION_SECONDS = 5 * 60;

function formatTime(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return minutes + ":" + seconds;
}

export function StudentTimedMockQuiz() {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const submit = useDemo(s => s.submit);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_DURATION_SECONDS);
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [result, setResult] = useState<{ attempts: Attempt[]; error?: string } | null>(null);
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseQuestions = useMemo(() => questions.filter(q => q.courseId === courseId), [courseId]);
  const groupedQuestions = useMemo(() => {
    const groups = new Map<string, typeof courseQuestions>();
    for (const question of courseQuestions) {
      groups.set(question.conceptId, [...(groups.get(question.conceptId) ?? []), question]);
    }
    return [...groups.entries()];
  }, [courseQuestions]);
  const answeredCount = courseQuestions.filter(q => !!answers[q.id]).length;

  const finishQuiz = useCallback((wasTimedOut: boolean) => {
    if (finished || result || !student || !course || courseQuestions.length === 0) return;
    setFinished(true);
    const saved: Attempt[] = [];
    for (const [conceptId, conceptQuestions] of groupedQuestions) {
      const response = submit({
        submissionId: `st15-${studentId}-${courseId}-${conceptId}-${Date.now()}`,
        studentId,
        courseId,
        conceptId,
        questionIds: conceptQuestions.map(q => q.id),
        answers: Object.fromEntries(conceptQuestions.filter(q => answers[q.id]).map(q => [q.id, answers[q.id]])),
      }, "student");
      if (!response.ok) {
        setResult({ attempts: saved, error: response.error });
        return;
      }
      saved.push(response.attempt);
    }
    setResult({ attempts: saved });
    if (wasTimedOut) setTimedOut(true);
  }, [finished, result, student, course, courseQuestions.length, groupedQuestions, submit, studentId, courseId, answers]);

  useEffect(() => {
    if (finished || result || courseQuestions.length === 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(current => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished, result, courseQuestions.length]);

  useEffect(() => {
    if (secondsLeft === 0 && !finished && !result) finishQuiz(true);
  }, [secondsLeft, finished, result, finishQuiz]);

  if (!hydrated) return <main className="mx-auto max-w-4xl p-6"><div className="h-64 animate-pulse rounded-xl bg-muted" /></main>;
  if (!course || !student) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="space-y-4 p-6"><p>{tr("Mock quiz is unavailable for the current demo context.", "الاختبار التجريبي مش متاح في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st14">{tr("Back to readiness", "العودة للاستعداد")}</Link></Button></CardContent></Card></main>;

  const totalScore = result?.attempts.length
    ? Math.round(result.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / result.attempts.length)
    : 0;
  const isLowTime = secondsLeft <= 60;

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 pb-12 md:p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st14"><ArrowLeft className="me-2 size-4" />{tr("Back to exam readiness", "العودة للاستعداد للامتحان")}</Link></Button>
        <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}><option value="en">English</option><option value="ar">العربية</option></select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><span>ST15 · {tr("Timed mock quiz", "اختبار تجريبي بوقت")}</span><span>{course.title}</span></div>
          <div><h1 className="text-2xl font-semibold">{tr("Test your understanding", "اختبري فهمك")}</h1><p className="mt-1 text-muted-foreground">{tr("Answer the available course questions before the timer runs out.", "جاوبي على أسئلة الكورس المتاحة قبل انتهاء الوقت.")}</p></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Time remaining", "الوقت المتبقي")}</p><p className={`mt-1 flex items-center gap-2 text-3xl font-bold tabular-nums ${isLowTime ? "text-destructive" : ""}`}><Clock3 className="size-6" />{formatTime(secondsLeft)}</p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Questions answered", "الأسئلة المجابة")}</p><p className="mt-1 text-3xl font-bold">{answeredCount}<span className="text-base font-normal text-muted-foreground"> / {courseQuestions.length}</span></p></div>
            <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Question bank", "بنك الأسئلة")}</p><p className="mt-1 text-3xl font-bold">{courseQuestions.length}</p><p className="mt-1 text-xs text-muted-foreground">{tr("Available demo items", "أسئلة الديمو المتاحة")}</p></div>
          </div>
          <Progress value={courseQuestions.length ? answeredCount / courseQuestions.length * 100 : 0} />
          {isLowTime && !result && <div className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="size-4" />{tr("One minute or less remaining. Review your answers.", "فاضل دقيقة أو أقل. راجعي إجاباتك.")}</div>}
        </CardContent>
      </Card>

      {courseQuestions.length === 0 ? <Card><CardContent className="space-y-3 p-5"><p className="font-medium">{tr("No mock-quiz questions are available for this course yet.", "مفيش أسئلة اختبار تجريبي متاحة للكورس ده حاليًا.")}</p><p className="text-sm text-muted-foreground">{tr("The shared question bank is still illustrative and incomplete.", "بنك الأسئلة المشترك لسه توضيحي وغير مكتمل.")}</p><Button asChild><Link href="/student/st14">{tr("Back to readiness", "العودة للاستعداد")}</Link></Button></CardContent></Card> : null}

      {!result && courseQuestions.length > 0 && <Card>
        <CardHeader><CardTitle>{tr("Mock exam questions", "أسئلة الاختبار التجريبي")}</CardTitle><CardDescription>{tr("You can change an answer any time before submitting. Unanswered questions count as incorrect.", "تقدري تغيري إجابتك في أي وقت قبل التسليم. الأسئلة غير المجابة بتتحسب غلط.")}</CardDescription></CardHeader>
        <CardContent className="space-y-7">
          {courseQuestions.map((question, index) => {
            const concept = concepts.find(c => c.id === question.conceptId);
            return <section key={question.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{tr("Question", "السؤال")} {index + 1} · {concept?.title ?? question.conceptId}</p><Badge tone={answers[question.id] ? "success" : "neutral"}>{answers[question.id] ? tr("Answered", "تمت الإجابة") : tr("Not answered", "لم تتم الإجابة")}</Badge></div>
              <p className="leading-7">{question.prompt}</p>
              <div className="space-y-2">{question.options.map((option, optionIndex) => <button key={option} disabled={finished} onClick={() => setAnswers(current => ({ ...current, [question.id]: option }))} className={`w-full rounded-xl border p-3 text-start transition ${answers[question.id] === option ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}><span className="me-3 inline-flex size-7 items-center justify-center rounded-full border text-sm">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}</div>
              {index < courseQuestions.length - 1 && <div className="border-b pt-2" />}
            </section>;
          })}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{courseQuestions.length - answeredCount} {tr("unanswered", "أسئلة بدون إجابة")}</p><Button disabled={finished} onClick={() => finishQuiz(false)}><Flag className="me-2 size-4" />{tr("Submit mock quiz", "تسليم الاختبار")}</Button></div>
        </CardContent>
      </Card>}

      {result && <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-6 text-primary" />{tr("Mock quiz completed", "تم إنهاء الاختبار التجريبي")}</CardTitle><CardDescription>{timedOut ? tr("Time ran out; your current answers were submitted.", "الوقت انتهى وتم تسليم إجاباتك الحالية.") : tr("Your answers were submitted and saved to the shared demo state.", "تم تسليم إجاباتك وحفظها في بيانات الديمو المشتركة.")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {result.error && <p className="rounded-lg border border-destructive p-3 text-sm text-destructive">{result.error}</p>}
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average score across submitted topics", "متوسط النتائج للموضوعات المسلّمة")}</p><p className="mt-1 text-3xl font-bold">{totalScore}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Topics submitted", "الموضوعات التي تم تسليمها")}</p><p className="mt-1 text-3xl font-bold">{result.attempts.length}</p></div></div>
          {result.attempts.map(attempt => <div key={attempt.submissionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{concepts.find(c => c.id === attempt.conceptId)?.title ?? attempt.conceptId}</p><p className="text-xs text-muted-foreground">{tr("Updated mastery", "الإتقان بعد التقييم")}: {attempt.previous}% → {attempt.mastery}% · {masteryBand(attempt.mastery).band}</p></div><p className="text-lg font-semibold">{attempt.score}%</p></div>)}
          <p className="text-xs text-muted-foreground">{tr("Each topic is saved as a separate assessment because the shared assessment contract records one concept per attempt. The quiz score is the unweighted average of available topic scores.", "كل موضوع بيتسجل كتقييم منفصل لأن نظام التقييم المشترك بيسجل مفهوم واحد في كل محاولة. نتيجة الاختبار هي متوسط غير موزون لنتائج الموضوعات المتاحة.")}</p>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setAnswers({}); setSecondsLeft(QUIZ_DURATION_SECONDS); setFinished(false); setTimedOut(false); setResult(null); }}><RotateCcw className="me-2 size-4" />{tr("Try again", "إعادة الاختبار")}</Button><Button asChild><Link href="/student/st16">{tr("Continue to daily review", "الانتقال للمراجعة اليومية")}<ArrowLeft className="ms-2 size-4" /></Link></Button></div>
        </CardContent>
      </Card>}

      <p className="text-xs text-muted-foreground">{tr("This is a timed interface simulation using the small illustrative fixture question bank. It is not a validated exam or a full-length mock test. Scores update the demo mastery record for each included concept.", "دي محاكاة بوقت باستخدام بنك الأسئلة التوضيحي الصغير المتاح حاليًا. مش امتحان معتمد ولا اختبار تجريبي كامل. النتائج بتحدث سجل الإتقان التجريبي لكل مفهوم موجود.")}</p>
    </main>
  );
}
