import { Suspense } from "react";
import { InstructorPortalLayout } from "@/features/instructor/portal/context";

/** Fixes the simulated role for every screen under /instructor. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background p-8">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <InstructorPortalLayout>{children}</InstructorPortalLayout>
    </Suspense>
  );
}
