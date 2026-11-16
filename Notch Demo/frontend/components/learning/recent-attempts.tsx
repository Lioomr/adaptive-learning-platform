import { ArrowRight, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { MasteryBadge } from "@/components/learning/mastery";
import { findConcept, findCourse } from "@/data/fixtures";
import { formatTime } from "@/services/insights";
import type { Attempt, Student } from "@/types";

/** Shared attempt feed. The same records appear in every portal. */
export function RecentAttempts({ attempts, students, showStudent = false, showCourse = false, limit = 5, emptyText = "No assessment attempts yet. Progress starts from the fictional baseline." }: { attempts: Attempt[]; students?: Student[]; showStudent?: boolean; showCourse?: boolean; limit?: number; emptyText?: string }) {
  if (!attempts.length) return <EmptyState icon={ClipboardList} title="No attempts yet" description={emptyText} />;
  return (
    <ul className="divide-y divide-border" role="list">
      {attempts.slice(0, limit).map(a => {
        const who = students?.find(s => s.id === a.studentId)?.name;
        const concept = findConcept(a.conceptId)?.title ?? a.conceptId;
        const delta = a.mastery - a.previous;
        return (
          <li key={a.submissionId} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink">
              <ClipboardList className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {showStudent && who ? `${who} · ` : null}
                {concept}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {showCourse ? `${findCourse(a.courseId)?.shortTitle} · ` : null}
                Score {a.score}% · <time dateTime={a.createdAt}>{formatTime(a.createdAt)}</time>
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-foreground">
                <span className="tabular-nums text-muted-foreground">{a.previous}%</span>
                <ArrowRight className="size-3 text-[#94a3b8] rtl:-scale-x-100" aria-hidden="true" />
                <span className="tabular-nums">{a.mastery}%</span>
                <span className={delta >= 0 ? "text-success-ink" : "text-danger-ink"}>
                  ({delta >= 0 ? "+" : ""}
                  {delta})
                </span>
                <MasteryBadge value={a.mastery} className="ms-1 py-0 text-[11px]" />
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
