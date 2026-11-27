import { Suspense } from "react";
import type { Metadata } from "next";
import { PendingApprovals } from "@/features/instructor/dashboard/approvals";

export const metadata: Metadata = { title: "Pending Approvals" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <PendingApprovals />
    </Suspense>
  );
}
