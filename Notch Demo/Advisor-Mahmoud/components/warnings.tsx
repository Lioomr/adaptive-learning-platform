"use client";
import { useState, Bell } from "@/features/advisor/runtime";
import { useDemo } from "@/store/demo";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/types";
import { warningsFor, type Warning } from "../services/advisor";
import { nameOf } from "../services/language";
import { useAdvisorLocale } from "./advisor-layout";
import { Heading, Panel, Empty, StudentLink } from "./common";
import styles from "./advisor.module.css";
export function useWarningText() {
  const { t, lang } = useAdvisorLocale();
  return (w: Warning) => {
    const concept = nameOf(w.conceptId ?? "", lang);
    const prerequisite = nameOf(w.prerequisiteId ?? "", lang);
    switch (w.kind) {
      case "inactive":
        return {
          title: t("Time for a check-in", "حان وقت الاطمئنان"),
          reason: t(
            `No simulated activity for ${w.value} days; the rule is 14 days or more.`,
            `لا يوجد نشاط افتراضي منذ ${w.value} يوماً؛ الحد هو ١٤ يوماً أو أكثر.`,
          ),
          action: t(
            "Ask what support would make returning easier.",
            "اسأل عن الدعم الذي يساعد على العودة.",
          ),
        };
      case "concept":
        return {
          title: t("A concept needs review", "مفهوم يحتاج إلى مراجعة"),
          reason: t(
            `${concept}: mastery is ${w.value}%, below the 40% support threshold.`,
            `${concept}: الإتقان ${w.value}٪، أقل من حد الدعم ٤٠٪.`,
          ),
          action: t(
            "Agree on a focused practice step for this concept.",
            "اتفق على خطوة تدريب مركزة لهذا المفهوم.",
          ),
        };
      case "support":
        return {
          title: t("Foundations need support", "الأساسيات تحتاج إلى دعم"),
          reason: t(
            `Course-average mastery is ${w.value}%, below the 40% support threshold.`,
            `متوسط إتقان المقرر ${w.value}٪، أقل من حد الدعم ٤٠٪.`,
          ),
          action: t(
            "Agree on a small, achievable review step.",
            "اتفق على خطوة مراجعة بسيطة وقابلة للتحقيق.",
          ),
        };
      case "prerequisite":
        return {
          title: t("Review a prerequisite", "مراجعة متطلب سابق"),
          reason: t(
            `${concept}: ${prerequisite} is ${w.value}%, below the 70% readiness threshold.`,
            `${concept}: إتقان ${prerequisite} هو ${w.value}٪، أقل من حد الاستعداد ٧٠٪.`,
          ),
          action: t(
            `Review ${prerequisite} before practising ${concept}.`,
            `راجع ${prerequisite} قبل التدريب على ${concept}.`,
          ),
        };
      case "repeated":
        return {
          title: t(
            "Repeated prerequisite difficulty",
            "صعوبة متكررة في متطلب سابق",
          ),
          reason: t(
            `${concept}: the last two recorded attempts both ended below 70%; latest mastery is ${w.value}%.`,
            `${concept}: آخر محاولتين انتهتا بأقل من ٧٠٪؛ الإتقان الحالي ${w.value}٪.`,
          ),
          action: t(
            "Review the prerequisite together and adjust the practice plan.",
            "راجعا المتطلب السابق معاً وعدّلا خطة التدريب.",
          ),
        };
      case "declining":
        return {
          title: t("Recent progress declined", "تراجع التقدم مؤخراً"),
          reason: t(
            `${concept}: mastery decreased on each of the last two recorded attempts; now ${w.value}%.`,
            `${concept}: انخفض الإتقان في كل من آخر محاولتين؛ وهو الآن ${w.value}٪.`,
          ),
          action: t(
            "Discuss the recent attempts before choosing more practice.",
            "ناقش المحاولات الأخيرة قبل اختيار تدريب إضافي.",
          ),
        };
    }
  };
}
export function WarningList({
  student,
  compact = false,
}: {
  student: Student;
  compact?: boolean;
}) {
  const attempts = useDemo((s) => s.attempts);
  const warnings = warningsFor(student, attempts);
  const text = useWarningText();
  const { t, lang } = useAdvisorLocale();
  return warnings.length ? (
    <div className={styles.warningList}>
      {warnings.map((w) => {
        const copy = text(w);
        return (
          <article key={w.id} className={styles.warning}>
            <div className={styles.warningIcon}>
              <Bell size={18} aria-hidden="true" />
            </div>
            <div>
              <div className={styles.inline}>
                <h3>{copy.title}</h3>
                <Badge tone="neutral">
                  {w.courseId
                    ? nameOf(w.courseId, lang)
                    : t("Cross-course", "عبر المقررات")}
                </Badge>
              </div>
              <p>{copy.reason}</p>
              <p className={styles.recommendation}>{copy.action}</p>
              <small>
                {w.evidence === "snapshot"
                  ? t(
                      "Limit: fictional baseline snapshot; it does not establish a trend or repeated difficulty.",
                      "الحدود: لقطة افتراضية لخط الأساس؛ لا تثبت اتجاهاً أو صعوبة متكررة.",
                    )
                  : t(
                      "Limit: a small simulated attempt history, not a diagnosis or AI risk score.",
                      "الحدود: سجل محاولات محاكاة محدود، وليس تشخيصاً أو درجة مخاطر بالذكاء الاصطناعي.",
                    )}
              </small>
              {!compact && (
                <div className={styles.inline}>
                  <StudentLink student={student}>
                    {t("Open student", "فتح ملف الطالب")}
                  </StudentLink>
                  <StudentLink student={student} screen="ad4">
                    {t("Prepare a nudge", "إعداد رسالة دعم")}
                  </StudentLink>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <Empty
      title={t("No warnings triggered", "لا توجد تنبيهات")}
      description={t(
        "No current demo rule suggests intervention. Limited evidence still applies.",
        "لا تشير قواعد المحاكاة الحالية إلى تدخل. تظل الأدلة محدودة.",
      )}
    />
  );
}
export function Warnings({ students }: { students: Student[] }) {
  const { t, lang } = useAdvisorLocale();
  const attempts = useDemo((s) => s.attempts);
  const [filter, setFilter] = useState("all");
  const visible = students.filter(
    (s) =>
      (filter === "all" || s.id === filter) && warningsFor(s, attempts).length,
  );
  return (
    <>
      <Heading
        id="AD5"
        title={t(
          "Notice early. Support thoughtfully.",
          "لاحظ مبكراً. وادعم باهتمام.",
        )}
        description={t(
          "Transparent rules help you decide where a conversation could help.",
          "قواعد واضحة تساعدك على تحديد من قد يستفيد من الحوار.",
        )}
      />
      <div className={styles.info}>
        <Bell size={20} aria-hidden="true" />
        <div>
          <strong>
            {t(
              "Simulated indicators, never an AI risk score",
              "مؤشرات محاكاة وليست درجة مخاطر بالذكاء الاصطناعي",
            )}
          </strong>
          <p>
            {t(
              "Activity uses frozen fixture days, not today’s date. Repeated difficulty and decline require two recorded attempts. Baseline values alone never imply either trend.",
              "يعتمد النشاط على أيام ثابتة في البيانات، وليس تاريخ اليوم. تتطلب الصعوبة المتكررة والتراجع محاولتين مسجلتين؛ لا يثبت خط الأساس أياً منهما.",
            )}
          </p>
        </div>
      </div>
      <div className={styles.filters}>
        <label>
          <span>{t("Student", "الطالب")}</span>
          <select
            aria-label={t("Student", "الطالب")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">
              {t("All assigned students", "جميع الطلاب المسندين")}
            </option>
            {students.map((s) => (
              <option value={s.id} key={s.id}>
                {nameOf(s.name, lang)}
              </option>
            ))}
          </select>
        </label>
        <span aria-live="polite">
          {visible.length}{" "}
          {t("students with support opportunities", "طلاب لديهم فرص للدعم")}
        </span>
      </div>
      {visible.length ? (
        visible.map((s) => (
          <Panel
            key={s.id}
            title={nameOf(s.name, lang)}
            description={t(
              "Reasons, limits and next steps",
              "الأسباب والحدود والخطوات التالية",
            )}
            action={
              <StudentLink student={s}>
                {t("View profile", "عرض الملف")}
              </StudentLink>
            }
          >
            <details
              className={styles.warningGroup}
              open={filter !== "all" || s.id === visible[0]?.id}
            >
              <summary>
                {warningsFor(s, attempts).length}{" "}
                {t(
                  "indicators · inspect reasons and limits",
                  "مؤشرات · افحص الأسباب والحدود",
                )}
              </summary>
              <WarningList student={s} />
            </details>
          </Panel>
        ))
      ) : (
        <Empty
          title={t("No warnings triggered", "لا توجد تنبيهات")}
          description={t(
            "No rule matches this selection. You can still review the student’s plan.",
            "لا تنطبق قاعدة على هذا الاختيار. يمكنك مراجعة خطة الطالب.",
          )}
        />
      )}
    </>
  );
}
