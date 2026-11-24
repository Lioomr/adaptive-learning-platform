"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  assignments,
  courses,
  courseHref,
  events,
  recentActivity,
} from "./data";
import { useStudent } from "./context";
import { CourseIcon, Metric, PageTitle, SectionTitle } from "./ui";

export function StudentDashboard() {
  const { t, date, profile } = useStudent();
  const [month, setMonth] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);
  const pending = assignments.filter(
    (a) => a.status === "pending" && !profile.submissions[a.id],
  );
  const monthDate = new Date(Date.UTC(2026, month, 1));
  const year = monthDate.getUTCFullYear();
  const monthIndex = monthDate.getUTCMonth();
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const schedule = events.filter((e) =>
    selected ? e.start.startsWith(selected) : e.start.startsWith(prefix),
  );
  const dueOnDate = assignments.filter(
    (a) => selected && a.due.startsWith(selected),
  );
  const weekdays = [
    ["Mon", "ن"],
    ["Tue", "ث"],
    ["Wed", "ر"],
    ["Thu", "خ"],
    ["Fri", "ج"],
    ["Sat", "س"],
    ["Sun", "ح"],
  ];
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle
        eyebrow={t("THE WEEK AHEAD", "الأسبوع القادم")}
        title={t("A clear head starts here.", "نظّم يومك وصفّ ذهنك.")}
        description={t(
          "Your deadlines, classes, and responsibilities—all in one place.",
          "مواعيدك ومحاضراتك ومسؤولياتك، كلها في مكان واحد.",
        )}
        action={
          <Badge tone="outline">
            <CalendarDays aria-hidden="true" />
            {t(
              "Demo calendar · 24 Nov 2026 · Cairo",
              "تقويم تجريبي · ٢٤ نوفمبر ٢٠٢٦ · القاهرة",
            )}
          </Badge>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label={t("Pending submissions", "تسليمات معلقة")}
          value={String(pending.length)}
          detail={t("Across your five courses", "في مقرراتك الخمسة")}
          icon={FileText}
        />
        <Metric
          label={t("Due this week", "تستحق هذا الأسبوع")}
          value={String(
            pending.filter((a) => a.due.slice(0, 10) <= "2026-11-29").length,
          )}
          detail={t("By Sunday, 29 November", "حتى الأحد ٢٩ نوفمبر")}
          icon={Clock3}
        />
        <Metric
          label={t("Upcoming assessments", "تقييمات قادمة")}
          value="2"
          detail={t("One quiz and one exam", "اختبار قصير وامتحان")}
          icon={CheckCircle2}
        />
        <Metric
          label={t("Classes this week", "حصص هذا الأسبوع")}
          value="3"
          detail={t("Two lectures and one lab", "محاضرتان ومعمل")}
          icon={CalendarDays}
        />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            title={t("Upcoming assignments", "الواجبات القادمة")}
            description={t(
              "Start with what needs your attention first.",
              "ابدأ بما يحتاج اهتمامك أولًا.",
            )}
          />
          <Card className="divide-y">
            {assignments
              .filter((a) => a.weight === 20)
              .map((a) => {
                const course = courses.find((c) => c.id === a.courseId)!;
                const sent =
                  !!profile.submissions[a.id] || a.status === "submitted";
                return (
                  <Link
                    key={a.id}
                    href={courseHref(a.courseId, "submissions")}
                    className="flex flex-wrap items-center gap-3 p-5 transition-colors hover:bg-muted/50"
                  >
                    <CourseIcon course={course} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{t(a.title)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(course.title)} · {date(a.due)} ·{" "}
                        {date(a.due, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge
                      tone={
                        sent
                          ? "success"
                          : a.priority === "high"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {sent
                        ? t("Submitted", "تم التسليم")
                        : a.priority === "high"
                          ? t("High priority", "أولوية عالية")
                          : t("To do", "للتنفيذ")}
                    </Badge>
                  </Link>
                );
              })}
          </Card>
        </section>
        <section>
          <SectionTitle title={t("Academic calendar", "التقويم الأكاديمي")} />
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("Previous month", "الشهر السابق")}
                onClick={() => {
                  setMonth((m) => m - 1);
                  setSelected(null);
                }}
              >
                <ChevronLeft className="rtl:rotate-180" />
              </Button>
              <h3 className="font-semibold">
                {date(monthDate.toISOString(), {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("Next month", "الشهر التالي")}
                onClick={() => {
                  setMonth((m) => m + 1);
                  setSelected(null);
                }}
              >
                <ChevronRight className="rtl:rotate-180" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((d) => (
                <span key={d[0]} className="pb-2 text-xs text-muted-foreground">
                  {t(d[0], d[1])}
                </span>
              ))}
              {Array.from(
                { length: (monthDate.getUTCDay() + 6) % 7 },
                (_, i) => (
                  <span key={`blank${i}`} />
                ),
              )}
              {Array.from({ length: days }, (_, i) => {
                const value = `${prefix}-${String(i + 1).padStart(2, "0")}`;
                const hasEvent =
                  events.some((e) => e.start.startsWith(value)) ||
                  assignments.some((a) => a.due.startsWith(value));
                return (
                  <button
                    key={value}
                    aria-label={`${date(`${value}T12:00:00+02:00`, { day: "numeric", month: "long" })}${hasEvent ? t(", has events", "، توجد أحداث") : ""}`}
                    aria-pressed={selected === value}
                    onClick={() =>
                      setSelected(selected === value ? null : value)
                    }
                    className={`relative min-h-10 rounded-lg text-sm transition-colors ${selected === value ? "bg-primary text-primary-foreground" : value === "2026-11-24" ? "bg-secondary font-bold text-primary" : "hover:bg-muted"}`}
                  >
                    {i + 1}
                    {hasEvent && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 start-1/2 size-1 -translate-x-1/2 rounded-full bg-current"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {t(
                "Dots mark deadlines or classes. Select a day to see details.",
                "تشير النقاط إلى المواعيد والمحاضرات. اختر يومًا لعرض التفاصيل.",
              )}
            </p>
          </Card>
        </section>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle
            title={
              selected
                ? date(`${selected}T12:00:00+02:00`, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : t(
                    "Lectures, labs & assessments",
                    "المحاضرات والمعامل والتقييمات",
                  )
            }
            description={t(
              "All times are in Cairo time (EET).",
              "جميع الأوقات بتوقيت القاهرة.",
            )}
          >
            {selected && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(null)}
              >
                {t("Show month", "عرض الشهر")}
              </Button>
            )}
          </SectionTitle>
          <Card className="divide-y">
            {schedule.map((e) => (
              <div key={e.id} className="flex items-start gap-4 p-5">
                <span className="flex min-w-14 flex-col items-center rounded-lg bg-muted px-2 py-2">
                  <strong className="text-xl">
                    {date(e.start, { day: "numeric" })}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {date(e.start, { month: "short" })}
                  </span>
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{t(e.title)}</h3>
                    <Badge tone="brand">{t(e.kind)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {date(e.start, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                    {t(e.location)}
                  </p>
                  <Link
                    className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    href={courseHref(
                      e.courseId,
                      e.kind[0] === "Lab"
                        ? "labs"
                        : e.kind[0] === "Lecture"
                          ? "lectures"
                          : "submissions",
                    )}
                  >
                    {t(courses.find((c) => c.id === e.courseId)!.title)}
                  </Link>
                </div>
              </div>
            ))}
            {dueOnDate.map((a) => (
              <Link
                key={a.id}
                href={courseHref(a.courseId, "submissions")}
                className="block p-5 hover:bg-muted"
              >
                <Badge tone="warning">{t("Deadline", "موعد التسليم")}</Badge>
                <p className="mt-2 font-semibold">{t(a.title)}</p>
                <p className="text-sm text-muted-foreground">
                  {date(a.due, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </Link>
            ))}
            {!schedule.length && !dueOnDate.length && (
              <p className="p-6 text-sm text-muted-foreground">
                {t(
                  "No scheduled responsibilities here. A little breathing room for independent study.",
                  "لا توجد مسؤوليات مجدولة هنا. فرصة للدراسة المستقلة.",
                )}
              </p>
            )}
          </Card>
        </section>
        <section>
          <SectionTitle
            title={t("Recent academic activity", "النشاط الأكاديمي الأخير")}
          />
          <Card className="space-y-5 p-5">
            {Object.keys(profile.submissions).map((id) => (
              <div key={id} className="flex gap-3">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium">
                    {t("Submission saved", "تم حفظ التسليم")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(assignments.find((a) => a.id === id)!.title)}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.map((a) => (
              <div key={a.title[0]} className="flex gap-3">
                <CheckCircle2
                  className="mt-1 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{t(a.title)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(a.detail)}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
