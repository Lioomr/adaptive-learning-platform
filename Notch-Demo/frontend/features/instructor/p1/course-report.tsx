"use client";
import { useState } from "react";
import { BarChart3, ClipboardList, FileBarChart, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { BandDistributionChart, ConceptAverageChart } from "@/components/learning/charts";
import { MasteryBadge } from "@/components/learning/mastery";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { conceptsForCourse, findConcept } from "@/data/fixtures";
import { attemptsFor, bandCounts, courseAverage } from "@/services/insights";
import { useDemo } from "@/store/demo";
import { contentGaps, exportFields, gapKindLabel, instructorLinks, signups } from "./data";
import { average, controlClass, P1Screen, ScreenLink, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

/** IN18 course report + IN19 research export approval (preview only). */
export function CourseReportScreen() {
  return (
    <P1Screen screenIds="IN18 · IN19" title="Course report" description="An end-of-period summary of the course using sample data, and a preview-only approval for a de-identified research export.">
      {ctx => <ReportContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

function ReportContent({ courseId, course, enrolled }: CourseContext) {
  const attempts = useDemo(s => s.attempts);
  const averages = enrolled.map(s => courseAverage(s, courseId));
  const classAvg = average(averages);
  const courseConcepts = conceptsForCourse(courseId);
  const conceptData = courseConcepts.map(c => ({ concept: c.title, average: average(enrolled.map(s => s.mastery[c.id] ?? 0)) }));
  const sorted = [...conceptData].sort((a, b) => b.average - a.average);
  const joined = enrolled.filter(s => signups[courseId][s.id]?.status === "joined");
  const courseAttempts = attemptsFor(attempts, { courseId });
  const gaps = contentGaps.filter(g => g.courseId === courseId);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students joined" value={`${joined.length}/${enrolled.length}`} icon={UserCheck} hint="Sample sign-up data (IN7)" />
        <StatCard label="Class average" value={classAvg} unit="%" icon={BarChart3} accent="progress" hint={<MasteryBadge value={classAvg} />} />
        <StatCard label="Attempts recorded" value={courseAttempts.length} icon={ClipboardList} accent="ai" hint="In this browser session" />
        <StatCard label="Open content gaps" value={gaps.length} icon={FileBarChart} accent="warning" hint="Sample gaps (IN11)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="report-concepts-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="report-concepts-heading">Concept averages (IN18)</CardTitle>
              <CardDescription>Simulated mastery · {enrolled.length} fictional students · sample data</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ConceptAverageChart data={conceptData} caption={`Class-average mastery per concept in ${course.title} (sample data)`} />
          </CardContent>
        </Card>
        <Card as="section" aria-labelledby="report-dist-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle id="report-dist-heading">Mastery distribution</CardTitle>
              <CardDescription>Students by course-average band.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <BandDistributionChart counts={bandCounts(averages)} caption={`Students per mastery band in ${course.title} (sample data)`} />
          </CardContent>
        </Card>
      </div>

      <Card as="section" aria-labelledby="highlights-heading">
        <CardHeader>
          <div>
            <CardTitle id="highlights-heading">Summary</CardTitle>
            <CardDescription>Generated from the current demo state. Small sample — interpret with care.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 pt-0 md:grid-cols-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Strongest concepts</h3>
            <ul className="mt-2 space-y-1 text-sm" role="list">
              {sorted.slice(0, 3).map(c => <li key={c.concept} className="flex justify-between gap-2"><span>{c.concept}</span><span className="tabular-nums">{c.average}%</span></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Needs review</h3>
            <ul className="mt-2 space-y-1 text-sm" role="list">
              {sorted.slice(-3).reverse().map(c => <li key={c.concept} className="flex justify-between gap-2"><span>{c.concept}</span><span className="tabular-nums">{c.average}%</span></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Content gaps</h3>
            <ul className="mt-2 space-y-1 text-sm" role="list">
              {gaps.map(g => <li key={g.id}>{findConcept(g.conceptId)?.title}: {gapKindLabel[g.kind].toLowerCase()}</li>)}
            </ul>
            <ScreenLink href={instructorLinks.contentGaps} className="mt-2 text-xs">Review gaps (IN11)</ScreenLink>
          </div>
        </CardContent>
      </Card>

      <ExportApproval key={courseId} courseTitle={course.title} consentedIds={joined.map(s => s.id)} conceptIds={courseConcepts.map(c => c.id)} />
    </>
  );
}

function ExportApproval({ courseTitle, consentedIds, conceptIds }: { courseTitle: string; consentedIds: string[]; conceptIds: string[] }) {
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [fields, setFields] = useState<string[]>(exportFields.filter(f => f.defaultOn).map(f => f.id));
  const [purpose, setPurpose] = useState("");
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const rows = students
    .filter(s => consentedIds.includes(s.id))
    .map((s, i) => ({
      pid: `P-${String(i + 1).padStart(2, "0")}`,
      mastery: average(conceptIds.map(id => s.mastery[id] ?? 0)),
      attempts: attempts.filter(a => a.studentId === s.id && conceptIds.includes(a.conceptId)).length,
      activity: s.lastActiveDays,
    }));
  const has = (id: string) => fields.includes(id);
  const canApprove = purpose.trim().length >= 10 && fields.length > 0 && !approved;

  return (
    <Card as="section" aria-labelledby="export-heading">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand-2"><ShieldCheck className="size-4" aria-hidden="true" /></span>
          <div>
            <CardTitle id="export-heading">Research export approval (IN19)</CardTitle>
            <CardDescription>De-identified dataset for {courseTitle} · consented students only ({rows.length} of {students.length} fictional students)</CardDescription>
          </div>
        </div>
        {approved ? <Badge tone="ai">Approved · preview only</Badge> : <Badge tone="warning">Awaiting approval</Badge>}
      </CardHeader>
      <CardContent className="grid gap-6 pt-0 lg:grid-cols-2">
        <div className="space-y-4">
          <fieldset className="space-y-2" disabled={approved}>
            <legend className="mb-1 text-xs font-semibold text-muted-foreground">Fields to include</legend>
            {exportFields.map(f => (
              <label key={f.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className={`${controlClass} mt-0.5`}
                  disabled={!f.allowed}
                  checked={f.allowed && has(f.id)}
                  onChange={e => setFields(x => (e.target.checked ? [...x, f.id] : x.filter(id => id !== f.id)))}
                />
                <span>
                  <span className="flex items-center gap-1.5 font-medium">{f.label}{!f.allowed ? <Lock className="size-3.5 text-muted-foreground" aria-label="Always excluded" /> : null}</span>
                  <span className="block text-xs text-muted-foreground">{f.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor="export-purpose" className="text-xs font-semibold text-muted-foreground">Research purpose (required, at least 10 characters)</label>
            <textarea id="export-purpose" rows={2} disabled={approved} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Evaluate prerequisite recommendations in week 1–7" className="w-full rounded-lg border border-input bg-card p-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60" />
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">De-identified preview (first 4 rows)</p>
          {fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Select at least one field.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <caption className="sr-only">De-identified export preview</caption>
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    {has("pseudo-id") ? <th scope="col" className="px-3 py-2 text-start font-medium">Participant</th> : null}
                    {has("mastery") ? <th scope="col" className="px-3 py-2 text-end font-medium">Course mastery</th> : null}
                    {has("attempt-count") ? <th scope="col" className="px-3 py-2 text-end font-medium">Attempts</th> : null}
                    {has("activity") ? <th scope="col" className="px-3 py-2 text-end font-medium">Days inactive</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 4).map(r => (
                    <tr key={r.pid} className="border-t border-border">
                      {has("pseudo-id") ? <td className="px-3 py-2 font-mono text-xs">{r.pid}</td> : null}
                      {has("mastery") ? <td className="px-3 py-2 text-end tabular-nums">{r.mastery}</td> : null}
                      {has("attempt-count") ? <td className="px-3 py-2 text-end tabular-nums">{r.attempts}</td> : null}
                      {has("activity") ? <td className="px-3 py-2 text-end tabular-nums">{r.activity}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Students with pending or missing consent are excluded automatically.</p>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <SimulatedNote>Preview only. Approving does not generate, download or transmit any file, and no data leaves this browser. A real export would need institutional ethics review.</SimulatedNote>
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!canApprove}><ShieldCheck aria-hidden="true" />Approve export (preview only)</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Approve research export preview?</AlertDialogTitle>
              <AlertDialogDescription>
                {rows.length} pseudonymous rows with {fields.length} field{fields.length === 1 ? "" : "s"}. This only marks the request as approved on this page. No file is created or shared.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setApproved(true); setMessage("Export approval recorded (preview only). No file was generated or sent."); }}>Approve preview</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {approved ? <Button variant="ghost" onClick={() => { setApproved(false); setMessage("Approval withdrawn (simulated)."); }}>Withdraw approval</Button> : null}
        </div>
        <StatusMessage message={message} />
      </CardFooter>
    </Card>
  );
}
