"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultInstructorId,
  instructorAccounts,
  isCourseId,
  seedContent,
  type CollectionKey,
  type Content,
  type StudentSubmission,
} from "./data";

type Item<K extends CollectionKey> = Content[K][number];
type State = {
  language: "en" | "ar";
  instructorId: string;
  content: Content;
  storageUnavailable: boolean;
  setLanguage: (language: "en" | "ar") => void;
  setInstructor: (id: string) => void;
  /** Create or replace an item by id. Future API: POST/PUT on the collection. */
  upsert: <K extends CollectionKey>(key: K, item: Item<K>) => void;
  /** Delete an item. Removing an assignment also removes its submissions. */
  remove: (key: CollectionKey, id: string) => void;
  /** Save a grade and feedback for one student's work. Future API: PATCH submission. */
  review: (
    id: string,
    patch: Pick<StudentSubmission, "grade" | "feedback">,
  ) => void;
  /** Set or clear one gradebook cell, creating the submission record if needed. */
  setGrade: (
    courseId: StudentSubmission["courseId"],
    assignmentId: string,
    studentId: string,
    grade: number | undefined,
  ) => void;
  reset: () => void;
};

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const copy = (v: unknown) =>
  Array.isArray(v) &&
  v.length === 2 &&
  v.every((x) => typeof x === "string" && x.length <= 20000);
/** Keep only well-formed items; a malformed collection falls back to the seed. */
function collection<T>(
  value: unknown,
  fallback: T[],
  ok: (item: Record<string, unknown>) => boolean,
): T[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter(
    (i): i is Record<string, unknown> =>
      record(i) &&
      typeof i.id === "string" &&
      typeof i.courseId === "string" &&
      isCourseId(i.courseId) &&
      ok(i),
  );
  return items.length === value.length ? (items as T[]) : fallback;
}
function restore(value: unknown): Pick<State, "language" | "instructorId" | "content"> {
  const seed = seedContent();
  const result = { language: "en" as const, instructorId: defaultInstructorId, content: seed };
  if (!record(value)) return result;
  const language = value.language === "ar" ? "ar" : "en";
  const instructorId =
    typeof value.instructorId === "string" &&
    instructorAccounts.some((i) => i.id === value.instructorId)
      ? value.instructorId
      : defaultInstructorId;
  const c = record(value.content) ? value.content : {};
  return {
    language,
    instructorId,
    content: {
      announcements: collection(c.announcements, seed.announcements, (i) => copy(i.title) && copy(i.body) && typeof i.date === "string"),
      lessons: collection(c.lessons, seed.lessons, (i) => copy(i.title) && (i.kind === "lecture" || i.kind === "lab") && typeof i.minutes === "number"),
      assignments: collection(c.assignments, seed.assignments, (i) => copy(i.title) && copy(i.instructions) && typeof i.maxGrade === "number" && Array.isArray(i.attachments)),
      submissions: collection(c.submissions, seed.submissions, (i) => typeof i.assignmentId === "string" && typeof i.studentId === "string" && copy(i.text)),
      materials: collection(c.materials, seed.materials, (i) => copy(i.title) && copy(i.description)),
    },
  };
}

export const useInstructorPortal = create<State>()(
  persist(
    (set) => ({
      language: "en",
      instructorId: defaultInstructorId,
      content: seedContent(),
      storageUnavailable: false,
      setLanguage: (language) => set({ language }),
      setInstructor: (instructorId) => set({ instructorId }),
      upsert: (key, item) =>
        set((s) => {
          const list = s.content[key] as { id: string }[];
          const next = list.some((x) => x.id === item.id)
            ? list.map((x) => (x.id === item.id ? item : x))
            : [item, ...list];
          return { content: { ...s.content, [key]: next } };
        }),
      remove: (key, id) =>
        set((s) => ({
          content: {
            ...s.content,
            [key]: (s.content[key] as { id: string }[]).filter((x) => x.id !== id),
            ...(key === "assignments"
              ? { submissions: s.content.submissions.filter((x) => x.assignmentId !== id) }
              : {}),
          },
        })),
      review: (id, patch) =>
        set((s) => ({
          content: {
            ...s.content,
            submissions: s.content.submissions.map((x) =>
              x.id === id
                ? { ...x, ...patch, status: patch.grade === undefined ? "submitted" : "graded" }
                : x,
            ),
          },
        })),
      setGrade: (courseId, assignmentId, studentId, grade) =>
        set((s) => {
          const id = `${assignmentId}:${studentId}`;
          const existing = s.content.submissions.find((x) => x.id === id);
          const base: StudentSubmission = existing ?? {
            id,
            assignmentId,
            courseId,
            studentId,
            status: "missing",
            text: ["", ""],
          };
          const updated: StudentSubmission = {
            ...base,
            grade,
            status: grade === undefined ? (base.text[0] ? "submitted" : "missing") : "graded",
          };
          return {
            content: {
              ...s.content,
              submissions: existing
                ? s.content.submissions.map((x) => (x.id === id ? updated : x))
                : [...s.content.submissions, updated],
            },
          };
        }),
      reset: () => set({ content: seedContent() }),
    }),
    {
      name: "notch-instructor-portal-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            queueMicrotask(() => useInstructorPortal.setState({ storageUnavailable: true }));
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            queueMicrotask(() => {
              if (!useInstructorPortal.getState().storageUnavailable)
                useInstructorPortal.setState({ storageUnavailable: true });
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
      partialize: (s) => ({ language: s.language, instructorId: s.instructorId, content: s.content }),
      merge: (saved, current) => ({ ...current, ...restore(saved) }),
    },
  ),
);
