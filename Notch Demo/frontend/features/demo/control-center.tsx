"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpenCheck, Database, GraduationCap, HeartHandshake, PlayCircle, Sparkles, type LucideIcon } from "lucide-react";
import { GuidedTourOverlay, type TourStep } from "@/components/demo/guided-tour";
import { ResetDemoButton } from "@/components/demo/reset-demo-button";
import { DemoCenterSkeleton } from "@/components/feedback/loading-skeletons";
import { CourseSelector, StudentSelector } from "@/components/layout/context-selectors";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { useRole } from "@/components/layout/role-context";
import { MasteryBadge, MasteryLegend, MasteryRing } from "@/components/learning/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { courses, findConcept } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { can } from "@/lib/permissions";
import { portalFor } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { courseAverage, focusConcept, formatDays, supportLevel } from "@/services/insights";
import { recommendation } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { CourseId, Role } from "@/types";

const TOUR: TourStep[] = [
  { target: "context", title: "Choose the story", body: "Pick a fictional student and course. The same selection follows you into every portal." },
  { target: "stories", title: "Or start from a story", body: "Shortcuts select a ready-made context — for example Nour, who needs Call Stack before Recursion. They change the selection only, never results." },
  { target: "portals", title: "Switch perspectives", body: "Open the Student portal to answer a question, then the Instructor and Advisor portals to see the same updated progress." },
  { target: "simulation", title: "How mastery moves", body: "Each assessment updates mastery with the approved formula: 60% previous mastery plus 40% of the new score. It is a simulation, not a trained model." },
  { target: "reset", title: "Reset between runs", body: "Reset restores the baseline fixtures and removes recorded attempts, so every presentation starts from the same point." },
];

const STORIES: { studentId: string; courseId: CourseId; label: string; summary: string; tone: "warning" | "success" | "danger" }[] = [
  { studentId: "S-NOUR", courseId: "C-PY", label: "Needs a prerequisite", summary: "Nour · Recursion 35%, Call Stack 55%", tone: "warning" },
  { studentId: "S-SALMA", courseId: "C-PY", label: "Mastering the course", summary: "Salma · Python average 92%", tone: "success" },
  { studentId: "S-YOUSSEF", courseId: "C-MATH", label: "Low recent activity", summary: "Youssef · inactive for 14 days", tone: "danger" },
];

const PORTAL_CARDS: { role: Role; icon: LucideIcon; tryThis: string }[] = [
  { role: "student", icon: GraduationCap, tryThis: "Answer the illustrative question and watch mastery update." },
  { role: "instructor", icon: BookOpenCheck, tryThis: "Find the same attempt in course activity and the class view." },
  { role: "advisor", icon: HeartHandshake, tryThis: "Compare courses and check supportive indicators." },
];

