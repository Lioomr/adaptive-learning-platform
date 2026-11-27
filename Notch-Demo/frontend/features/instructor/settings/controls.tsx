"use client";
import { useId } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Accessible on/off switch. */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", checked ? "border-primary bg-primary" : "border-input bg-muted")}>
      <span aria-hidden="true" className={cn("size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-1 rtl:-translate-x-1")} />
    </button>
  );
}

/** One setting: label and explanation on one side, the control on the other. */
export function SettingRow({ label, description, children, locked, htmlFor, stack }: { label: string; description?: string; children: React.ReactNode; locked?: boolean; htmlFor?: string; stack?: boolean }) {
  const id = useId();
  return (
    <div className={cn("gap-3 py-4 first:pt-0 last:pb-0", stack ? "grid" : "flex flex-wrap items-start justify-between sm:flex-nowrap sm:gap-8")}>
      <div className="min-w-0 max-w-xl flex-1">
        <label htmlFor={htmlFor} id={id} className="flex items-center gap-1.5 text-sm font-medium">{label}{locked && <Lock className="size-3.5 text-muted-foreground" aria-hidden="true" />}</label>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className={cn("shrink-0", stack ? "w-full" : "sm:min-w-52")}>{children}</div>
    </div>
  );
}

export function Panel({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 divide-y">{children}</div>
    </Card>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warning"; children: React.ReactNode }) {
  return <p className={cn("rounded-lg p-3 text-sm", tone === "warning" ? "bg-warning-soft text-warning-ink" : "bg-secondary/50 text-muted-foreground")}>{children}</p>;
}
