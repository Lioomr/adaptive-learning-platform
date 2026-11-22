"use client";
import { Activity, BarChart3, ClipboardList, LifeBuoy, Users } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { useRole } from "@/components/layout/role-context";
import { BandDistributionChart, ConceptAverageChart } from "@/components/learning/charts";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { RecentAttempts } from "@/components/learning/recent-attempts";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { attemptsFor, bandCounts, courseAverage, formatDays, lowestConcept, supportLevel } from "@/services/insights";
import { useDemo } from "@/store/demo";

/** Shared-foundation preview of the Instructor portal (not IN1–IN19). */
export function InstructorOverview() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader eyebrow="Instructor portal · foundation preview" title="Course overview" description="Class mastery, students who may benefit from support, and recent assessment activity for your assigned course." />
      {hydrated ? <InstructorContent /> : <InstructorPreviewSkeleton />}
    </>
  );
}

function InstructorContent() {
  const role = useRole();
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const setStudent = useDemo(s => s.setStudent);
  const course = findCourse(courseId)!;
  const instructor = instructorForCourse(courseId);

  if (!instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }

  const enrolled = students.filter(s => s.enrolledCourseIds.includes(courseId));
  const averages = enrolled.map(s => courseAverage(s, courseId));
  const classAvg = averages.length ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length) : 0;
  const needsSupport = enrolled.filter(s => supportLevel(s, [courseId]).label !== "On track");
  const courseAttempts = attemptsFor(attempts, { courseId });
  const conceptData = conceptsForCourse(courseId).map(c => ({ concept: c.title, average: Math.round(enrolled.reduce((n, s) => n + s.mastery[c.id], 0) / Math.max(1, enrolled.length)) }));
  const focus = enrolled.find(s => s.id === studentId) ?? enrolled[0];

  return (
    <div className="space-y-6">
      <Card as="section" aria-label="Assigned course" className="relative isolate overflow-hidden rounded-[24px] border-(--notch-brand-slate) bg-(--notch-brand-ink) p-5 text-(--notch-brand-white) sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-[28%] bg-[url('/brand/knowledge-layers.svg')] bg-size-[auto_118%] bg-center bg-no-repeat" />
        <div className="max-w-[70%] space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">{course.title}</h2>
          <p className="text-sm leading-6 text-(--notch-brand-fog)">
            Viewing as <span className="font-medium text-(--notch-brand-white)">{instructor.name}</span> (simulated assignment)
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled students" value={enrolled.length} icon={Users} hint="Fictional students in this course" />
        <StatCard label="Class average" value={classAvg} unit="%" icon={BarChart3} accent="progress" hint={<MasteryBadge value={classAvg} />} />
        <StatCard label="May need support" value={needsSupport.length} icon={LifeBuoy} accent="warning" hint="Course average or a concept below 40%" />
        <StatCard label="Attempts recorded" value={courseAttempts.length} icon={ClipboardList} accent="ai" hint="In this browser session" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="concept-avg-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="concept-avg-heading">Concept averages</CardTitle>
              <CardDescription>Class-average mastery per concept, coloured by band.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ConceptAverageChart data={conceptData} caption={`Class-average mastery per concept in ${course.title}`} />
          </CardContent>
        </Card>
        <Card as="section" aria-labelledby="dist-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle id="dist-heading">Mastery distribution</CardTitle>
              <CardDescription>Students by course-average band.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BandDistributionChart counts={bandCounts(averages)} caption={`Students per mastery band in ${course.title}`} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="progress-heading" className="min-w-0 xl:col-span-8">
          <CardHeader>
            <div>
              <CardTitle id="progress-heading">Student progress</CardTitle>
              <CardDescription>Select a student to focus the detail panel.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2 sm:px-0">
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-border text-start text-xs font-medium text-muted-foreground">
                  <th scope="col" className="px-6 pb-2 text-start font-medium">Student</th>
                  <th scope="col" className="pb-2 text-start font-medium">Course mastery</th>
                  <th scope="col" className="pb-2 text-start font-medium">Lowest concept</th>
                  <th scope="col" className="pb-2 text-start font-medium">Last active</th>
                  <th scope="col" className="px-6 pb-2 text-end font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrolled.map(s => {
                  const avg = courseAverage(s, courseId);
                  const low = lowestConcept(s, courseId)!;
                  const level = supportLevel(s, [courseId]);
                  const selected = s.id === focus?.id;
                  return (
                    <tr key={s.id} className={cn("border-b border-border last:border-b-0", selected && "bg-secondary/60")}>
                      <th scope="row" className="px-6 py-2.5 text-start font-medium">
                        <button type="button" aria-pressed={selected} onClick={() => setStudent(s.id, role)} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                          <StudentAvatar name={s.name} />
                          {s.name}
                        </button>
                      </th>
                      <td className="py-2.5 pe-4">
                        <div className="flex items-center gap-3">
                          <MasteryBar value={avg} label={`${s.name} course mastery`} className="h-1.5 w-24" />
                          <span className="tabular-nums">{avg}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 pe-4 text-muted-foreground">
                        {low.title} <span className="tabular-nums text-foreground">{s.mastery[low.id]}%</span>
                      </td>
                      <td className="py-2.5 pe-4 text-muted-foreground">{formatDays(s.lastActiveDays)}</td>
                      <td className="px-6 py-2.5 text-end"><Badge tone={level.tone}>{level.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ul className="divide-y divide-border md:hidden" role="list">
              {enrolled.map(s => {
                const avg = courseAverage(s, courseId);
                const level = supportLevel(s, [courseId]);
                const selected = s.id === focus?.id;
                return (
                  <li key={s.id}>
                    <button type="button" aria-pressed={selected} onClick={() => setStudent(s.id, role)} className={cn("flex w-full items-center gap-3 px-5 py-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", selected && "bg-secondary/60")}>
                      <StudentAvatar name={s.name} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-sm font-medium">
                          {s.name}
                          <span className="tabular-nums">{avg}%</span>
                        </span>
                        <MasteryBar value={avg} label={`${s.name} course mastery`} className="mt-1.5 h-1.5" />
                      </span>
                      <Badge tone={level.tone}>{level.label}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6 xl:col-span-4">
          {focus ? (
            <Card as="section" aria-labelledby="focus-heading">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StudentAvatar name={focus.name} className="size-10 text-sm" />
                  <div>
                    <CardTitle id="focus-heading">{focus.name}</CardTitle>
                    <CardDescription>Student in focus · {courseAverage(focus, courseId)}% average</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Lowest concepts</p>
                <ul className="space-y-3" role="list">
                  {[...conceptsForCourse(courseId)].sort((a, b) => focus.mastery[a.id] - focus.mastery[b.id]).slice(0, 4).map(c => (
                    <li key={c.id}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium">{c.title}</span>
                        <span className="tabular-nums">{focus.mastery[c.id]}%</span>
                      </div>
                      <MasteryBar value={focus.mastery[c.id]} label={`${focus.name} ${c.title} mastery`} className="mt-1.5 h-1.5" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          <Card as="section" aria-labelledby="activity-heading">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink">
                  <Activity className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle id="activity-heading">Recent assessment activity</CardTitle>
                  <CardDescription>All students in {course.shortTitle}.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RecentAttempts attempts={courseAttempts} students={students} showStudent limit={5} emptyText="When a student submits a practice question, it appears here." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
