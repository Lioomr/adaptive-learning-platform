"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findConcept, findCourse, questions } from "@/data/fixtures";
import { masteryBand } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

const ASSESSMENT_SECONDS = 120;

function newAttempt() {
  return {
    submissionId: `st10-${crypto.randomUUID()}`,
    deadline: Date.now() + ASSESSMENT_SECONDS * 1000,
  };
}

export function StudentMasteryAssessment({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);

  if (!hydrated) return <div className="mx-auto max-w-4xl"><div className="h-64 animate-pulse rounded-xl bg-muted"/></div>;

  return <MasteryAssessmentSession key={`${studentId}:${courseId}:${conceptId}`} conceptId={conceptId} />;
}

function MasteryAssessmentSession({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const submit = useDemo(s => s.submit);
  const concept = findConcept(conceptId);
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const questionSet = useMemo(() => questions.filter(q => q.courseId === courseId && q.conceptId === conceptId), [courseId, conceptId]);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [result, setResult] = useState<{score:number;previous:number;mastery:number;timedOut:boolean}|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(newAttempt);
  const [remainingSeconds, setRemainingSeconds] = useState(ASSESSMENT_SECONDS);
  const submitted = useRef(false);
  const [language, setLanguage] = useState<"en"|"ar">("en");
  const ar = language === "ar";
  const tr = (en:string, arabic:string) => ar ? arabic : en;

  const finishAssessment = useCallback((timedOut = false) => {
    if (submitted.current || !questionSet.length || !student || !concept || concept.courseId !== courseId) return;
    const expired = Date.now() >= attempt.deadline;
    if (!timedOut && !expired && !questionSet.every(q => !!answers[q.id])) return;
    submitted.current = true;
    const response = submit({ submissionId: attempt.submissionId, studentId, courseId, conceptId, questionIds: questionSet.map(q => q.id), answers }, "student");
    if (!response.ok) {
      submitted.current = false;
      setError(response.error);
      return;
    }
    setError(null);
    setResult({ score: response.attempt.score, previous: response.attempt.previous, mastery: response.attempt.mastery, timedOut: timedOut || expired });
  }, [answers, attempt, concept, conceptId, courseId, questionSet, student, studentId, submit]);

  useEffect(() => {
    if (!hydrated || !questionSet.length || !student || !concept || concept.courseId !== courseId || result || error) return;
    const interval = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) finishAssessment(true);
    }, 250);
    return () => window.clearInterval(interval);
  }, [attempt.deadline, concept, courseId, error, finishAssessment, hydrated, questionSet.length, result, student]);

  function retakeAssessment() {
    submitted.current = false;
    setAnswers({});
    setResult(null);
    setError(null);
    setRemainingSeconds(ASSESSMENT_SECONDS);
    setAttempt(newAttempt());
  }

  if (!hydrated) return <div className="mx-auto max-w-4xl"><div className="h-64 animate-pulse rounded-xl bg-muted"/></div>;
  if (!concept || !course || !student || concept.courseId !== courseId) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Assessment unavailable for this concept in the current demo context.","التقييم غير متاح للمفهوم ده في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st7">{tr("Back to course","العودة للكورس")}</Link></Button></CardContent></Card></div>;

  const previous = student.mastery[concept.id] ?? 0;
  const band = masteryBand(previous);
  const answeredCount = questionSet.filter(q => !!answers[q.id]).length;
  const canSubmit = questionSet.length > 0 && (answeredCount === questionSet.length || remainingSeconds === 0);
  const timeDisplay = `${Math.floor(remainingSeconds / 60).toString().padStart(2, "0")}:${(remainingSeconds % 60).toString().padStart(2, "0")}`;

  return <div className="mx-auto max-w-4xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href={`/student/st9?conceptId=${concept.id}`}><ArrowLeft className="me-2 size-4 rtl:-scale-x-100"/>{tr("Back to practice","العودة للتدريب")}</Link></Button>
      <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>
    <Card><CardContent className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{tr("Mastery assessment","تقييم الإتقان")}</span><span>ST10 · {concept.title}</span></div><Progress value={result ? 100 : questionSet.length ? answeredCount / questionSet.length * 100 : 0}/><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{tr("Demo assessment · current question bank","تقييم تجريبي · بنك الأسئلة الحالي")}</p>{!result && questionSet.length > 0 && <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${remainingSeconds <= 30 ? "bg-warning-soft text-warning-ink" : "bg-muted text-foreground"}`}><Clock3 className="size-4" aria-hidden="true"/><span>{tr("Time remaining","الوقت المتبقي")}</span><span role="timer" aria-label={tr("Time remaining","الوقت المتبقي")} className="font-semibold tabular-nums" dir="ltr">{timeDisplay}</span></div>}</div></CardContent></Card>
    {!result ? <Card><CardHeader><CardTitle>{tr("Assessment","التقييم")}</CardTitle><CardDescription>{tr("You have 2 minutes. Answer all questions to submit early, or your current answers will be submitted when time runs out. Unanswered questions count as incorrect.","عندك دقيقتين. جاوبي على كل الأسئلة للتسليم مبكرًا، أو هتتسلم إجاباتك تلقائيًا لما الوقت يخلص. الأسئلة غير المجابة بتتحسب غلط.")}</CardDescription></CardHeader><CardContent className="space-y-6">
      {questionSet.length===0 ? <div className="rounded-xl border border-warning bg-warning-soft p-4 text-sm text-warning-ink">{tr("There are no demo questions for this concept yet. No assessment can be submitted.","مفيش أسئلة تجريبية متاحة للمفهوم ده حاليًا. مش ممكن تسليم تقييم.")}</div> : questionSet.map((q,index)=><div key={q.id} className="space-y-4"><div className="flex items-center justify-between"><p className="font-medium">{tr("Question","السؤال")} {index+1} {questionSet.length>1? `/ ${questionSet.length}`:""}</p><span className="text-xs text-muted-foreground">{q.id}</span></div><p className="text-lg leading-8">{q.prompt}</p><div className="space-y-2" role="group" aria-label={`${tr("Question","السؤال")} ${index + 1}`}>{q.options.map((option,i)=><button key={option} type="button" aria-pressed={answers[q.id]===option} onClick={()=>{if (Date.now() >= attempt.deadline) { finishAssessment(true); return; } setAnswers(s=>({...s,[q.id]:option}));}} className={`w-full rounded-xl border p-4 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${answers[q.id]===option?"border-primary bg-primary/5 ring-1 ring-primary":"hover:bg-muted"}`}><span className="me-3 inline-flex size-7 items-center justify-center rounded-full border text-sm">{String.fromCharCode(65+i)}</span>{option}</button>)}</div></div>)}
      <div className="rounded-xl bg-muted p-4"><p className="font-medium">{tr("Current mastery","الإتقان الحالي")}: {previous}%</p><p className="text-sm text-muted-foreground">{band.band} · {tr("Submitting updates mastery using the agreed demo formula.","التسليم هيحدث الإتقان باستخدام المعادلة المتفق عليها للعرض.")}</p></div>
      {error && <div role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</div>}
      <Button className="w-full" disabled={!canSubmit} onClick={()=>finishAssessment()}><ClipboardCheck className="me-2 size-4"/>{tr("Submit assessment","تسليم التقييم")}</Button>
    </CardContent></Card> : <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-6 text-primary"/>{tr("Assessment submitted","تم تسليم التقييم")}</CardTitle><CardDescription>{result.timedOut ? tr("Time is up. Your current answers were submitted automatically and your result is saved.","الوقت خلص. إجاباتك اتسلمت تلقائيًا ونتيجتك اتحفظت.") : tr("Your result is saved in the shared demo state.","نتيجتك اتحفظت في بيانات العرض المشتركة.")}</CardDescription></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Assessment score","نتيجة التقييم")}</p><p className="mt-1 text-3xl font-semibold">{result.score}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Previous mastery","الإتقان السابق")}</p><p className="mt-1 text-3xl font-semibold">{result.previous}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Updated mastery","الإتقان الجديد")}</p><p className="mt-1 text-3xl font-semibold">{result.mastery}%</p></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><p className="font-semibold">{tr("Mastery level","مستوى الإتقان")}</p><span className="rounded-full border px-3 py-1 text-sm">{masteryBand(result.mastery).band}</span></div><Progress value={result.mastery}/><p className="text-sm text-muted-foreground">{tr("The shared student record has been updated.","بيانات الطالب المشتركة اتحدثت.")}</p></div>
      <div className="rounded-xl bg-muted p-4 text-sm"><p className="font-medium">{tr("Calculation","طريقة الحساب")}</p><p className="notch-type-math mt-2" dir="ltr">round(0.60 × {result.previous} + 0.40 × {result.score}) = {result.mastery}</p><p className="mt-2 text-muted-foreground">{tr("Deterministic demo simulation, not a validated learning model.","حساب تجريبي ثابت، مش نموذج تعليمي مُعتمد.")}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={retakeAssessment}><RotateCcw className="me-2 size-4"/>{tr("Retake assessment","إعادة التقييم")}</Button><Button asChild><Link href={`/student/st11?conceptId=${concept.id}`}>{tr("Continue to diagnosis","كملي للتشخيص")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100"/></Link></Button></div>
    </CardContent></Card>}
    <p className="text-xs text-muted-foreground">{tr("Only illustrative fixture questions are available; this is not a validated question bank.","المتاح أسئلة توضيحية فقط، مش بنك تقييم مُراجع.")}</p>
  </div>;
}
