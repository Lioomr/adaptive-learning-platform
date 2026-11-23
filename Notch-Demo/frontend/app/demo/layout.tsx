import { AppShell } from "@/components/layout/app-shell";

/** Fixes the simulated role for every screen under /demo (see components/layout/role-context.tsx). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell role="demo">{children}</AppShell>;
}
