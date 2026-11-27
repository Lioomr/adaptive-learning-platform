"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, FileWarning, MessageSquareWarning, Upload, UserRoundX, Users, Activity as ActivityIcon, GraduationCap, HelpCircle, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SectionTitle } from "@/features/instructor/portal/ui";
import { categories, categoryLabel, eventLabel, issueLabel, oobReasonLabel, NOW, type Activity, type IssueKind, type OobReason } from "./data";
import { useAgo, useOverview } from "./hooks";
import { CourseTag, levelRing, Urgency, type Level } from "./ui";

type Row = { label: string; n: number; href: string };
function AttentionCard({ icon: Icon, title, count, level, description, rows, courses, cta, href, children }: {
  icon: typeof ClipboardCheck; title: string; count: number; level: Level; description: string; rows?: Row[]; courses?: React.ReactNode; cta: string; href: string; children?: React.ReactNode;
}) {
  const { t, num } = useOverview();
  void t;
  return (
    <Card className={cn("flex flex-col p-5 sm:p-6", levelRing[level])}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span><h3 className="text-base font-semibold leading-tight">{title}</h3></span>
        <Urgency level={level} />
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">{num(count)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {rows && (
        <ul className="mt-4 divide-y rounded-lg border text-sm">
          {rows.map((r) => (
            <li key={r.label}><Link href={r.href} className="flex items-center justify-between gap-3 px-3 py-2 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"><span>{r.label}</span><strong className="tabular-nums">{num(r.n)}</strong></Link></li>
          ))}
        </ul>
      )}
      {children}
      {courses && <div className="mt-4 flex flex-wrap gap-1.5">{courses}</div>}
      <Button asChild className="mt-5 w-full sm:w-fit"><Link href={href}>{cta}<ArrowRight className="rtl:-scale-x-100" aria-hidden="true" /></Link></Button>
    </Card>
  );
}

const icons: Record<Activity["kind"], typeof Upload> = { submission: ClipboardCheck, diagnostic: GraduationCap, upload: Upload, approval: CheckCircle2, help: HelpCircle, assessment: ListChecks };

