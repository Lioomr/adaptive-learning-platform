"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findConcept, findCourse, questions } from "@/data/fixtures";
import { masteryBand } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentMasteryAssessment({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const submit = useDemo(s => s.submit);
  const concept = findConcept(conceptId);
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const questionSet = questions.filter(q => q.courseId === courseId && q.conceptId === conceptId);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [result, setResult] = useState<{score:number;previous:number;mastery:number;error?:string}|null>(null);
  const [language, setLanguage] = useState<"en"|"ar">("en");
  const ar = language === "ar";
  const tr = (en:string, arabic:string) => ar ? arabic : en;

  if (!hydrated) return <div className="mx-auto max-w-4xl"><div className="h-64 animate-pulse rounded-xl bg-muted"/></div>;
  if (!concept || !course || !student || concept.courseId !== courseId) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Assessment unavailable for this concept in the current demo context.","التقييم غير متاح للمفهوم ده في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st7">{tr("Back to course","العودة للكورس")}</Link></Button></CardContent></Card></div>;

  const previous = student.mastery[concept.id] ?? 0;
  const band = masteryBand(previous);
  const canSubmit = questionSet.length > 0 && questionSet.every(q => !!answers[q.id]);
  const onSubmit = () => {
    const submissionId = `st10-${studentId}-${conceptId}-${Date.now()}`;
    const response = submit({ submissionId, studentId, courseId, conceptId, questionIds: questionSet.map(q=>q.id), answers }, "student");
    if (!response.ok) { setResult({score:0,previous,mastery:previous,error:response.error}); return; }
    setResult({score:response.attempt.score,previous:response.attempt.previous,mastery:response.attempt.mastery});
  };

  return <div className="mx-auto max-w-4xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href={`/student/st9?conceptId=${concept.id}`}><ArrowLeft className="me-2 size-4 rtl:-scale-x-100"/>{tr("Back to practice","العودة للتدريب")}</Link></Button>
      <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>
    <Card><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between text-sm"><span>{tr("Mastery assessment","تقييم الإتقان")}</span><span>ST10 · {concept.title}</span></div><Progress value={result?100:0}/><p className="text-xs text-muted-foreground">{tr("Demo assessment · current question bank","تقييم تجريبي · بنك الأسئلة الحالي")}</p></CardContent></Card>
    {!result ? <Card><CardHeader><CardTitle>{tr("Assessment","التقييم")}</CardTitle><CardDescription>{tr("Answer all available questions before submitting. Unanswered questions count as incorrect.","جاوبي على كل الأسئلة المتاحة قبل التسليم. الأسئلة غير المجابة بتتحسب غلط.")}</CardDescription></CardHeader><CardContent className="space-y-6">
      {questionSet.length===0 ? <div className="rounded-xl border border-warning bg-warning-soft p-4 text-sm text-warning-ink">{tr("There are no demo questions for this concept yet. No assessment can be submitted.","مفيش أسئلة تجريبية متاحة للمفهوم ده حاليًا. مش ممكن تسليم تقييم.")}</div> : questionSet.map((q,index)=><div key={q.id} className="space-y-4"><div className="flex items-center justify-between"><p className="font-medium">{tr("Question","السؤال")} {index+1} {questionSet.length>1? `/ ${questionSet.length}`:""}</p><span className="text-xs text-muted-foreground">{q.id}</span></div><p className="text-lg leading-8">{q.prompt}</p><div className="space-y-2">{q.options.map((option,i)=><button key={option} onClick={()=>setAnswers(s=>({...s,[q.id]:option}))} className={`w-full rounded-xl border p-4 text-start transition ${answers[q.id]===option?"border-primary bg-primary/5 ring-1 ring-primary":"hover:bg-muted"}`}><span className="me-3 inline-flex size-7 items-center justify-center rounded-full border text-sm">{String.fromCharCode(65+i)}</span>{option}</button>)}</div></div>)}
      <div className="rounded-xl bg-muted p-4"><p className="font-medium">{tr("Current mastery","الإتقان الحالي")}: {previous}%</p><p className="text-sm text-muted-foreground">{band.band} · {tr("Submitting updates mastery using the agreed demo formula.","التسليم هيحدث الإتقان باستخدام المعادلة المتفق عليها للعرض.")}</p></div>
      <Button className="w-full" disabled={!canSubmit} onClick={onSubmit}><ClipboardCheck className="me-2 size-4"/>{tr("Submit assessment","تسليم التقييم")}</Button>
    </CardContent></Card> : <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-6 text-primary"/>{tr("Assessment submitted","تم تسليم التقييم")}</CardTitle><CardDescription>{tr("Your result is saved in the shared demo state.","نتيجتك اتحفظت في بيانات العرض المشتركة.")}</CardDescription></CardHeader><CardContent className="space-y-5">
      {result.error?<div className="rounded-lg border border-destructive p-3 text-sm text-destructive">{result.error}</div>:<>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Assessment score","نتيجة التقييم")}</p><p className="mt-1 text-3xl font-semibold">{result.score}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Previous mastery","الإتقان السابق")}</p><p className="mt-1 text-3xl font-semibold">{result.previous}%</p></div><div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Updated mastery","الإتقان الجديد")}</p><p className="mt-1 text-3xl font-semibold">{result.mastery}%</p></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><p className="font-semibold">{tr("Mastery level","مستوى الإتقان")}</p><span className="rounded-full border px-3 py-1 text-sm">{masteryBand(result.mastery).band}</span></div><Progress value={result.mastery}/><p className="text-sm text-muted-foreground">{tr("The shared student record has been updated.","بيانات الطالب المشتركة اتحدثت.")}</p></div>
      <div className="rounded-xl bg-muted p-4 text-sm"><p className="font-medium">{tr("Calculation","طريقة الحساب")}</p><p className="notch-type-math mt-2" dir="ltr">round(0.60 × {result.previous} + 0.40 × {result.score}) = {result.mastery}</p><p className="mt-2 text-muted-foreground">{tr("Deterministic demo simulation, not a validated learning model.","حساب تجريبي ثابت، مش نموذج تعليمي مُعتمد.")}</p></div>
      </>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>{setAnswers({});setResult(null)}}><RotateCcw className="me-2 size-4"/>{tr("Retake assessment","إعادة التقييم")}</Button><Button asChild><Link href={`/student/st11?conceptId=${concept.id}`}>{tr("Continue to diagnosis","كملي للتشخيص")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100"/></Link></Button></div>
    </CardContent></Card>}
    <p className="text-xs text-muted-foreground">{tr("Only illustrative fixture questions are available; this is not a validated question bank.","المتاح أسئلة توضيحية فقط، مش بنك تقييم مُراجع.")}</p>
  </div>;
}
