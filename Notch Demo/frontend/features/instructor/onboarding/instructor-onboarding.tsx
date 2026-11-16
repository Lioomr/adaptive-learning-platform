"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, FlaskConical, Lock, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { conceptsForCourse, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import { canDo, cannotDo, dataNotes, steps } from "./onboarding-mock";

const MATERIALS_HREF = `${routes.instructor}/materials`;

/** IN1 Onboarding & instructor boundaries (Demo / Simulated). */
export function InstructorOnboarding() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>IN1 · Instructor onboarding</span>
            <Badge tone="ai">
              <FlaskConical aria-hidden="true" /> Demo / Simulated
            </Badge>
          </>
        }
        title="Welcome to your course workspace"
        description="Confirm your assignment and review what the instructor role can see and approve before adding course materials."
      />
      {hydrated ? (
        <OnboardingContent />
      ) : (
        <div role="status" aria-label="Loading onboarding" className="grid gap-6 xl:grid-cols-12">
          <Skeleton className="h-72 xl:col-span-4" />
          <Skeleton className="h-72 xl:col-span-8" />
        </div>
      )}
    </>
  );
}

function OnboardingContent() {
  const courseId = useDemo(s => s.courseId);
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course. Choose a course from the Demo Control Center." />;
  }

  const required = steps.filter(s => s.id !== "materials");
  const completed = required.filter(s => done[s.id]).length;
  const ready = completed === required.length;
  const toggle = (id: string) => setDone(d => ({ ...d, [id]: !d[id] }));
  const conceptCount = conceptsForCourse(courseId).length;

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Card as="section" aria-labelledby="onb-steps-heading" className="min-w-0 xl:col-span-4 xl:self-start">
        <CardHeader>
          <div className="w-full">
            <CardTitle id="onb-steps-heading">Getting started</CardTitle>
            <CardDescription>
              {completed} of {required.length} steps confirmed
            </CardDescription>
            <Progress value={(completed / required.length) * 100} className="mt-3" aria-label="Onboarding progress" />
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3" role="list">
            {steps.map((step, i) => {
              const isDone = step.id === "materials" ? false : !!done[step.id];
              return (
                <li key={step.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      isDone ? "border-transparent bg-success text-white" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                      <span className="sr-only">{isDone ? " (confirmed)" : " (not yet confirmed)"}</span>
                    </p>
                    <p className="text-sm leading-5 text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          {ready ? (
            <Button asChild>
              <Link href={MATERIALS_HREF}>
                Continue to Upload materials
                <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button disabled aria-describedby="onb-cta-hint">
              Continue to Upload materials
              <ArrowRight className="rtl:rotate-180" aria-hidden="true" />
            </Button>
          )}
          <p id="onb-cta-hint" className="text-xs leading-5 text-muted-foreground">
            {ready ? "Onboarding confirmations are kept on this page only (simulated)." : "Confirm the three steps on this page to continue."}
          </p>
        </CardFooter>
      </Card>

      <div className="min-w-0 space-y-6 xl:col-span-8">
        <Card as="section" aria-labelledby="onb-assignment-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <UserRound className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle id="onb-assignment-heading">1. Your course assignment</CardTitle>
                <CardDescription>Simulated assignment from the shared demo fixtures.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs font-semibold text-muted-foreground">Instructor</dt>
                <dd className="mt-1 text-sm font-medium">{instructor.name}</dd>
              </div>
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs font-semibold text-muted-foreground">Assigned course</dt>
                <dd className="mt-1 text-sm font-medium">{course.title}</dd>
              </div>
              <div className="rounded-lg border border-border p-3">
                <dt className="text-xs font-semibold text-muted-foreground">Concepts in course</dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">{conceptCount}</dd>
              </div>
            </dl>
            <StepCheckbox id="assignment" checked={!!done.assignment} onToggle={toggle} label={`I teach ${course.title}`} />
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="onb-boundaries-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink">
                <ShieldCheck className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle id="onb-boundaries-heading">2. Instructor boundaries</CardTitle>
                <CardDescription>What this role can see and approve in the demo, and what stays with other roles.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <BoundaryList heading="You can" tone="can" items={canDo} />
              <BoundaryList heading="You cannot" tone="cannot" items={cannotDo} />
            </div>
            <StepCheckbox id="boundaries" checked={!!done.boundaries} onToggle={toggle} label="I understand the instructor boundaries" />
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="onb-data-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink">
                <FlaskConical className="size-4" aria-hidden="true" />
              </span>
              <div>
                <CardTitle id="onb-data-heading">3. About the simulated data</CardTitle>
                <CardDescription>Phase 1 is a UI demonstration; nothing here is a real operation.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2" role="list">
              {dataNotes.map(note => (
                <li key={note} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                  <Lock className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                  {note}
                </li>
              ))}
            </ul>
            <StepCheckbox id="data" checked={!!done.data} onToggle={toggle} label="I understand this workspace uses simulated data" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BoundaryList({ heading, tone, items }: { heading: string; tone: "can" | "cannot"; items: { id: string; title: string; detail: string }[] }) {
  const Icon = tone === "can" ? CheckCircle2 : XCircle;
  const headingId = `onb-${tone}-heading`;
  return (
    <div className={cn("rounded-lg border p-4", tone === "can" ? "border-success/25 bg-success-soft/40" : "border-border bg-muted/40")}>
      <h3 id={headingId} className="text-sm font-semibold text-foreground">
        {heading}
      </h3>
      <ul aria-labelledby={headingId} className="mt-3 space-y-3" role="list">
        {items.map(item => (
          <li key={item.id} className="flex gap-2.5">
            <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "can" ? "text-success-ink" : "text-muted-foreground")} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-sm leading-5 text-muted-foreground">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCheckbox({ id, checked, onToggle, label }: { id: string; checked: boolean; onToggle: (id: string) => void; label: string }) {
  const inputId = `onb-confirm-${id}`;
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
      <input id={inputId} type="checkbox" checked={checked} onChange={() => onToggle(id)} className="size-4 shrink-0 accent-[var(--brand-indigo-2)]" />
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
    </div>
  );
}
