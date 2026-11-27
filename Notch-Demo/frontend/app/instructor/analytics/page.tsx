import { Suspense } from "react";
import type { Metadata } from "next";
import { LearningAnalytics } from "@/features/instructor/analytics/learning-analytics";

export const metadata: Metadata = { title: "Learning Analytics" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <LearningAnalytics />
    </Suspense>
  );
}
