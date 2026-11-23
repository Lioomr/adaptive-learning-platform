"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarClock, ClipboardList, FlaskConical, LifeBuoy, Stethoscope, Target } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { ConceptProgress, PrerequisitePath } from "@/components/learning/concept-progress";
import { MasteryBadge, MasteryLegend } from "@/components/learning/mastery";
import { RecentAttempts } from "@/components/learning/recent-attempts";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse, findConcept } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { attemptsFor, courseAverage, formatDays, lowestConcept } from "@/services/insights";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { assessStudent, diagnosisEpisodesFor, RISK_RULES, sampleHistoryFor } from "./risk-data";
import { CourseContext, CourseNotAssigned, instructorRoutes, PrivacyNotice, ReasonBadge, useInstructorCourse } from "./shared";

/** IN14 — Student view: course-scoped progress, recent practice and diagnosis episodes. */
export function StudentDetail({ studentId }: { studentId: string }) {
  const hydrated = useHydrated();
  return hydrated ? <DetailContent studentId={studentId} /> : <InstructorPreviewSkeleton />;
}

const conceptTitle = (id: string) => findConcept(id)?.title ?? id;

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        <Link href={instructorRoutes.students}>
          <ArrowLeft className="rtl:-scale-x-100" aria-hidden="true" />
          All students
        </Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href={instructorRoutes.atRisk}>
          <LifeBuoy aria-hidden="true" />
          At-risk list
        </Link>
      </Button>
    </div>
  );
}

