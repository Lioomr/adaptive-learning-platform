import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StudentJourneyNavigation } from "@/features/student/student-journey-navigation";

/** Fixes the simulated role for every screen under /student. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="student">
      <Suspense fallback={<div className="mx-auto max-w-6xl px-4 pt-4"><div className="h-12 animate-pulse rounded bg-muted" /></div>}>
        <StudentJourneyNavigation />
      </Suspense>
      {children}
    </AppShell>
  );
}
