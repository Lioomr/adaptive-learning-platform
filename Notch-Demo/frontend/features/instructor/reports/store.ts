"use client";
import { create } from "zustand";

/** Session-only store for revision activities, reminders and mock exams. Nothing is sent anywhere. */
export type Revision = {
  id: string; courseId: string; examId: string; title: string; mode: "class" | "targeted"; conceptKeys: string[]; studentIds: string[];
  start: string; due: string; instructions: string; materialIds: string[]; questionIds: string[]; createdAt: number;
};
export type MockExam = {
  id: string; courseId: string; title: string; minutes: number; totalMarks: number; items: { questionId: string; marks: number }[];
  status: "draft" | "published" | "scheduled"; when?: string; assessmentId?: string;
};
type State = {
  revisions: Revision[]; reminders: string[]; mockExams: MockExam[]; seq: number;
  addRevision: (r: Omit<Revision, "id" | "createdAt">) => string;
  removeRevision: (id: string) => void;
  remind: (key: string) => void;
  saveMock: (m: Omit<MockExam, "id"> & { id?: string }) => string;
  patchMock: (id: string, p: Partial<MockExam>) => void;
  removeMock: (id: string) => void;
};
export const useReports = create<State>()((set, get) => ({
  revisions: [], reminders: [], mockExams: [], seq: 1,
  addRevision: (r) => { const id = `REV-${100 + get().seq}`; set((s) => ({ seq: s.seq + 1, revisions: [{ ...r, id, createdAt: s.seq }, ...s.revisions] })); return id; },
  removeRevision: (id) => set((s) => ({ revisions: s.revisions.filter((r) => r.id !== id) })),
  remind: (key) => set((s) => ({ reminders: s.reminders.includes(key) ? s.reminders : [...s.reminders, key] })),
  saveMock: (m) => { const id = m.id ?? `MOCK-${100 + get().seq}`; set((s) => ({ seq: m.id ? s.seq : s.seq + 1, mockExams: m.id ? s.mockExams.map((x) => (x.id === id ? { ...x, ...m, id } : x)) : [{ ...m, id }, ...s.mockExams] })); return id; },
  patchMock: (id, p) => set((s) => ({ mockExams: s.mockExams.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
  removeMock: (id) => set((s) => ({ mockExams: s.mockExams.filter((x) => x.id !== id) })),
}));
