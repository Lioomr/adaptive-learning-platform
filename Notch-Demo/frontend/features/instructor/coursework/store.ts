"use client";
import { create } from "zustand";
import { defaultExt, seedComms, seedSessions, seedThreads, type AExt, type AStatus, type Comm, type CourseId, type Msg, type Records, type SMeta, type Session, type Thread } from "./data";

export type ComposePreset = { courseId?: string; kind?: Comm["kind"]; audience?: Comm["audience"]; title?: string; body?: string };
type State = {
  ext: Record<string, AExt>;
  subMeta: Record<string, SMeta>;
  sessions: Session[];
  records: Records;
  edited: string[];
  comms: Comm[];
  threads: Thread[];
  /** UI hand-offs between the page header and the tabs. */
  wizard: string | null;
  compose: ComposePreset | null;
  notice: string;
  setExt: (id: string, patch: Partial<AExt> | AExt) => void;
  setMeta: (id: string, patch: Partial<SMeta>) => void;
  saveAttendance: (sessionId: string, rec: Record<string, AStatus>) => void;
  addComm: (c: Comm) => void;
  patchComm: (id: string, p: Partial<Comm>) => void;
  removeComm: (id: string) => void;
  reply: (threadId: string, msg: Msg) => void;
  startThread: (courseId: CourseId, studentId: string, subject: Thread["subject"], msg: Msg) => void;
  patchThread: (id: string, p: Partial<Thread>) => void;
  openWizard: (id: string | null) => void;
  openCompose: (p: ComposePreset | null) => void;
  say: (m: string) => void;
};
const base = seedSessions();
export const useWork = create<State>()((set) => ({
  ext: {}, subMeta: {}, sessions: base.sessions, records: base.records, edited: [], comms: seedComms(), threads: seedThreads(),
  wizard: null, compose: null, notice: "",
  setExt: (id, patch) => set((s) => ({ ext: { ...s.ext, [id]: { ...(s.ext[id] ?? defaultExt()), ...patch } } })),
  setMeta: (id, patch) => set((s) => ({ subMeta: { ...s.subMeta, [id]: { ...s.subMeta[id], ...patch, attempts: patch.attempts ?? s.subMeta[id]?.attempts ?? 1 } } })),
  saveAttendance: (sid, rec) => set((s) => ({ records: { ...s.records, [sid]: rec }, edited: s.sessions.find((x) => x.id === sid)?.recorded ? [...new Set([...s.edited, sid])] : s.edited, sessions: s.sessions.map((x) => (x.id === sid ? { ...x, recorded: true } : x)) })),
  addComm: (c) => set((s) => ({ comms: [c, ...s.comms] })),
  patchComm: (id, p) => set((s) => ({ comms: s.comms.map((c) => (c.id === id ? { ...c, ...p } : c)) })),
  removeComm: (id) => set((s) => ({ comms: s.comms.filter((c) => c.id !== id) })),
  reply: (id, msg) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, messages: [...t.messages, msg], unread: false } : t)) })),
  startThread: (courseId, studentId, subject, msg) => set((s) => {
    const existing = s.threads.find((t) => t.courseId === courseId && t.studentId === studentId);
    return existing ? { threads: s.threads.map((t) => (t === existing ? { ...t, messages: [...t.messages, msg] } : t)) } : { threads: [{ id: `t-${s.threads.length + 1}-${studentId}`, courseId, studentId, subject, messages: [msg], unread: false, resolved: false }, ...s.threads] };
  }),
  patchThread: (id, p) => set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  openWizard: (wizard) => set({ wizard }),
  openCompose: (compose) => set({ compose }),
  say: (notice) => set({ notice }),
}));
