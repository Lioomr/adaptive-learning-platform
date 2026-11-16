import type { Metadata } from "next";
import { ExamReadinessScreen } from "@/features/instructor/p1/exam-readiness";

export const metadata: Metadata = { title: "Exam readiness · IN16–IN17" };

export default function Page() {
  return <ExamReadinessScreen />;
}