function DetailContent({ studentId }: { studentId: string }) {
  const ctx = useInstructorCourse();
  const student = useDemo(s => s.students.find(x => x.id === studentId));
  const attempts = useDemo(s => s.attempts);

  if (!ctx) {
    return (
      <>
        <PageHeader eyebrow="Instructor portal · IN14" title="Student view" actions={<BackLinks />} />
        <CourseNotAssigned />
      </>
    );
  }
  const { course } = ctx;
  if (!student || !student.enrolledCourseIds.includes(course.id)) {
    return (
      <>
        <PageHeader eyebrow="Instructor portal · IN14" title="Student view" actions={<BackLinks />} />
        <ErrorState title="Student not available" description={`No fictional student with this ID is enrolled in ${course.title}. Instructors can only open students in their assigned course.`} />
      </>
    );
  }

  const avg = courseAverage(student, course.id);
  const items = conceptsForCourse(course.id);
  const mastered = items.filter(c => masteryBand(student.mastery[c.id]).band === "Mastered").length;
  const support = items.filter(c => masteryBand(student.mastery[c.id]).band === "Needs Support").length;
  const focus = lowestConcept(student, course.id);
  const risk = assessStudent(student, course.id, attempts);
  const sessionAttempts = attemptsFor(attempts, { studentId: student.id, courseId: course.id });
  const history = sampleHistoryFor(student.id, course.id);
  const episodes = diagnosisEpisodesFor(student, course.id);

  return (
    <>
      <PageHeader
        eyebrow="Instructor portal · IN14"
        title={
          <span className="flex items-center gap-3">
            <StudentAvatar name={student.name} className="size-10 text-sm" />
            {student.name}
          </span>
        }
        description={`Course-scoped progress in ${course.title}: concept mastery, recent practice and diagnosis episodes.`}
        actions={<BackLinks />}
      />
      <div className="space-y-6">
        <CourseContext {...ctx} />
        <PrivacyNotice courseTitle={course.title} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Course average" value={avg} unit="%" icon={BarChart3} accent="progress" hint={<MasteryBadge value={avg} />} />
          <StatCard label="Concepts mastered" value={mastered} unit={`/${items.length}`} icon={Target} accent="success" hint="85% or above" />
          <StatCard label="Concepts needing support" value={support} icon={LifeBuoy} accent="danger" hint="Below 40%" />
          <StatCard label="Last active" value={formatDays(student.lastActiveDays)} icon={CalendarClock} accent="brand" hint="Simulated activity" />
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <Card as="section" aria-labelledby="flags-heading" className="min-w-0 xl:col-span-5">
            <CardHeader>
              <div>
                <CardTitle id="flags-heading">Support flags</CardTitle>
                <CardDescription>Preset rules from the at-risk list (Demo / Simulated).</CardDescription>
              </div>
              {risk ? <Badge tone={risk.level === "Needs support" ? "danger" : "warning"}>{risk.level}</Badge> : <Badge tone="success">On track</Badge>}
            </CardHeader>
            <CardContent>
              {risk ? (
                <ul className="space-y-3" role="list">
                  {risk.reasons.map(r => (
                    <li key={r.key} className="rounded-lg border border-border px-3 py-2.5">
                      <ReasonBadge reason={r.key} />
                      <p className="mt-1.5 text-sm text-foreground">{r.detail}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Rule: {RISK_RULES[r.key].rule}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Target} title="No flags" description="This student does not meet any preset support rule in this course." />
              )}
            </CardContent>
          </Card>

          <Card as="section" aria-labelledby="focus-heading" className="min-w-0 xl:col-span-7">
            <CardHeader>
              <div>
                <CardTitle id="focus-heading">Focus concept</CardTitle>
                <CardDescription>Lowest concept and its prerequisites. Readiness threshold {PREREQUISITE_READY}%.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {focus ? (
                <>
                  <p className="mb-3 text-sm">
                    <span className="font-semibold">{focus.title}</span> <span className="tabular-nums">{student.mastery[focus.id]}%</span>
                  </p>
                  <PrerequisitePath student={student} concept={focus} />
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card as="section" aria-labelledby="progress-heading" className="min-w-0">
          <CardHeader>
            <div>
              <CardTitle id="progress-heading">Concept progress</CardTitle>
              <CardDescription>Current simulated mastery for every {course.shortTitle} concept.</CardDescription>
            </div>
            <MasteryLegend />
          </CardHeader>
          <CardContent>
            <ConceptProgress student={student} courseId={course.id} highlightId={focus?.id} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-12">
          <Card as="section" aria-labelledby="diagnosis-heading" className="min-w-0 xl:col-span-7">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
                  <Stethoscope className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle id="diagnosis-heading">Diagnosis episodes</CardTitle>
                  <CardDescription>Simulated diagnoses. Prerequisites and values come from the shared demo data.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {episodes.length ? (
                <ol className="space-y-3" role="list">
                  {episodes.map(e => (
                    <li key={e.id} className="rounded-lg border border-border px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{conceptTitle(e.conceptId)}</span>
                        {e.source === "current" ? <Badge tone="progress">Current recommendation</Badge> : <Badge tone="ai">Sample · {e.daysAgo} days before baseline</Badge>}
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-foreground">{e.note}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        {e.source === "sample" ? (
                          <>
                            Score {e.score}% · mastery <span className="tabular-nums">{e.previous}%</span>
                            <ArrowRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
                            <span className="tabular-nums text-foreground">{e.mastery}%</span>
                          </>
                        ) : (
                          <>Current mastery <span className="tabular-nums text-foreground">{e.mastery}%</span></>
                        )}
                        {e.prerequisiteId ? (
                          <span>
                            · Linked prerequisite <span className="font-medium text-foreground">{conceptTitle(e.prerequisiteId)}</span>{" "}
                            {e.source === "sample" ? <>baseline {e.prerequisiteBaseline}%</> : <>now {student.mastery[e.prerequisiteId]}%</>} (ready at {PREREQUISITE_READY}%)
                          </span>
                        ) : null}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <EmptyState icon={Stethoscope} title="No diagnosis episodes" description="Every concept's prerequisites are at or above readiness, and there is no sample diagnosis for this student." />
              )}
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6 xl:col-span-5">
            <Card as="section" aria-labelledby="session-heading">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink">
                    <ClipboardList className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle id="session-heading">Recent practice</CardTitle>
                    <CardDescription>Attempts recorded in this browser demo session.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RecentAttempts attempts={sessionAttempts} limit={5} emptyText="When this student submits practice in the Student portal, it appears here." />
              </CardContent>
            </Card>

            <Card as="section" aria-labelledby="history-heading">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
                    <FlaskConical className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle id="history-heading">Sample practice history</CardTitle>
                    <CardDescription>Fictional attempts before the demo baseline; each ends at the shared fixture value.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {history.length ? (
                  <table className="w-full text-sm">
                    <caption className="sr-only">Sample practice history for {student.name} in {course.title}</caption>
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th scope="col" className="pb-2 text-start font-medium">Concept</th>
                        <th scope="col" className="pb-2 text-start font-medium">Score</th>
                        <th scope="col" className="pb-2 text-start font-medium">Mastery</th>
                        <th scope="col" className="pb-2 text-end font-medium">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id} className="border-b border-border last:border-b-0">
                          <th scope="row" className="py-2 pe-2 text-start font-medium">{conceptTitle(h.conceptId)}</th>
                          <td className="py-2 pe-2 tabular-nums">{h.score}%</td>
                          <td className="py-2 pe-2 tabular-nums">
                            {h.previous}% <ArrowRight className="inline size-3 text-muted-foreground rtl:-scale-x-100" aria-label="to" /> {h.mastery}%
                          </td>
                          <td className="py-2 text-end text-muted-foreground">{h.daysAgo}d before</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState icon={FlaskConical} title="No sample history" description="This fictional student has no scripted history before the baseline." />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
