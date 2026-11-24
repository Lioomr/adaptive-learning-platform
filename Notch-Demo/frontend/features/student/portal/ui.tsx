"use client";
import Link from "next/link";
import {
  Binary,
  BookOpen,
  BrainCircuit,
  Calculator,
  Code2,
  Flame,
  GraduationCap,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  courseConcepts,
  courseHref,
  courses,
  mastery,
  type Course,
} from "./data";
import { useStudent } from "./context";

const icons: Record<Course["id"], LucideIcon> = {
  mathematics: Calculator,
  english: BookOpen,
  python: Code2,
  algorithms: Binary,
  ai: BrainCircuit,
};
export const tones = {
  violet: "bg-secondary text-secondary-foreground",
  blue: "bg-info-soft text-info",
  mint: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  rose: "bg-danger-soft text-danger",
};
export function CourseIcon({
  course,
  large = false,
}: {
  course: Course;
  large?: boolean;
}) {
  const Icon = icons[course.id];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        large ? "size-14" : "size-11",
        tones[course.tone],
      )}
    >
      <Icon className={large ? "size-7" : "size-5"} aria-hidden="true" />
    </span>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function SectionTitle({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon: Icon = Target,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}
export function MasteryMetrics({ course }: { course?: Course }) {
  const { t, student } = useStudent();
  const selected = course ? [course] : courses;
  const concepts = selected.flatMap((c) => courseConcepts(c, student));
  const avg = Math.round(
    concepts.reduce((sum, c) => sum + c.mastery, 0) / concepts.length,
  );
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric
        label={t("Overall Mastery", "الإتقان العام")}
        value={`${avg}%`}
        detail={t("Estimated from concept mastery", "تقدير من إتقان المفاهيم")}
      />
      <Metric
        label={t("Concepts Mastered", "مفاهيم متقنة")}
        value={`${concepts.filter((c) => c.mastery >= 80).length}/${concepts.length}`}
        detail={t("At least 80% mastery", "إتقان بنسبة ٨٠٪ على الأقل")}
        icon={GraduationCap}
      />
      <Metric
        label={t("Needs Practice", "تحتاج تدريبًا")}
        value={String(concepts.filter((c) => c.mastery < 70).length)}
        detail={t(
          "A little focus goes a long way",
          "قليل من التركيز يصنع فارقًا",
        )}
        icon={BookOpen}
      />
      <Metric
        label={t("Learning Streak", "تتابع التعلم")}
        value={t("7 days", "٧ أيام")}
        detail={t(
          "Sample activity · keep it going",
          "نشاط تجريبي · واصل التعلم",
        )}
        icon={Flame}
      />
    </div>
  );
}
export function completion(course: Course, completed: string[]) {
  const items = [...course.lectures, ...course.labs];
  return Math.round(
    (items.filter((l) => l.done || completed.includes(l.id)).length /
      items.length) *
      100,
  );
}
export function CourseCard({
  course,
  insights = false,
}: {
  course: Course;
  insights?: boolean;
}) {
  const { t, student, profile } = useStudent();
  const concepts = courseConcepts(course, student);
  const strong = concepts.reduce((a, b) => (a.mastery > b.mastery ? a : b));
  const weak = concepts.reduce((a, b) => (a.mastery < b.mastery ? a : b));
  const percent = insights
    ? mastery(course, student)
    : completion(course, profile.completed);
  return (
    <Link
      href={courseHref(course.id)}
      className="group block h-full rounded-xl outline-none transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-colors group-hover:border-primary/50">
        <div
          className={cn(
            "h-1",
            {
              violet: "bg-primary",
              blue: "bg-info",
              mint: "bg-success",
              amber: "bg-warning",
              rose: "bg-danger",
            }[course.tone],
          )}
        />
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
            {t(course.instructor)}
          </p>
          {!insights && (
            <p className="mb-4 mt-3 text-sm leading-6 text-muted-foreground">
              {t(course.description)}
            </p>
          )}
          <div className="mt-auto pt-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t(
                  insights ? "Course mastery" : "Course completion",
                  insights ? "إتقان المقرر" : "إكمال المقرر",
                )}
              </span>
              <strong>{percent}%</strong>
            </div>
            <Progress
              value={percent}
              aria-label={t(
                insights ? "Course mastery" : "Course completion",
                insights ? "إتقان المقرر" : "إكمال المقرر",
              )}
            />
          </div>
          {insights && (
            <div className="mt-5 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">
                  {t("Strong: ", "نقطة قوة: ")}
                </span>
                {t(strong.title)}
              </p>
              <p>
                <span className="text-muted-foreground">
                  {t("Focus: ", "مجال التركيز: ")}
                </span>
                {t(weak.title)}
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Badge tone={percent >= 80 ? "success" : "brand"}>
              {t(
                percent >= 80 ? "On track" : "In progress",
                percent >= 80 ? "على المسار الصحيح" : "قيد التقدم",
              )}
            </Badge>
            <span className="text-sm font-semibold text-primary">
              {t("Open course", "فتح المقرر")}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
export function Recommendation({
  course,
  featured = false,
}: {
  course: Course;
  featured?: boolean;
}) {
  const { t } = useStudent();
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl p-5",
        featured
          ? "border border-primary/20 bg-secondary/50"
          : "border bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        <CourseIcon course={course} />
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t(course.title)}
          </p>
          <h3 className="mt-1 font-semibold">{t(course.recommendation)}</h3>
        </div>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">
        {t(course.recommendationReason)}
      </p>
      <Button
        asChild
        variant={featured ? "default" : "outline"}
        className="mt-auto w-fit"
      >
        <Link href={courseHref(course.id, "lectures")}>
          {t("Continue learning", "متابعة التعلم")}
        </Link>
      </Button>
    </div>
  );
}
