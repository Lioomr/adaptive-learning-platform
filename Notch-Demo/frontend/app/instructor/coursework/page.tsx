import { Suspense } from "react";
import type { Metadata } from "next";
import { Coursework } from "@/features/instructor/coursework/coursework";

export const metadata: Metadata = { title: "Assignments, Attendance & Communication" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <Coursework />
    </Suspense>
  );
}
