"use client";
import { useState } from "react";
import { AlertTriangle, BookOpen, GraduationCap, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  courseConcepts,
  type Course,
} from "@/features/student/portal/data";
import type { Health } from "./data";
import { useInstructor } from "./context";
import { courseStats } from "./stats";
import { healthTone, Metric, SectionTitle, useHealthLabel } from "./ui";
import { NativeSelect } from "./forms";

export function CourseProgress({ course }: { course: Course }) {
  const { t, num, content, students } = useInstructor();
  const label = useHealthLabel();
  const stats = courseStats(course, students, content);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Health | "all">("all");
  const rows = stats.rows
    .filter(
      (r) =>
        (filter === "all" || r.health === filter) &&
        r.student.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.mastery - b.mastery);
  // Class-wide concept mastery: the mean across the roster for each concept.
  const concepts = courseConcepts(course, students[0]).map((c) => ({
    ...c,
    mastery: Math.round(
      students.reduce(
        (sum, s) =>
          sum + (courseConcepts(course, s).find((x) => x.id === c.id)?.mastery ?? 0),
        0,
      ) / students.length,
    ),
  }));
  const total = stats.rows.length || 1;
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label={t("Students", "الطلاب")}
          value={num(stats.rows.length)}
          detail={t("Enrolled this term", "مسجلون هذا الفصل")}
          icon={Users}
        />
        <Metric
          label={t("Avg. completion", "متوسط الإكمال")}
          value={`${num(stats.avgCompletion)}%`}
          detail={t("Lectures and labs", "المحاضرات والمعامل")}
          icon={BookOpen}
        />
        <Metric
          label={t("Avg. mastery", "متوسط الإتقان")}
          value={`${num(stats.avgMastery)}%`}
          detail={t("Across course concepts", "عبر مفاهيم المقرر")}
          icon={GraduationCap}
        />
        <Metric
          label={t("At risk", "معرّضون للتعثر")}
          value={num(stats.counts["at-risk"])}
          detail={t("Low mastery or inactive 10+ days", "إتقان منخفض أو غائبون ١٠ أيام فأكثر")}
          icon={AlertTriangle}
        />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle
            title={t("Class mastery by concept", "إتقان الصف حسب المفهوم")}
            description={t(
              "Mean mastery across enrolled students · simulated estimates",
              "متوسط الإتقان لدى الطلاب المسجلين · تقديرات تجريبية",
            )}
          />
          <div className="space-y-5">
            {concepts.map((c) => (
              <div key={c.id}>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{t(c.title)}</span>
                  <strong className="tabular-nums">{num(c.mastery)}%</strong>
                </div>
                <Progress
                  value={c.mastery}
                  tone={c.mastery >= 80 ? "success" : c.mastery < 70 ? "warning" : "brand"}
                  aria-label={t(c.title)}
                />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionTitle
            title={t("Class health", "حالة الصف")}
            description={t("How students are doing right now", "كيف يسير الطلاب حاليًا")}
          />
          <div className="space-y-4">
            {(["on-track", "attention", "at-risk"] as Health[]).map((h) => (
              <div key={h}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{label(h)}</span>
                  <strong className="tabular-nums">{num(stats.counts[h])}</strong>
                </div>
                <Progress
                  value={(stats.counts[h] / total) * 100}
                  tone={h === "on-track" ? "success" : h === "attention" ? "warning" : "danger"}
                  aria-label={label(h)}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <section>
        <SectionTitle
          title={t("Individual progress", "تقدم كل طالب")}
          description={t(
            "Sorted by lowest mastery first so support goes where it is needed.",
            "مرتبون من الأقل إتقانًا لتصل المساعدة إلى من يحتاجها.",
          )}
        >
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <label className="flex flex-1 items-center gap-2 rounded-lg border bg-card px-3 sm:w-56 sm:flex-none">
              <Search className="size-4 text-muted-foreground" aria-hidden="true" />
              <input
                className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                aria-label={t("Search students", "البحث عن طالب")}
                placeholder={t("Search students", "البحث عن طالب")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <NativeSelect
              aria-label={t("Filter by status", "تصفية حسب الحالة")}
              className="h-10 w-auto"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Health | "all")}
            >
              <option value="all">{t("All statuses", "كل الحالات")}</option>
              <option value="on-track">{label("on-track")}</option>
              <option value="attention">{label("attention")}</option>
              <option value="at-risk">{label("at-risk")}</option>
            </NativeSelect>
          </div>
        </SectionTitle>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-start text-sm">
            <caption className="sr-only">{t("Student progress", "تقدم الطلاب")}</caption>
            <thead className="bg-muted/60">
              <tr>
                {[
                  t("Student", "الطالب"),
                  t("Completion", "الإكمال"),
                  t("Mastery", "الإتقان"),
                  t("Work submitted", "الأعمال المسلّمة"),
                  t("Last active", "آخر نشاط"),
                  t("Status", "الحالة"),
                ].map((h) => (
                  <th key={h} scope="col" className="p-4 text-start font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id} className="border-t">
                  <th scope="row" className="p-4 text-start font-medium">{r.student.name}</th>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Progress className="w-24" value={r.completion} aria-label={t("Completion", "الإكمال")} />
                      <span className="tabular-nums">{num(r.completion)}%</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold tabular-nums">{num(r.mastery)}%</td>
                  <td className="p-4 tabular-nums">{num(r.submitted)}/{num(r.assignments)}</td>
                  <td className="p-4 text-muted-foreground">
                    {r.student.lastActiveDays <= 1
                      ? t("Today", "اليوم")
                      : t(`${r.student.lastActiveDays} days ago`, `قبل ${num(r.student.lastActiveDays)} أيام`)}
                  </td>
                  <td className="p-4">
                    <Badge tone={healthTone[r.health]}>{label(r.health)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="p-8 text-center text-muted-foreground">
              {t("No students match these filters.", "لا يوجد طلاب مطابقون للتصفية.")}
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
