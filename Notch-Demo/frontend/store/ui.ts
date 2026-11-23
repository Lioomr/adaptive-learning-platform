"use client";
import { create } from "zustand";

/** Presentation-only UI state (not persisted, not part of the data contract). */
type UiState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useUi = create<UiState>()(set => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
