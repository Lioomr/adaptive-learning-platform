"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useInstructor } from "@/features/instructor/portal/context";
import { useParam } from "@/features/instructor/dashboard/hooks";
import { TERMS } from "@/features/instructor/reports/data";
import { defaultExt } from "./data";
import { useWork } from "./store";

export type Tab = "assignments" | "attendance" | "communication";
export function useCoursework() {
  const inst = useInstructor();
  const router = useRouter();
  const sp = useSearchParams();
  const w = useWork();
  const [courseRaw, setCourse] = useParam("course");
  const [termRaw, setTerm] = useParam("term", TERMS[0].id);
  const [tabRaw, setTab] = useParam("tab", "assignments");
  const [viewing, setViewing] = useParam("assignment", "none");
  const [segRaw, setSegment] = useParam("segment", "announcements");
  const course = inst.assigned.some((c) => c.id === courseRaw) ? courseRaw : "all";
  const scope = course === "all" ? inst.assigned : inst.assigned.filter((c) => c.id === course);
  const term = TERMS.find((x) => x.id === termRaw) ?? TERMS[0];
  const tab = (["assignments", "attendance", "communication"].includes(tabRaw) ? tabRaw : "assignments") as Tab;
  const segment = (["announcements", "messages", "reminders"].includes(segRaw) ? segRaw : "announcements") as "announcements" | "messages" | "reminders";
  const ids = new Set(scope.map((c) => c.id));
  const inScope = (id: string) => ids.has(id as never);
  const extOf = (id: string, a?: Parameters<typeof defaultExt>[0]) => w.ext[id] ?? defaultExt(a);
  const unread = w.threads.filter((t) => t.unread && !t.resolved && inst.assigned.some((c) => c.id === t.courseId)).length;
  /** Change several URL filters in one navigation (separate calls would overwrite each other). */
  const goTo = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) { if (v === null) p.delete(k); else p.set(k, v); }
    router.replace(`?${p.toString()}`, { scroll: false });
  };
  return { ...inst, w, goTo, course, scope, term, tab, segment, viewing: viewing === "none" ? null : viewing, archived: !term.current, inScope, extOf, unread, setCourse, setTerm, setTab, setViewing: (id: string | null) => setViewing(id ?? "none"), setSegment };
}
export type Cw = ReturnType<typeof useCoursework>;
