"use client";
import { useEffect, useSearchParams } from "@/features/advisor/runtime";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";
import { AdvisorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { assignedStudents } from "../services/advisor";
import { useAdvisorLocale } from "./advisor-layout";
import { Empty, BackLink } from "./common";
import { Caseload } from "./caseload";
import { StudentOverview, Planning, Onboarding } from "./student";
import { Warnings } from "./warnings";
import { Nudges } from "./nudges";
export type Screen = "ad1" | "ad2" | "ad3" | "ad4" | "ad5" | "ad6";
export function AdvisorScreen({ screen }: { screen: Screen }) {
  const hydrated = useHydrated();
  return hydrated ? <Content screen={screen} /> : <AdvisorPreviewSkeleton />;
}
function Content({ screen }: { screen: Screen }) {
  const { t } = useAdvisorLocale();
  const params = useSearchParams();
  const students = useDemo((s) => s.students);
  const selectedId = useDemo((s) => s.studentId);
  const allowed = assignedStudents(students);
  const requested = params.get("student");
  const student = allowed.find((s) => s.id === (requested ?? selectedId));
  useEffect(() => {
    if (student && requested)
      useDemo.getState().setStudent(student.id, "advisor");
  }, [student, requested]);
  if (screen === "ad1") return <Onboarding students={allowed} />;
  if (screen === "ad2") return <Caseload students={allowed} />;
  if (screen === "ad5") return <Warnings students={allowed} />;
  if (!student)
    return (
      <Empty
        title={t("Student unavailable", "الطالب غير متاح")}
        description={t(
          "Choose a student assigned to your simulated caseload. No other student information is available here.",
          "اختر طالباً من قائمة طلابك الافتراضية. لا تتاح هنا معلومات عن طلاب آخرين.",
        )}
        action={<BackLink />}
      />
    );
  if (screen === "ad4")
    return <Nudges key={student.id} student={student} students={allowed} />;
  if (screen === "ad6") return <Planning student={student} />;
  return <StudentOverview student={student} />;
}
