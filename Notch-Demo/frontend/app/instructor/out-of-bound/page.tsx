import { Suspense } from "react";
import type { Metadata } from "next";
import { OutOfBoundReview } from "@/features/instructor/dashboard/out-of-bound";

export const metadata: Metadata = { title: "Out-of-Bound Tutor Questions" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <OutOfBoundReview />
    </Suspense>
  );
}
