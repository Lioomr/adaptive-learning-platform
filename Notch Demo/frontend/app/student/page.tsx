import type { Metadata } from "next";
import { StudentOverview } from "@/features/student/student-overview";

export const metadata: Metadata = { title: "Student Portal" };

export default function Page() {
  return <StudentOverview />;
}
