"use client";
import { StudentNavigation } from "@/features/student/portal/navigation";
import { InstructorNavigation } from "@/features/instructor/portal/navigation";
import { useShellCopy } from "@/components/layout/shell-copy";
import Link from "next/link";
import { BookOpenCheck, GraduationCap, HeartHandshake, LayoutDashboard, type LucideIcon } from "lucide-react";
import { portals } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

export const portalIcons: Record<Role, LucideIcon> = {
  demo: LayoutDashboard,
  student: GraduationCap,
  instructor: BookOpenCheck,
  advisor: HeartHandshake,
};

type Props = {
  active: Role;
  /** "rail" hides labels at md and when the desktop sidebar is collapsed. */
  variant?: "sidebar" | "drawer";
  onNavigate?: () => void;
};

/**
 * Portal navigation used by the desktop sidebar, the tablet rail and the mobile
 * drawer. Switching portal is a route change; the role follows the route layout.
 */
export function RoleSwitcher({ active, variant = "sidebar", onNavigate }: Props) {
  const { text } = useShellCopy();
  const rail = variant === "sidebar";
  if (active === "student") return <StudentNavigation drawer={!rail} onNavigate={onNavigate} />;
  if (active === "instructor") return <InstructorNavigation drawer={!rail} onNavigate={onNavigate} />;
  return (
    <ul className="grid gap-1" role="list">
      {portals.map(p => {
        const Icon = portalIcons[p.role];
        const current = p.role === active;
        return (
          <li key={p.role}>
            <Link
              href={p.href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "group/link relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium text-sidebar-foreground outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-strong focus-visible:ring-2 focus-visible:ring-ring",
                current && "bg-sidebar-active text-secondary-foreground",
                rail && "md:max-lg:justify-center md:max-lg:px-0 lg:group-data-[collapsed=true]/sidebar:justify-center lg:group-data-[collapsed=true]/sidebar:px-0",
              )}
            >
              {current ? <span aria-hidden="true" className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-progress" /> : null}
              <Icon className="size-6 shrink-0" aria-hidden="true" />
              <span className={cn("min-w-0 flex-1", rail && "md:max-lg:sr-only lg:group-data-[collapsed=true]/sidebar:sr-only")}>
                <span className="block truncate">{text(p.short)}</span>
                <span className="block truncate text-xs font-normal text-sidebar-muted">{text(p.screens)}</span>
              </span>
              {rail ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute start-full top-1/2 z-50 ms-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--notch-inverse)] px-2.5 py-1.5 text-xs font-medium text-[var(--notch-on-inverse)] opacity-0 shadow-raised transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100 md:max-lg:block lg:group-data-[collapsed=true]/sidebar:block"
                >
                  {text(p.short)}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
