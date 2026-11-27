"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, NativeSelect } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { DEMO_DAY, eventLabel, type EventKind } from "./data";
import { useOverview, useParam } from "./hooks";
import { CourseFilter, CourseTag, PageBack } from "./ui";

const where = (kind: EventKind, id: string) => (kind === "lecture" ? `/instructor/courses/${id}/lectures` : kind === "assignment" ? `/instructor/courses/${id}/submissions` : "/instructor/assessments");

export function CalendarPage() {
  const { t, num, date, assigned, events } = useOverview();
  const [course, setCourse] = useParam("course");
  const [kind, setKind] = useParam("kind");
  const counts = Object.fromEntries(assigned.map((c) => [c.id, events.filter((e) => e.courseId === c.id).length]));
  const shown = events.filter((e) => (course === "all" || e.courseId === course) && (kind === "all" || e.kind === kind));
  const days = [...new Set(shown.map((e) => new Date(new Date(e.date).getTime() + 2 * 3600000).toISOString().slice(0, 10)))];
  const away = (d: string) => Math.round((new Date(d).getTime() - new Date(DEMO_DAY).getTime()) / 86400000);
  return (
    <div className="space-y-6 animate-fade-in">
      <div><PageBack /><PageTitle eyebrow={t("CALENDAR", "التقويم")} title={t("What's coming up.", "ما هو قادم.")} description={t("Quizzes, exams, assignment deadlines and lectures across your courses.", "اختبارات وامتحانات ومواعيد واجبات ومحاضرات عبر مقرراتك.")} /></div>
      <NativeSelect aria-label={t("Event type", "نوع الحدث")} className="w-auto" value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">{t("All event types", "كل أنواع الأحداث")}</option>{(Object.keys(eventLabel) as EventKind[]).map((k) => <option key={k} value={k}>{t(eventLabel[k])}</option>)}</NativeSelect>
      <CourseFilter value={course} onChange={setCourse} counts={counts} />
      <div className="space-y-5">
        {days.map((d) => {
          const n = away(d);
          return (
            <section key={d} aria-label={d}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">{date(`${d}T12:00:00+02:00`, { weekday: "long", day: "numeric", month: "long" })}<Badge tone={n <= 1 ? "warning" : "neutral"}>{n === 0 ? t("Today", "اليوم") : n === 1 ? t("Tomorrow", "غدًا") : t(`In ${n} days`, `بعد ${num(n)} أيام`)}</Badge></h2>
              <Card className="divide-y">
                {shown.filter((e) => new Date(new Date(e.date).getTime() + 2 * 3600000).toISOString().slice(0, 10) === d).map((e) => {
                  const c = assigned.find((x) => x.id === e.courseId)!;
                  return (
                    <div key={e.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                      <span className="w-16 tabular-nums text-muted-foreground">{date(e.date, { hour: "2-digit", minute: "2-digit" })}</span>
                      <div className="min-w-0 flex-1 basis-56"><p className="font-medium">{t(e.title)}</p><p className="mt-1 flex flex-wrap items-center gap-2"><Badge tone={e.kind === "exam" ? "danger" : e.kind === "quiz" ? "warning" : "brand"}>{t(eventLabel[e.kind])}</Badge><CourseTag course={c} /></p></div>
                      <Button asChild size="sm" variant="outline"><Link href={where(e.kind, e.courseId)}>{t("Open", "فتح")}</Link></Button>
                    </div>
                  );
                })}
              </Card>
            </section>
          );
        })}
      </div>
      {!shown.length && <EmptyState title={t("Nothing scheduled", "لا يوجد شيء مجدول")} description={t("No events match these filters.", "لا توجد أحداث مطابقة للتصفية.")} />}
    </div>
  );
}
