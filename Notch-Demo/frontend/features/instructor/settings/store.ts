"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaults, defaultCourse, defaultLanguage, defaultNotifs, defaultProfile, seedTeam, type SectionId, type Settings } from "./data";

type State = {
  /** Last saved settings per instructor. Persisted in this browser only. */
  saved: Record<string, Settings>;
  /** Unsaved edits per instructor. Kept while you move between sections, lost on reload. */
  draft: Record<string, Settings>;
  current: (id: string) => Settings;
  savedOf: (id: string) => Settings;
  edit: (id: string, fn: (s: Settings) => Settings) => void;
  save: (id: string) => void;
  discard: (id: string) => void;
  reset: (id: string, section: SectionId, courseId?: string) => void;
  /** Immediate actions (access requests) apply to both the saved and the draft copy. */
  both: (id: string, fn: (s: Settings) => Settings) => void;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
function resetSection(from: Settings, id: string, section: SectionId, courseId?: string): Settings {
  const base = clone(from);
  if (section === "profile") base.profile = defaultProfile(id);
  if (section === "course" && courseId) base.courses[courseId] = { ...base.courses[courseId], course: defaultCourse(courseId).course };
  if (section === "ai" && courseId) base.courses[courseId] = { ...base.courses[courseId], ai: defaultCourse(courseId).ai };
  if (section === "notifications") base.notifications = defaultNotifs();
  if (section === "permissions") { base.requests = []; for (const c of Object.keys(base.team)) base.team[c] = seedTeam(id, c as never); }
  if (section === "language") base.language = defaultLanguage();
  return base;
}
export const useSettings = create<State>()(
  persist(
    (set, get) => ({
      saved: {}, draft: {},
      savedOf: (id) => get().saved[id] ?? defaults(id),
      current: (id) => get().draft[id] ?? get().saved[id] ?? defaults(id),
      edit: (id, fn) => set((s) => ({ draft: { ...s.draft, [id]: fn(clone(s.draft[id] ?? s.saved[id] ?? defaults(id))) } })),
      save: (id) => set((s) => { const next = s.draft[id]; if (!next) return s; const { [id]: _drop, ...rest } = s.draft; void _drop; return { saved: { ...s.saved, [id]: next }, draft: rest }; }),
      discard: (id) => set((s) => { const { [id]: _drop, ...rest } = s.draft; void _drop; return { draft: rest }; }),
      both: (id, fn) => set((s) => ({ saved: { ...s.saved, [id]: fn(clone(s.saved[id] ?? defaults(id))) }, draft: s.draft[id] ? { ...s.draft, [id]: fn(clone(s.draft[id])) } : s.draft })),
      // Resetting a section applies to the saved copy and to any draft, so other sections keep their unsaved edits.
      reset: (id, section, courseId) => set((s) => ({ saved: { ...s.saved, [id]: resetSection(s.saved[id] ?? defaults(id), id, section, courseId) }, draft: s.draft[id] ? { ...s.draft, [id]: resetSection(s.draft[id], id, section, courseId) } : s.draft })),
    }),
    { name: "notch-instructor-settings-v1", storage: createJSONStorage(() => localStorage), skipHydration: true, partialize: (s) => ({ saved: s.saved }) as never },
  ),
);
