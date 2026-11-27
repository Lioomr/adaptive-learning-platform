"use client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";
import { levelLabel, levelRange, type Level } from "./data";

/** One colour per mastery level, used by every view on this page. */
export const levelClass: Record<Level, string> = {
  low: "bg-danger-soft text-danger-ink",
  developing: "bg-warning-soft text-warning-ink",
  high: "bg-success-soft text-success-ink",
  none: "bg-muted text-muted-foreground",
};
export const levelFill: Record<Level, string> = { low: "var(--color-danger)", developing: "var(--color-warning)", high: "var(--color-success)", none: "var(--color-muted-foreground)" };
export const hatch = { backgroundImage: "repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, currentColor 18%, transparent) 4px 5px)" } as const;

export function Legend() {
  const { t } = useInstructor();
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label={t("Mastery scale", "مقياس الإتقان")}>
      {(["low", "developing", "high", "none"] as Level[]).map((l) => (
        <li key={l} className="flex items-center gap-1.5"><span className={cn("size-3.5 rounded-sm border", levelClass[l])} style={l === "none" ? hatch : undefined} aria-hidden="true" /><span className="font-medium text-foreground">{t(levelLabel[l])}</span> {t(levelRange[l])}</li>
      ))}
    </ul>
  );
}

export function LevelBadge({ level, value }: { level: Level; value?: number | null }) {
  const { t, num } = useInstructor();
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums", levelClass[level])} style={level === "none" ? hatch : undefined}>{value != null ? `${num(value)}%` : t(levelLabel[level])}</span>;
}

export function Section({ id, title, description, actions, children }: { id: string; title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id={`${id}-h`} className="text-xl font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}</div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tag, tone }: { label: string; value: React.ReactNode; note?: React.ReactNode; tag?: string; tone?: "danger" | "warning" | "success" }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="flex items-start justify-between gap-2"><span className="text-sm text-muted-foreground">{label}</span>{tag && <Badge tone="ai">{tag}</Badge>}</div>
      <span className={cn("text-3xl font-semibold tabular-nums", tone === "danger" && "text-danger", tone === "warning" && "text-warning-ink", tone === "success" && "text-success-ink")}>{value}</span>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </Card>
  );
}

/** Mastery split into the four levels as one stacked bar, with counts. */
export function DistBar({ dist, label }: { dist: Record<Level, number>; label: string }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  return (
    <div role="img" aria-label={label} className="flex h-3 w-full overflow-hidden rounded-full border bg-card">
      {(["low", "developing", "high", "none"] as Level[]).map((l) => dist[l] > 0 && <span key={l} className={levelClass[l]} style={{ width: `${(dist[l] / total) * 100}%`, ...(l === "none" ? hatch : {}) }} />)}
    </div>
  );
}

/** Small dependency-free line chart. Missing points (null) leave a gap rather than drawing zero. */
export function Trend({ values, labels, label, height = 96, className }: { values: (number | null)[]; labels?: [string, string]; label: string; height?: number; className?: string }) {
  const w = 320;
  const pts = values.map((v, i) => (v === null ? null : [(i / Math.max(1, values.length - 1)) * (w - 16) + 8, height - 10 - (v / 100) * (height - 20)] as const));
  const path = pts.reduce((d, p, i) => (p ? `${d}${pts[i - 1] ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}` : d), "");
  return (
    <figure className={className} dir="ltr">
      <svg viewBox={`0 0 ${w} ${height}`} role="img" aria-label={label} className="h-auto w-full text-primary">
        {[25, 50, 75].map((g) => <line key={g} x1="0" x2={w} y1={height - 10 - (g / 100) * (height - 20)} y2={height - 10 - (g / 100) * (height - 20)} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="3 3" />)}
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="currentColor"><title>{`${values[i]}%`}</title></circle>)}
      </svg>
      {labels && <figcaption className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{labels[0]}</span><span>{labels[1]}</span></figcaption>}
    </figure>
  );
}

export function Bars({ values, label, max, className, tone = "bg-primary" }: { values: number[]; label: string; max?: number; className?: string; tone?: string }) {
  const top = max ?? Math.max(1, ...values);
  return (
    <div role="img" aria-label={label} className={cn("flex h-14 items-end gap-1", className)} dir="ltr">
      {values.map((v, i) => <span key={i} title={String(v)} className={cn("min-w-1 flex-1 rounded-t-sm", tone)} style={{ height: `${Math.max(v > 0 ? 6 : 2, (v / top) * 100)}%`, opacity: v === 0 ? 0.25 : 1 }} />)}
    </div>
  );
}
