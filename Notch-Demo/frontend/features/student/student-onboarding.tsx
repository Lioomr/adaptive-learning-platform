
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/store/demo";
import { courses } from "@/data/fixtures";
import { instructorForCourse } from "@/lib/permissions";
import type { CourseId } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  ShieldCheck,
  UserRound,
  ArrowRight,
  CheckCircle2,
  Info,
} from "lucide-react";

type StudentType = "first-time" | "returning";

export function StudentOnboarding() {
  const router = useRouter();

  const courseId = useDemo((state) => state.courseId);
  const students = useDemo((state) => state.students);
  const studentId = useDemo((state) => state.studentId);
  const setCourse = useDemo((state) => state.setCourse);

  const [studentType, setStudentType] =
    useState<StudentType>("returning");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const student = students.find((item) => item.id === studentId);

  const selectedCourse = courses.find(
    (course) => course.id === courseId,
  );

  const instructor = instructorForCourse(courseId);

  function handleCourseChange(nextCourseId: CourseId) {
    setError("");
    setSignedIn(false);

    const result = setCourse(nextCourseId, "student");

    if (!result.ok) {
      setError(result.error);
    }
  }

  function handleDemoSignIn() {
    setError("");

    if (!selectedCourse || !instructor) {
      setError("Please select a valid course before continuing.");
      return;
    }

    setSignedIn(true);
  }

  function handleContinue() {
    router.push("/student/st2");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow="ST1 · Student onboarding"
        title="Welcome to Notch"
        description="Your personalized learning journey starts here. Choose your course and review how this demo works."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <CardTitle>Choose your course</CardTitle>
                  <CardDescription>
                    Select the course you want to learn.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {courses.map((course) => {
                const isSelected = course.id === courseId;

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => handleCourseChange(course.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        {course.id === "C-PY" ? (
                          <BookOpen className="size-5" />
                        ) : (
                          <GraduationCap className="size-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {course.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {course.id === "C-PY"
                            ? "Programming fundamentals"
                            : "Mathematics foundations"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="size-4" />
                      )}
                    </span>
                  </button>
                );
              })}

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <CardTitle>Your learning profile</CardTitle>
                  <CardDescription>
                    Choose the option that describes your experience.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setStudentType("first-time");
                  setSignedIn(false);
                }}
                aria-pressed={studentType === "first-time"}
                className={`rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  studentType === "first-time"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="font-semibold text-foreground">
                  I&apos;m new here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is my first time using Notch.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudentType("returning");
                  setSignedIn(false);
                }}
                aria-pressed={studentType === "returning"}
                className={`rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  studentType === "returning"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="font-semibold text-foreground">
                  I&apos;m returning
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I have used this learning platform before.
                </p>
              </button>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleDemoSignIn}
          >
            Continue with demo sign-in
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </Button>

          {signedIn && (
            <div className="space-y-3">
              <div
                role="status"
                className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-ink" />
                <div>
                  <p className="font-semibold text-foreground">
                    Demo sign-in successful
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your selected course is {selectedCourse?.title}.
                    The next step is reviewing the platform consent settings.
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleContinue}
              >
                Continue to consent
                <ArrowRight className="size-4 rtl:-scale-x-100" />
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <CardTitle>Your course instructor</CardTitle>
                  <CardDescription>
                    Instructor assigned to your selected course.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  COURSE
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {selectedCourse?.title ?? "No course selected"}
                </p>

                <div className="my-4 border-t border-border" />

                <p className="text-xs font-medium text-muted-foreground">
                  INSTRUCTOR
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {instructor?.name ?? "Not assigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle>Data use notice</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Notch is currently running as a demonstration platform.
                It uses fictional student profiles and sample learning
                activities to demonstrate the learning experience.
              </p>

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-muted-foreground">
                  Demo activity is stored locally in your browser. It is not
                  connected to a live student database or a real school
                  account, and it does not sync across devices.
                </p>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                Please do not enter real passwords or sensitive personal
                information.
              </p>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                Demo student profile
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {student?.name ?? "Demo student"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {studentType === "first-time"
                ? "First-time student experience"
                : "Returning student experience"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
