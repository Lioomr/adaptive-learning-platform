import { Suspense } from "react";
import type { Metadata } from "next";
import { StudentManagement } from "@/features/instructor/dashboard/students";

export const metadata: Metadata = { title: "Students" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <StudentManagement />
    </Suspense>
  );
}
