"use client";
import Link from "next/link";
import { FlaskConical, Info } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findCourse } from "@/data/fixtures";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import type { CourseId } from "@/types";
import { instructorLinks } from "./analytics";

/** "Sample data" marker for every number derived from fictional fixtures. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="neutral" className={className}>
      <FlaskConical aria-hidden="true" />
      Sample data
    </Badge>
  );
}

/** Sample-size note (IN8): the class is small, so each student moves percentages a lot. */
export function SampleSizeNote({ count, className }: { count: number; className?: string }) {
  const step = count ? Math.round(100 / count) : 0;
  return (
    <p className={cn("flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold text-foreground">Sample size: n = {count} fictional students.</span> Each student changes a percentage by about {step} points, so treat trends as indicative. All values are simulated demo data, not validated analytics.
      </span>
    </p>
  );
}

/** Course-assignment guard shared by IN8/IN9. Returns an error block or null. */
export function courseGuardError(courseId: CourseId) {
  const instructor = instructorForCourse(courseId);
  if (!instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }
  return null;
}

export function CourseContext({ courseId }: { courseId: CourseId }) {
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge tone="brand">{course?.title}</Badge>
      <span>
        Viewing as <span className="font-medium text-foreground">{instructor?.name}</span> (simulated assignment) · Current week (simulated)
      </span>
    </p>
  );
}

/** Offered when a concept belongs to a course other than the selected one. */
export function SwitchCourse({ courseId, conceptTitle }: { courseId: CourseId; conceptTitle: string }) {
  const role = useRole();
  const setCourse = useDemo(s => s.setCourse);
  const course = findCourse(courseId);
  return (
    <ErrorState
      title="Concept is in another course"
      description={`${conceptTitle} belongs to ${course?.title}. Switch the selected course to view it with that course's assigned instructor.`}
      action={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setCourse(courseId, role)}>Switch to {course?.shortTitle}</Button>
          <Button size="sm" variant="outline" asChild>
            <Link href={instructorLinks.dashboard}>Back to dashboard</Link>
          </Button>
        </div>
      }
    />
  );
}
