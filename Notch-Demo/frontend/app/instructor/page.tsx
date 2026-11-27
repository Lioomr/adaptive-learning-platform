import type { Metadata } from "next";
import { InstructorDashboard } from "@/features/instructor/dashboard/dashboard";

export const metadata: Metadata = { title: "Instructor Dashboard" };

export default function Page() {
  return <InstructorDashboard />;
}
