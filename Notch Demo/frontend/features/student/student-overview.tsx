"use client";
import { ArrowDown, Compass, Target } from "lucide-react";
import { StudentPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentCard } from "@/components/learning/assessment-card";
import { ConceptProgress, PrerequisitePath } from "@/components/learning/concept-progress";
import { MasteryBadge, MasteryLegend, MasteryRing } from "@/components/learning/mastery";
import { RecentAttempts } from "@/components/learning/recent-attempts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse, findConcept, findCourse, questions } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { attemptsFor, conceptsNeedingReview, courseAverage, focusConcept, formatDays } from "@/services/insights";
import { masteryBand, recommendation } from "@/services/mastery";
import { useDemo } from "@/store/demo";

/** Shared-foundation preview of the Student portal (not ST1–ST21). */
export function StudentOverview() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader eyebrow="Student portal · foundation preview" title="My learning space" description="Your simulated progress, what to review next, and an illustrative practice question." />
      {hydrated ? <StudentContent /> : <StudentPreviewSkeleton />}
    </>
  );
}

function StudentContent() {
  const students = useDemo(s => s.students);
  const studentId = useDemo(s => s.studentId);
  const courseId = useDemo(s => s.courseId);
  const allAttempts = useDemo(s => s.attempts);
  const student = students.find(s => s.id === studentId)!;
  const course = findCourse(courseId)!;
  const items = conceptsForCourse(courseId);
  const avg = courseAverage(student, courseId);
  const mastered = items.filter(c => masteryBand(student.mastery[c.id]).band === "Mastered").length;
  const review = conceptsNeedingReview(student, courseId);
  const attempts = attemptsFor(allAttempts, { studentId, courseId });

  // Practice target: the concept with an illustrative question; recommendation shown for it.
  const practiceConceptId = questions.find(q => q.courseId === courseId)?.conceptId;
  const target = (practiceConceptId && findConcept(practiceConceptId)) || focusConcept(student, courseId)!;
  const rec = recommendation(student, target.id);

  return (
    <div className="space-y-6">
      <Card as="section" aria-labelledby="welcome-heading" className="overflow-hidden">
        <div className="flex flex-col gap-6 p-5 sm:p-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <Badge tone="brand">{course.title}</Badge>
            <h2 id="welcome-heading" className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Welcome back, {student.name}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              {rec.kind === "review" ? (
                <>
                  Before going deeper into <strong className="font-semibold text-foreground">{target.title}</strong>, a quick review of{" "}
                  <strong className="font-semibold text-foreground">{findConcept(rec.prerequisiteId)?.title}</strong> will help.
                </>
              ) : (
                <>
                  You are ready to practise <strong className="font-semibold text-foreground">{target.title}</strong>.
                </>
              )}
            </p>
            <Button asChild className="mt-4">
              <a href="#practice">
                Practise {target.title}
                <ArrowDown aria-hidden="true" />
              </a>
            </Button>
          </div>
          <div className="flex items-center gap-5 border-t border-border pt-5 md:border-s md:border-t-0 md:ps-6 md:pt-0">
            <MasteryRing value={avg} label={`${course.shortTitle} average mastery`} />
            <ul className="grid gap-2 text-sm" role="list">
              <li><MasteryBadge value={avg} /></li>
              <li>
                <span className="font-semibold tabular-nums">{mastered}/{items.length}</span> <span className="text-muted-foreground">concepts mastered</span>
              </li>
              <li>
                <span className="font-semibold tabular-nums">{review.length}</span> <span className="text-muted-foreground">{review.length === 1 ? "concept needs review" : "concepts need review"}</span>
              </li>
              <li>
                <span className="text-muted-foreground">Last active</span> <span className="font-semibold">{formatDays(student.lastActiveDays)}</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          <Card as="section" aria-labelledby="next-heading">
            <CardHeader>
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink">
                  <Compass className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <CardTitle id="next-heading">Recommended next step</CardTitle>
                  <CardDescription>{rec.message} Recommendations advise; they never block practice.</CardDescription>
                </div>
              </div>
              <MasteryBadge value={student.mastery[target.id]} showValue />
            </CardHeader>
            <CardContent>
              <PrerequisitePath student={student} concept={target} />
            </CardContent>
          </Card>

          <div id="practice" className="scroll-mt-24">
            <AssessmentCard key={`${studentId}:${courseId}`} studentId={studentId} courseId={courseId} />
          </div>
        </div>

        <div className="min-w-0 space-y-6 xl:col-span-4">
          <Card as="section" aria-labelledby="attempts-heading">
            <CardHeader>
              <div>
                <CardTitle id="attempts-heading">Recent attempts</CardTitle>
                <CardDescription>Shared with your instructor and advisor.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <RecentAttempts attempts={attempts} limit={4} />
            </CardContent>
          </Card>
          <Card as="section" aria-labelledby="bands-heading">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand-2">
                  <Target className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle id="bands-heading">How mastery is shown</CardTitle>
                  <CardDescription>Simulated estimates, updated after each attempt.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MasteryLegend className="grid gap-2" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card as="section" aria-labelledby="concepts-heading">
        <CardHeader>
          <div>
            <CardTitle id="concepts-heading">Concept mastery</CardTitle>
            <CardDescription>{items.length} concepts in {course.title}. Prerequisites are ready at 70% or above.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-3">
          <ConceptProgress student={student} courseId={courseId} highlightId={target.id} />
        </CardContent>
      </Card>
    </div>
  );
}
