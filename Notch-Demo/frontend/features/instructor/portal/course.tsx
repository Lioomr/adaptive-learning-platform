"use client";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courses, sectionLabels, type Section } from "@/features/student/portal/data";
import { courseHref, type CourseId } from "./data";
import { useInstructor } from "./context";
import { AccessDenied, CourseIcon } from "./ui";
import { courseStats } from "./stats";
import { CourseProgress } from "./progress";
import { CourseAnnouncements } from "./announcements";
import { LessonManager } from "./lessons";
import { Submissions } from "./submissions";
import { Gradebook } from "./grades";
import { Materials } from "./materials";

export function InstructorCourse({
  id,
  section,
}: {
  id: CourseId;
  section: Section;
}) {
  const { t, language, can, content, students, ready, num } = useInstructor();
  const course = courses.find((c) => c.id === id)!;
  // Role-based access: an unassigned course renders nothing but the denial.
  if (!can(id)) return <AccessDenied course={course} />;
  const stats = courseStats(course, students, content);
  const more: Section[] = ["submissions", "grades", "materials"];
  return (
    <div className="space-y-7 animate-fade-in">
      <Link
        href="/instructor/courses"
        className="inline-block text-sm font-medium text-muted-foreground hover:text-primary"
      >
        {t("Courses", "المقررات")} /{" "}
        <span className="text-foreground">{t(course.title)}</span>
      </Link>
      <header className="flex flex-wrap items-center gap-5">
        <CourseIcon course={course} large />
        <div className="min-w-0 flex-1">
          <p
            className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground"
            dir="ltr"
          >
            {course.code} · FALL 2026
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t(course.title)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {num(stats.rows.length)} {t("students enrolled", "طلاب مسجلون")} ·{" "}
            {t("Instructor view", "عرض المدرّس")}
          </p>
        </div>
        <Badge tone="brand">
          {num(stats.avgCompletion)}% {t("avg. completion", "متوسط الإكمال")}
        </Badge>
      </header>
      <nav
        aria-label={t("Course navigation", "التنقل في المقرر")}
        className="flex flex-wrap items-center gap-1 border-b pb-1"
      >
        {(["progress", "announcements", "lectures", "labs"] as Section[]).map(
          (s) => (
            <Link
              key={s}
              href={courseHref(id, s)}
              aria-current={section === s ? "page" : undefined}
              className={`rounded-t-lg border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${section === s ? "border-primary bg-secondary/50 text-primary" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {t(sectionLabels[s])}
            </Link>
          ),
        )}
        <DropdownMenu.Root dir={language === "ar" ? "rtl" : "ltr"}>
          <DropdownMenu.Trigger asChild>
            <Button
              variant="ghost"
              className={
                more.includes(section) ? "bg-secondary text-primary" : ""
              }
            >
              <MoreHorizontal aria-hidden="true" />
              {more.includes(section)
                ? t(sectionLabels[section])
                : t("More", "المزيد")}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-40 min-w-48 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-raised"
            >
              {more.map((s) => (
                <DropdownMenu.Item key={s} asChild>
                  <Link
                    href={courseHref(id, s)}
                    aria-current={section === s ? "page" : undefined}
                    className="block rounded-lg px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-secondary data-[highlighted]:text-primary"
                  >
                    {t(sectionLabels[s])}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </nav>
      {!ready ? (
        <div
          className="h-64 animate-pulse rounded-xl bg-muted"
          aria-label={t("Loading course", "جارٍ تحميل المقرر")}
        />
      ) : (
        <>
          {section === "progress" && <CourseProgress course={course} />}
          {section === "announcements" && <CourseAnnouncements course={course} />}
          {(section === "lectures" || section === "labs") && (
            <LessonManager
              key={section}
              course={course}
              kind={section === "lectures" ? "lecture" : "lab"}
            />
          )}
          {section === "submissions" && <Submissions course={course} />}
          {section === "grades" && <Gradebook course={course} />}
          {section === "materials" && <Materials course={course} />}
        </>
      )}
    </div>
  );
}
