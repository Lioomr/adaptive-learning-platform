"use client";
import { useShellCopy } from "@/components/layout/shell-copy";
import { RoleProvider } from "@/components/layout/role-context";
import { Sidebar } from "@/components/layout/sidebar";
import { ContextStrip, Topbar } from "@/components/layout/topbar";
import { StorageNotice } from "@/components/feedback/storage-notice";
import { cn } from "@/lib/utils";
import { useUi } from "@/store/ui";
import type { Role } from "@/types";

/**
 * Shared application shell for every portal route. Each portal's layout renders
 * <AppShell role="…">, which fixes the simulated role for everything inside it.
 * Portal screens (ST/IN/AD) only render page content; they never duplicate the shell.
 */
export function AppShell({ role, children, studentWorkspace = false }: { role: Role; children: React.ReactNode; studentWorkspace?: boolean }) {
  const { text } = useShellCopy();
  const collapsed = useUi(s => s.sidebarCollapsed);
  return (
    <RoleProvider role={role}>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-3"
      >
        {text("Skip to main content")}
      </a>
      <Sidebar role={role} />
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col md:ps-[var(--sidebar-collapsed)] motion-safe:transition-[padding] motion-safe:duration-200",
          collapsed ? "lg:ps-[var(--sidebar-collapsed)]" : "lg:ps-[var(--sidebar-width)]",
        )}
      >
        <Topbar role={role} studentWorkspace={studentWorkspace} />
        <ContextStrip role={role} studentWorkspace={studentWorkspace} />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[var(--notch-grid-max)] flex-1 px-[var(--notch-grid-margin)] pb-16 pt-6 outline-none sm:pt-8">
          <StorageNotice />
          {children}
        </main>
      </div>
    </RoleProvider>
  );
}
