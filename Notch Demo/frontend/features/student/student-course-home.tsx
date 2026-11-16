"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  GraduationCap,
  LockKeyhole,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { conceptsForCourse, courses } from "@/data/fixtures";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

export function StudentCourseHome() {
  const hydrated = useHydrated();

  const studentId = useDemo((state) => state.studentId);
  const courseId = useDemo((state) => state.courseId);
  const students = useDemo((state) => state.students);

  const student = students.find((item) => item.id === studentId);

  const course = courses.find((item) => item.id === courseId);

  const concepts = useMemo(
    () => conceptsForCourse(courseId),
    [courseId],
  );

  const firstConcept = concepts[0];

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!course || !student) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              Course information is unavailable
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Please return to your student dashboard and select a course.
            </p>
            <Button asChild className="mt-5">
              <Link href="/student">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName =
    "name" in student
      ? String(student.name)
      : "Student";

  const courseName =
    "title" in course
      ? String(course.title)
      : "name" in course
        ? String(course.name)
        : "Selected Course";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-10 md:p-6">
      <PageHeader
        title={courseName}
        description={`Welcome back, ${displayName}. Continue learning at your own pace.`}
      />

      <Card className="overflow-hidden border-0 bg-[#1E2B58] text-white shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm text-indigo-200">
                <GraduationCap className="size-4" />
                <span>Your learning journey</span>
              </div>

              <h2 className="text-2xl font-bold md:text-3xl">
                Learn step by step.
              </h2>

              <p className="mt-3 text-sm leading-6 text-indigo-100 md:text-base">
                Explore the concepts in this course, open a learning
                session, and check your understanding as you progress.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 p-4">
              <BookOpen className="size-8 text-indigo-200" />
              <div>
                <p className="text-2xl font-bold">{concepts.length}</p>
                <p className="text-xs text-indigo-200">Course concepts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Course content
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a concept to open its learning session.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {concepts.length} concepts
          </span>
        </div>

        <div className="space-y-3">
          {concepts.map((concept, index) => {
            const conceptName =
              "name" in concept
                ? String(concept.name)
                : "title" in concept
                  ? String(concept.title)
                  : `Concept ${index + 1}`;

            const conceptDescription =
              "description" in concept
                ? String(concept.description)
                : "Open this concept to explore its learning session.";

            return (
              <Card
                key={concept.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#1E2B58]">
                    <BookOpen className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">
                        CONCEPT {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="mt-1 font-semibold text-slate-900">
                      {conceptName}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {conceptDescription}
                    </p>
                  </div>

                  <Button asChild variant="outline" className="shrink-0">
                    <Link href={`/student/st8/${concept.id}`}>
                      Open lesson
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="size-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Learn at your own pace
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                This demo displays the course concept structure. Full
                lecture materials and lesson completion tracking are not
                connected yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {firstConcept && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/student/st8/${firstConcept.id}`}>
              Start learning
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}