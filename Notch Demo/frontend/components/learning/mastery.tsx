import { CheckCircle2, CircleAlert, CircleDot, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { MASTERY_BANDS, masteryBand, type Tone } from "@/services/mastery";

const bandIcon = { danger: CircleAlert, warning: CircleDot, progress: TrendingUp, success: CheckCircle2 } as const;

export const toneText: Record<Tone, string> = { danger: "text-danger-ink", warning: "text-warning-ink", progress: "text-progress-ink", success: "text-success-ink" };
export const toneFill: Record<Tone, string> = { danger: "bg-danger", warning: "bg-warning", progress: "bg-progress", success: "bg-success" };
export const toneColor: Record<Tone, string> = {
  danger: "var(--danger)",
  warning: "var(--warning)",
  progress: "var(--progress)",
  success: "var(--success)",
};

/** Mastery band label with an icon so meaning never relies on colour alone. */
export function MasteryBadge({ value, showValue = false, className }: { value: number; showValue?: boolean; className?: string }) {
  const band = masteryBand(value);
  const Icon = bandIcon[band.tone];
  return (
    <Badge tone={band.tone} className={className}>
      <Icon aria-hidden="true" />
      {showValue ? `${value}% · ` : null}
      {band.band}
    </Badge>
  );
}

/** Bar coloured by band. */
export function MasteryBar({ value, label, className }: { value: number; label: string; className?: string }) {
  return <Progress value={value} tone={masteryBand(value).tone} aria-label={label} className={className} />;
}

/** Compact legend of the approved bands. */
export function MasteryLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground", className)} aria-label="Mastery bands">
      {MASTERY_BANDS.map(b => (
        <li key={b.band} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("size-2 rounded-full", toneFill[b.tone])} />
          <span>
            <span className="font-medium text-foreground">{b.band}</span> {b.min}–{b.max}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Circular mastery indicator for overview cards. */
export function MasteryRing({ value, size = 96, label }: { value: number; size?: number; label: string }) {
  const band = masteryBand(value);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${value}%, ${band.band}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={toneColor[band.tone]} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700" />
      </svg>
      <span className="absolute text-center">
        <span className="block text-2xl font-semibold tracking-tight tabular-nums">
          {value}
          <span className="text-sm font-medium text-muted-foreground">%</span>
        </span>
      </span>
    </div>
  );
}
