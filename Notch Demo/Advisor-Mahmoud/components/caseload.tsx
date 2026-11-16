"use client";
import {
  useState,
  Link,
  Users,
  Clock3,
  Activity,
  ArrowRight,
  Search,
} from "@/features/advisor/runtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/store/demo";
import { courseAverage } from "@/services/insights";
import type { Student, CourseId } from "@/types";
import { warningsFor } from "../services/advisor";
import { nameOf } from "../services/language";
import { useAdvisorLocale } from "./advisor-layout";
import { Heading, Panel, Empty, StudentLink, Meter } from "./common";
import styles from "./advisor.module.css";
export function Caseload({ students }: { students: Student[] }) {
  const { lang, t } = useAdvisorLocale();
  const attempts = useDemo((s) => s.attempts);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [course, setCourse] = useState<CourseId | "all">("all");
  const flagged = students.filter((s) => warningsFor(s, attempts).length);
  const inactive = students.filter((s) => s.lastActiveDays >= 14);
  const low = students.filter(
    (s) => !attempts.some((a) => a.studentId === s.id),
  );
  const visible = students.filter((s) => {
    const flags = warningsFor(s, attempts).filter(
      (w) => course === "all" || !w.courseId || w.courseId === course,
    );
    return (
      `${s.name} ${nameOf(s.name, "ar")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (course === "all" || s.enrolledCourseIds.includes(course)) &&
      (filter === "all" ||
        (filter === "warning" && flags.length > 0) ||
        (filter === "inactive" && s.lastActiveDays >= 14) ||
        (filter === "low" &&
          !attempts.some(
            (a) =>
              a.studentId === s.id &&
              (course === "all" || a.courseId === course),
          )))
    );
  });
  return (
    <>
      <Heading
        id="AD2"
        title={t("Every student. A clearer next step.", "خطوة أوضح لكل طالب.")}
        description={t(
          "A cross-course view of your caseload, so support starts with understanding.",
          "نظرة على طلابك عبر المقررات، ليبدأ الدعم بالفهم.",
        )}
        action={
          <Button asChild>
            <Link href="/advisor/ad5">
              {t("Review warnings", "مراجعة التنبيهات")}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <div className={styles.stats}>
        {[
          [
            Users,
            students.length,
            t("Assigned students", "الطلاب المسندون"),
            t("Fictional caseload", "قائمة افتراضية"),
          ],
          [
            Activity,
            flagged.length,
            t("Support opportunities", "فرص الدعم"),
            t("Explainable demo rules", "قواعد محاكاة واضحة"),
          ],
          [
            Clock3,
            inactive.length,
            t("Inactive for 14+ days", "غياب لمدة ١٤ يوماً أو أكثر"),
            t("Frozen demo activity clock", "ساعة نشاط افتراضية ثابتة"),
          ],
          [
            Search,
            low.length,
            t("Limited evidence", "أدلة محدودة"),
            t("No recorded attempts yet", "لا توجد محاولات مسجلة"),
          ],
        ].map(([Icon, value, label, hint], i) => {
          const I = Icon as typeof Users;
          return (
            <div key={i} className={styles.stat}>
              <div>
                <span>{String(label)}</span>
                <I size={18} aria-hidden="true" />
              </div>
              <strong>{String(value)}</strong>
              <small>{String(hint)}</small>
            </div>
          );
        })}
      </div>
      <Panel
        title={t("Your caseload", "طلابك")}
        description={t(
          "Shared progress across Python and Mathematics. All values are simulated.",
          "تقدم مشترك في بايثون والرياضيات. جميع القيم محاكاة.",
        )}
        action={
          <Badge tone="brand">
            {students.length} {t("students", "طلاب")}
          </Badge>
        }
      >
        <div className={styles.filters}>
          <label className={styles.search}>
            <span>{t("Search students", "البحث عن طالب")}</span>
            <div>
              <Search size={17} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search by name…", "ابحث بالاسم…")}
              />
            </div>
          </label>
          <label>
            <span>{t("Course", "المقرر")}</span>
            <select
              aria-label={t("Course", "المقرر")}
              value={course}
              onChange={(e) => setCourse(e.target.value as CourseId | "all")}
            >
              <option value="all">{t("Both courses", "المقرران معاً")}</option>
              <option value="C-PY">{nameOf("C-PY", lang)}</option>
              <option value="C-MATH">{nameOf("C-MATH", lang)}</option>
            </select>
          </label>
          <label>
            <span>{t("Show", "عرض")}</span>
            <select
              aria-label={t("Show", "عرض")}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t("All students", "جميع الطلاب")}</option>
              <option value="warning">
                {t("Support opportunities", "فرص الدعم")}
              </option>
              <option value="inactive">
                {t("Inactive 14+ days", "غياب ١٤ يوماً أو أكثر")}
              </option>
              <option value="low">
                {t("Limited evidence", "أدلة محدودة")}
              </option>
            </select>
          </label>
        </div>
        <div className={styles.resultCount} aria-live="polite">
          {visible.length} {t("students shown", "طلاب معروضون")}
        </div>
        {visible.length ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>{t("Student", "الطالب")}</th>
                  <th>{t("Python mastery", "إتقان بايثون")}</th>
                  <th>{t("Mathematics mastery", "إتقان الرياضيات")}</th>
                  <th>{t("Last activity", "آخر نشاط")}</th>
                  <th>{t("Support / evidence", "الدعم / الأدلة")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => {
                  const flags = warningsFor(s, attempts);
                  return (
                    <tr key={s.id}>
                      <td>
                        <StudentLink student={s} />
                      </td>
                      {(["C-PY", "C-MATH"] as const).map((id) => (
                        <td key={id}>
                          <strong className={styles.percent}>
                            {courseAverage(s, id)}%
                          </strong>
                          <Meter
                            value={courseAverage(s, id)}
                            label={`${nameOf(s.name, lang)} ${nameOf(id, lang)}`}
                          />
                        </td>
                      ))}
                      <td>
                        {s.lastActiveDays === 0
                          ? t("Today", "اليوم")
                          : t(
                              s.lastActiveDays === 1
                                ? "1 day ago"
                                : `${s.lastActiveDays} days ago`,
                              `منذ ${s.lastActiveDays} أيام`,
                            )}
                      </td>
                      <td>
                        <StudentLink student={s} screen="ad3">
                          <Badge tone={flags.length ? "warning" : "success"}>
                            {flags.length
                              ? t("Review suggested", "يُقترح المراجعة")
                              : t("On track", "على المسار")}
                          </Badge>
                        </StudentLink>
                        <small className={styles.evidence}>
                          {!attempts.some((a) => a.studentId === s.id)
                            ? t(
                                "Baseline only · limited evidence",
                                "خط أساس فقط · أدلة محدودة",
                              )
                            : t(
                                "Recorded attempts available",
                                "توجد محاولات مسجلة",
                              )}
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={t("No students to show", "لا يوجد طلاب للعرض")}
            description={t(
              "Try a different name or clear your filters. Only assigned students appear here.",
              "جرّب اسماً آخر أو أزل التصفية. يظهر الطلاب المسندون فقط.",
            )}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                  setCourse("all");
                }}
              >
                {t("Clear filters", "إزالة التصفية")}
              </Button>
            }
          />
        )}
      </Panel>
      <p className={styles.note}>
        {t(
          "A flag is a conversation starter, not a prediction. Open a student to see the exact reason and supporting evidence.",
          "التنبيه بداية لحوار وليس تنبؤاً. افتح ملف الطالب لعرض السبب والأدلة.",
        )}
      </p>
    </>
  );
}
