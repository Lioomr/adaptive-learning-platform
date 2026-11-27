"use client";
import { create } from "zustand";
import {
  conceptsFor,
  emptyWorkspace,
  newId,
  sampleFiles,
  type Concept,
  type CourseId,
  type Lecture,
  type Reference,
  type StoredFile,
  type Workspace,
} from "./data";

/**
 * Session-only store for the simulated Semester Preparation workflow. It is not
 * persisted: a browser refresh starts over. Nothing here talks to a backend.
 */
export type ErrorCode = "no-lectures" | "uploading" | "nothing-new";
type Picked = { name: string; size: number };

type State = {
  courseId: CourseId | null;
  semester: string;
  workspaces: Record<string, Workspace>;
  select: (courseId: CourseId, semester: string) => void;
  addLectures: (key: string, files: Picked[]) => void;
  addReferences: (key: string, files: Picked[]) => void;
  addSamples: (key: string, courseId: CourseId) => void;
  editLecture: (key: string, id: string, patch: Partial<Pick<Lecture, "number" | "title">>) => void;
  replaceLecture: (key: string, id: string, file: Picked) => void;
  removeLecture: (key: string, id: string) => void;
  replaceReference: (key: string, id: string, file: Picked) => void;
  removeReference: (key: string, id: string) => void;
  retryFile: (key: string, kind: "lecture" | "reference", id: string) => void;
  setThreshold: (key: string, value: number) => void;
  startExtraction: (key: string, courseId: CourseId) => void;
  approve: (key: string, id: string) => void;
  reject: (key: string, id: string) => void;
  restore: (key: string, id: string) => void;
  editConcept: (key: string, id: string, patch: Partial<Pick<Concept, "en" | "ar" | "definition">>, approve?: boolean) => void;
  merge: (key: string, sourceId: string, targetId: string) => void;
  split: (key: string, id: string, next: { en: string; ar: string }, sourceIndexes: number[]) => void;
  finishReview: (key: string) => void;
};

export const workspaceKey = (courseId: string, semester: string) => `${courseId}:${semester}`;
const timers = new Map<string, ReturnType<typeof setInterval>>();