export function InstructorDashboard() {
  const o = useOverview();
  const ago = useAgo();
  const { instructor, t, num, date, assigned, pending, openRisks, issues, oob, events, perCourse, students, activity, activeAssessments } = o;
  const byCat = (c: (typeof categories)[number]) => pending.filter((p) => p.category === c).length;
  const count = <T extends { courseId: string }>(list: T[], id: string) => list.filter((x) => x.courseId === id).length;
  const courseTags = (list: { courseId: string }[], base: string) => assigned.map((c) => ({ c, n: count(list, c.id) })).filter((x) => x.n > 0).map(({ c, n }) => <CourseTag key={c.id} course={c} count={n} href={`${base}${base.includes("?") ? "&" : "?"}course=${c.id}`} />);
  const oldest = Math.max(0, ...pending.map((p) => p.ageDays));
  const risk = (k: "inactive" | "behind" | "gap") => openRisks.filter((r) => r.reasons.some((x) => (k === "gap" ? x.key === "stuck" || x.key === "prerequisite" || x.key === "mastery" : x.key === k))).length;
  const issueCount = (k: IssueKind) => issues.filter((i) => i.kind === k).length;
  const oobCourses = assigned.map((c) => { const list = oob.filter((x) => x.courseId === c.id); const tally = new Map<OobReason, number>(); list.forEach((x) => tally.set(x.reason, (tally.get(x.reason) ?? 0) + 1)); return { course: c, n: list.length, students: new Set(list.flatMap((x) => x.students)).size, latest: list.reduce((m, x) => (x.at > m ? x.at : m), ""), reason: ([...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unsupported") as OobReason }; }).filter((r) => r.n > 0).sort((a, b) => b.latest.localeCompare(a.latest));
  const soon = events.filter((e) => e.date <= new Date(new Date(NOW).getTime() + 7 * 86400000).toISOString());
  const level = (urgent: boolean, n: number): Level => (n === 0 ? "clear" : urgent ? "urgent" : "attention");
  const attentionTotal = pending.length + openRisks.length + issues.length + oob.length;
  const fmtDay = (iso: string) => date(iso, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const totals = {
    enrolled: students.length * assigned.length,
    active: perCourse.reduce((a, c) => a + c.active, 0),
    mastery: Math.round(perCourse.reduce((a, c) => a + c.mastery, 0) / Math.max(1, perCourse.length)),
    questions: perCourse.reduce((a, c) => a + c.mastery * c.enrolled * 3, 0),
  };
  const week = [0.6, 0.8, 0.7, 0.95, 0.85, 0.4, 0.55].map((f) => Math.round(f * (totals.questions / 5)));
  const maxWeek = Math.max(1, ...week);
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />{date(NOW, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t(`Good morning, ${t(instructor.name)}`, `صباح الخير، ${t(instructor.name)}`)}</h1>
        <p className="mt-2 text-muted-foreground">{t("Here's what needs your attention across your courses.", "إليك ما يحتاج إلى اهتمامك في مقرراتك.")}</p>
      </header>

      <section aria-labelledby="attention" className="rounded-2xl border bg-secondary/30 p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="attention" className="text-xl font-semibold tracking-tight">{t("Needs your attention", "يحتاج إلى اهتمامك")}</h2><p className="text-sm text-muted-foreground">{attentionTotal ? t(`${num(attentionTotal)} items across ${num(assigned.length)} courses, most urgent first.`, `${num(attentionTotal)} عنصرًا عبر ${num(assigned.length)} مقررات، الأكثر إلحاحًا أولًا.`) : t("Everything is handled. Nice work.", "تمت معالجة كل شيء. عمل رائع.")}</p></div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <AttentionCard icon={ClipboardCheck} title={t("Pending approvals", "الاعتمادات المعلّقة")} count={pending.length} level={level(oldest >= 5, pending.length)} description={t(`Waiting for your review. The oldest has waited ${num(oldest)} days.`, `بانتظار مراجعتك. أقدمها ينتظر منذ ${num(oldest)} أيام.`)}
            rows={categories.map((c) => ({ label: `${num(byCat(c))} ${t(categoryLabel[c])}`.replace(/^\d+\s|^[٠-٩]+\s/, ""), n: byCat(c), href: `/instructor/approvals?category=${c}` }))}
            courses={courseTags(pending, "/instructor/approvals")} cta={t("Review Approvals", "مراجعة الاعتمادات")} href="/instructor/approvals" />
          <AttentionCard icon={UserRoundX} title={t("Students at risk", "الطلاب المعرّضون للتعثر")} count={openRisks.length} level={level(openRisks.some((r) => r.severity === "high"), openRisks.length)} description={t("Flagged by explicit rules on real activity, not by a black box.", "موسومون بقواعد صريحة على النشاط الفعلي لا بنموذج غامض.")}
            rows={[{ label: t("Inactive for several days", "غير نشطين منذ عدة أيام"), n: risk("inactive"), href: "/instructor/student-management?filter=at-risk&reason=inactive" }, { label: t("Stuck on a concept or its prerequisite", "متعثرون في مفهوم أو متطلبه"), n: risk("gap"), href: "/instructor/student-management?filter=at-risk&reason=concept" }, { label: t("Behind the weekly schedule", "متأخرون عن الجدول الأسبوعي"), n: risk("behind"), href: "/instructor/student-management?filter=at-risk&reason=behind" }]}
            courses={courseTags(openRisks.map((r) => ({ courseId: r.course.id })), "/instructor/student-management?filter=at-risk")} cta={t("View Students at Risk", "عرض الطلاب المعرّضين للتعثر")} href="/instructor/student-management?filter=at-risk" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <AttentionCard icon={FileWarning} title={t("Course content issues", "مشكلات محتوى المقرر")} count={issues.length} level={level(issueCount("failed") > 0, issues.length)} description={t("Materials that failed, are unreadable or lack coverage.", "مواد فشلت أو غير مقروءة أو تفتقر إلى التغطية.")}
            rows={(["failed", "unreadable", "indexing", "coverage"] as IssueKind[]).map((k) => ({ label: t(issueLabel[k]), n: issueCount(k), href: `/instructor/content-issues?kind=${k}` }))}
            courses={courseTags(issues, "/instructor/content-issues")} cta={t("Resolve Issues", "معالجة المشكلات")} href="/instructor/content-issues" />
          <AttentionCard icon={MessageSquareWarning} title={t("Out-of-bound tutor questions", "أسئلة المساعد خارج النطاق")} count={oob.length} level={level(oob.some((x) => x.reason === "uncertain" || x.repeats >= 5), oob.length)} description={t(`Asked by ${num(new Set(oob.flatMap((x) => x.students)).size)} students. The tutor could not answer within your course scope or materials.`, `سأل ${num(new Set(oob.flatMap((x) => x.students)).size)} طلاب. لم يستطع المساعد الإجابة ضمن نطاق مقررك أو موادك.`)}
            cta={t("Review Questions", "مراجعة الأسئلة")} href="/instructor/out-of-bound">
            <ul className="mt-4 divide-y rounded-lg border text-sm">
              {oobCourses.map((r) => (
                <li key={r.course.id}><Link href={`/instructor/out-of-bound?course=${r.course.id}`} className="block px-3 py-2 outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex items-center justify-between gap-3"><span className="font-medium">{r.course.code} · {t(r.course.title)}</span><strong className="tabular-nums">{num(r.n)}</strong></span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{t(`${num(r.students)} students · latest ${ago(r.latest)}`, `${num(r.students)} طلاب · الأحدث ${ago(r.latest)}`)} · {t(oobReasonLabel[r.reason])}</span>
                </Link></li>
              ))}
            </ul>
          </AttentionCard>
          <AttentionCard icon={CalendarDays} title={t("Upcoming academic deadlines", "المواعيد الأكاديمية القادمة")} count={soon.length} level={level(soon.some((e) => e.kind === "exam" || e.kind === "quiz") && soon.some((e) => e.date <= new Date(new Date(NOW).getTime() + 3 * 86400000).toISOString()), soon.length)} description={t("Quizzes, exams, assignments and lectures in the next 7 days.", "اختبارات وامتحانات وواجبات ومحاضرات خلال 7 أيام.")}
            cta={t("View Calendar", "عرض التقويم")} href="/instructor/calendar">
            <ul className="mt-4 divide-y rounded-lg border text-sm">
              {events.slice(0, 4).map((e) => { const c = assigned.find((x) => x.id === e.courseId)!; return <li key={e.id} className="px-3 py-2"><p className="font-medium">{t(e.title)}</p><p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{fmtDay(e.date)} · {t(eventLabel[e.kind])} · {c.code}</p></li>; })}
            </ul>
          </AttentionCard>
        </div>
      </section>

      <section aria-labelledby="courses">
        <SectionTitle title={t("My courses", "مقرراتي")}><Button asChild variant="ghost" size="sm"><Link href="/instructor/courses">{t("View All Courses", "عرض كل المقررات")}<ArrowRight className="rtl:-scale-x-100" aria-hidden="true" /></Link></Button></SectionTitle>
        <h2 id="courses" className="sr-only">{t("My courses", "مقرراتي")}</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {perCourse.map((p) => (
            <Card key={p.course.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold leading-snug">{t(p.course.title)}</h3><p className="text-xs text-muted-foreground" dir="ltr">{p.course.code}</p></div></div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">{t("Enrolled", "المسجلون")}</dt><dd className="text-lg font-semibold tabular-nums">{num(p.enrolled)}</dd></div>
                <div><dt className="text-muted-foreground">{t("Active", "النشطون")}</dt><dd className="text-lg font-semibold tabular-nums">{num(p.active)}</dd></div>
              </dl>
              <div className="mt-3 space-y-3 text-sm">
                <div><div className="mb-1 flex justify-between"><span className="text-muted-foreground">{t("Course progress", "تقدم المقرر")}</span><strong className="tabular-nums">{num(p.progress)}%</strong></div><Progress value={p.progress} aria-label={t("Course progress", "تقدم المقرر")} /></div>
                <div><div className="mb-1 flex justify-between"><span className="text-muted-foreground">{t("Mastery", "الإتقان")}</span><strong className="tabular-nums">{num(p.mastery)}%</strong></div><Progress value={p.mastery} tone={p.mastery >= 75 ? "success" : p.mastery >= 55 ? "brand" : "warning"} aria-label={t("Mastery", "الإتقان")} /></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link href={`/instructor/approvals?course=${p.course.id}`} className={cn("rounded-full border px-2.5 py-1 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring", p.pending ? "border-warning/50 bg-warning-soft text-warning-ink" : "text-muted-foreground")}><strong className="tabular-nums">{num(p.pending)}</strong> {t("pending approvals", "اعتمادات معلّقة")}</Link>
                <Link href={`/instructor/student-management?filter=at-risk&course=${p.course.id}`} className={cn("rounded-full border px-2.5 py-1 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring", p.atRisk ? "border-danger/40 bg-danger-soft text-danger-ink" : "text-muted-foreground")}><strong className="tabular-nums">{num(p.atRisk)}</strong> {t("at risk", "معرّضون للتعثر")}</Link>
              </div>
              <Button asChild className="mt-5 w-full"><Link href={`/instructor/courses/${p.course.id}/progress`}>{t("Manage Course", "إدارة المقرر")}</Link></Button>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="overview">
        <SectionTitle title={t("Academic overview", "نظرة أكاديمية عامة")} description={t("A compact view across all your courses.", "عرض موجز عبر كل مقرراتك.")} />
        <h2 id="overview" className="sr-only">{t("Academic overview", "نظرة أكاديمية عامة")}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card className="p-4"><p className="flex items-center justify-between text-sm text-muted-foreground">{t("Enrolled students", "الطلاب المسجلون")}<Users className="size-4 text-primary" aria-hidden="true" /></p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(totals.enrolled)}</p><div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={t("Enrollment by course", "التسجيل حسب المقرر")}>{perCourse.map((p, i) => <span key={p.course.id} className="h-full bg-primary" style={{ width: `${100 / perCourse.length}%`, opacity: 1 - i * 0.25 }} />)}</div></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Active students", "الطلاب النشطون")}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(totals.active)}</p><Progress className="mt-3" value={(totals.active / Math.max(1, totals.enrolled)) * 100} tone="success" aria-label={t("Active share", "نسبة النشطين")} /><p className="mt-1 text-xs text-muted-foreground">{t("Active in the last 3 days", "نشطون خلال آخر 3 أيام")}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Average class mastery", "متوسط إتقان الصف")}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(totals.mastery)}%</p><Progress className="mt-3" value={totals.mastery} aria-label={t("Average mastery", "متوسط الإتقان")} /></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Questions answered", "الأسئلة المُجاب عنها")}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(totals.questions)}</p><div className="mt-3 flex h-8 items-end gap-1" role="img" aria-label={t("Last 7 days", "آخر 7 أيام")}>{week.map((v, i) => <span key={i} className="flex-1 rounded-sm bg-primary/70" style={{ height: `${(v / maxWeek) * 100}%` }} />)}</div><p className="mt-1 text-xs text-muted-foreground">{t("Last 7 days", "آخر 7 أيام")}</p></Card>
          <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Active assessments", "التقييمات النشطة")}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(activeAssessments.length)}</p><Link href="/instructor/calendar" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">{t("Next 14 days · open calendar", "الأيام 14 القادمة · فتح التقويم")}</Link></Card>
        </div>
      </section>

      <section aria-labelledby="recent">
        <SectionTitle title={t("Recent activity", "النشاط الأخير")} />
        <h2 id="recent" className="sr-only">{t("Recent activity", "النشاط الأخير")}</h2>
        <Card className="p-2">
          <ol className="divide-y">
            {activity.slice(0, 8).map((a) => {
              const Icon = icons[a.kind] ?? ActivityIcon;
              const c = assigned.find((x) => x.id === a.courseId)!;
              return (
                <li key={a.id} className="flex items-start gap-3 p-3 text-sm">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1"><p>{t(a.text)}</p><p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><CourseTag course={c} href={`/instructor/courses/${c.id}/progress`} /><span>{ago(a.at)}</span></p></div>
                </li>
              );
            })}
          </ol>
        </Card>
      </section>
    </div>
  );
}
