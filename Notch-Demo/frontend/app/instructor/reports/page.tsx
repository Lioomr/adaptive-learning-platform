import { Suspense } from "react";
import type { Metadata } from "next";
import { CourseReports } from "@/features/instructor/reports/course-reports";

export const metadata: Metadata = { title: "Course Reports & Exam Preparation" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <CourseReports />
    </Suspense>
  );
}
