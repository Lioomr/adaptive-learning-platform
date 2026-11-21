import { AppShell } from "@/components/layout/app-shell";
import { StudentJourneyNavigation } from "@/features/student/student-journey-navigation";

/** Fixes the simulated role for every screen under /student. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="student">
      <StudentJourneyNavigation />
      {children}
    </AppShell>
  );
}
