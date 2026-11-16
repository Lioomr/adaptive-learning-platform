import { cn } from '../lib/shadcn/utils'

const STATUS_STYLES: Record<string, string> = {
  committed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  auto_committed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  auto_approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  human_approved: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  human_approved_edge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  approved: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  queue: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  blocked: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  merged: 'bg-muted text-muted-foreground',
  superseded: 'bg-muted text-muted-foreground',
  complete: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  running: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        STATUS_STYLES[status] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const color = value >= 0.8 ? 'bg-emerald-500' : value >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{(value ?? 0).toFixed(2)}</span>
    </div>
  )
}

export function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  )
}

export const EDGE_TYPE_LABELS: Record<string, string> = {
  course_course_prereq: 'course → course',
  course_background_prereq: 'course → background',
  background_background_prereq: 'background → background',
}
