"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findConcept, findCourse, findQuestion } from "@/data/fixtures";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

const fallbackQuestions: Record<string, {prompt:string;options:string[];answer:string;explanation:string}> = {
  "PY-REC": { prompt: "What stops a recursive function from calling itself indefinitely?", options: ["A base case", "A variable name", "A comment"], answer: "A base case", explanation: "The base case returns without making another recursive call, stopping the recursion." },
  "PY-STACK": { prompt: "When a function returns, what happens to its active stack frame?", options: ["It is removed from the stack", "It stays at the top forever", "It becomes a global variable"], answer: "It is removed from the stack", explanation: "A completed call is popped from the call stack, and its caller resumes." },
  "MA-DERIV": { prompt: "What is the derivative of x² at x = 3?", options: ["3", "6", "9"], answer: "6", explanation: "The derivative of x² is 2x. Substituting x = 3 gives 6." },
};

export function StudentPracticeSession({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const concept = findConcept(conceptId);
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const bankQuestion = findQuestion(conceptId === "PY-REC" ? "PY-REC-001" : conceptId === "MA-DERIV" ? "MA-DERIV-001" : "");
  const question = bankQuestion ?? fallbackQuestions[conceptId];
  const [selected, setSelected] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [language, setLanguage] = useState<"en"|"ar">("en");
  const ar = language === "ar";
  const tr = (en:string, arabic:string) => ar ? arabic : en;

  if (!hydrated) return <div className="mx-auto max-w-4xl"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
  if (!concept || !course || !student || concept.courseId !== courseId) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Practice is unavailable for this concept in the current demo context.","التدريب غير متاح للمفهوم ده في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st7">{tr("Back to course","العودة للكورس")}</Link></Button></CardContent></Card></div>;

  const demoQuestion = question ?? { prompt: tr("Which statement best describes","أي عبارة بتوصف") + " " + concept.title + "?", options: [tr("The main idea of the concept","الفكرة الأساسية للمفهوم"),tr("An unrelated concept","مفهوم غير مرتبط"),tr("A random rule","قاعدة عشوائية")], answer: tr("The main idea of the concept","الفكرة الأساسية للمفهوم"), explanation: tr("This is a placeholder practice item, not a reviewed question-bank item.","ده سؤال تجريبي بديل، مش سؤال من بنك أسئلة مُراجع.") };
  const correct = selected === demoQuestion.answer;
  const isReviewedQuestion = !!bankQuestion;
  const mastery = student.mastery[concept.id] ?? 0;

  return <div className="mx-auto max-w-4xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href={`/student/st8/${concept.id}`}><ArrowLeft className="me-2 size-4 rtl:-scale-x-100"/>{tr("Back to lesson","العودة للدرس")}</Link></Button>
      <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>
    <Card><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between text-sm"><span>{tr("Learning checkpoint","نقطة مراجعة")}</span><span>ST9 · {concept.title}</span></div><Progress value={100}/><p className="text-xs text-muted-foreground">{tr("Practice question · Demo content","سؤال تدريبي · محتوى تجريبي")}</p></CardContent></Card>
    <Card><CardHeader><CardTitle>{tr("Check your understanding","اختبري فهمك")}</CardTitle><CardDescription>{tr("Choose one answer, then check the explanation.","اختاري إجابة واحدة وبعدها راجعي التفسير.")}</CardDescription></CardHeader><CardContent className="space-y-5">
      <p className="text-lg font-medium leading-8">{demoQuestion.prompt}</p>
      <div className="space-y-3">{demoQuestion.options.map((option,index)=><button key={option} disabled={submitted} onClick={()=>setSelected(option)} className={`w-full rounded-xl border p-4 text-start transition ${selected===option?"border-primary bg-primary/5 ring-1 ring-primary":"hover:bg-muted"} ${submitted&&option===demoQuestion.answer?"border-success bg-success-soft text-success-ink":submitted&&selected===option&&!correct?"border-danger bg-danger-soft text-danger-ink":""}`}><span className="me-3 inline-flex size-7 items-center justify-center rounded-full border text-sm">{String.fromCharCode(65+index)}</span>{option}{submitted&&option===demoQuestion.answer&&<CheckCircle2 className="ms-2 inline size-4"/>}{submitted&&selected===option&&!correct&&<XCircle className="ms-2 inline size-4"/>}</button>)}</div>
      {!submitted&&<div className="flex flex-wrap gap-2"><Button disabled={!selected} onClick={()=>setSubmitted(true)}>{tr("Check answer","تحققي من الإجابة")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100"/></Button><Button variant="outline" onClick={()=>setHintOpen(v=>!v)}><HelpCircle className="me-2 size-4"/>{tr("Hint","تلميح")}</Button></div>}
      {hintOpen&&!submitted&&<div className="rounded-lg bg-info-soft p-3 text-sm text-info-ink">{tr("Think about the key rule that makes this concept work.","فكري في القاعدة الأساسية اللي بتخلي المفهوم ده يشتغل.")}</div>}
      {submitted&&<div className={`rounded-xl border p-4 ${correct?"border-success bg-success-soft text-success-ink":"border-danger bg-danger-soft text-danger-ink"}`}><div className="flex items-center gap-2 font-semibold">{correct?<CheckCircle2 className="size-5"/>:<XCircle className="size-5"/>}{correct?tr("Correct!","إجابة صحيحة!"):tr("Not quite — review the explanation","مش بالظبط — راجعي التفسير")}</div><p className="mt-2 text-sm leading-6">{demoQuestion.explanation}</p><p className="mt-3 text-xs">{tr("Practice feedback only. This checkpoint does not change mastery.","تغذية راجعة للتدريب فقط. السؤال ده مش بيغير مستوى الإتقان.")}</p></div>}
    </CardContent></Card>
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-medium">{tr("Current concept mastery","مستوى إتقان المفهوم الحالي")}</p><p className="text-sm text-muted-foreground">{mastery}% · {tr("from the shared demo state","من بيانات العرض المشتركة")}</p></div><div className="w-full max-w-xs"><Progress value={mastery}/></div></CardContent></Card>
    <div className="flex flex-wrap justify-between gap-3">{submitted&&<Button variant="outline" onClick={()=>{setSelected("");setSubmitted(false);setHintOpen(false)}}><RotateCcw className="me-2 size-4"/>{tr("Try again","حاولي تاني")}</Button>}<Button asChild className="max-w-full"><Link href={`/student/st10?conceptId=${concept.id}`}>{tr("Continue to mastery assessment","كملي لتقييم الإتقان")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100"/></Link></Button></div>
    <p className="text-xs text-muted-foreground">{isReviewedQuestion?tr("Illustrative fixture question from the current demo bank.","سؤال توضيحي من بنك العرض الحالي."):tr("Placeholder practice content; question-bank review is still pending.","محتوى تدريبي بديل؛ مراجعة بنك الأسئلة لسه مطلوبة.")}</p>
  </div>;
}
