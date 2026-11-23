"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ClipboardList, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { concepts, findCourse } from "@/data/fixtures";
import { masteryBand, MASTERY_BANDS } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

type BandFilter = "all" | "Needs Support" | "Developing" | "Proficient" | "Mastered";

export function StudentMasteryOverview() {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [filter, setFilter] = useState<BandFilter>("all");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseConcepts = useMemo(() => concepts.filter(c => c.courseId === courseId), [courseId]);
  const courseAttempts = useMemo(
    () => attempts.filter(a => a.studentId === studentId && a.courseId === courseId).slice().sort((a,b) => Date.parse(b.createdAt)-Date.parse(a.createdAt)),
    [attempts, studentId, courseId]
  );

  if (!hydrated) return <div className="mx-auto max-w-5xl"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>;
  if (!course || !student) return <div className="mx-auto max-w-3xl"><Card><CardContent className="space-y-4 p-6"><p>{tr("Mastery data is unavailable for the current demo context.","بيانات الإتقان مش متاحة في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st6">{tr("Back to home","العودة للرئيسية")}</Link></Button></CardContent></Card></div>;

  const rows = courseConcepts.map(concept => {
    const value = student.mastery[concept.id] ?? 0;
    return { concept, value, band: masteryBand(value).band };
  });
  const average = rows.length ? Math.round(rows.reduce((sum,row)=>sum+row.value,0)/rows.length) : 0;
  const counts = MASTERY_BANDS.map(b => ({...b, count: rows.filter(row=>row.band===b.band).length}));
  const visibleRows = filter === "all" ? rows : rows.filter(row=>row.band===filter);
  const latest = courseAttempts.slice(0,5);

  return <div className="mx-auto max-w-5xl space-y-5" lang={ar ? "ar" : "en"} dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" asChild><Link href="/student/st12"><ArrowLeft className="me-2 size-4 rtl:-scale-x-100"/>{tr("Back to roadmap","العودة لخريطة التعلم")}</Link></Button>
      <select aria-label="Language" className="rounded-xl border border-input bg-card px-3 py-2 text-sm" value={language} onChange={e=>setLanguage(e.target.value as "en"|"ar")}><option value="en">English</option><option value="ar">العربية</option></select>
    </div>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="size-4"/> ST13 · {tr("Mastery overview","نظرة عامة على الإتقان")} · {course.title}</div>
      <div><h1 className="notch-page-title">{tr("Your mastery","مستوى إتقانك")}</h1><p className="mt-1 text-muted-foreground">{tr("A course-level view of your current concept mastery and recorded assessment attempts.","نظرة على مستوى إتقانك الحالي لمفاهيم الكورس ومحاولات التقييم المسجلة.")}</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Average mastery","متوسط الإتقان")}</p><p className="mt-1 text-3xl font-semibold">{average}%</p><Progress className="mt-2" value={average}/></div>
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Mastered concepts","مفاهيم متقنة")}</p><p className="mt-1 text-3xl font-semibold">{counts.find(x=>x.band==="Mastered")?.count ?? 0}<span className="text-base font-normal text-muted-foreground"> / {rows.length}</span></p></div>
        <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{tr("Recorded assessments","التقييمات المسجلة")}</p><p className="mt-1 text-3xl font-semibold">{courseAttempts.length}</p></div>
      </div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>{tr("Mastery distribution","توزيع مستويات الإتقان")}</CardTitle><CardDescription>{tr("Number of course concepts in each mastery band.","عدد مفاهيم الكورس في كل مستوى إتقان.")}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {counts.map(item=><div key={item.band} className="space-y-1.5"><div className="flex items-center justify-between gap-3 text-sm"><span>{tr(item.band, item.band==="Needs Support"?"يحتاج دعم":item.band==="Developing"?"في طور التطور":item.band==="Proficient"?"متقن":"إتقان كامل")} <span className="text-muted-foreground">({item.min}–{item.max}%)</span></span><strong>{item.count} / {rows.length}</strong></div><Progress value={rows.length ? item.count/rows.length*100 : 0}/></div>)}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle>{tr("Concept-by-concept mastery","الإتقان لكل مفهوم")}</CardTitle><CardDescription>{tr("Filter the list by mastery level. Open a lesson to review a concept.","فلترّي المفاهيم حسب مستوى الإتقان، وافتحي الدرس لمراجعة أي مفهوم.")}</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["all", ...MASTERY_BANDS.map(b=>b.band)] as BandFilter[]).map(value=><Button key={value} size="sm" variant={filter===value?"default":"outline"} onClick={()=>setFilter(value)}>{value==="all"?tr("All concepts","كل المفاهيم"):tr(value,value==="Needs Support"?"يحتاج دعم":value==="Developing"?"في طور التطور":value==="Proficient"?"متقن":"إتقان كامل")}</Button>)}
        </div>
        {visibleRows.length ? visibleRows.map(row=><div key={row.concept.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{row.concept.title}</p><p className="text-xs text-muted-foreground">{row.concept.id}</p></div><span className="text-sm font-semibold">{row.value}% · {tr(row.band,row.band==="Needs Support"?"يحتاج دعم":row.band==="Developing"?"في طور التطور":row.band==="Proficient"?"متقن":"إتقان كامل")}</span></div><Progress className="mt-3" value={row.value}/><div className="mt-3 flex justify-end"><Button size="sm" variant="outline" asChild><Link href={`/student/st8/${row.concept.id}`}><BookOpen className="me-2 size-4"/>{tr("Open lesson","افتحي الدرس")}</Link></Button></div></div>) : <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">{tr("No concepts match this filter.","مفيش مفاهيم مطابقة للفلتر ده.")}</p>}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="size-5"/>{tr("Recent assessment attempts","أحدث محاولات التقييم")}</CardTitle><CardDescription>{tr("Only submissions saved in this browser's shared demo state appear here.","المعروض هنا هو التقييمات اللي اتسجلت فعلًا في بيانات الديمو على المتصفح ده.")}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {latest.length ? latest.map(attempt=>{const concept=courseConcepts.find(c=>c.id===attempt.conceptId);return <div key={attempt.submissionId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{concept?.title ?? attempt.conceptId}</p><p className="text-xs text-muted-foreground">{new Date(attempt.createdAt).toLocaleString(ar?"ar-EG":"en-US",{dateStyle:"medium",timeStyle:"short"})}</p></div><div className="text-end"><p className="font-semibold">{attempt.score}% {tr("score","النتيجة")}</p><p className="text-xs text-muted-foreground">{tr("Mastery","الإتقان")}: {attempt.previous}% → {attempt.mastery}%</p></div></div>}) : <div className="rounded-xl border border-dashed p-5 text-center"><p className="font-medium">{tr("No assessment attempts yet","لسه مفيش محاولات تقييم")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("Complete an available mastery assessment and your saved result will appear here.","كمّلي تقييم إتقان متاح، والنتيجة المسجلة هتظهر هنا.")}</p><Button className="mt-3" asChild><Link href="/student/st10">{tr("Go to assessment","اذهبي للتقييم")}</Link></Button></div>}
      </CardContent>
    </Card>

    <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/student/st14">{tr("Continue to exam readiness","كملي لاستعداد الامتحان")}</Link></Button><Button asChild><Link href="/student/st6">{tr("Back to home","العودة للرئيسية")}<ArrowLeft className="ms-2 size-4 rtl:-scale-x-100"/></Link></Button></div>
    <p className="text-xs text-muted-foreground">{tr("Mastery bands and updates follow the agreed deterministic demo formula. They are illustrative and are not a validated learning measurement.","مستويات الإتقان والتحديثات بتتبع معادلة الديمو الثابتة المتفق عليها، وهي توضيحية وليست قياسًا تعليميًا مُعتمدًا.")}</p>
  </div>;
}
