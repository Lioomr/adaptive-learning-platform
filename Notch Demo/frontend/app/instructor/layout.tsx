
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { InstructorNav } from "@/features/instructor/instructor-nav";

/** Fixes the simulated role for every screen under /instructor. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShell role="instructor">
        <InstructorNav />
        {children}
      </AppShell>
    </Suspense>
  );
}
