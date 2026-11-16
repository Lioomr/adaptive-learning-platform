"use client";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Lightbulb, MessageSquareWarning } from "lucide-react";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findConcept } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { PREREQUISITE_READY } from "@/services/mastery";
import type { Concept, Student } from "@/types";
import { commonMisconceptions, instructorLinks, upcomingLecture } from "./data";
import { average, P1Screen, ScreenLink, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

type DecisionId = "revisit" | "warmup" | "proceed";
const DECISIONS: { id: DecisionId; title: string; detail: string }[] = [
  { id: "revisit", title: "Revisit the prerequisite first", detail: "Open the lecture with a focused re-teach of the weakest prerequisite." },
  { id: "warmup", title: "Short warm-up, then proceed", detail: "Spend 10–15 minutes on the prerequisite, then teach as planned." },
  { id: "proceed", title: "Proceed as planned", detail: "Prerequisites look ready for most of the class." },
];

/** Simulated, explainable rule (not a prediction). Uses the shared 70% readiness threshold. */
export function suggestDecision(prereqs: { avg: number; belowShare: number }[]): DecisionId {
  if (prereqs.some(p => p.avg < PREREQUISITE_READY)) return "revisit";
  if (prereqs.some(p => p.belowShare >= 30)) return "warmup";
  return "proceed";
}

/** IN10 — lecture decision summary for the next scheduled lecture. */
export function LectureDecisionScreen() {
  return (
    <P1Screen screenIds="IN10" title="Lecture decision summary" description="Before the next lecture, check whether prerequisites are ready and record how you plan to teach it. The suggestion is a simple demo rule, not a prediction.">
      {ctx => <DecisionContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

function prereqStats(concept: Concept, students: Student[]) {
  return concept.prerequisites
    .map(findConcept)
    .filter((c): c is Concept => Boolean(c))
    .map(p => {
      const values = students.map(s => s.mastery[p.id] ?? 0);
      const below = students.filter(s => (s.mastery[p.id] ?? 0) < PREREQUISITE_READY);
      return { concept: p, avg: average(values), below, belowShare: students.length ? Math.round((100 * below.length) / students.length) : 0 };
    })
    .sort((a, b) => a.avg - b.avg);
}

function DecisionContent({ courseId, enrolled }: CourseContext) {
  const lecture = upcomingLecture[courseId];
  const concept = findConcept(lecture.conceptId)!;
  const stats = prereqStats(concept, enrolled);
  const suggested = suggestDecision(stats);
  const weakest = stats[0];
  const [choice, setChoice] = useState<DecisionId>(suggested);
  const [note, setNote] = useState("");
  const [recorded, setRecorded] = useState<{ id: DecisionId; note: string } | null>(null);
  const targetAvg = average(enrolled.map(s => s.mastery[concept.id] ?? 0));

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="lecture-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand-2"><CalendarDays className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="lecture-heading">Week {lecture.week}: {concept.title}</CardTitle>
                <CardDescription>Next lecture · {lecture.day} (sample timetable) · current class average {targetAvg}%</CardDescription>
              </div>
            </div>
            <MasteryBadge value={targetAvg} />
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Prerequisite readiness (target {PREREQUISITE_READY}%)</h3>
            <ul className="space-y-4" role="list">
              {stats.map(p => (
                <li key={p.concept.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{p.concept.title}</p>
                    <span className="text-sm tabular-nums">{p.avg}% avg</span>
                  </div>
                  <MasteryBar value={p.avg} label={`${p.concept.title} class average`} className="mt-2 h-1.5" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p.below.length} of {enrolled.length} students below {PREREQUISITE_READY}% ({p.belowShare}%)
                    {p.below.length ? `: ${p.below.map(s => s.name).join(", ")}` : ""}
                  </p>
                  {commonMisconceptions[p.concept.id]?.length ? (
                    <ul className="mt-2 space-y-1" role="list" aria-label={`Common wrong choices in ${p.concept.title}`}>
                      {commonMisconceptions[p.concept.id].map(m => (
                        <li key={m.label} className="flex items-start gap-2 text-xs">
                          <MessageSquareWarning className="mt-0.5 size-3.5 shrink-0 text-warning-ink" aria-hidden="true" />
                          <span>{m.label} <span className="text-muted-foreground">· {m.count} students (sample)</span></span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <ScreenLink href={instructorLinks.concepts}>Concept detail (IN9)</ScreenLink>
              <ScreenLink href={instructorLinks.atRisk}>Students needing support (IN13)</ScreenLink>
            </div>
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="decision-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink"><Lightbulb className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="decision-heading">Your decision</CardTitle>
                <CardDescription>Suggestion is AI-style guidance; you decide.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="rounded-lg border border-ai/20 bg-ai-soft/60 p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold text-ai-ink"><Badge tone="ai">Suggested · simulated rule</Badge></p>
              <p className="mt-1.5 leading-6">
                {DECISIONS.find(d => d.id === suggested)!.title}
                {weakest ? ` — ${weakest.concept.title} averages ${weakest.avg}% and ${weakest.belowShare}% of students are below ${PREREQUISITE_READY}%.` : "."}
              </p>
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">Plan for this lecture</legend>
              {DECISIONS.map(d => (
                <label key={d.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", choice === d.id ? "border-brand-2 bg-secondary/60" : "border-border")}>
                  <input type="radio" name="decision" className="mt-0.5 size-4 accent-[#2D4485]" checked={choice === d.id} onChange={() => setChoice(d.id)} />
                  <span>
                    <span className="font-medium">{d.title}</span>
                    {d.id === suggested ? <span className="ms-2 text-xs text-ai-ink">(suggested)</span> : null}
                    <span className="block text-xs text-muted-foreground">{d.detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="space-y-1.5">
              <label htmlFor="decision-note" className="text-xs font-semibold text-muted-foreground">Teaching note (optional)</label>
              <textarea id="decision-note" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Trace a three-frame call stack on the board" className="w-full rounded-lg border border-input bg-card p-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <Button className="w-full" onClick={() => setRecorded({ id: choice, note: note.trim() })}>
              <CheckCircle2 aria-hidden="true" />
              Record decision (simulated)
            </Button>
            <SimulatedNote>Recorded only on this page for the demo. Students are not notified and the timetable is not changed.</SimulatedNote>
            <StatusMessage message={recorded ? `Decision recorded (simulated): ${DECISIONS.find(d => d.id === recorded.id)!.title}${recorded.note ? ` — “${recorded.note}”` : ""}.` : null} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
