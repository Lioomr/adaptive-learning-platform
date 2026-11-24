"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  assignments,
  courses,
  diagnosticQuestions,
  type CourseId,
} from "./data";

export type Message = { role: "user" | "assistant"; content: string };
export type Profile = {
  preferences?: number[];
  completed: string[];
  submissions: Record<string, string>;
  drafts: Record<string, string>;
  conversations: Partial<Record<CourseId, Message[]>>;
};
export const emptyProfile: Profile = {
  completed: [],
  submissions: {},
  drafts: {},
  conversations: {},
};
type State = {
  language: "en" | "ar";
  profiles: Record<string, Profile>;
  storageUnavailable: boolean;
  setLanguage: (language: "en" | "ar") => void;
  update: (studentId: string, patch: Partial<Profile>) => void;
  complete: (studentId: string, lessonId: string) => void;
};
const validLessonIds = new Set(
  courses.flatMap((c) => [...c.lectures, ...c.labs].map((l) => l.id)),
);
const validAssignmentIds = new Set(assignments.map((a) => a.id));
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
function texts(value: unknown) {
  return record(value)
    ? (Object.fromEntries(
        Object.entries(value).filter(
          ([id, text]) =>
            validAssignmentIds.has(id) &&
            typeof text === "string" &&
            text.length <= 10000,
        ),
      ) as Record<string, string>)
    : {};
}
/** Validate persisted browser data; malformed or old fields never replace actions. */
function restore(value: unknown): Pick<State, "language" | "profiles"> {
  const result: Pick<State, "language" | "profiles"> = {
    language: "en",
    profiles: {},
  };
  if (!record(value)) return result;
  if (value.language === "ar") result.language = "ar";
  if (!record(value.profiles)) return result;
  for (const [id, p] of Object.entries(value.profiles)) {
    if (!id.startsWith("S-") || !record(p)) continue;
    const preferences =
      Array.isArray(p.preferences) &&
      p.preferences.length === diagnosticQuestions.length &&
      p.preferences.every(
        (n, i) =>
          Number.isInteger(n) &&
          n >= 0 &&
          n < diagnosticQuestions[i].options.length,
      )
        ? (p.preferences as number[])
        : undefined;
    const conversations: Profile["conversations"] = {};
    if (record(p.conversations))
      for (const c of courses) {
        const messages = p.conversations[c.id];
        if (Array.isArray(messages))
          conversations[c.id] = messages
            .filter(
              (m): m is Message =>
                record(m) &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string" &&
                m.content.length <= 10000,
            )
            .slice(-60);
      }
    result.profiles[id] = {
      preferences,
      completed: Array.isArray(p.completed)
        ? p.completed.filter(
            (id): id is string =>
              typeof id === "string" && validLessonIds.has(id),
          )
        : [],
      drafts: texts(p.drafts),
      submissions: texts(p.submissions),
      conversations,
    };
  }
  return result;
}
export const useStudentPortal = create<State>()(
  persist(
    (set) => ({
      language: "en",
      profiles: {},
      storageUnavailable: false,
      setLanguage: (language) => set({ language }),
      update: (id, patch) =>
        set((s) => ({
          profiles: {
            ...s.profiles,
            [id]: { ...(s.profiles[id] ?? emptyProfile), ...patch },
          },
        })),
      complete: (id, lessonId) =>
        set((s) => {
          const p = s.profiles[id] ?? emptyProfile;
          return {
            profiles: {
              ...s.profiles,
              [id]: {
                ...p,
                completed: [...new Set([...p.completed, lessonId])],
              },
            },
          };
        }),
    }),
    {
      name: "notch-student-portal-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            queueMicrotask(() =>
              useStudentPortal.setState({ storageUnavailable: true }),
            );
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            queueMicrotask(() => {
              if (!useStudentPortal.getState().storageUnavailable)
                useStudentPortal.setState({ storageUnavailable: true });
            });
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            /* In-memory state remains usable. */
          }
        },
      })),
      partialize: (s) => ({ language: s.language, profiles: s.profiles }),
      merge: (saved, current) => ({ ...current, ...restore(saved) }),
    },
  ),
);
