import type { Metadata } from "next";
import { StudentDashboard } from "@/features/student/portal/dashboard";
export const metadata: Metadata = { title: "Academic Dashboard" };
export default function Page() {
  return <StudentDashboard />;
}
