import type { Metadata } from "next";
import { WeeklyDashboard } from "@/features/instructor/analytics/weekly-dashboard";

export const metadata: Metadata = { title: "Weekly dashboard · Instructor" };

/** IN8 Weekly dashboard. */
export default function Page() {
  return <WeeklyDashboard />;
}
