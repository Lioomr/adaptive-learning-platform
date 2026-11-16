"use client";
import Link from "next/link";
import { Activity, ArrowRight, BarChart3, ClipboardList, FileWarning, LifeBuoy, TrendingDown, Users } from "lucide-react";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { MasteryBadge, MasteryLegend } from "@/components/learning/mastery";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";
import { attemptsFor, courseAverage, formatDays, supportIndicators, supportLevel } from "@/services/insights";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { CourseId, Student } from "@/types";
import { ACTIVE_WITHIN_DAYS, contentGaps, enrolledIn, instructorLinks, topRoadblocks } from "./analytics";
import { courseGuardError, CourseContext, SampleBadge, SampleSizeNote } from "./shared";

/** IN8 Weekly dashboard. */
export function WeeklyDashboard() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow={<>IN8 · Weekly dashboard <SampleBadge className="normal-case tracking-normal" /></>}
        title="This week in your course"
        description="Weekly status, where students are stuck, who may benefit from support, and gaps in course content. Values are simulated from fictional sample data."
      />
      {hydrated ? <DashboardContent /> : <InstructorPreviewSkeleton />}
    </>
  );
}

const cellClass = { danger: "bg-danger-soft text-danger-ink", warning: "bg-warning-soft text-warning-ink", progress: "bg-progress-soft text-progress-ink", success: "bg-success-soft text-success-ink" } as const;

function DashboardContent() {
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const courseId = useDemo(s => s.courseId);
  const guard = courseGuardError(courseId);
  if (guard) return guard;

  const enrolled = enrolledIn(students, courseId);
  const averages = enrolled.map(s => courseAverage(s, courseId));
  const classAvg = averages.length ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length) : 0;
  const active = enrolled.filter(s => s.lastActiveDays <= ACTIVE_WITHIN_DAYS).length;
  const atRisk = enrolled.filter(s => supportLevel(s, [courseId]).label !== "On track");
  const sessionAttempts = attemptsFor(attempts, { courseId }).length;
  const roadblocks = topRoadblocks(enrolled, courseId);

  return (
    <div className="space-y-6">
      <CourseContext courseId={courseId} />
      <SampleSizeNote count={enrolled.length} />

      <section aria-label="Weekly status (sample data)" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled students" value={enrolled.length} icon={Users} hint="Sample data · fictional students" />
        <StatCard label="Class average mastery" value={classAvg} unit="%" icon={BarChart3} accent="progress" hint={<span className="flex flex-wrap items-center gap-2"><MasteryBadge value={classAvg} /> Sample data</span>} />
        <StatCard label={`Active in last ${ACTIVE_WITHIN_DAYS} days`} value={`${active}/${enrolled.length}`} icon={Activity} accent="success" hint="Sample data · simulated last-active days" />
        <StatCard label="May need support" value={atRisk.length} icon={LifeBuoy} accent="warning" hint={`Sample data · ${sessionAttempts} attempt${sessionAttempts === 1 ? "" : "s"} recorded this browser session`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <RoadblocksCard roadblocks={roadblocks} total={enrolled.length} />
        <AtRiskPreview students={atRisk} courseId={courseId} />
      </div>

      <Heatmap students={enrolled} courseId={courseId} />

      <ContentGapsCard courseId={courseId} />
    </div>
  );
}

