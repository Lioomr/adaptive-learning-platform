"use client";
import {
  Link,
  type ReactNode,
  type ComponentProps,
  ShieldCheck,
  ArrowUpRight,
} from "@/features/advisor/runtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { useDemo } from "@/store/demo";
import { masteryBand } from "@/services/mastery";
import { courseAverage } from "@/services/insights";
import { courses } from "@/data/fixtures";
import type { Student } from "@/types";
import { nameOf } from "../services/language";
import { useAdvisorLocale } from "./advisor-layout";
import styles from "./advisor.module.css";
export function Heading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { t } = useAdvisorLocale();
  return (
    <header className={styles.heading}>
      <div>
        <p className={styles.eyebrow}>
          {id} <span> / </span> {t("ADVISOR WORKSPACE", "مساحة المرشد")}
        </p>
        <h1 className="notch-type-h1">{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function Panel({
  title,
  description,
  children,
  action,
  id,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={styles.panel}>
      <div className={styles.panelHeading}>
        <div>
          <h2 className="notch-type-h4">{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <ShieldCheck size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function StudentLink({
  student,
  screen = "ad3",
  children,
  ...props
}: {
  student: Student;
  screen?: string;
  children?: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const { lang } = useAdvisorLocale();
  return (
    <Link
      {...props}
      className={[styles.studentLink, props.className]
        .filter(Boolean)
        .join(" ")}
      href={`/advisor/${screen}?student=${encodeURIComponent(student.id)}`}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented)
          useDemo.getState().setStudent(student.id, "advisor");
      }}
    >
      {children ?? (
        <>
          <StudentAvatar name={student.name} />
          <span>{nameOf(student.name, lang)}</span>
          <ArrowUpRight className={styles.directionalIcon} size={16} aria-hidden="true" />
        </>
      )}
    </Link>
  );
}
export function Band({ value }: { value: number }) {
  const { lang } = useAdvisorLocale();
  const band = masteryBand(value);
  return <Badge tone={band.tone}>{nameOf(band.band, lang)}</Badge>;
}
export function Meter({ value, label }: { value: number; label: string }) {
  const tone = masteryBand(value).tone;
  return (
    <div
      className={styles.meter}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%`, background: `var(--${tone})` }} />
    </div>
  );
}
export function CourseSummary({ student }: { student: Student }) {
  const { lang, t } = useAdvisorLocale();
  return (
    <div className={styles.twoColumns}>
      {courses
        .filter((c) => student.enrolledCourseIds.includes(c.id))
        .map((c) => (
          <div className={styles.courseSummary} key={c.id}>
            <p>{nameOf(c.id, lang)}</p>
            <div>
              <strong>
                {courseAverage(student, c.id)}
                <small>%</small>
              </strong>
              <Band value={courseAverage(student, c.id)} />
            </div>
            <Meter
              value={courseAverage(student, c.id)}
              label={nameOf(c.id, lang)}
            />
            <small>
              {t(
                "Average of the course’s 10 concepts · Simulated",
                "متوسط مفاهيم المقرر العشرة · محاكاة",
              )}
            </small>
          </div>
        ))}
    </div>
  );
}
export function BackLink() {
  const { t } = useAdvisorLocale();
  return (
    <Button asChild variant="outline">
      <Link href="/advisor/ad2">
        {t("Back to caseload", "العودة إلى الطلاب")}
      </Link>
    </Button>
  );
}
