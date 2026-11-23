"use client";
import { useState } from "react";
import { BookOpenCheck, ClipboardCheck, GraduationCap, Share2, Target, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse, findConcept, questions } from "@/data/fixtures";
import { PREREQUISITE_READY } from "@/services/mastery";
import type { Concept, Student } from "@/types";
import { examInfo, instructorLinks } from "./data";
import { average, controlClass, fieldClass, P1Screen, ScreenLink, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

/** IN16 exam readiness + IN17 review session pack. */
export function ExamReadinessScreen() {
  return (
    <P1Screen screenIds="IN16 · IN17" title="Exam readiness" description="Simulated readiness for the upcoming exam, based on current demo mastery across the exam scope, and a review session pack built from the weakest concepts.">
      {ctx => <ReadinessContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

type PackItem = { concept: Concept; avg: number; below: Student[]; activity: string; questionIds: string[] };

function buildPack(scope: Concept[], students: Student[]): PackItem[] {
  return scope
    .map(c => {
      const avg = average(students.map(s => s.mastery[c.id] ?? 0));
      const below = students.filter(s => (s.mastery[c.id] ?? 0) < PREREQUISITE_READY);
      const weakPrereq = c.prerequisites
        .map(findConcept)
        .filter((p): p is Concept => Boolean(p))
        .find(p => average(students.map(s => s.mastery[p.id] ?? 0)) < PREREQUISITE_READY);
      const activity = weakPrereq ? `Start with a 10-minute ${weakPrereq.title} refresher, then a worked example.` : "Worked example, then two practice items in pairs.";
      return { concept: c, avg, below, activity, questionIds: questions.filter(q => q.conceptId === c.id).map(q => q.id) };
    })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);
}

function ReadinessContent({ courseId, course, enrolled }: CourseContext) {
  const exam = examInfo[courseId];
  const all = conceptsForCourse(courseId);
  const [scopeIds, setScopeIds] = useState<string[]>(exam.scope);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(60);
  const [generated, setGenerated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const scope = all.filter(c => scopeIds.includes(c.id));
  const readiness = enrolled
    .map(s => ({ student: s, value: average(scope.map(c => s.mastery[c.id] ?? 0)) }))
    .sort((a, b) => a.value - b.value);
  const ready = readiness.filter(r => r.value >= PREREQUISITE_READY).length;
  const classAvg = average(readiness.map(r => r.value));
  const pack = buildPack(scope, enrolled);
  const included = pack.filter(p => !excluded.includes(p.concept.id));
  const perItem = included.length ? Math.floor((minutes - 10) / included.length) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={exam.title} value={exam.inDays} unit=" days" icon={GraduationCap} hint="Until the sample exam date" />
        <StatCard label="Concepts in scope" value={scope.length} icon={Target} accent="brand" hint={`of ${all.length} in ${course.shortTitle}`} />
        <StatCard label="Simulated readiness" value={classAvg} unit="%" icon={BookOpenCheck} accent="progress" hint={<MasteryBadge value={classAvg} />} />
        <StatCard label={`At or above ${PREREQUISITE_READY}%`} value={`${ready}/${enrolled.length}`} icon={Users} accent="success" hint="Students ready across scope" />
      </div>

      <SimulatedNote>Readiness is the average of current demo mastery across the selected concepts. It is not a validated prediction of exam results.</SimulatedNote>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-7">
          <Card as="section" aria-labelledby="scope-heading">
            <CardHeader>
              <div>
                <CardTitle id="scope-heading">Exam scope</CardTitle>
                <CardDescription>Select the concepts this exam covers.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <fieldset>
                <legend className="sr-only">Concepts in exam scope</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {all.map(c => {
                    const avg = average(enrolled.map(s => s.mastery[c.id] ?? 0));
                    return (
                      <label key={c.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                        <input type="checkbox" className={controlClass} checked={scopeIds.includes(c.id)} onChange={e => { setGenerated(false); setScopeIds(ids => (e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))); }} />
                        <span className="min-w-0 flex-1 truncate">{c.title}</span>
                        <span className="tabular-nums text-xs text-muted-foreground">{avg}%</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </CardContent>
          </Card>

          <Card as="section" aria-labelledby="students-ready-heading">
            <CardHeader>
              <div>
                <CardTitle id="students-ready-heading">Student readiness (IN16)</CardTitle>
                <CardDescription>Lowest first · fictional students · sample data</CardDescription>
              </div>
              <ScreenLink href={instructorLinks.students}>Student view (IN14)</ScreenLink>
            </CardHeader>
            <CardContent className="pt-0">
              {scope.length === 0 ? (
                <EmptyState title="No concepts in scope" description="Select at least one concept to see readiness." />
              ) : (
                <ul className="space-y-3" role="list">
                  {readiness.map(r => (
                    <li key={r.student.id} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm">
                      <span className="truncate font-medium">{r.student.name}</span>
                      <MasteryBar value={r.value} label={`${r.student.name} exam readiness`} className="h-1.5" />
                      <span className="flex items-center gap-2"><span className="w-9 text-end tabular-nums">{r.value}%</span><MasteryBadge value={r.value} className="hidden sm:inline-flex" /></span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card as="section" aria-labelledby="pack-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink"><ClipboardCheck className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="pack-heading">Review session pack (IN17)</CardTitle>
                <CardDescription>Three weakest concepts in scope · suggested draft</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {pack.length === 0 ? (
              <EmptyState title="Nothing to review" description="Add concepts to the exam scope to build a pack." />
            ) : (
              <ul className="space-y-3" role="list">
                {pack.map(p => {
                  const on = !excluded.includes(p.concept.id);
                  return (
                    <li key={p.concept.id} className="rounded-lg border border-border p-3">
                      <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" className={`${controlClass} mt-0.5`} checked={on} onChange={e => { setGenerated(false); setExcluded(x => (e.target.checked ? x.filter(id => id !== p.concept.id) : [...x, p.concept.id])); }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2 font-medium">{p.concept.title}<span className="text-xs tabular-nums text-muted-foreground">{p.avg}% avg</span></span>
                          <span className="block text-xs leading-5 text-muted-foreground">{p.activity}</span>
                          <span className="block text-xs leading-5 text-muted-foreground">Suggested group: {p.below.length ? p.below.map(s => s.name).join(", ") : "whole class"}</span>
                          <span className="block text-xs leading-5 text-muted-foreground">Practice: {p.questionIds.length ? p.questionIds.join(", ") : "no approved questions yet (see IN5)"}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="space-y-1.5">
              <label htmlFor="session-length" className="text-xs font-semibold text-muted-foreground">Session length</label>
              <select id="session-length" value={minutes} onChange={e => { setGenerated(false); setMinutes(Number(e.target.value)); }} className={fieldClass}>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
            <Button className="w-full" variant="outline" disabled={!included.length} onClick={() => setGenerated(true)}>Build pack preview</Button>

            {generated && included.length ? (
              <div className="rounded-lg border border-border bg-background p-4" aria-live="polite">
                <p className="text-sm font-semibold">Agenda · {minutes} min <Badge tone="ai" className="ms-1">Draft</Badge></p>
                <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm">
                  <li>Warm-up quiz on {included.map(i => i.concept.title).join(", ")} — 5 min</li>
                  {included.map(i => <li key={i.concept.id}>{i.concept.title} — {perItem} min</li>)}
                  <li>Exit ticket and questions — 5 min</li>
                </ol>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            <SimulatedNote>Sharing is simulated: no pack is sent to students and no file is generated.</SimulatedNote>
            <Button disabled={!generated || !included.length} onClick={() => setMessage(`Review pack marked as shared (simulated) for ${course.shortTitle}. No students were notified.`)}>
              <Share2 aria-hidden="true" />
              Share with students (simulated)
            </Button>
            <StatusMessage message={message} />
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
