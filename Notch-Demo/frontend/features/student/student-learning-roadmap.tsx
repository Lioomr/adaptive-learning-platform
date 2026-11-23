"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Circle, Map, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concepts, findConcept, findCourse } from "@/data/fixtures";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentLearningRoadmap({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const [language, setLanguage] = useState<"en"|"ar">("en");
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const concept = findConcept(conceptId);
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseConcepts = useMemo(() => concepts.filter(c => c.courseId === courseId), [courseId]);

  if (!hydrated) return <div className="mx-auto max-w-5xl"><div className="h-64 animate-pulse rounded-xl bg-muted"/></div>;
  if (!course || !student || (concept && concept.courseId !== courseId)) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Roadmap unavailable for the current demo context.","الخريطة مش متاحة في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st7">{tr("Back to course","العودة للكورس")}</Link></Button></CardContent></Card></div>;

  const values = courseConcepts.map(c => student.mastery[c.id] ?? 0);
  const average = values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : 0;
  const mastered = courseConcepts.filter(c => (student.mastery[c.id] ?? 0) >= 85).length;
  const developing = courseConcepts.filter(c => {const v=student.mastery[c.id]??0;return v>=40&&v<70;}).length;
  const focusConcept = concept ?? courseConcepts.find(c => (student.mastery[c.id] ?? 0) < 70) ?? courseConcepts[0];
  const nextPrerequisite = focusConcept?.prerequisites.find(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY);
  const suggested = nextPrerequisite ? concepts.find(c=>c.id===nextPrerequisite) : focusConcept;
  const readyCount = courseConcepts.filter(c => c.prerequisites.every(id => (student.mastery[id] ?? 0) >= PREREQUISITE_READY)).length;

  return <div className="mx-auto max-w-5xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href={`/student/st11?conceptId=${focusConcept?.id ?? "PY-REC"}`}><ArrowLeft className="me-2 size-4 rtl:-scale-x-100"/>{tr("Back to diagnosis","العودة للتشخيص")}</Link></Button>
      <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Map className="size-4"/> ST12 · {tr("Learning roadmap","خريطة التعلم")} · {course.title}</div>
      <div><h1 className="notch-page-title">{tr("Your learning path","مسار التعلم الخاص بي")}</h1><p className="mt-1 text-muted-foreground">{tr("Track your progress and decide what to learn next.","تابعي تقدمك وحددي المفهوم اللي تتعلميه بعد كده.")}</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average mastery","متوسط الإتقان")}</p><p className="mt-1 text-3xl font-semibold">{average}%</p><Progress className="mt-2" value={average}/></div>
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Mastered concepts","مفاهيم متقنة")}</p><p className="mt-1 text-3xl font-semibold">{mastered}<span className="text-base font-normal text-muted-foreground"> / {courseConcepts.length}</span></p></div>
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Prerequisite-ready concepts","مفاهيم جاهزة بالمتطلبات")}</p><p className="mt-1 text-3xl font-semibold">{readyCount}<span className="text-base font-normal text-muted-foreground"> / {courseConcepts.length}</span></p></div>
      </div>
    </CardContent></Card>

    {suggested ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5"/>{tr("Suggested next step","الخطوة التالية المقترحة")}</CardTitle><CardDescription>{tr("Based on your current mastery and the prerequisite graph.","بناءً على مستوى إتقانك الحالي وترابط المفاهيم.")}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-lg font-semibold">{suggested.title}</p><p className="text-sm text-muted-foreground">{tr("Current mastery","الإتقان الحالي")}: {student.mastery[suggested.id] ?? 0}% · {masteryBand(student.mastery[suggested.id] ?? 0).band}</p>{nextPrerequisite?<p className="mt-1 text-sm text-warning-ink">{tr("Review this prerequisite before focusing on","راجعي المتطلب ده قبل التركيز على")} {focusConcept?.title}.</p>:<p className="mt-1 text-sm text-muted-foreground">{tr("Your selected concept's prerequisites meet the readiness threshold.","المتطلبات السابقة للمفهوم المحدد وصلت لحد الجاهزية.")}</p>}</div>
      <Button asChild><Link href={`/student/st8/${suggested.id}`}><BookOpen className="me-2 size-4"/>{tr("Open lesson","افتحي الدرس")}</Link></Button>
    </CardContent></Card>:null}

    <Card><CardHeader><CardTitle>{tr("Course roadmap","خريطة الكورس")}</CardTitle><CardDescription>{tr("Concepts are shown in the course sequence. A prerequisite score of 70% means ready; it does not block access.","المفاهيم مرتبة حسب تسلسل الكورس. نسبة 70% تعني جاهزية المتطلب، لكنها لا تمنع فتح الدروس.")}</CardDescription></CardHeader><CardContent className="space-y-3">
      {courseConcepts.map((item,index)=>{const value=student.mastery[item.id]??0;const band=masteryBand(value);const ready=item.prerequisites.every(id=>(student.mastery[id]??0)>=PREREQUISITE_READY);const isFocus=item.id===focusConcept?.id;return <div key={item.id} className={`rounded-xl border p-4 ${isFocus?"border-primary ring-1 ring-primary/30":""}`}><div className="flex items-start gap-3"><div className="mt-0.5">{value>=85?<CheckCircle2 className="size-5 text-success-ink"/>:<Circle className="size-5 text-muted-foreground"/>}</div><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{index+1}. {item.title}{isFocus?<span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{tr("Focus","التركيز الحالي")}</span>:null}</p><p className="text-xs text-muted-foreground">{item.id}</p></div><span className="text-sm font-semibold">{value}% · {band.band}</span></div><Progress value={value}/><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{item.prerequisites.length?tr("Prerequisites","المتطلبات السابقة")+": "+item.prerequisites.map(id=>concepts.find(c=>c.id===id)?.title??id).join(", "):tr("No prerequisites","لا توجد متطلبات سابقة")} · {ready?tr("Ready","جاهز"):tr("Prerequisites need review","المتطلبات محتاجة مراجعة")}</p><Button size="sm" variant="outline" asChild><Link href={`/student/st8/${item.id}`}>{tr("Open lesson","افتحي الدرس")}</Link></Button></div></div></div></div>})}
    </CardContent></Card>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild><Link href={`/student/st11?conceptId=${focusConcept?.id ?? "PY-REC"}`}>{tr("View diagnosis","عرض التشخيص")}</Link></Button>
      <Button asChild><Link href={`/student/st13?conceptId=${focusConcept?.id ?? "PY-REC"}`}>{tr("Continue to mastery overview","الانتقال لنظرة عامة على الإتقان")}<ArrowRight className="ms-2 size-4 rtl:-scale-x-100"/></Link></Button>
      <Button variant="outline" asChild><Link href="/student/st6">{tr("Back to home","العودة للرئيسية")}</Link></Button>
    </div>
    <p className="text-xs text-muted-foreground">{tr("This roadmap is a deterministic demo view of fixture mastery and prerequisite relationships. It is not an AI-generated or validated learning plan.","الخريطة دي عرض تجريبي ثابت مبني على بيانات الإتقان وعلاقات المتطلبات السابقة، وليست خطة مولدة أو معتمدة بالذكاء الاصطناعي.")}</p>
  </div>;
}
