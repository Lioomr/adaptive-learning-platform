"use client";
import { LanguageControl } from "@/features/student/portal/language-control";
import { InstructorLanguageControl } from "@/features/instructor/portal/language-control";
import { InstructorTopbarExtras } from "@/features/instructor/dashboard/topbar-extras";
import { useShellCopy } from "@/components/layout/shell-copy";
import Link from "next/link";
import { ChevronRight, FlaskConical } from "lucide-react";
import { ContextControls } from "@/components/layout/context-selectors";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { BrandMark } from "@/components/layout/brand";
import { AppearanceControl } from "./appearance";
import { Badge } from "@/components/ui/badge";
import { portalFor, routes } from "@/lib/routes";
import type { Role } from "@/types";

/** 64px sticky top bar: navigation trigger (mobile), breadcrumb, context (≥1280px) and demo status. */
export function Topbar({ role, studentWorkspace = false }: { role: Role; studentWorkspace?: boolean }) {
  const { text } = useShellCopy();
  const portal = portalFor(role);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="flex h-[var(--header-height)] items-center gap-3 px-[var(--notch-grid-margin)]">
        <MobileNavigation role={role} />
        <Link href={routes.demo} className="rounded-md md:hidden" aria-label={text("Notch demo home")}>
          <BrandMark />
        </Link>
        <nav aria-label={text("Breadcrumb")} className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            <li className="hidden shrink-0 text-muted-foreground sm:block">
              <Link href={routes.demo} className="rounded-sm hover:text-foreground">Notch</Link>
            </li>
            <li aria-hidden="true" className="hidden text-muted-foreground sm:block">
              <ChevronRight className="size-4 rtl:-scale-x-100" />
            </li>
            <li className="min-w-0 truncate font-semibold text-foreground" aria-current="page">{text(portal.label)}</li>
          </ol>
        </nav>
        {/* The Control Center has its own large context selectors. */}
        {role !== "demo" && !studentWorkspace ? <ContextControls hideLabel className="hidden w-[420px] shrink-0 xl:grid" /> : null}
        {role === "student" && <LanguageControl />}
        {role === "instructor" && studentWorkspace && <><InstructorLanguageControl /><InstructorTopbarExtras /></>}
        <AppearanceControl />
        <Badge tone="ai" className="hidden sm:inline-flex" title={text("All people and outcomes are fictional and simulated")}>
          <FlaskConical aria-hidden="true" />
          {text("Demo · Simulated")}
        </Badge>
      </div>
    </header>
  );
}

/** Context strip below the top bar on screens narrower than 1280px. */
export function ContextStrip({ role, studentWorkspace = false }: { role: Role; studentWorkspace?: boolean }) {
  const { text } = useShellCopy();
  if (role === "demo" || studentWorkspace) return null;
  return (
    <section aria-label={text("Demo context")} className="border-b border-border bg-card px-[var(--notch-grid-margin)] py-3 xl:hidden">
      <ContextControls className="mx-auto max-w-[1280px] sm:max-w-md sm:ms-0" />
    </section>
  );
}