export const useSemester = create<State>()((set, get) => {
  const patch = (key: string, fn: (w: Workspace) => Partial<Workspace>) =>
    set((s) => {
      const w = s.workspaces[key] ?? emptyWorkspace();
      return { workspaces: { ...s.workspaces, [key]: { ...w, ...fn(w) } } };
    });
  const mapConcept = (key: string, id: string, fn: (c: Concept) => Concept) =>
    patch(key, (w) => ({ concepts: w.concepts.map((c) => (c.id === id ? fn(c) : c)) }));

  /** Simulate an upload: progress ticks to 100%, then the file is "uploaded". */
  function simulateUpload(key: string, kind: "lecture" | "reference", fileId: string) {
    const timerKey = `${key}:${fileId}`;
    if (timers.has(timerKey)) clearInterval(timers.get(timerKey)!);
    const tick = (f: StoredFile): StoredFile =>
      f.id !== fileId || f.status !== "uploading"
        ? f
        : f.progress >= 100
          ? { ...f, progress: 100, status: "uploaded" }
          : { ...f, progress: Math.min(100, f.progress + 25) };
    timers.set(
      timerKey,
      setInterval(() => {
        patch(key, (w) =>
          kind === "lecture"
            ? { lectures: w.lectures.map((l) => (l.file ? { ...l, file: tick(l.file) } : l)) }
            : { references: w.references.map((r) => tick(r) as Reference) },
        );
        const w = get().workspaces[key];
        const file = kind === "lecture" ? w?.lectures.find((l) => l.file?.id === fileId)?.file : w?.references.find((r) => r.id === fileId);
        if (!file || file.status !== "uploading") {
          clearInterval(timers.get(timerKey)!);
          timers.delete(timerKey);
        }
      }, 300),
    );
  }
  const stored = (f: Picked): StoredFile => ({ id: newId("f"), name: f.name, size: f.size, status: "uploading", progress: 0 });
  /** A deliberately failing demo file so the error state can be exercised. */
  const willFail = (name: string) => /corrupt/i.test(name);

  return {
    courseId: null,
    semester: "fall-2026",
    workspaces: {},
    select: (courseId, semester) => set({ courseId, semester }),
    addLectures: (key, files) => {
      const created: Lecture[] = [];
      patch(key, (w) => {
        let next = Math.max(0, ...w.lectures.map((l) => l.number)) + 1;
        for (const f of files) {
          created.push({
            id: newId("lec"),
            number: next,
            title: f.name.replace(/\.(pdf|pptx?)$/i, "").replace(/[-_]+/g, " ").replace(/^lecture\s*\d+\s*/i, "").trim() || `Lecture ${next}`,
            file: stored(f),
            process: "not-processed",
            slides: 18 + (f.name.length % 10),
          });
          next++;
        }
        return { lectures: [...w.lectures, ...created] };
      });
      created.forEach((l) => {
        if (willFail(l.file!.name)) patch(key, (w) => ({ lectures: w.lectures.map((x) => (x.id === l.id ? { ...x, file: { ...x.file!, status: "error", error: "corrupt" } } : x)) }));
        else simulateUpload(key, "lecture", l.file!.id);
      });
    },
    addReferences: (key, files) => {
      const created: Reference[] = files.map((f) => ({ ...stored(f), indexed: false, processing: false }));
      patch(key, (w) => ({ references: [...w.references, ...created] }));
      created.forEach((r) => {
        if (willFail(r.name)) patch(key, (w) => ({ references: w.references.map((x) => (x.id === r.id ? { ...x, status: "error", error: "corrupt" } : x)) }));
        else simulateUpload(key, "reference", r.id);
      });
    },
    addSamples: (key, courseId) => {
      const sample = sampleFiles(courseId);
      patch(key, (w) => ({ lectures: [...w.lectures, ...sample.lectures.map((l, i) => ({ ...l, number: Math.max(0, ...w.lectures.map((x) => x.number)) + 1 + i }))], references: [...w.references, ...sample.references] }));
    },
    editLecture: (key, id, p) => patch(key, (w) => ({ lectures: w.lectures.map((l) => (l.id === id ? { ...l, ...p } : l)) })),
    replaceLecture: (key, id, file) => {
      const f = stored(file);
      patch(key, (w) => ({ lectures: w.lectures.map((l) => (l.id === id ? { ...l, file: f, process: "not-processed" } : l)), reviewed: false, phase: w.phase === "complete" ? "idle" : w.phase }));
      if (willFail(file.name)) patch(key, (w) => ({ lectures: w.lectures.map((l) => (l.id === id && l.file ? { ...l, file: { ...l.file, status: "error", error: "corrupt" } } : l)) }));
      else simulateUpload(key, "lecture", f.id);
    },
    removeLecture: (key, id) =>
      patch(key, (w) => ({
        lectures: w.lectures.filter((l) => l.id !== id),
        // Evidence from a removed lecture goes with it; concepts with no evidence left are dropped.
        concepts: w.concepts
          .map((c) => ({ ...c, sources: c.sources.filter((s) => s.lectureId !== id) }))
          .filter((c) => c.sources.length > 0),
      })),
    replaceReference: (key, id, file) => {
      const f = stored(file);
      patch(key, (w) => ({ references: w.references.map((r) => (r.id === id ? { ...f, indexed: false, processing: false } : r)) }));
      const next = get().workspaces[key].references.find((r) => r.name === file.name && r.status === "uploading");
      if (next && willFail(file.name)) patch(key, (w) => ({ references: w.references.map((r) => (r.id === next.id ? { ...r, status: "error", error: "corrupt" } : r)) }));
      else if (next) simulateUpload(key, "reference", next.id);
    },
    removeReference: (key, id) => patch(key, (w) => ({ references: w.references.filter((r) => r.id !== id) })),
    retryFile: (key, kind, id) => {
      const fix = (f: StoredFile): StoredFile => ({ ...f, name: f.name.replace(/corrupt/i, "retry"), status: "uploading", progress: 0, error: undefined });
      patch(key, (w) =>
        kind === "lecture"
          ? { lectures: w.lectures.map((l) => (l.file?.id === id ? { ...l, file: fix(l.file) } : l)) }
          : { references: w.references.map((r) => (r.id === id ? { ...r, ...fix(r) } : r)) },
      );
      simulateUpload(key, kind, id);
    },
    setThreshold: (key, value) => patch(key, () => ({ threshold: Math.min(100, Math.max(0, Math.round(value))) })),
    startExtraction: (key, courseId) => {
      const w = get().workspaces[key] ?? emptyWorkspace();
      const ready = w.lectures.filter((l) => l.file?.status === "uploaded");
      const targets = ready.filter((l) => l.process !== "processed").map((l) => l.id);
      if (!w.lectures.length) return patch(key, () => ({ phase: "error", error: "no-lectures" satisfies ErrorCode }));
      if (w.lectures.some((l) => l.file?.status === "uploading")) return patch(key, () => ({ phase: "error", error: "uploading" satisfies ErrorCode }));
      if (!targets.length) return patch(key, () => ({ phase: "error", error: "nothing-new" satisfies ErrorCode }));
      patch(key, (cur) => ({
        phase: "processing", error: undefined, batch: targets.length, done: 0, stage: 0, currentId: targets[0], reviewed: false,
        references: cur.references.map((r) => (r.status === "uploaded" ? { ...r, processing: true } : r)),
        lectures: cur.lectures.map((l) => (l.id === targets[0] ? { ...l, process: "processing" } : l)),
      }));
      if (timers.has(`${key}:run`)) clearInterval(timers.get(`${key}:run`)!);
      timers.set(
        `${key}:run`,
        setInterval(() => {
          const cur = get().workspaces[key];
          if (!cur || cur.phase !== "processing") return void clearInterval(timers.get(`${key}:run`)!);
          if (cur.stage < 3) return patch(key, () => ({ stage: cur.stage + 1 }));
          const lecture = cur.lectures.find((l) => l.id === cur.currentId);
          const found = lecture ? conceptsFor(courseId, lecture, cur.lectures, cur.concepts) : [];
          const remaining = targets.slice(cur.done + 1);
          const finished = remaining.length === 0;
          patch(key, (w) => ({
            concepts: [...w.concepts, ...found],
            done: w.done + 1,
            stage: 0,
            currentId: remaining[0],
            phase: finished ? "complete" : "processing",
            references: finished ? w.references.map((r) => (r.processing ? { ...r, processing: false, indexed: true } : r)) : w.references,
            lectures: w.lectures.map((l) => (l.id === cur.currentId ? { ...l, process: "processed" } : l.id === remaining[0] ? { ...l, process: "processing" } : l)),
          }));
          if (finished) {
            clearInterval(timers.get(`${key}:run`)!);
            timers.delete(`${key}:run`);
          }
        }, 500),
      );
    },
    approve: (key, id) => mapConcept(key, id, (c) => ({ ...c, decision: "approved" })),
    reject: (key, id) => mapConcept(key, id, (c) => ({ ...c, decision: "rejected" })),
    restore: (key, id) => mapConcept(key, id, (c) => ({ ...c, decision: "none" })),
    editConcept: (key, id, p, approve) =>
      mapConcept(key, id, (c) => ({ ...c, ...p, edited: true, decision: approve ? "approved" : c.decision })),
    merge: (key, sourceId, targetId) =>
      patch(key, (w) => {
        const source = w.concepts.find((c) => c.id === sourceId);
        const target = w.concepts.find((c) => c.id === targetId);
        if (!source || !target || source.id === target.id) return {};
        const seen = new Set(target.sources.map((s) => `${s.lectureId}:${s.slide}`));
        const extra = source.sources.filter((s) => !seen.has(`${s.lectureId}:${s.slide}`));
        return {
          concepts: w.concepts
            .filter((c) => c.id !== sourceId)
            .map((c) => (c.id === targetId ? { ...c, sources: [...c.sources, ...extra], edited: true } : c)),
        };
      }),
    split: (key, id, next, sourceIndexes) =>
      patch(key, (w) => {
        const original = w.concepts.find((c) => c.id === id);
        if (!original) return {};
        const moved = original.sources.filter((_, i) => sourceIndexes.includes(i));
        const kept = original.sources.filter((_, i) => !sourceIndexes.includes(i));
        const created: Concept = { ...original, id: newId("split"), en: next.en, ar: next.ar, sources: moved.length ? moved : original.sources, decision: "none", edited: true };
        return {
          concepts: [...w.concepts.map((c) => (c.id === id ? { ...c, sources: kept.length ? kept : c.sources, edited: true } : c)), created],
        };
      }),
    finishReview: (key) => patch(key, () => ({ reviewed: true })),
  };
});

export const EMPTY = emptyWorkspace();
