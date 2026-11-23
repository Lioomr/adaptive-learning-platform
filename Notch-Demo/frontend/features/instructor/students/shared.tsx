"use client";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { findCourse } from "@/data/fixtures";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import { RISK_RULES, type RiskReasonKey } from "./risk-data";
import type { Course, Instructor } from "@/types";

export const instructorRoutes = {
  atRisk: "/instructor/at-risk",
  students: "/instructor/students",
  student: (id: string) => `/instructor/students/${encodeURIComponent(id)}`,
} as const;

/** The selected course and its simulated instructor assignment (course-scoped access). */
export function useInstructorCourse(): { course: Course; instructor: Instructor } | null {
  const courseId = useDemo(s => s.courseId);
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) return null;
  return { course, instructor };
}

export function CourseNotAssigned() {
  return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
}

/** Context line used on every IN13 / IN14 screen. */
export function CourseContext({ course, instructor }: { course: Course; instructor: Instructor }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge tone="brand">{course.title}</Badge>
      <Badge tone="ai">
        <FlaskConical aria-hidden="true" />
        Sample data · Demo / Simulated
      </Badge>
      <span>
        Viewing as <span className="font-medium text-foreground">{instructor.name}</span> (simulated assignment)
      </span>
    </p>
  );
}

/** Privacy boundary: the instructor sees course-scoped learning data only. */
export function PrivacyNotice({ courseTitle, className }: { courseTitle: string; className?: string }) {
  return (
    <aside aria-label="Privacy boundary" className={cn("flex gap-3 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm", className)}>
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-2" aria-hidden="true" />
      <p className="leading-6 text-muted-foreground">
        <span className="font-semibold text-foreground">Course-scoped view.</span> You see learning data for {courseTitle} only. Other courses, advisor notes, tutor conversations and personal details are not shown to instructors.
      </p>
    </aside>
  );
}

export function ReasonBadge({ reason }: { reason: RiskReasonKey }) {
  const rule = RISK_RULES[reason];
  return <Badge tone={rule.tone}>{rule.label}</Badge>;
}

/** Accessible native select styled like the design system inputs. */
export function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SearchInput({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input id={id} type="search" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );
}
