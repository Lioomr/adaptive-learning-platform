"use client";
import { useMemo, useState } from "react";
import { useInstructor } from "@/features/instructor/portal/context";
import { useParam } from "@/features/instructor/dashboard/hooks";
import { build, type Range } from "./data";

/** URL-backed filters so dashboard links, notifications and drill-downs can deep-link. */
export function useAnalytics() {
  const inst = useInstructor();
  const [courseRaw, setCourse] = useParam("course");
  const [rangeRaw, setRange] = useParam("range", "30");
  const [group, setGroup] = useParam("group");
  const [conceptRaw, setConcept] = useParam("concept");
  const [focusRaw, setFocus] = useParam("focus", "none");
  const [studentRaw, setStudent] = useParam("student", "none");
  const [q, setQ] = useState("");
  const course = inst.assigned.some((c) => c.id === courseRaw) ? courseRaw : "all";
  const range = ([7, 30, 90].includes(Number(rangeRaw)) ? Number(rangeRaw) : 30) as Range;
  const model = useMemo(
    () => build(inst.assigned, inst.students, { course, range, group, concept: "all", q: "" }),
    [inst.assigned, inst.students, course, range, group],
  );
  const concept = model.nodeBy.has(conceptRaw) ? conceptRaw : "all";
  const focus = model.nodeBy.has(focusRaw) ? focusRaw : null;
  const student = model.students.find((s) => s.id === studentRaw) ?? null;
  return { ...inst, model, filters: { course, range, group, concept, q }, setCourse, setRange: (r: Range) => setRange(String(r)), setGroup, setConcept, focus, setFocus: (k: string | null) => setFocus(k ?? "none"), student, setStudent: (id: string | null) => setStudent(id ?? "none"), setQ };
}
export type Analytics = ReturnType<typeof useAnalytics>;
