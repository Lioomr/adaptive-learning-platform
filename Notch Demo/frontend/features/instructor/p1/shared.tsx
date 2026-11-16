"use client";
import Link from "next/link";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import type { Course, CourseId, Instructor, Student } from "@/types";

export type CourseContext = { courseId: CourseId; course: Course; instructor: Instructor; enrolled: Student[] };

/**
 * Common frame for the P1 instructor screens: one <h1>, a simulation notice,
 * hydration skeleton, and the assigned-course restriction from lib/permissions.
 */
export function P1Screen({ screenIds, title, description, actions, children }: { screenIds: string; title: string; description: string; actions?: React.ReactNode; children: (ctx: CourseContext) => React.ReactNode }) {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>Instructor · {screenIds}</span>
            <Badge tone="ai" className="normal-case tracking-normal">Demo / Simulated</Badge>
          </>
        }
        title={title}
        description={description}
        actions={actions}
      />
      {hydrated ? <Guarded>{children}</Guarded> : <InstructorPreviewSkeleton />}
    </>
  );
}

function Guarded({ children }: { children: (ctx: CourseContext) => React.ReactNode }) {
  const students = useDemo(s => s.students);
  const courseId = useDemo(s => s.courseId);
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }
  const enrolled = students.filter(s => s.enrolledCourseIds.includes(courseId));
  return (
    <div className="space-y-6">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="brand">{course.title}</Badge>
        <span>
          Viewing as <span className="font-medium text-foreground">{instructor.name}</span> (simulated assignment) · sample data, {enrolled.length} fictional students
        </span>
      </p>
      {children({ courseId, course, instructor, enrolled })}
    </div>
  );
}

/** Prominent label for any action that only changes local UI state. */
export function SimulatedNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="note" className={cn("flex items-start gap-2 rounded-lg border border-ai/20 bg-ai-soft px-3 py-2 text-xs leading-5 text-ai-ink", className)}>
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Polite live region confirming a simulated action. */
export function StatusMessage({ message }: { message: string | null }) {
  return (
    <p role="status" aria-live="polite" className={cn("text-sm", message ? "rounded-lg border border-success/25 bg-success-soft px-3 py-2 text-success-ink" : "sr-only")}>
      {message ?? ""}
    </p>
  );
}

/** Link to another instructor screen (owned elsewhere). */
export function ScreenLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-1 rounded text-sm font-medium text-brand-2 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring", className)}>
      {children}
      <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );
}

export const average = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0);

/** Native checkbox/radio styling shared by forms on these screens. */
export const controlClass = "size-4 shrink-0 rounded border-input accent-[#2D4485] outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const fieldClass = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
