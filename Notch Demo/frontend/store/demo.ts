"use client";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { findCourse } from "@/data/fixtures";
import { can, ROLE_DENIED_MESSAGE } from "@/lib/permissions";
import { evaluateSubmission } from "@/services/assessment";
import { baselineData, SCHEMA_VERSION, STORAGE_KEY, validateDemoData } from "@/services/persistence";
import type { CourseId, DemoData, Role, SubmissionResult } from "@/types";

/**
 * The single shared client store for all portals.
 * - Persisted data (schema v2): students, attempts, selected student and course.
 * - Not persisted: storage status. The active role is NOT stored here; it is
 *   derived from the route (components/layout/role-context.tsx) and passed to
 *   each permission-checked action, so a stale role can never authorize an action.
 * - Hydration is manual (`skipHydration`) and runs after mount, so server and
 *   first client render always match.
 */
export type StorageStatus = "pending" | "fresh" | "restored" | "reset-invalid" | "reset-version" | "unavailable";
export type ActionResult = { ok: true } | { ok: false; error: string };

type State = DemoData & {
  storageStatus: StorageStatus;
  setStudent: (studentId: string, actor: Role) => ActionResult;
  setCourse: (courseId: CourseId, actor: Role) => ActionResult;
  submit: (input: unknown, actor: Role) => SubmissionResult;
  reset: (actor: Role) => ActionResult;
  acknowledgeStorageStatus: () => void;
};

let storageIssue: StorageStatus | null = null;

/** localStorage wrapper that never throws: corrupt JSON or blocked storage fall back to memory. */
const safeStorage: PersistStorage<DemoData> = {
  getItem: name => {
    try {
      const raw = window.localStorage.getItem(name);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as StorageValue<DemoData>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.version !== "number" || !("state" in parsed)) {
        storageIssue = "reset-invalid";
        return null;
      }
      return parsed;
    } catch (error) {
      storageIssue = error instanceof SyntaxError ? "reset-invalid" : "unavailable";
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      storageIssue = "unavailable";
    }
  },
  removeItem: name => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* storage unavailable */
    }
  },
};

const RESET_VERSION = Symbol("reset-version");

export const useDemo = create<State>()(
  persist(
    (set, get) => ({
      ...baselineData(),
      storageStatus: "pending",

      setStudent: (studentId, actor) => {
        if (!can(actor, "context:select-student")) return { ok: false, error: ROLE_DENIED_MESSAGE["context:select-student"] };
        const s = get();
        const student = s.students.find(x => x.id === studentId);
        if (!student) return { ok: false, error: "Unknown student." };
        set({ studentId, courseId: student.enrolledCourseIds.includes(s.courseId) ? s.courseId : student.enrolledCourseIds[0] });
        return { ok: true };
      },

      setCourse: (courseId, actor) => {
        if (!can(actor, "context:select-course")) return { ok: false, error: ROLE_DENIED_MESSAGE["context:select-course"] };
        const s = get();
        if (!findCourse(courseId)) return { ok: false, error: "Unknown course." };
        if (!s.students.find(x => x.id === s.studentId)?.enrolledCourseIds.includes(courseId)) return { ok: false, error: "The selected student is not enrolled in that course." };
        set({ courseId });
        return { ok: true };
      },

      submit: (input, actor) => {
        const s = get();
        const result = evaluateSubmission({ students: s.students, attempts: s.attempts, studentId: s.studentId, courseId: s.courseId }, input, actor);
        if (!result.ok) return result;
        if (!result.duplicate) set({ students: result.data.students, attempts: result.data.attempts });
        return { ok: true, attempt: result.attempt, duplicate: result.duplicate };
      },

      reset: actor => {
        if (!can(actor, "demo:reset")) return { ok: false, error: ROLE_DENIED_MESSAGE["demo:reset"] };
        set({ ...baselineData(), storageStatus: get().storageStatus === "unavailable" ? "unavailable" : "fresh" });
        return { ok: true };
      },

      acknowledgeStorageStatus: () => set(s => (s.storageStatus === "reset-invalid" || s.storageStatus === "reset-version" ? { storageStatus: "restored" } : {})),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: safeStorage,
      skipHydration: true,
      partialize: s => ({ students: s.students, attempts: s.attempts, studentId: s.studentId, courseId: s.courseId }),
      migrate: () => RESET_VERSION as unknown as DemoData,
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error("[adaptlearn] Rehydration failed", error);
      },
      merge: (persisted, current) => {
        if (persisted === undefined || persisted === null) {
          const status = storageIssue ?? "fresh";
          storageIssue = null;
          return { ...current, ...baselineData(), storageStatus: status };
        }
        if ((persisted as unknown) === RESET_VERSION) return { ...current, ...baselineData(), storageStatus: "reset-version" };
        const checked = validateDemoData(persisted);
        if (!checked.ok) {
          if (process.env.NODE_ENV !== "production") console.warn(`[adaptlearn] Stored demo data was reset: ${checked.reason}`);
          return { ...current, ...baselineData(), storageStatus: "reset-invalid" };
        }
        return { ...current, ...checked.data, storageStatus: "restored" };
      },
    },
  ),
);

/**
 * Reads persisted state once per page load, rewrites invalid storage, and
 * follows other tabs. Runs at client module load rather than in an effect:
 * during React hydration `useHydrated` still reports the server snapshot
 * (false), so markup matches, and React re-renders with stored data right after.
 */
let started = false;
export function hydrateDemoStore() {
  if (started || typeof window === "undefined") return;
  started = true;
  void Promise.resolve(useDemo.persist.rehydrate()).then(() => {
    const status = useDemo.getState().storageStatus;
    if (status === "reset-invalid" || status === "reset-version") useDemo.setState({}); // persist the clean baseline
  });
  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) void useDemo.persist.rehydrate();
  });
}

hydrateDemoStore();
