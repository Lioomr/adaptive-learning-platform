"use client";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInstructor } from "./context";
import { courseStats } from "./stats";
import { courseHref } from "./data";
import {
  InstructorCourseCard,
  InstructorSwitcher,
  Metric,
  PageTitle,
  SectionTitle,
} from "./ui";

const tools: { href: string; en: string; ar: string; id: string }[] = [
  { href: "/instructor/dashboard", en: "Weekly dashboard", ar: "لوحة الأسبوع", id: "IN8–9" },
  { href: "/instructor/at-risk", en: "At-risk students", ar: "الطلاب المعرّضون للتعثر", id: "IN13" },
  { href: "/instructor/materials", en: "Upload materials", ar: "رفع المواد", id: "IN2" },
  { href: "/instructor/tutor-audit", en: "Tutor audit", ar: "مراجعة المساعد", id: "IN15" },
  { href: "/instructor/report", en: "Course report", ar: "تقرير المقرر", id: "IN18–19" },
];

export function InstructorHome() {
  const { t, assigned, instructor, content, students, num } = useInstructor();
  const all = assigned.map((c) => ({
    course: c,
    stats: courseStats(c, students, content),
  }));
  const toGrade = all.reduce((s, x) => s + x.stats.toGrade, 0);
  const atRisk = all.reduce((s, x) => s + x.stats.counts["at-risk"], 0);
  const learners = all.reduce((s, x) => s + x.stats.rows.length, 0);
  const next = all.find((x) => x.stats.toGrade > 0);
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle
        eyebrow={t("INSTRUCTOR HOME", "الرئيسية")}
        title={t(`Welcome back, ${t(instructor.name)}.`, `أهلًا بعودتك، ${t(instructor.name)}.`)}
        description={t(
          "A calm place to see what needs you today and keep every class moving.",
          "مكان هادئ لمعرفة ما يحتاج إلى اهتمامك اليوم وإبقاء كل صف في تقدم.",
        )}
        action={<InstructorSwitcher />}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label={t("Courses", "المقررات")}
          value={num(assigned.length)}
          detail={t("Assigned to you", "مسندة إليك")}
        />
        <Metric
          label={t("Student enrollments", "تسجيلات الطلاب")}
          value={num(learners)}
          detail={t("Across your courses", "عبر مقرراتك")}
          icon={Users}
        />
        <Metric
          label={t("To grade", "بانتظار التقييم")}
          value={num(toGrade)}
          detail={t("Submitted, not yet graded", "مُسلَّمة ولم تُقيَّم")}
          icon={ClipboardCheck}
        />
        <Metric
          label={t("At risk", "معرّضون للتعثر")}
          value={num(atRisk)}
          detail={t("Low mastery or inactive", "إتقان منخفض أو غير نشطين")}
          icon={AlertTriangle}
        />
      </div>
      {next && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-secondary/50 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("Next best step", "الخطوة التالية")}
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {t(
                `${num(next.stats.toGrade)} submissions are waiting in ${t(next.course.title)}`,
                `${num(next.stats.toGrade)} تسليمًا بانتظارك في ${t(next.course.title)}`,
              )}
            </h2>
          </div>
          <Button asChild>
            <Link href={courseHref(next.course.id, "submissions")}>
              {t("Review submissions", "مراجعة التسليمات")}
              <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </Button>
        </Card>
      )}
      <section>
        <SectionTitle title={t("Your courses", "مقرراتك")} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {assigned.map((c) => (
            <InstructorCourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
      <section>
        <SectionTitle
          title={t("Analytics & approvals", "التحليلات والاعتمادات")}
          description={t(
            "The existing instructor tools remain available.",
            "أدوات المدرّس الحالية ما زالت متاحة.",
          )}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="block font-medium">{t(x.en, x.ar)}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">{x.id}</span>
              </span>
              <ArrowRight className="size-4 text-primary rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
