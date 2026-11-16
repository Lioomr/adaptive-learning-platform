import type { Metadata } from "next";
import { StudentDetail } from "@/features/instructor/students/student-detail";

export const metadata: Metadata = { title: "Student view · Instructor Portal" };

/** IN14 — Student view (course-scoped). */
export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <StudentDetail studentId={decodeURIComponent(studentId)} />;
}
