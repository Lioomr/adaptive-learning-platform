"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, CircleAlert, ClipboardList, GitBranch, Lightbulb, MessageCircleQuestion, Sparkles, Users, XCircle } from "lucide-react";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { BandDistributionChart } from "@/components/learning/charts";
import { MasteryBadge, MasteryBar, MasteryLegend } from "@/components/learning/mastery";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findConcept, findCourse, findQuestion } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { MASTERY_BANDS, masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { Concept, Student } from "@/types";
import { conceptAverage, enrolledIn, instructorLinks, masteryDistribution, notReady, questionCount, tutorQuestions, unlocks, wrongChoices } from "./analytics";
import { teachingFixSamples } from "./sample-data";
import { courseGuardError, CourseContext, SampleBadge, SampleSizeNote, SwitchCourse } from "./shared";

/** IN9 Concept detail. */
export function ConceptDetail({ conceptId }: { conceptId: string }) {
  const hydrated = useHydrated();
  const concept = findConcept(conceptId);
  const back = (
    <Button variant="outline" size="sm" asChild>
      <Link href={instructorLinks.dashboard}>
        <ArrowLeft className="rtl:-scale-x-100" aria-hidden="true" />
        Weekly dashboard
      </Link>
    </Button>
  );

  if (!concept) {
    return (
      <>
        <PageHeader eyebrow="IN9 · Concept detail" title="Concept not found" actions={back} />
        <ErrorState title="Unknown concept" description={`No concept with the ID “${conceptId}” exists in the demo courses.`} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<>IN9 · Concept detail <SampleBadge className="normal-case tracking-normal" /></>}
        title={concept.title}
        description={`How students in ${findCourse(concept.courseId)?.title} are doing on ${concept.title}, what they get wrong, and a suggested teaching fix. Values are simulated from fictional sample data.`}
        actions={back}
      />
      {hydrated ? <DetailContent concept={concept} /> : <InstructorPreviewSkeleton />}
    </>
  );
}

function DetailContent({ concept }: { concept: Concept }) {
  const students = useDemo(s => s.students);
  const courseId = useDemo(s => s.courseId);
  const guard = courseGuardError(courseId);
  if (guard) return guard;
  if (concept.courseId !== courseId) return <SwitchCourse courseId={concept.courseId} conceptTitle={concept.title} />;

  const enrolled = enrolledIn(students, courseId);
  const avg = conceptAverage(enrolled, concept.id);
  const ready = enrolled.length - notReady(enrolled, concept.id).length;
  const prereqs = concept.prerequisites.map(id => findConcept(id)).filter((c): c is Concept => Boolean(c));
  const prereqsReady = prereqs.filter(p => conceptAverage(enrolled, p.id) >= PREREQUISITE_READY).length;
  const qCount = questionCount(concept.id);

  return (
    <div className="space-y-6">
      <CourseContext courseId={courseId} />
      <SampleSizeNote count={enrolled.length} />

      <section aria-label="Concept status (sample data)" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Class average" value={avg} unit="%" icon={BarChart3} accent="progress" hint={<span className="flex flex-wrap items-center gap-2"><MasteryBadge value={avg} /> Sample data</span>} />
        <StatCard label={`Ready (≥ ${PREREQUISITE_READY}%)`} value={`${ready}/${enrolled.length}`} icon={Users} accent="success" hint="Sample data · students at prerequisite-ready level" />
        <StatCard label="Prerequisites ready (class avg)" value={prereqs.length ? `${prereqsReady}/${prereqs.length}` : "—"} icon={GitBranch} accent="warning" hint={prereqs.length ? `Class average ≥ ${PREREQUISITE_READY}%` : "No prerequisites"} />
        <StatCard label="Questions in bank" value={qCount} icon={ClipboardList} accent="ai" hint="Illustrative bank only, not validated" />
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <DistributionCard concept={concept} students={enrolled} />
        <PrerequisitesCard concept={concept} prereqs={prereqs} students={enrolled} />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <WrongChoicesCard concept={concept} students={enrolled} />
        <TutorQuestionsCard concept={concept} />
      </div>

      <TeachingFixCard concept={concept} prereqs={prereqs} students={enrolled} />
    </div>
  );
}

function DistributionCard({ concept, students }: { concept: Concept; students: Student[] }) {
  const counts = masteryDistribution(students, concept.id);
  return (
    <Card as="section" aria-labelledby="dist-heading" className="min-w-0 xl:col-span-7">
      <CardHeader>
        <div>
          <CardTitle id="dist-heading">Mastery distribution</CardTitle>
          <CardDescription>Students per mastery band on {concept.title}.</CardDescription>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="space-y-5">
        <BandDistributionChart counts={counts} caption={`Sample count of students per mastery band on ${concept.title}`} />
        <MasteryLegend />
        <div className="grid gap-3 sm:grid-cols-2">
          {[...MASTERY_BANDS].reverse().map(b => {
            const inBand = students.filter(s => masteryBand(s.mastery[concept.id] ?? 0).band === b.band);
            return (
              <div key={b.band} className="rounded-lg border border-border p-3">
                <p className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span>{b.band} <span className="font-normal text-muted-foreground">{b.min}–{b.max}</span></span>
                  <span className="tabular-nums">{inBand.length}</span>
                </p>
                {inBand.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label={`Students in ${b.band}`}>
                    {inBand.map(s => (
                      <li key={s.id}>
                        <Link href={instructorLinks.student(s.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                          {s.name} <span className="tabular-nums text-muted-foreground">{s.mastery[concept.id]}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">No students</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PrerequisitesCard({ concept, prereqs, students }: { concept: Concept; prereqs: Concept[]; students: Student[] }) {
  const stuck = notReady(students, concept.id);
  const next = unlocks(concept.id);
  return (
    <Card as="section" id="prerequisites" aria-labelledby="prereq-heading" className="min-w-0 xl:col-span-5">
      <CardHeader>
        <div>
          <CardTitle id="prereq-heading">Prerequisite links</CardTitle>
          <CardDescription>A prerequisite is ready at {PREREQUISITE_READY}% or above.</CardDescription>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent className="space-y-5">
        {prereqs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{concept.title} has no prerequisites.</p>
        ) : (
          <ul className="space-y-3" role="list">
            {prereqs.map(p => {
              const pAvg = conceptAverage(students, p.id);
              const isReady = pAvg >= PREREQUISITE_READY;
              const alsoStuck = notReady(stuck, p.id).length;
              return (
                <li key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={instructorLinks.concept(p.id)} className="flex items-center gap-1.5 rounded text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                      {isReady ? <CheckCircle2 className="size-4 text-success-ink" aria-hidden="true" /> : <CircleAlert className="size-4 text-warning-ink" aria-hidden="true" />}
                      {p.title}
                      <span className="sr-only">{isReady ? "(ready on class average)" : "(below ready on class average)"}</span>
                    </Link>
                    <span className="text-sm font-semibold tabular-nums">{pAvg}%</span>
                  </div>
                  <MasteryBar value={pAvg} label={`${p.title} class average`} className="mt-2 h-1.5" />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">{alsoStuck} of {stuck.length}</span> students below {PREREQUISITE_READY}% on {concept.title} are also below {PREREQUISITE_READY}% here.
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Unlocks</p>
          {next.length ? (
            <ul className="mt-2 flex flex-wrap gap-2" role="list">
              {next.map(c => (
                <li key={c.id}>
                  <Link href={instructorLinks.concept(c.id)} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                    {c.title}
                    <ArrowRight className="size-3 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No later concepts depend on {concept.title}.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WrongChoicesCard({ concept, students }: { concept: Concept; students: Student[] }) {
  const items = wrongChoices(students, concept.id);
  return (
    <Card as="section" aria-labelledby="wrong-heading" className="min-w-0 xl:col-span-7">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger-ink">
            <XCircle className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="wrong-heading">Common wrong choices</CardTitle>
            <CardDescription>Simulated tallies among students below {PREREQUISITE_READY}% on this concept.</CardDescription>
          </div>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="No wrong-choice sample" description={`No simulated wrong-choice data for ${concept.title} yet.`} />
        ) : (
          <ul className="space-y-3" role="list">
            {items.map(w => {
              const q = findQuestion(w.questionId);
              return (
                <li key={w.questionId + w.choice} className="rounded-lg border border-border p-4">
                  {q ? <p className="text-xs text-muted-foreground">{q.id} · {q.prompt}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Chose “{w.choice}”</p>
                    <Badge tone="danger">{w.studentIds.length} student{w.studentIds.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{w.misconception}</p>
                  {q ? <p className="mt-1 text-xs text-muted-foreground">Correct answer: <span className="font-medium text-success-ink">{q.answer}</span></p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TutorQuestionsCard({ concept }: { concept: Concept }) {
  const items = tutorQuestions(concept.id);
  return (
    <Card as="section" aria-labelledby="tutor-heading" className="min-w-0 xl:col-span-5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
            <MessageCircleQuestion className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="tutor-heading">Tutor questions</CardTitle>
            <CardDescription>Anonymised questions students asked the AI tutor (simulated).</CardDescription>
          </div>
        </div>
        <SampleBadge />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="No tutor questions" description={`No simulated tutor questions about ${concept.title} this week.`} />
        ) : (
          <ul className="divide-y divide-border" role="list">
            {items.map(t => {
              const linked = t.linkedConceptId ? findConcept(t.linkedConceptId) : undefined;
              return (
                <li key={t.question} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6">“{t.question}”</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">Asked {t.askedTimes} times</span>
                    {linked ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          Points to{" "}
                          <Link href={instructorLinks.concept(linked.id)} className="rounded font-medium text-brand-2 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{linked.title}</Link>
                        </span>
                      </>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TeachingFixCard({ concept, prereqs, students }: { concept: Concept; prereqs: Concept[]; students: Student[] }) {
  const [planned, setPlanned] = useState(false);
  const weakest = prereqs.map(p => ({ p, avg: conceptAverage(students, p.id) })).sort((a, b) => a.avg - b.avg)[0];
  const fix = teachingFixSamples[concept.id] ?? (weakest && weakest.avg < PREREQUISITE_READY
    ? { summary: `Briefly review ${weakest.p.title} before the next ${concept.title} activity.`, steps: [`Open with a short ${weakest.p.title} warm-up (class average ${weakest.avg}%).`, `Link it explicitly to a worked ${concept.title} example.`, "Follow with guided practice before independent questions."] }
    : { summary: `Add guided practice for ${concept.title}.`, steps: ["Show one fully worked example.", "Give two scaffolded practice questions.", "Check understanding with a short exit question."] });

  return (
    <Card as="section" aria-labelledby="fix-heading" className="border-ai/30 bg-ai-soft/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
            <Lightbulb className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="fix-heading">Suggested teaching fix</CardTitle>
            <CardDescription>AI suggestion, not instructor-approved content.</CardDescription>
          </div>
        </div>
        <Badge tone="ai">
          <Sparkles aria-hidden="true" />
          AI suggestion · Simulated
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-semibold">{fix.summary}</p>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm leading-6 text-muted-foreground">
          {fix.steps.map(s => <li key={s}>{s}</li>)}
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant={planned ? "outline" : "default"} aria-pressed={planned} onClick={() => setPlanned(p => !p)}>
            {planned ? <CheckCircle2 aria-hidden="true" /> : null}
            {planned ? "Marked for next lecture" : "Mark for next lecture"}
          </Button>
          <p className="text-xs text-muted-foreground" role="status">
            {planned ? "Saved on this page only (local preview, not sent or stored)." : "Local preview only; nothing is sent or stored."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