export function DemoControlCenter() {
  const role = useRole();
  const hydrated = useHydrated();
  const [tourStep, setTourStep] = useState(-1);

  return (
    <>
      <PageHeader
        eyebrow={<>Presenter tools</>}
        title="Demo Control Center"
        description="Set up a shared story, then walk through the Student, Instructor and Advisor portals. Every portal reads the same simulated data, stored only in this browser."
        actions={
          <>
            {can(role, "demo:tour") ? (
              <Button onClick={() => setTourStep(0)}>
                <PlayCircle aria-hidden="true" />
                Start guided tour
              </Button>
            ) : null}
            <ResetDemoButton />
          </>
        }
      />

      {hydrated ? <ContextSection /> : <DemoCenterSkeleton />}

      <section aria-labelledby="portals-heading" className="mt-8" data-tour="portals">
        <SectionHeading id="portals-heading" title="Open a portal" description="Three perspectives on one shared learning journey." />
        <ul className="grid gap-4 md:grid-cols-3" role="list">
          {PORTAL_CARDS.map(({ role: r, icon: Icon, tryThis }) => {
            const p = portalFor(r);
            return (
              <li key={r}>
                <Card className="group relative flex h-full flex-col p-5 transition-colors hover:border-[#b6c2dc]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-secondary text-brand-2">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <Badge tone="neutral">{p.screens}</Badge>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{p.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{p.description}</p>
                  <p className="mt-3 rounded-lg bg-muted/70 px-3 py-2 text-xs leading-5 text-foreground">
                    <span className="font-semibold">Try: </span>
                    {tryThis}
                  </p>
                  <Link href={p.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-2 after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">
                    Open {p.short} portal
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="sim-heading" className="min-w-0 xl:col-span-7" data-tour="simulation">
          <CardHeader>
            <div>
              <CardTitle id="sim-heading">How the adaptive simulation works</CardTitle>
              <CardDescription>Deterministic and explainable — not BKT, DKT or IRT.</CardDescription>
            </div>
            <Badge tone="ai">
              <Sparkles aria-hidden="true" />
              Simulated
            </Badge>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 sm:grid-cols-2" role="list">
              {[
                ["Select", "Choose a fictional student and a course above."],
                ["Practise", "In the Student portal, answer the illustrative question."],
                ["Update", "Mastery moves toward the new score using the formula below."],
                ["Compare", "Instructor and Advisor portals show the same updated record."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-brand">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-lg border border-border bg-muted/50 px-4 py-3">
              <p className="font-mono text-[13px] text-foreground">new mastery = round(0.60 × previous + 0.40 × score)</p>
              <p className="mt-1 text-xs text-muted-foreground">Example: Nour, Recursion — round(0.60 × 35 + 0.40 × 100) = 61%. Unanswered questions count as incorrect.</p>
            </div>
            <MasteryLegend className="mt-4" />
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="status-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle id="status-heading">Demo status</CardTitle>
              <CardDescription>What is real, simulated or still pending.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{hydrated ? <DemoStatus /> : <div className="h-[212px]" />}</CardContent>
        </Card>
      </div>

      {tourStep >= 0 ? <GuidedTourOverlay steps={TOUR} step={tourStep} onStepChange={setTourStep} onClose={() => setTourStep(-1)} /> : null}
    </>
  );
}

function ContextSection() {
  const role = useRole();
  const students = useDemo(s => s.students);
  const studentId = useDemo(s => s.studentId);
  const courseId = useDemo(s => s.courseId);
  const setStudent = useDemo(s => s.setStudent);
  const setCourse = useDemo(s => s.setCourse);
  const student = students.find(s => s.id === studentId)!;
  const course = courses.find(c => c.id === courseId)!;
  const avg = courseAverage(student, courseId);
  const focus = focusConcept(student, courseId);
  const rec = focus ? recommendation(student, focus.id) : null;
  const level = supportLevel(student, [courseId]);

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Card as="section" aria-labelledby="context-heading" className="min-w-0 xl:col-span-7" data-tour="context">
        <CardHeader>
          <div>
            <CardTitle id="context-heading">Demo context</CardTitle>
            <CardDescription>This selection is shared by every portal.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <StudentSelector />
            <CourseSelector />
          </div>
          <div className="mt-5 flex flex-col gap-5 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center">
            <MasteryRing value={avg} size={88} label={`${student.name}'s ${course.shortTitle} average`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold">{student.name}</p>
                <Badge tone={level.tone}>{level.label}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {course.title} average · active {formatDays(student.lastActiveDays).toLowerCase()}
              </p>
              {focus && rec ? (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Focus concept:</span>
                  <span className="font-semibold">{focus.title} {student.mastery[focus.id]}%</span>
                  <MasteryBadge value={student.mastery[focus.id]} />
                </p>
              ) : null}
              {rec && rec.kind === "review" ? <p className="mt-1 text-sm text-warning-ink">{rec.message.replace("first.", `before ${findConcept(rec.conceptId)?.title}.`)}</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="stories-heading" className="min-w-0 xl:col-span-5" data-tour="stories">
        <CardHeader>
          <div>
            <CardTitle id="stories-heading">Story shortcuts</CardTitle>
            <CardDescription>Select a deterministic story. Selection only — results are never changed.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2" role="list">
            {STORIES.map(story => {
              const active = story.studentId === studentId && story.courseId === courseId;
              return (
                <li key={story.studentId} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setStudent(story.studentId, role);
                      setCourse(story.courseId, role);
                    }}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg border px-3.5 py-3 text-start outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-brand-2 bg-secondary" : "border-border bg-card",
                    )}
                  >
                    <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", { warning: "bg-warning", success: "bg-success", danger: "bg-danger" }[story.tone])} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{story.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{story.summary}</span>
                    </span>
                    {active ? <Badge tone="brand">Selected</Badge> : <ArrowRight className="size-4 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">Full scenario presets that initialize data are pending (MAH-30).</p>
        </CardContent>
      </Card>
    </div>
  );
}

function DemoStatus() {
  const attempts = useDemo(s => s.attempts);
  const storage = useDemo(s => s.storageStatus);
  const rows: [string, React.ReactNode][] = [
    ["Recorded attempts", <span key="a" className="tabular-nums">{attempts.length}</span>],
    ["Saved progress", storage === "unavailable" ? "Not available (memory only)" : "This browser only"],
    ["Question bank", <Badge key="q" tone="warning">2 of 100 · MAH-28</Badge>],
    ["System screens SYS1–SYS3", <Badge key="s" tone="neutral">Pending · MAH-29</Badge>],
    ["Scenario presets & full tours", <Badge key="p" tone="neutral">Pending · MAH-30</Badge>],
  ];
  return (
    <>
      <dl className="divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-end font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        No real authentication, database, AI model or notifications. All roles and permissions are client-side simulations.
      </p>
    </>
  );
}
