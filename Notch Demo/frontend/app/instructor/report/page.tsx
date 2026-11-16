import type { Metadata } from "next";
import { CourseReportScreen } from "@/features/instructor/p1/course-report";

export const metadata: Metadata = { title: "Course report · IN18–IN19" };

export default function Page() {
  return <CourseReportScreen />;
}
