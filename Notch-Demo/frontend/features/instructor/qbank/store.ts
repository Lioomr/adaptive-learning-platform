"use client";
import { create } from "zustand";
import {
  defaultStyle, newId, type Bank, type Bloom, type Diff, type ExamFile, type ExamStyle, type Feedback, type Lang,
  type QStatus, type QType, type Question,
} from "./data";
import { generate, validate, type GenSpec } from "./generator";

/**
 * Session-only store for the Question Bank and the Assessment Center demo.
 * Nothing is persisted or sent anywhere; a refresh restores the seeded data.
 */
export type Tab = "questions" | "pending" | "concepts" | "style";
export type Filters = {
  q: string; concept: string; lecture: string; type: string; difficulty: string; bloom: string;
  lang: string; status: string; marksMin: number; marksMax: number; sort: string; page: number;
};
export const defaultFilters = (): Filters => ({
  q: "", concept: "all", lecture: "all", type: "all", difficulty: "all", bloom: "all", lang: "all",
  status: "all", marksMin: 0, marksMax: 100, sort: "recent", page: 1,
});
export type AssessmentKind = "diagnostic" | "quiz" | "practice" | "exam";
export type Assessment = {
  id: string; title: string; kind: AssessmentKind; minutes: number; grading: "auto" | "mixed";
  items: { questionId: string; marks: number }[]; saved: boolean;
};

export const fullFeedback: Feedback = { showCorrect: true, explanations: true, explainWrong: true, hints: true, steps: true, multipleAttempts: true };
export const noFeedback: Feedback = { showCorrect: false, explanations: false, explainWrong: false, hints: false, steps: false, multipleAttempts: false };

type Seed = [Bank, string, QType, Diff, Bloom, number, Lang, QStatus, string?];
const seeds: Seed[] = [
  ["practice", "prob", "mcq", "easy", "remember", 1, "both", "approved"],
  ["practice", "prob", "math", "easy", "apply", 2, "both", "approved"],
  ["practice", "cond", "mcq", "medium", "understand", 2, "both", "approved"],
  ["practice", "cond", "math", "medium", "apply", 3, "both", "approved"],
  ["practice", "cond", "tf", "easy", "remember", 1, "en", "approved"],
  ["practice", "indep", "math", "medium", "apply", 3, "both", "approved"],
  ["practice", "bayes", "math", "hard", "analyze", 4, "both", "approved"],
  ["practice", "rv", "math", "easy", "apply", 2, "ar", "approved"],
  ["practice", "dist", "numeric", "medium", "apply", 3, "both", "approved"],
  ["practice", "ev", "math", "medium", "apply", 3, "both", "approved"],
  ["practice", "ev", "short", "medium", "understand", 2, "en", "approved"],
  ["practice", "joint", "math", "medium", "apply", 3, "both", "approved"],
  ["practice", "indep", "matching", "medium", "understand", 2, "both", "approved"],
  ["practice", "dist", "mcq", "medium", "understand", 2, "both", "pending"],
  ["practice", "bayes", "mcq", "hard", "analyze", 3, "both", "pending", "relevance"],
  ["practice", "rv", "fill", "easy", "remember", 1, "both", "pending"],
  ["practice", "prob", "essay", "hard", "evaluate", 5, "en", "pending"],
  ["practice", "joint", "tf", "easy", "remember", 1, "both", "rejected"],
  ["exam", "cond", "math", "medium", "apply", 5, "both", "approved"],
  ["exam", "ev", "math", "hard", "apply", 5, "both", "approved"],
  ["exam", "dist", "numeric", "medium", "apply", 5, "both", "approved"],
  ["exam", "prob", "mcq", "easy", "remember", 2, "both", "approved"],
  ["exam", "bayes", "short", "hard", "analyze", 3, "both", "approved"],
  ["exam", "indep", "tf", "easy", "remember", 1, "both", "approved"],
  ["exam", "joint", "math", "medium", "apply", 5, "both", "approved"],
  ["exam", "cond", "mcq", "medium", "apply", 2, "both", "approved"],
  ["exam", "rv", "mcq", "medium", "understand", 2, "both", "pending"],
  ["exam", "ev", "short", "medium", "understand", 3, "both", "pending"],
  ["exam", "dist", "math", "hard", "analyze", 5, "both", "pending", "math"],
  ["exam", "prob", "tf", "easy", "remember", 1, "both", "rejected"],
];
function seedQuestions(): Question[] {
  const out: Question[] = [];
  let p = 1000, e = 2000;
  seeds.forEach(([bank, concept, type, difficulty, bloom, marks, lang, status, flag], i) => {
    const id = bank === "practice" ? `PQ-${++p}` : `EQ-${++e}`;
    const conceptIds = bank === "exam" && type === "short" ? [concept, "cond"] : [concept];
    const q = generate({ bank, type, difficulty, bloom, marks, lang, conceptIds, feedback: bank === "practice" ? fullFeedback : noFeedback, seed: 100 + i * 7, wording: bank === "exam" ? (i % 2 ? "scenario" : "direct") : undefined }, id);
    q.status = status;
    q.createdAt = `2026-11-${String(10 + (i % 10)).padStart(2, "0")}T09:00:00+02:00`;
    if (flag) q.validation[flag as "relevance" | "math"] = { status: flag === "math" ? "failed" : "review", note: flag === "math" ? ["Re-computation gave a different final value.", "أعطت إعادة الحساب قيمة نهائية مختلفة."] : ["The wording is only loosely tied to the selected concept.", "الصياغة مرتبطة بالمفهوم المحدد بشكل فضفاض فقط."] };
    out.push(q);
  });
  return out;
}

