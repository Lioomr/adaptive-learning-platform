import { ArrowRight, CheckCircle2, CircleAlert } from "lucide-react";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { conceptsForCourse, findConcept } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { PREREQUISITE_READY, recommendation } from "@/services/mastery";
import type { Concept, CourseId, Student } from "@/types";

/** Every concept in a course with value, band and the prerequisite recommendation. */
export function ConceptProgress({ student, courseId, highlightId, columns = 2 }: { student: Student; courseId: CourseId; highlightId?: string; columns?: 1 | 2 }) {
  const items = conceptsForCourse(courseId);
  return (
    <ul className={cn("grid gap-x-6", columns === 2 && "sm:grid-cols-2")} role="list">
      {items.map(c => {
        const value = student.mastery[c.id];
        const rec = recommendation(student, c.id);
        const highlighted = c.id === highlightId;
        return (
          <li key={c.id} className={cn("border-t border-border py-3.5 first:border-t-0", columns === 2 && "sm:nth-2:border-t-0", highlighted && "-mx-3 rounded-lg border-transparent bg-secondary/70 px-3")}>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-foreground">{c.title}</p>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{value}%</span>
            </div>
            <MasteryBar value={value} label={`${c.title} mastery`} className="mt-2 h-1.5" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className={cn("min-w-0 truncate text-xs", rec.kind === "review" ? "text-warning-ink" : "text-muted-foreground")}>{rec.message}</p>
              <MasteryBadge value={value} className="py-0 text-[11px]" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Prerequisite readiness for one concept, as a short path ending at the concept. */
export function PrerequisitePath({ student, concept }: { student: Student; concept: Concept }) {
  if (!concept.prerequisites.length) return <p className="text-sm text-muted-foreground">{concept.title} has no prerequisites.</p>;
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label={`Prerequisites for ${concept.title}`}>
      {concept.prerequisites.map(id => {
        const value = student.mastery[id] ?? 0;
        const ready = value >= PREREQUISITE_READY;
        return (
          <li key={id} className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium", ready ? "border-success/25 bg-success-soft text-success-ink" : "border-warning/30 bg-warning-soft text-warning-ink")}>
              {ready ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <CircleAlert className="size-3.5" aria-hidden="true" />}
              {findConcept(id)?.title} <span className="tabular-nums">{value}%</span>
              <span className="sr-only">{ready ? "(ready)" : "(review first)"}</span>
            </span>
            <ArrowRight className="size-3.5 text-[#94a3b8] rtl:-scale-x-100" aria-hidden="true" />
          </li>
        );
      })}
      <li>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-2/30 bg-secondary px-2.5 py-1.5 text-xs font-semibold text-brand">
          {concept.title} <span className="tabular-nums">{student.mastery[concept.id]}%</span>
        </span>
      </li>
    </ol>
  );
}
