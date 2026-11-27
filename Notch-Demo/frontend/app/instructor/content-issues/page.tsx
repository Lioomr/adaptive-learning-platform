import { Suspense } from "react";
import type { Metadata } from "next";
import { ContentIssues } from "@/features/instructor/dashboard/issues";

export const metadata: Metadata = { title: "Content Issues" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <ContentIssues />
    </Suspense>
  );
}
