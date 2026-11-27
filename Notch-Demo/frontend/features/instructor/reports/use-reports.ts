"use client";
import { useMemo, useState } from "react";
import { useInstructor } from "@/features/instructor/portal/context";
import { useParam } from "@/features/instructor/dashboard/hooks";
import { CRITERIA, TERMS, examsFor, readiness } from "./data";

export function useReportsPage() {
  const inst = useInstructor();
  const first = inst.assigned[0]?.id ?? "python";
  const [courseRaw, setCourse] = useParam("course", first);
  const [termRaw, setTerm] = useParam("term", TERMS[0].id);
  const [examRaw, setExam] = useParam("exam", "mid");
  const [thrRaw, setThr] = useParam("threshold", "70");
  const [studentRaw, setStudent] = useParam("student", "none");
  const [notice, say] = useState("");
  const course = inst.assigned.find((c) => c.id === courseRaw) ?? inst.assigned[0];
  const term = TERMS.find((x) => x.id === termRaw) ?? TERMS[0];
  const exams = examsFor(course.id);
  const exam = exams.find((e) => e.id === `${course.id}-${examRaw}`) ?? exams[1];
  const threshold = CRITERIA.thresholds.includes(Number(thrRaw)) ? Number(thrRaw) : 70;
  const model = useMemo(() => readiness(course, inst.students, exam.id, threshold), [course, inst.students, exam.id, threshold]);
  const student = model.students.find((s) => s.stat.student.id === studentRaw) ?? null;
  return {
    ...inst, course, term, exams, exam, threshold, model, student, notice, say,
    setCourse, setTerm, setExam: (id: string) => setExam(id.split("-").pop() ?? "mid"), setThreshold: (n: number) => setThr(String(n)),
    setStudent: (id: string | null) => setStudent(id ?? "none"),
  };
}
export type Page = ReturnType<typeof useReportsPage>;
