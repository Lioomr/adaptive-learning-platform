"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Course } from "@/features/student/portal/data";
import { weightedGrade } from "./data";
import { useInstructor } from "./context";
import { useInstructorPortal } from "./store";
import { Metric, SectionTitle } from "./ui";
import { Status, fieldClass } from "./forms";
import { cn } from "@/lib/utils";

export function Gradebook({ course }: { course: Course }) {
  const { t, pick, num, content, students } = useInstructor();
  const setGrade = useInstructorPortal((s) => s.setGrade);
  const [message, setMessage] = useState("");
  const columns = content.assignments
    .filter((a) => a.courseId === course.id && a.status === "published")
    .sort((a, b) => a.due.localeCompare(b.due));
  const subs = content.submissions.filter((s) => s.courseId === course.id);
  const finals = students.map((s) => ({
    student: s,
    final: weightedGrade(columns, subs, s.id),
  }));
  const graded = finals.filter((f) => f.final !== null) as {
    student: (typeof students)[number];
    final: number;
  }[];
  const average = graded.length
    ? Math.round(graded.reduce((s, f) => s + f.final, 0) / graded.length)
    : null;
  const cell = (assignmentId: string, studentId: string) =>
    subs.find((s) => s.assignmentId === assignmentId && s.studentId === studentId);
  function commit(
    assignmentId: string,
    studentId: string,
    max: number,
    raw: string,
    previous: number | undefined,
  ) {
    const text = raw.trim();
    const value = text === "" ? undefined : Number(text);
    if (value !== undefined && (Number.isNaN(value) || value < 0 || value > max)) {
      setMessage(t(`Grades must be between 0 and ${max}.`, `يجب أن تكون الدرجة بين 0 و${num(max)}.`));
      return false;
    }
    if (value === previous) return true;
    setGrade(course.id, assignmentId, studentId, value);
    setMessage(t("Grade saved.", "تم حفظ الدرجة."));
    return true;
  }
  function exportCsv() {
    const header = ["Student", ...columns.map((a) => pick(a.title)), "Final"];
    const lines = [
      header,
      ...students.map((s) => [
        s.name,
        ...columns.map((a) => cell(a.id, s.id)?.grade ?? ""),
        finals.find((f) => f.student.id === s.id)?.final ?? "",
      ]),
    ].map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));
    const url = URL.createObjectURL(
      new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `notch-${course.id}-grades.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section>
      <SectionTitle
        title={t("Gradebook", "سجل الدرجات")}
        description={t(
          "Edit a grade directly in the table. Changes are saved as soon as you leave the field.",
          "عدّل الدرجة مباشرة في الجدول. تُحفظ التغييرات بمجرد مغادرة الحقل.",
        )}
      >
        <Button variant="outline" onClick={exportCsv}>
          <Download aria-hidden="true" />
          {t("Export CSV", "تصدير CSV")}
        </Button>
      </SectionTitle>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label={t("Class average", "متوسط الصف")} value={average === null ? "—" : `${num(average)}%`} detail={t("Weighted, graded work only", "مرجّح للأعمال المقيّمة فقط")} />
        <Metric label={t("Highest", "الأعلى")} value={graded.length ? `${num(Math.max(...graded.map((g) => g.final)))}%` : "—"} detail={graded.length ? graded.reduce((a, b) => (a.final >= b.final ? a : b)).student.name : ""} />
        <Metric label={t("Lowest", "الأدنى")} value={graded.length ? `${num(Math.min(...graded.map((g) => g.final)))}%` : "—"} detail={graded.length ? graded.reduce((a, b) => (a.final <= b.final ? a : b)).student.name : ""} />
        <Metric label={t("Graded items", "عناصر مقيّمة")} value={num(columns.length)} detail={t("Published assessments", "تقييمات منشورة")} />
      </div>
      <Status message={message} />
      <Card className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-start text-sm">
          <caption className="sr-only">{t("Course gradebook", "سجل درجات المقرر")}</caption>
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className="sticky start-0 z-10 bg-muted p-4 text-start font-medium text-muted-foreground">{t("Student", "الطالب")}</th>
              {columns.map((a) => (
                <th key={a.id} scope="col" className="p-4 text-start font-medium text-muted-foreground">
                  <span className="block">{pick(a.title)}</span>
                  <span className="text-xs font-normal">{t("out of", "من")} {num(a.maxGrade)} · {num(a.weight)}%</span>
                </th>
              ))}
              <th scope="col" className="p-4 text-start font-medium text-muted-foreground">{t("Final", "النهائية")}</th>
            </tr>
          </thead>
          <tbody>
            {finals.map(({ student, final }) => (
              <tr key={student.id} className="border-t">
                <th scope="row" className="sticky start-0 z-10 bg-card p-4 text-start font-medium">{student.name}</th>
                {columns.map((a) => {
                  const current = cell(a.id, student.id)?.grade;
                  return (
                    <td key={a.id} className="p-2">
                      <input
                        key={`${a.id}-${student.id}-${current ?? "none"}`}
                        defaultValue={current ?? ""}
                        inputMode="decimal"
                        aria-label={t(`${student.name}, ${pick(a.title)}`, `${student.name}، ${pick(a.title)}`)}
                        className={cn(fieldClass, "h-10 w-20 text-center tabular-nums")}
                        onBlur={(e) => {
                          if (!commit(a.id, student.id, a.maxGrade, e.currentTarget.value, current))
                            e.currentTarget.value = current === undefined ? "" : String(current);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      />
                    </td>
                  );
                })}
                <td className="p-4 font-semibold tabular-nums text-primary">{final === null ? "—" : `${num(final)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!columns.length && (
          <p className="p-8 text-center text-muted-foreground">
            {t("Publish an assignment to start grading.", "انشر واجبًا لتبدأ التقييم.")}
          </p>
        )}
      </Card>
    </section>
  );
}
