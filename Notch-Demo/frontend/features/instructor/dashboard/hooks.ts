"use client";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInstructor } from "@/features/instructor/portal/context";
import { studentCompletion, studentMastery } from "@/features/instructor/portal/data";
import { assess, NOW, type Category, type Copy, type CourseId, type Risk } from "./data";
import { useDash } from "./store";

export type PendingItem = { id: string; courseId: CourseId; category: Category; title: Copy; detail: Copy; ageDays: number };

/** Everything the dashboard shows, derived from the store and the live roster. */
export function useOverview() {
  const { assigned, students, t, language, num, date, instructor } = useInstructor();
  const d = useDash();
  const ids = useMemo(() => new Set<CourseId>(assigned.map((c) => c.id)), [assigned]);
  const pending = useMemo<PendingItem[]>(
    () => [
      ...d.approvals.filter((a) => a.status === "pending" && ids.has(a.courseId)).map((a) => ({ id: a.id, courseId: a.courseId, category: a.category, title: a.title, detail: a.detail, ageDays: a.ageDays })),
      ...d.oob.filter((x) => x.reason === "uncertain" && x.status === "open" && ids.has(x.courseId)).map((x) => ({ id: x.id, courseId: x.courseId, category: "tutor" as const, title: x.question, detail: x.response, ageDays: 1 })),
    ],
    [d.approvals, d.oob, ids],
  );
  const risks = useMemo<Risk[]>(
    () => assigned.flatMap((c) => students.map((s) => assess(c, s)).filter((r): r is Risk => !!r)),
    [assigned, students],
  );
  const openRisks = risks.filter((r) => !d.contacted.includes(r.id));
  const issues = d.issues.filter((i) => !i.resolved && ids.has(i.courseId));
  const oob = d.oob.filter((x) => x.status === "open" && ids.has(x.courseId));
  const events = d.events.filter((e) => ids.has(e.courseId) && e.date >= NOW).sort((a, b) => a.date.localeCompare(b.date));
  const activity = d.activity.filter((a) => ids.has(a.courseId));
  const perCourse = assigned.map((c) => {
    const masteries = students.map((s) => studentMastery(c, s));
    const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
    return {
      course: c,
      enrolled: students.length,
      active: students.filter((s) => s.lastActiveDays <= 3).length,
      progress: mean(students.map((s, i) => studentCompletion(c.id, s, masteries[i]))),
      mastery: mean(masteries),
      pending: pending.filter((p) => p.courseId === c.id).length,
      atRisk: openRisks.filter((r) => r.course.id === c.id).length,
      issues: issues.filter((i) => i.courseId === c.id).length,
      oob: oob.filter((x) => x.courseId === c.id).length,
    };
  });
  const horizon = new Date(new Date(NOW).getTime() + 14 * 86400000).toISOString();
  return { instructor, t, language, num, date, assigned, students, pending, risks, openRisks, issues, oob, events, activity, perCourse, activeAssessments: events.filter((e) => e.kind !== "lecture" && e.date <= horizon), data: d };
}

/** Relative time against the fixed demo clock. */
export function useAgo() {
  const { t, num } = useInstructor();
  return (iso: string) => {
    const m = Math.max(0, Math.round((new Date(NOW).getTime() - new Date(iso).getTime()) / 60000));
    if (m < 2) return t("Just now", "الآن");
    if (m < 60) return t(`${m} minutes ago`, `قبل ${num(m)} دقيقة`);
    const h = Math.round(m / 60);
    return h < 24 ? t(`${h} hours ago`, `قبل ${num(h)} ساعة`) : t(`${Math.round(h / 24)} days ago`, `قبل ${num(Math.round(h / 24))} يومًا`);
  };
}

/** URL-backed filter value, so dashboard links can open a page already filtered. */
export function useParam(key: string, fallback = "all") {
  const sp = useSearchParams();
  const router = useRouter();
  const value = sp.get(key) ?? fallback;
  const set = (v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v === fallback) p.delete(key);
    else p.set(key, v);
    const q = p.toString();
    router.replace(q ? `?${q}` : "?", { scroll: false });
  };
  return [value, set] as const;
}
