import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { InstructorNav } from "@/features/instructor/instructor-nav";

/** Fixes the simulated role for every screen under /instructor (see components/layout/role-context.tsx). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="instructor">
      <Suspense fallback={null}>
        <InstructorNav />
      </Suspense>
      {children}
    </AppShell>
  );
}