type State = {
  questions: Question[];
  style: ExamStyle;
  bank: Bank;
  tab: Record<Bank, Tab>;
  filters: Record<Bank, Filters>;
  selected: Record<Bank, string[]>;
  notice: string;
  assessments: Assessment[];
  seq: number;
  notify: (m: string) => void;
  setBank: (b: Bank) => void;
  setTab: (b: Bank, t: Tab) => void;
  setFilters: (b: Bank, p: Partial<Filters>) => void;
  resetFilters: (b: Bank) => void;
  toggle: (b: Bank, id: string) => void;
  setSelected: (b: Bank, ids: string[]) => void;
  addGenerated: (qs: Question[]) => void;
  nextIds: (bank: Bank, n: number) => string[];
  setStatus: (id: string, status: QStatus) => void;
  archive: (ids: string[]) => void;
  restore: (id: string) => void;
  edit: (id: string, patch: Partial<Question>, approve?: boolean) => void;
  regenerate: (id: string) => void;
  duplicate: (id: string, toBank?: Bank) => string | null;
  setStyle: (p: Partial<ExamStyle>) => void;
  addExamFiles: (files: { name: string; size: number }[]) => void;
  removeExamFile: (id: string) => void;
  analyzeExamFile: (id: string) => void;
  createAssessment: (a: Omit<Assessment, "id" | "saved">) => string;
  updateAssessment: (id: string, p: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  reset: () => void;
};

const timers = new Map<string, ReturnType<typeof setTimeout>>();
export const useQb = create<State>()((set, get) => {
  const patchQ = (id: string, fn: (q: Question) => Question) => set((s) => ({ questions: s.questions.map((q) => (q.id === id ? fn(q) : q)) }));
  return {
    questions: seedQuestions(),
    style: defaultStyle(),
    bank: "practice",
    tab: { practice: "questions", exam: "questions" },
    filters: { practice: defaultFilters(), exam: defaultFilters() },
    selected: { practice: [], exam: [] },
    notice: "",
    assessments: [],
    seq: 3000,
    notify: (notice) => set({ notice }),
    setBank: (bank) => set({ bank }),
    setTab: (b, t) => set((s) => ({ tab: { ...s.tab, [b]: t } })),
    setFilters: (b, p) => set((s) => ({ filters: { ...s.filters, [b]: { ...s.filters[b], ...p, page: "page" in p ? (p.page as number) : 1 } } })),
    resetFilters: (b) => set((s) => ({ filters: { ...s.filters, [b]: defaultFilters() } })),
    toggle: (b, id) => set((s) => ({ selected: { ...s.selected, [b]: s.selected[b].includes(id) ? s.selected[b].filter((x) => x !== id) : [...s.selected[b], id] } })),
    setSelected: (b, ids) => set((s) => ({ selected: { ...s.selected, [b]: ids } })),
    nextIds: (bank, n) => {
      const start = get().seq;
      set({ seq: start + n });
      return Array.from({ length: n }, (_, i) => `${bank === "practice" ? "PQ" : "EQ"}-${start + i + 1}`);
    },
    addGenerated: (qs) => set((s) => ({ questions: [...qs, ...s.questions] })),
    setStatus: (id, status) => patchQ(id, (q) => ({ ...q, status })),
    archive: (ids) => set((s) => ({ questions: s.questions.map((q) => (ids.includes(q.id) ? { ...q, status: "archived" } : q)), selected: { practice: s.selected.practice.filter((x) => !ids.includes(x)), exam: s.selected.exam.filter((x) => !ids.includes(x)) } })),
    restore: (id) => patchQ(id, (q) => ({ ...q, status: "pending" })),
    edit: (id, p, approve) =>
      set((s) => {
        const old = s.questions.find((q) => q.id === id);
        if (!old) return {};
        const next = { ...old, ...p, status: approve ? "approved" : old.status } as Question;
        next.validation = validate(next, s.questions);
        // Edits keep the instructor's own manual approval decision intact.
        return { questions: s.questions.map((q) => (q.id === id ? next : q)) };
      }),
    regenerate: (id) =>
      set((s) => {
        const old = s.questions.find((q) => q.id === id);
        if (!old) return {};
        const spec: GenSpec = { bank: old.bank, type: old.type, difficulty: old.difficulty, bloom: old.bloom, marks: old.marks, lang: old.lang, conceptIds: old.conceptIds, feedback: old.feedback, seed: old.seed + 13, wording: old.pattern?.startsWith("scenario") ? "scenario" : old.pattern?.startsWith("multipart") ? "multipart" : "direct", prerequisite: old.prerequisite };
        const fresh = generate(spec, old.id, s.questions.filter((q) => q.id !== old.id));
        return { questions: s.questions.map((q) => (q.id === id ? { ...fresh, status: "pending" } : q)) };
      }),
    duplicate: (id, toBank) => {
      const s = get();
      const old = s.questions.find((q) => q.id === id);
      if (!old) return null;
      const bank = toBank ?? old.bank;
      const [nid] = s.nextIds(bank, 1);
      const copy: Question = { ...old, id: nid, bank, status: "pending", createdAt: new Date().toISOString(), feedback: bank === "practice" ? fullFeedback : noFeedback, pattern: bank === "exam" ? old.pattern ?? "direct" : undefined };
      copy.validation = validate(copy, [...s.questions.filter((q) => q.bank === bank)]);
      set({ questions: [copy, ...s.questions] });
      return nid;
    },
    setStyle: (p) => set((s) => ({ style: { ...s.style, ...p } })),
    addExamFiles: (files) =>
      set((s) => ({ style: { ...s.style, files: [...s.style.files, ...files.map((f): ExamFile => ({ id: newId("x"), name: f.name, size: f.size, status: "uploaded" }))] } })),
    removeExamFile: (id) => set((s) => ({ style: { ...s.style, files: s.style.files.filter((f) => f.id !== id) } })),
    analyzeExamFile: (id) => {
      const setFile = (status: ExamFile["status"]) => set((s) => ({ style: { ...s.style, files: s.style.files.map((f) => (f.id === id ? { ...f, status } : f)) } }));
      setFile("analyzing");
      if (timers.has(id)) clearTimeout(timers.get(id)!);
      timers.set(id, setTimeout(() => {
        setFile("analyzed");
        set((s) => ({ style: { ...s.style, traits: s.style.traits ?? { lengthWords: 38, patterns: "Short scenario → compute → interpret; conditional-probability and expectation problems with 2–3 steps", notes: "Marks per question grow with the number of steps; MCQs use four options." } } }));
      }, 1800));
    },
    createAssessment: (a) => {
      const id = newId("as");
      set((s) => ({ assessments: [{ ...a, id, saved: false }, ...s.assessments] }));
      return id;
    },
    updateAssessment: (id, p) => set((s) => ({ assessments: s.assessments.map((a) => (a.id === id ? { ...a, ...p } : a)) })),
    deleteAssessment: (id) => set((s) => ({ assessments: s.assessments.filter((a) => a.id !== id) })),
    reset: () => set({ questions: seedQuestions(), style: defaultStyle(), filters: { practice: defaultFilters(), exam: defaultFilters() }, selected: { practice: [], exam: [] }, assessments: [] }),
  };
});

export const isApproved = (q: Question) => q.status === "approved";
