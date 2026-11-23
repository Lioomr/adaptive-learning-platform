"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, FlaskConical } from "lucide-react";
import { CardSkeleton, StatGridSkeleton } from "@/components/feedback/loading-skeletons";
import { ErrorState } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { findConcept, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import type { Course, CourseId, Instructor } from "@/types";
import { LOW_CONFIDENCE, type SourceRef } from "./mock-data";

/** Local hrefs for the review flow (IN3 → IN4 → IN5). Kept here so lib/routes.ts stays untouched. */
export const approvalRoutes = {
  concepts: "/instructor/concepts",
  graph: "/instructor/graph",
  questions: "/instructor/questions",
} as const;

const steps = [
  { href: approvalRoutes.concepts, id: "IN3", label: "Concept approvals" },
  { href: approvalRoutes.graph, id: "IN4", label: "Graph review" },
  { href: approvalRoutes.questions, id: "IN5", label: "Question approvals" },
] as const;

/** Step navigation between the three approval screens. */
export function ReviewSteps() {
  const pathname = usePathname();
  return (
    <nav aria-label="Content review steps" className="mb-6">
      <ol className="flex flex-wrap gap-2" role="list">
        {steps.map((s, i) => {
          const current = pathname === s.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  current ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="tabular-nums" aria-hidden="true">{i + 1}</span>
                <span>
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.label}
                </span>
                <span className={cn("text-xs", current ? "text-primary-foreground/80" : "text-muted-foreground")}>{s.id}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Persistent notice that the whole screen is simulated sample data. */
export function SimulatedNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex gap-3 rounded-lg border border-ai/25 bg-ai-soft px-4 py-3 text-sm">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-ai-ink" aria-hidden="true" />
      <p className="leading-6 text-ai-ink">
        <span className="font-semibold">Demo / Simulated · sample data.</span>{" "}
        {children ?? "AI proposals are fictional. Your decisions only change the status shown on this page in this browser tab; nothing is saved, published or sent to students."}
      </p>
    </div>
  );
}

/**
 * Waits for the shared store, then checks the simulated instructor assignment for
 * the selected course. Children are keyed by course so local review state resets
 * when the course changes.
 */
export function AssignedCourseGate({ children }: { children: (ctx: { courseId: CourseId; course: Course; instructor: Instructor }) => React.ReactNode }) {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  if (!hydrated) {
    return (
      <div role="status" aria-label="Loading review queue" className="space-y-6">
        <StatGridSkeleton />
        <div className="grid gap-6 xl:grid-cols-12">
          <CardSkeleton className="xl:col-span-7" lines={6} />
          <CardSkeleton className="xl:col-span-5" lines={6} />
        </div>
      </div>
    );
  }
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }
  return (
    <div key={courseId}>
      <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="brand">{course.title}</Badge>
        <span>
          Reviewing as <span className="font-medium text-foreground">{instructor.name}</span> (simulated assignment)
        </span>
      </p>
      {children({ courseId, course, instructor })}
    </div>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const low = value < LOW_CONFIDENCE;
  return (
    <Badge tone={low ? "warning" : "neutral"}>
      <span className="tabular-nums">{pct}%</span>
      {low ? <span>Low confidence</span> : <span className="sr-only">confidence</span>}
    </Badge>
  );
}

/** "AI proposed" marker, visually distinct from instructor-approved content. */
export function AiBadge({ label = "AI proposed" }: { label?: string }) {
  return <Badge tone="ai">{label} · simulated</Badge>;
}

export const conceptTitle = (id: string | null | undefined) => (id ? (findConcept(id)?.title ?? id) : "—");

/** Linked source panel shared by all three screens. */
export function SourceLink({ source, className }: { source: SourceRef; className?: string }) {
  const missing = source.location === "—";
  return (
    <div className={cn("rounded-lg border border-border bg-muted/40 p-3 text-sm", className)}>
      <p className="flex items-start gap-2 font-medium text-foreground">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 break-words">
          {source.file}
          {!missing ? <span className="font-normal text-muted-foreground"> · {source.location}</span> : null}
        </span>
      </p>
      <blockquote className={cn("mt-2 border-s-2 ps-3 leading-6", missing ? "border-warning text-warning-ink" : "border-border text-muted-foreground")}>{source.excerpt}</blockquote>
      <p className="mt-2 text-xs text-muted-foreground">Sample material reference — no real file is stored or opened.</p>
    </div>
  );
}

/** Polite live region for announcing simulated status changes. */
export function LiveAnnouncement({ message }: { message: string }) {
  return (
    <p aria-live="polite" role="status" className="sr-only">
      {message}
    </p>
  );
}
