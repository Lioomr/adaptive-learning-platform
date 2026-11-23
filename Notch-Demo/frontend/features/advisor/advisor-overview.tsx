"use client";
import { CalendarClock, ClipboardList, HeartHandshake, Users } from "lucide-react";
import { AdvisorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { useRole } from "@/components/layout/role-context";
import { CourseComparisonChart } from "@/components/learning/charts";
import { MasteryBadge, MasteryBar, toneText } from "@/components/learning/mastery";
import { RecentAttempts } from "@/components/learning/recent-attempts";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { courses } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { activeAdvisor, canAdvisorViewStudent } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { attemptsFor, courseAverage, formatDays, INACTIVITY_DAYS, lowestConcept, supportIndicators, supportLevel } from "@/services/insights";
import { useDemo } from "@/store/demo";

/** Shared-foundation preview of the Advisor portal (not AD1–AD6). */
export function AdvisorOverview() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader eyebrow="Advisor portal · foundation preview" title="Student support" description="Cross-course progress and supportive check-in indicators for your caseload. Indicators are simulated demo rules, not predictions." />
      {hydrated ? <AdvisorContent /> : <AdvisorPreviewSkeleton />}
    </>
  );
}

function AdvisorContent() {
  const role = useRole();
  const allStudents = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const studentId = useDemo(s => s.studentId);
  const setStudent = useDemo(s => s.setStudent);
  const advisor = activeAdvisor();
  const caseload = allStudents.filter(s => canAdvisorViewStudent(advisor.id, s.id));
  const selected = caseload.find(s => s.id === studentId);
  const monitor = caseload.filter(s => supportLevel(s).label !== "On track");
  const inactive = caseload.filter(s => s.lastActiveDays >= INACTIVITY_DAYS);

  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="brand">Caseload · {caseload.length} students</Badge>
        <span>
          Viewing as <span className="font-medium text-foreground">{advisor.name}</span> (simulated caseload)
        </span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Caseload" value={caseload.length} icon={Users} hint="Fictional students, both courses" />
        <StatCard label="Check-in suggested" value={monitor.length} icon={HeartHandshake} accent="warning" hint="Any course or concept below 40%, or inactivity" />
        <StatCard label={`Inactive ${INACTIVITY_DAYS}+ days`} value={inactive.length} icon={CalendarClock} accent="danger" hint="Based on simulated activity" />
        <StatCard label="Attempts recorded" value={attempts.length} icon={ClipboardList} accent="ai" hint="Across both courses" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="caseload-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="caseload-heading">Caseload progress</CardTitle>
              <CardDescription>Course averages by student. Select a student for details.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2 sm:px-0">
            <ul className="divide-y divide-border" role="list">
              {caseload.map(s => {
                const level = supportLevel(s);
                const isSelected = s.id === selected?.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setStudent(s.id, role)}
                      className={cn(
                        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-5 py-3 text-start outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[auto_minmax(0,1fr)_7.5rem_7.5rem_7.5rem] sm:px-6",
                        isSelected && "bg-secondary/60 hover:bg-secondary/60",
                      )}
                    >
                      <StudentAvatar name={s.name} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">Active {formatDays(s.lastActiveDays).toLowerCase()}</span>
                      </span>
                      <span className="col-span-2 col-start-2 row-start-2 grid grid-cols-2 gap-3 sm:col-span-2 sm:col-start-3 sm:row-start-1 sm:gap-4">
                        {courses.map(c => {
                          const avg = courseAverage(s, c.id);
                          return (
                            <span key={c.id} className="block min-w-0">
                              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{c.shortTitle}</span>
                                <span className="font-medium tabular-nums text-foreground">{avg}%</span>
                              </span>
                              <MasteryBar value={avg} label={`${s.name} ${c.shortTitle} average`} className="mt-1 h-1.5" />
                            </span>
                          );
                        })}
                      </span>
                      <span className="col-start-3 row-start-1 flex justify-end sm:col-start-5">
                        <Badge tone={level.tone}>{level.label}</Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="min-w-0 xl:col-span-5">
          {selected ? <StudentSupportPanel studentId={selected.id} /> : <ErrorState title="Not in caseload" description="The selected student is not in this advisor's caseload. Choose a caseload student." />}
        </div>
      </div>

      <Card as="section" aria-labelledby="compare-heading">
        <CardHeader>
          <div>
            <CardTitle id="compare-heading">Cross-course comparison</CardTitle>
            <CardDescription>Course-average mastery for every caseload student.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CourseComparisonChart data={caseload.map(s => ({ name: s.name, python: courseAverage(s, "C-PY"), math: courseAverage(s, "C-MATH") }))} caption="Course-average mastery for each caseload student" />
        </CardContent>
      </Card>
    </div>
  );
}

function StudentSupportPanel({ studentId: id }: { studentId: string }) {
  const allStudents = useDemo(x => x.students);
  const attempts = useDemo(x => x.attempts);
  const s = allStudents.find(x => x.id === id)!;
  const indicators = supportIndicators(s);
  const studentAttempts = attemptsFor(attempts, { studentId: id });
  return (
    <Card as="section" aria-labelledby="support-heading" className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <StudentAvatar name={s.name} className="size-10 text-sm" />
          <div>
            <CardTitle id="support-heading">{s.name}</CardTitle>
            <CardDescription>Last active {formatDays(s.lastActiveDays).toLowerCase()}</CardDescription>
          </div>
        </div>
        <Badge tone={supportLevel(s).tone}>{supportLevel(s).label}</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {s.enrolledCourseIds.map(cid => {
            const c = courses.find(x => x.id === cid)!;
            const avg = courseAverage(s, cid);
            const low = lowestConcept(s, cid)!;
            return (
              <div key={cid} className="rounded-lg border border-border p-3.5">
                <p className="text-xs font-medium text-muted-foreground">{c.title}</p>
                <p className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xl font-semibold tabular-nums">{avg}%</span>
                  <MasteryBadge value={avg} className="text-[11px]" />
                </p>
                <MasteryBar value={avg} label={`${c.title} average`} className="mt-2 h-1.5" />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Lowest: {low.title} <span className="font-medium text-foreground tabular-nums">{s.mastery[low.id]}%</span>
                </p>
              </div>
            );
          })}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Support indicators</p>
          {indicators.length ? (
            <ul className="space-y-2" role="list">
              {indicators.map(i => (
                <li key={i.key} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", { danger: "bg-danger", warning: "bg-warning", progress: "bg-progress", success: "bg-success" }[i.tone])} />
                  <span>
                    <span className={cn("font-semibold", toneText[i.tone])}>{i.label}</span> <span className="text-muted-foreground">· {i.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No indicators. {s.name} is on track in both courses.</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent progress</p>
          <RecentAttempts attempts={studentAttempts} showCourse limit={3} emptyText={`No attempts recorded for ${s.name} yet.`} />
        </div>
      </CardContent>
    </Card>
  );
}
