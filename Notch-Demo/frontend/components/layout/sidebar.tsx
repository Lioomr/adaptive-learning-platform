"use client";
import { useShellCopy } from "@/components/layout/shell-copy";
import Link from "next/link";
import { FlaskConical, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/layout/brand";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useUi } from "@/store/ui";
import type { Role } from "@/types";

/**
 * Desktop sidebar (≥1024px: 260px, collapsible to 72px) and tablet rail
 * (768–1023px: 72px). Hidden on mobile, where MobileNavigation opens a drawer.
 */
export function Sidebar({ role }: { role: Role }) {
  const { text } = useShellCopy();
  const collapsed = useUi(s => s.sidebarCollapsed);
  const toggle = useUi(s => s.toggleSidebar);
  return (
    <aside
      data-collapsed={collapsed}
      aria-label={text("Primary")}
      className="group/sidebar fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[var(--sidebar-collapsed)] lg:w-[var(--sidebar-width)] lg:data-[collapsed=true]:w-[var(--sidebar-collapsed)] motion-safe:transition-[width] motion-safe:duration-200"
    >
      <div className="flex h-[var(--header-height)] shrink-0 items-center border-b border-sidebar-border px-5 md:max-lg:justify-center md:max-lg:px-0 lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0">
        <Link href={routes.demo} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={text("Notch demo home")}>
          <BrandWordmark className="md:max-lg:hidden lg:group-data-[collapsed=true]/sidebar:hidden" />
          <BrandMark className="hidden md:max-lg:block lg:group-data-[collapsed=true]/sidebar:block" />
        </Link>
      </div>

      <nav aria-label={text("Portals")} className="flex-1 px-3 py-5">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted md:max-lg:sr-only lg:group-data-[collapsed=true]/sidebar:sr-only">{text(role === "student" ? "Student" : "Workspaces")}</p>
        <RoleSwitcher active={role} />
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent p-3 md:max-lg:hidden lg:group-data-[collapsed=true]/sidebar:hidden">
          <p className="flex items-center gap-2 text-xs font-semibold text-sidebar-strong">
            <FlaskConical className="size-3.5 text-primary" aria-hidden="true" />
            {text("Simulation mode")}
          </p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground">{text("Fictional students. Progress is simulated and stays in this browser.")}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={collapsed}
          className="mt-2 hidden h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-strong focus-visible:ring-2 focus-visible:ring-ring lg:flex lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0"
        >
          {collapsed ? <PanelLeftOpen className="size-[18px] rtl:-scale-x-100" aria-hidden="true" /> : <PanelLeftClose className="size-[18px] rtl:-scale-x-100" aria-hidden="true" />}
          <span className={cn(collapsed && "sr-only")}>{text(collapsed ? "Expand sidebar" : "Collapse sidebar")}</span>
        </button>
      </div>
    </aside>
  );
}
