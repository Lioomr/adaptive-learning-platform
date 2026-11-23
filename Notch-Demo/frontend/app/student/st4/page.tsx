
import type { Metadata } from "next";
import { StudentDiagnostic } from "@/features/student/student-diagnostic";

export const metadata: Metadata = {
  title: "Course Diagnostic | Notch",
  description: "Complete the illustrative course diagnostic in Notch.",
};

export default function StudentDiagnosticPage() {
  return <StudentDiagnostic />;
}
