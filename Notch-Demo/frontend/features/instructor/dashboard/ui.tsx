"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";
import type { Course } from "@/features/student/portal/data";

export type Level = "urgent" | "attention" | "clear";
export function Urgency({ level }: { level: Level }) {
  const { t } = useInstructor();
  const map = { urgent: ["danger", t("Urgent", "عاجل")], attention: ["warning", t("Needs attention", "يحتاج متابعة")], clear: ["success", t("All clear", "لا شيء معلّق")] } as const;
  return <Badge tone={map[level][0]}>{map[level][1]}</Badge>;
}
export const levelRing: Record<Level, string> = {
  urgent: "border-danger/40 shadow-[inset_4px_0_0_var(--color-danger)] rtl:shadow-[inset_-4px_0_0_var(--color-danger)]",
  attention: "border-warning/40 shadow-[inset_4px_0_0_var(--color-warning)] rtl:shadow-[inset_-4px_0_0_var(--color-warning)]",
  clear: "border-success/30 shadow-[inset_4px_0_0_var(--color-success)] rtl:shadow-[inset_-4px_0_0_var(--color-success)]",
};

/** Course label chip. Links to a filtered view when `href` is set. */
export function CourseTag({ course, count, href }: { course: Course; count?: number; href?: string }) {
  const { t, num } = useInstructor();
  const body = (
    <>
      <span className="font-medium">{course.code}</span>
      <span className="hidden text-muted-foreground 2xl:inline">{t(course.title)}</span>
      {count !== undefined && <strong className="tabular-nums">{num(count)}</strong>}
    </>
  );
  const cls = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-2.5 py-1 text-xs";
  return href ? <Link href={href} className={cn(cls, "outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring")}>{body}</Link> : <span className={cls}>{body}</span>;
}

export function CourseFilter({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts?: Record<string, number> }) {
  const { t, assigned, num } = useInstructor();
  const all = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
  const chip = (id: string, label: string, n?: number) => (
    <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={cn("min-h-9 rounded-full border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", value === id ? "border-primary bg-secondary font-semibold text-primary" : "bg-card text-muted-foreground hover:text-foreground")}>
      {label}{n !== undefined && <span className="ms-1.5 tabular-nums">{num(n)}</span>}
    </button>
  );
  return (
    <div role="group" aria-label={t("Filter by course", "تصفية حسب المقرر")} className="flex flex-wrap gap-2">
      {chip("all", t("All courses", "كل المقررات"), counts ? all : undefined)}
      {assigned.map((c) => chip(c.id, `${c.code} · ${t(c.title)}`, counts?.[c.id]))}
    </div>
  );
}

export function PageBack() {
  const { t } = useInstructor();
  return (
    <Button asChild variant="ghost" size="sm" className="-ms-2 mb-3 w-fit">
      <Link href="/instructor">← {t("Dashboard", "لوحة المعلومات")}</Link>
    </Button>
  );
}
