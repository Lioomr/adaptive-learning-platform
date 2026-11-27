"use client";
import Link from "next/link";
import { ShieldAlert, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CourseIcon } from "@/features/student/portal/ui";
import type { Course } from "@/features/student/portal/data";
import { courseHref, instructorAccounts, type Health } from "./data";
import { useInstructor } from "./context";
import { useInstructorPortal } from "./store";
import { courseStats } from "./stats";
import { NativeSelect } from "./forms";

export {
  PageTitle,
  SectionTitle,
  Metric,
  CourseIcon,
} from "@/features/student/portal/ui";

const bar = {
  violet: "bg-primary",
  blue: "bg-info",
  mint: "bg-success",
  amber: "bg-warning",
  rose: "bg-danger",
};
export const healthTone: Record<Health, "success" | "warning" | "danger"> = {
  "on-track": "success",
  attention: "warning",
  "at-risk": "danger",
};

export function useHealthLabel() {
  const { t } = useInstructor();
  return (h: Health) =>
    ({
      "on-track": t("On track", "على المسار الصحيح"),
      attention: t("Needs attention", "يحتاج متابعة"),
      "at-risk": t("At risk", "معرّض للتعثر"),
    })[h];
}

/** Demo-only: pick which fictional instructor is signed in. Assignments come from the Admin mock. */
export function InstructorSwitcher() {
  const { t, instructor } = useInstructor();
  const setInstructor = useInstructorPortal((s) => s.setInstructor);
  return (
    <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
      <UserRound className="size-4 text-primary" aria-hidden="true" />
      <span className="whitespace-nowrap text-muted-foreground">
        {t("Demo: signed in as", "عرض تجريبي: الدخول باسم")}
      </span>
      <NativeSelect
        aria-label={t("Choose a fictional instructor", "اختر مدرّسًا افتراضيًا")}
        className="h-9 w-auto min-w-44 border-0 bg-transparent px-1 font-medium"
        value={instructor.id}
        onChange={(e) => setInstructor(e.target.value)}
      >
        {instructorAccounts.map((i) => (
          <option key={i.id} value={i.id}>
            {t(i.name)}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

export function InstructorCourseCard({ course }: { course: Course }) {
  const { t, num, content, students, ready } = useInstructor();
  const stats = courseStats(course, students, content);
  return (
    <Link
      href={courseHref(course.id)}
      className="group block h-full rounded-xl outline-none transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-primary/50">
        <div className={cn("h-1", bar[course.tone])} />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <CourseIcon course={course} />
            <span
              className="text-xs font-medium text-muted-foreground"
              dir="ltr"
            >
              {course.code}
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
            {t(course.title)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {num(stats.rows.length)} {t("students enrolled", "طلاب مسجلون")} ·{" "}
            {num(course.lectures.length)} {t("lectures", "محاضرات")} ·{" "}
            {num(course.labs.length)} {t("labs", "معامل")}
          </p>
          <p className="mb-4 mt-3 text-sm leading-6 text-muted-foreground">
            {t(course.description)}
          </p>
          <div className="mt-auto pt-5" aria-busy={!ready}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t("Average completion", "متوسط الإكمال")}
              </span>
              <strong>{num(stats.avgCompletion)}%</strong>
            </div>
            <Progress
              value={stats.avgCompletion}
              aria-label={t("Average completion", "متوسط الإكمال")}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {stats.toGrade > 0 && (
                <Badge tone="warning">
                  {num(stats.toGrade)} {t("to grade", "بانتظار التقييم")}
                </Badge>
              )}
              {stats.counts["at-risk"] > 0 && (
                <Badge tone="danger">
                  {num(stats.counts["at-risk"])} {t("at risk", "معرّضون للتعثر")}
                </Badge>
              )}
              {stats.toGrade === 0 && stats.counts["at-risk"] === 0 && (
                <Badge tone="success">{t("All clear", "كل شيء على ما يرام")}</Badge>
              )}
            </div>
            <span className="text-sm font-semibold text-primary">
              {t("Manage course", "إدارة المقرر")}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/** Shown when an instructor opens a course the Admin has not assigned to them. */
export function AccessDenied({ course }: { course: Course }) {
  const { t, instructor } = useInstructor();
  return (
    <div className="mx-auto max-w-xl animate-fade-in rounded-2xl border bg-card p-10 text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-xl bg-danger-soft text-danger">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("This course is not assigned to you", "هذا المقرر غير مسند إليك")}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        {t(
          `${t(course.title)} is managed by another instructor. Ask an Admin if you need access. You are signed in as ${t(instructor.name)}.`,
          `${t(course.title)} يديره مدرّس آخر. اطلب من المسؤول منحك الصلاحية إن لزم. أنت مسجّل الدخول باسم ${t(instructor.name)}.`,
        )}
      </p>
      <Button asChild className="mt-6">
        <Link href="/instructor/courses">
          {t("Back to my courses", "العودة إلى مقرراتي")}
        </Link>
      </Button>
    </div>
  );
}
