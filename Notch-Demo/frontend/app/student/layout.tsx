import { Suspense } from "react";
import { StudentPortalLayout } from "@/features/student/portal/context";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background p-8">
          <div className="h-12 w-48 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <StudentPortalLayout>{children}</StudentPortalLayout>
    </Suspense>
  );
}
