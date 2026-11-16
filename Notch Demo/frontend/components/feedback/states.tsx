import { AlertTriangle, Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Neutral empty state for lists and panels with nothing to show yet. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: { icon?: LucideIcon; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-8 text-center", className)}>
      <span className="grid size-10 place-items-center rounded-full bg-card text-muted-foreground shadow-card">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Inline error state. Announced to assistive technology via role="alert". */
export function ErrorState({ title = "Something went wrong", description, action, className }: { title?: string; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex gap-3 rounded-lg border border-danger/25 bg-danger-soft px-4 py-3 text-sm", className)}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-ink" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-danger-ink">{title}</p>
        {description ? <p className="mt-0.5 leading-6 text-[#7f1d1d]">{description}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
