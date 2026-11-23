import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Accent = "brand" | "progress" | "success" | "warning" | "danger" | "ai";
const accentClass: Record<Accent, string> = {
  brand: "bg-secondary text-brand-2",
  progress: "bg-progress-soft text-progress-ink",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
  ai: "bg-ai-soft text-ai-ink",
};

/** KPI tile: label, large value, supporting hint and optional footer (e.g. a progress bar). */
export function StatCard({ label, value, unit, hint, icon: Icon, accent = "brand", footer, className }: { label: string; value: React.ReactNode; unit?: string; hint?: React.ReactNode; icon?: LucideIcon; accent?: Accent; footer?: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("flex min-h-[132px] flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", accentClass[accent])}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {value}
        {unit ? <span className="ms-0.5 text-base font-medium text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <div className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</div> : null}
      {footer ? <div className="mt-auto pt-3">{footer}</div> : null}
    </Card>
  );
}
