"use client";
import { useState } from "react";
import { FlaskConical, Menu } from "lucide-react";
import { BrandWordmark } from "@/components/layout/brand";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Role } from "@/types";

/** Mobile (<768px) navigation drawer. Radix Dialog provides focus trap, Escape and focus return. */
export function MobileNavigation({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="-ms-2 text-foreground md:hidden" aria-label="Open navigation">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-sidebar text-sidebar-foreground" aria-describedby="mobile-nav-description">
        <div className="flex h-[var(--header-height)] items-center border-b border-sidebar-border px-5">
          <BrandWordmark />
        </div>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription id="mobile-nav-description" className="sr-only">Switch between the demo portals.</SheetDescription>
        <nav aria-label="Portals" className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">Workspaces</p>
          <RoleSwitcher active={role} variant="drawer" onNavigate={() => setOpen(false)} />
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-sidebar-strong">
              <FlaskConical className="size-3.5 text-[#5eead4]" aria-hidden="true" />
              Simulation mode
            </p>
            <p className="mt-1 text-xs leading-5">Fictional students. Progress is simulated and stays in this browser.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