function RoadblocksCard({ roadblocks, total }: { roadblocks: ReturnType<typeof topRoadblocks>; total: number }) {
  return (
    <Card as="section" aria-labelledby="roadblocks-heading" className="min-w-0 xl:col-span-7">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning-ink">
            <TrendingDown className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="roadblocks-heading">Top roadblocks</CardTitle>
            <CardDescription>Lowest class-average concepts and their weakest prerequisite. Ready means {PREREQUISITE_READY}% or above.</CardDescription>
          </div>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent>
        {roadblocks.length === 0 ? (
          <EmptyState title="No roadblocks this week" description={`Every student is at ${PREREQUISITE_READY}% or above on every concept.`} />
        ) : (
          <ol className="space-y-3" role="list">
            {roadblocks.map((r, i) => (
              <li key={r.concept.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <span className="grid size-6 place-items-center rounded-full bg-secondary text-xs tabular-nums text-brand">{i + 1}</span>
                    <Link href={instructorLinks.concept(r.concept.id)} className="rounded underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                      {r.concept.title}
                    </Link>
                    {r.prerequisite ? (
                      <>
                        <ArrowRight className="size-3.5 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
                        <span className="sr-only">likely blocked by</span>
                        <Link href={instructorLinks.concept(r.prerequisite.concept.id)} className="rounded font-medium text-warning-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                          {r.prerequisite.concept.title}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <MasteryBadge value={r.average} showValue />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">{r.notReadyCount} of {total}</span> students are below {PREREQUISITE_READY}% on {r.concept.title}
                  {r.prerequisite ? (
                    <>
                      ; <span className="font-medium text-foreground tabular-nums">{r.prerequisite.alsoNotReady}</span> of them are also below {PREREQUISITE_READY}% on {r.prerequisite.concept.title} (class average <span className="tabular-nums">{r.prerequisite.average}%</span>).
                    </>
                  ) : "."}
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={instructorLinks.concept(r.concept.id)}>
                      Open {r.concept.title} detail
                      <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function AtRiskPreview({ students, courseId }: { students: Student[]; courseId: CourseId }) {
  const preview = students.slice(0, 4);
  return (
    <Card as="section" aria-labelledby="atrisk-heading" className="min-w-0 xl:col-span-5">
      <CardHeader>
        <div>
          <CardTitle id="atrisk-heading">May need support</CardTitle>
          <CardDescription>Preview of students flagged by simulated, explainable rules.</CardDescription>
        </div>
        <Button size="sm" variant="ghost" asChild>
          <Link href={instructorLinks.atRisk}>
            View all
            <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {preview.length === 0 ? (
          <EmptyState title="No students flagged" description="No simulated support indicators for this course this week." />
        ) : (
          <ul className="divide-y divide-border" role="list">
            {preview.map(s => {
              const level = supportLevel(s, [courseId]);
              const reasons = supportIndicators(s, [courseId]);
              return (
                <li key={s.id}>
                  <Link href={instructorLinks.student(s.id)} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                    <StudentAvatar name={s.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{s.name}</span>
                        <Badge tone={level.tone}>{level.label}</Badge>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {reasons.map(r => r.detail).join(" · ")} · Last active {formatDays(s.lastActiveDays).toLowerCase()}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {students.length > preview.length ? <p className="mt-2 text-xs text-muted-foreground">+{students.length - preview.length} more on the at-risk list.</p> : null}
      </CardContent>
    </Card>
  );
}

function Heatmap({ students, courseId }: { students: Student[]; courseId: CourseId }) {
  const items = conceptsForCourse(courseId);
  const course = findCourse(courseId);
  return (
    <Card as="section" aria-labelledby="heatmap-heading" className="min-w-0">
      <CardHeader>
        <div>
          <CardTitle id="heatmap-heading">Concept heatmap</CardTitle>
          <CardDescription>Mastery per student and concept. Select a concept heading for its detail.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MasteryLegend />
          <SampleBadge />
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-0">
        {students.length === 0 ? (
          <div className="px-5 sm:px-6">
            <EmptyState title="No enrolled students" description="Students appear here once enrolled in this course." />
          </div>
        ) : (
          <div className="overflow-x-auto px-5 sm:px-6" tabIndex={0} role="region" aria-labelledby="heatmap-heading">
            <table className="w-full min-w-[760px] border-separate border-spacing-1 text-xs">
              <caption className="sr-only">Sample mastery per student and concept in {course?.title}, in percent with band</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-32 pb-1 text-start font-medium text-muted-foreground">Student</th>
                  {items.map(c => (
                    <th key={c.id} scope="col" className="pb-1 align-bottom font-medium">
                      <Link href={instructorLinks.concept(c.id)} className="block rounded px-1 text-center leading-4 text-brand-2 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                        {c.title}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <th scope="row" className="pe-2 text-start font-medium">
                      <Link href={instructorLinks.student(s.id)} className="rounded underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                        {s.name}
                      </Link>
                    </th>
                    {items.map(c => {
                      const v = s.mastery[c.id] ?? 0;
                      const band = masteryBand(v);
                      return (
                        <td key={c.id} className={cn("h-9 rounded-md text-center font-semibold tabular-nums", cellClass[band.tone])} title={`${s.name} · ${c.title}: ${v}% (${band.band})`}>
                          {v}
                          <span className="sr-only">% {band.band}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentGapsCard({ courseId }: { courseId: CourseId }) {
  const { missingQuestions, notes } = contentGaps(courseId);
  const total = conceptsForCourse(courseId).length;
  return (
    <Card as="section" aria-labelledby="gaps-heading" className="min-w-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
            <FileWarning className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="gaps-heading">Content gaps</CardTitle>
            <CardDescription>Where course material or practice questions may be missing.</CardDescription>
          </div>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
            Question coverage
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{missingQuestions.length} of {total}</span> concepts have no question in the illustrative bank (2 sample questions; not a validated bank).
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Concepts without questions">
            {missingQuestions.map(c => (
              <li key={c.id}>
                <Link href={instructorLinks.concept(c.id)} className="inline-flex rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Flagged gaps (simulated)</p>
          {notes.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">No sample gaps flagged for this course.</p>
          ) : (
            <ul className="mt-2 space-y-2" role="list">
              {notes.map(n => (
                <li key={n.conceptId + n.gap} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link href={instructorLinks.concept(n.conceptId)} className="rounded font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{n.title}</Link>
                    <Badge tone="outline">{n.source}</Badge>
                  </span>
                  <span className="mt-1 block leading-6 text-muted-foreground">{n.gap}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
