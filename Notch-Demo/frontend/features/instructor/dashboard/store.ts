"use client";
import { create } from "zustand";
import { incomingFeed, NOW, oobFor, seed, type Activity, type Approval, type ContentIssue, type Copy, type CourseId, type OobQuestion, type OobStatus } from "./data";

/**
 * Session-only store behind every dashboard count. Approving, resolving or following up
 * here changes the dashboard, the sidebar badge and the notifications immediately.
 */
export type OobNotice = { id: string; questionId: string; courseId: CourseId; at: string; read: boolean };
type State = ReturnType<typeof seed> & {
  contacted: string[];
  /** One entry per unresolved out-of-bound question; never duplicated. */
  notices: OobNotice[];
  feedIndex: number;
  readNotifications: boolean;
  log: (courseId: CourseId, kind: Activity["kind"], text: Copy) => void;
  decide: (id: string, status: "approved" | "rejected") => void;
  resolveIssue: (id: string) => void;
  contact: (riskId: string) => void;
  markRead: () => void;
  /** Simulates the tutor detecting a new out-of-bound question. Returns its id. */
  arrive: () => { id: string; created: boolean };
  setOob: (id: string, status: OobStatus) => void;
  answerOob: (id: string, answer: string, reuse: boolean) => void;
  addMaterial: (id: string, fileName: string) => void;
  reopenOob: (id: string) => void;
  reset: () => void;
};
const open = (q: OobQuestion) => q.status === "open";

export const useDash = create<State>()((set, get) => ({
  ...seed(),
  contacted: [],
  notices: [],
  feedIndex: 0,
  readNotifications: false,
  log: (courseId, kind, text) => set((s) => ({ activity: [{ id: `n-${s.activity.length}-${Date.now()}`, courseId, kind, text, at: NOW }, ...s.activity] })),
  decide: (id, status) => {
    const item = get().approvals.find((a) => a.id === id);
    if (!item) return;
    set((s) => ({ approvals: s.approvals.map((a) => (a.id === id ? { ...a, status } : a)) }));
    get().log(item.courseId, "approval", [`${status === "approved" ? "Approved" : "Rejected"}: ${item.title[0]}`, `${status === "approved" ? "تم اعتماد" : "تم رفض"}: ${item.title[1]}`]);
  },
  resolveIssue: (id) => {
    const item = get().issues.find((a) => a.id === id);
    if (!item) return;
    set((s) => ({ issues: s.issues.map((a) => (a.id === id ? { ...a, resolved: true } : a)) }));
    get().log(item.courseId, "upload", [`Resolved: ${item.title[0]}`, `تمت المعالجة: ${item.title[1]}`]);
  },
  contact: (riskId) => set((s) => ({ contacted: [...new Set([...s.contacted, riskId])] })),
  markRead: () => set((s) => ({ readNotifications: true, notices: s.notices.map((n) => ({ ...n, read: true })) })),
  arrive: () => {
    const s = get();
    const feed = incomingFeed[s.feedIndex % incomingFeed.length];
    const at = new Date(new Date(NOW).getTime() + (s.feedIndex + 1) * 60000).toISOString();
    const made = oobFor(feed.courseId, feed.reason, feed.conceptIndex);
    // The same unresolved question from another student merges into the existing one, with no new notification.
    const existing = feed.duplicate
      ? s.oob.find((q) => open(q) && q.courseId === feed.courseId && q.reason === feed.reason)
      : s.oob.find((q) => open(q) && q.courseId === feed.courseId && q.question[0] === (feed.question ?? made.question)[0]);
    if (existing) {
      set((st) => ({ feedIndex: st.feedIndex + 1, oob: st.oob.map((q) => (q.id === existing.id ? { ...q, repeats: q.repeats + 1, at, students: q.students.includes(feed.student) ? q.students : [...q.students, feed.student] } : q)) }));
      return { id: existing.id, created: false };
    }
    const id = `${feed.courseId}-oob-new-${s.feedIndex}`;
    const q: OobQuestion = { id, courseId: feed.courseId, concept: feed.reason === "unrelated" ? undefined : made.concept, students: [feed.student], question: feed.question ?? made.question, at, reason: feed.reason, response: made.response, repeats: 1, status: "open" };
    set((st) => ({ feedIndex: st.feedIndex + 1, oob: [q, ...st.oob], notices: [{ id: `nt-${id}`, questionId: id, courseId: feed.courseId, at, read: false }, ...st.notices.filter((n) => n.questionId !== id)], readNotifications: false }));
    return { id, created: true };
  },
  setOob: (id, status) => {
    const q = get().oob.find((x) => x.id === id);
    if (!q) return;
    set((s) => ({ oob: s.oob.map((x) => (x.id === id ? { ...x, status } : x)) }));
    const verb: Record<OobStatus, [string, string]> = { open: ["Reopened", "أُعيد فتح"], reviewed: ["Reviewed", "تمت مراجعة"], answered: ["Answered", "تمت الإجابة عن"], "out-of-scope": ["Marked out of scope", "وُسم خارج النطاق"], dismissed: ["Dismissed", "تم تجاهل"] };
    get().log(q.courseId, "help", [`${verb[status][0]} tutor question: ${q.question[0]}`, `${verb[status][1]} سؤال المساعد: ${q.question[1]}`]);
  },
  answerOob: (id, answer, reuse) => {
    set((s) => ({ oob: s.oob.map((x) => (x.id === id ? { ...x, status: "answered", approvedAnswer: answer, reuse } : x)) }));
    const q = get().oob.find((x) => x.id === id)!;
    get().log(q.courseId, "help", [`Approved an answer${reuse ? " (stored as a reviewed response)" : ""}: ${q.question[0]}`, `اعتُمدت إجابة${reuse ? " (حُفظت كرد مراجَع)" : ""}: ${q.question[1]}`]);
  },
  addMaterial: (id, fileName) => {
    set((s) => ({ oob: s.oob.map((x) => (x.id === id ? { ...x, material: fileName, status: x.status === "open" ? "reviewed" : x.status } : x)) }));
    const q = get().oob.find((x) => x.id === id)!;
    get().log(q.courseId, "upload", [`Material added for a tutor question: ${fileName}`, `أُضيفت مادة لسؤال المساعد: ${fileName}`]);
  },
  reopenOob: (id) => set((s) => ({ oob: s.oob.map((x) => (x.id === id ? { ...x, status: "open" } : x)) })),
  reset: () => set({ ...seed(), contacted: [], notices: [], feedIndex: 0, readNotifications: false }),
}));
export type { Approval, ContentIssue, OobQuestion };
