import { Suspense } from "react";
import type { Metadata } from "next";
import { CalendarPage } from "@/features/instructor/dashboard/calendar";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <CalendarPage />
    </Suspense>
  );
}
