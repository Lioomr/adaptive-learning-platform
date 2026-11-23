"use client";
import { createContext, useContext } from "react";
import type { Role } from "@/types";

/**
 * The active simulated role is fixed by the portal's route layout
 * (app/<portal>/layout.tsx → <AppShell role="…">) and read synchronously during
 * render. It is never copied into the store by an effect, so a control can only
 * act with the role of the route that rendered it — no stale-role window exists
 * while navigating between portals.
 */
const RoleContext = createContext<Role | null>(null);

export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  const role = useContext(RoleContext);
  if (!role) throw new Error("useRole must be used inside a portal layout (AppShell).");
  return role;
}
