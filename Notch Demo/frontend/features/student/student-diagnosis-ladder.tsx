"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concepts, findConcept, findCourse } from "@/data/fixtures";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentDiagnosisLadder({ conceptId }: { conceptId: string }) {
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

  const ladder = useMemo(() => {
    if (!concept) return [];
    const seen = new Set<string>();
    const collect = (id: string) => {
      if (seen.has(id)) return;
      seen.add(id);
      const item = concepts.find(c => c.id === id);
      if (!item) return;
      item.prerequisites.forEach(collect);
      seen.add(id);
    };
    concept.prerequisites.forEach(collect);
    seen.add(concept.id);
    return concepts.filter(c => c.courseId === concept.courseId && seen.has(c.id));
  }, [concept]);

  if (!hydrated) return <main className="mx-auto max-w-4xl p-6"><div className="h-64 animate-pulse rounded-xl bg-muted"/></main>;
  if (!concept || !course || !student || concept.courseId !== courseId) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="space-y-4 p-6"><p>{tr("Diagnosis unavailable for this concept in the current demo context.","التشخيص غير متاح للمفهوم ده في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st7">{tr("Back to course","العودة للكورس")}</Link></Button></CardContent></Card></main>;

  const current = student.mastery[concept.id] ?? 0;
  const belowReady = ladder.filter(c => c.id !== concept.id && (student.mastery[c.id] ?? 0) < PREREQUISITE_READY);
  const firstReview = belowReady[0];
  const band = masteryBand(current);

  return <main className="mx-auto max-w-4xl space-y-5 p-4 pb-12 md:p-6" dir={ar?"rtl":"ltr"}>
    <div className="flex items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href={`/student/st10?conceptId=${concept.id}`}><ArrowLeft className="me-2 size-4"/>{tr("Back to assessment","العودة للتقييم")}</Link></Button>
      <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="size-4"/> ST11 · {tr("Diagnosis ladder","سُلّم التشخيص")} · {concept.title}</div>
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">{tr("Learning diagnosis","تشخيص مستوى التعلم")}</h1><p className="mt-1 text-muted-foreground">{tr("A prerequisite-based view of your current mastery.","عرض لمستوى إتقانك الحالي بناءً على المتطلبات السابقة.")}</p></div><div className="text-end"><p className="text-3xl font-bold">{current}%</p><span className="text-sm">{band.band}</span></div></div>
      <Progress value={current}/>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>{tr("Concept ladder","سُلّم المفاهيم")}</CardTitle><CardDescription>{tr("Prerequisites are considered ready at 70% mastery. This is guidance, not a blocking rule.","المتطلبات السابقة تعتبر جاهزة عند إتقان 70%. ده توجيه مش شرط يمنعك من التقدم.")}</CardDescription></CardHeader><CardContent className="space-y-3">
      {ladder.map((item,index)=>{const value=student.mastery[item.id]??0;const isTarget=item.id===concept.id;const ready=value>=PREREQUISITE_READY;return <div key={item.id} className="rounded-xl border p-4"><div className="flex items-start gap-3"><div className="mt-0.5">{ready?<CheckCircle2 className="size-5 text-emerald-600"/>:<Circle className="size-5 text-amber-500"/>}</div><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{index+1}. {item.title}{isTarget?<span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{tr("Current concept","المفهوم الحالي")}</span>:null}</p><p className="text-xs text-muted-foreground">{item.id}</p></div><span className="text-sm font-semibold">{value}% · {masteryBand(value).band}</span></div><Progress value={value}/>{!ready&&!isTarget?<Button size="sm" variant="outline" asChild><Link href={`/student/st8/${item.id}`}><BookOpen className="me-2 size-4"/>{tr("Review concept","مراجعة المفهوم")}</Link></Button>:null}</div></div></div>})}
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5"/>{tr("Diagnosis & next step","التشخيص والخطوة التالية")}</CardTitle></CardHeader><CardContent className="space-y-4">
      {firstReview?<div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4"><p className="font-semibold">{tr("Recommended review","المراجعة المقترحة")}: {firstReview.title}</p><p className="mt-1 text-sm text-muted-foreground">{tr("This prerequisite is below the 70% readiness threshold.","المفهوم ده أقل من حد الجاهزية 70%.")}</p><Button className="mt-3" asChild><Link href={`/student/st8/${firstReview.id}`}>{tr("Start review","ابدئي المراجعة")}<ArrowLeft className="ms-2 size-4"/></Link></Button></div>:<div className="rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-4"><p className="font-semibold">{tr("Prerequisites look ready","المتطلبات السابقة جاهزة")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("All listed prerequisites are at or above 70%. You can continue learning this concept.","كل المتطلبات السابقة وصلت لـ70% أو أكتر. تقدري تكملي تعلم المفهوم.")}</p></div>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href={`/student/st8/${concept.id}`}>{tr("Return to lesson","العودة للدرس")}<BookOpen className="ms-2 size-4"/></Link></Button><Button asChild><Link href={`/student/st12?conceptId=${concept.id}`}>{tr("Continue to roadmap","كملي للخريطة")}<ArrowLeft className="ms-2 size-4"/></Link></Button></div>
      <p className="text-xs text-muted-foreground">{tr("Demo diagnosis uses the shared mastery fixtures and prerequisite graph. It is deterministic guidance, not an AI diagnosis.","التشخيص في الديمو بيعتمد على بيانات الإتقان والـ prerequisite graph، مش تشخيص بالذكاء الاصطناعي.")}</p>
    </CardContent></Card>
  </main>;
}
