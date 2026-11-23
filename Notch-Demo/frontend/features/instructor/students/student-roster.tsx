"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronRight, LifeBuoy, SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";
import { courseAverage, formatDays, lowestConcept } from "@/services/insights";
import { useDemo } from "@/store/demo";
import { assessStudent } from "./risk-data";
import { CourseContext, CourseNotAssigned, instructorRoutes, PrivacyNotice, SearchInput, useInstructorCourse } from "./shared";

/** Course roster linking to IN14 Student view. */
export function StudentRoster() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow="Instructor portal · IN14"
        title="Students"
        description="Fictional students enrolled in your assigned course. Open a student to see course-scoped progress, practice and diagnosis episodes."
        actions={
          <Button asChild variant="outline">
            <Link href={instructorRoutes.atRisk}>
              <LifeBuoy aria-hidden="true" />
              At-risk list
            </Link>
          </Button>
        }
      />
      {hydrated ? <RosterContent /> : <InstructorPreviewSkeleton />}
    </>
  );
}

function RosterContent() {
  const ctx = useInstructorCourse();
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [query, setQuery] = useState("");
  if (!ctx) return <CourseNotAssigned />;
  const courseId = ctx.course.id;
  const q = query.trim().toLowerCase();
  const enrolled = students.filter(s => s.enrolledCourseIds.includes(courseId));
  const rows = enrolled.filter(s => !q || s.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <CourseContext {...ctx} />
      <Card as="section" aria-labelledby="roster-heading" className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle id="roster-heading">Course roster</CardTitle>
            <CardDescription>{enrolled.length} fictional students · {ctx.course.title} data only.</CardDescription>
          </div>
          <form role="search" aria-label="Filter students" onSubmit={e => e.preventDefault()} className="w-full sm:w-64">
            <SearchInput id="roster-search" label="Search by name" value={query} onChange={setQuery} />
          </form>
        </CardHeader>
        <CardContent className="relative overflow-x-auto px-0 pb-2 sm:px-0" role="region" aria-label="Roster results" tabIndex={rows.length ? 0 : undefined}>
          <p className="sr-only" role="status" aria-live="polite">
            Showing {rows.length} of {enrolled.length} students.
          </p>
          {rows.length === 0 ? (
            <div className="px-5 pb-4 sm:px-6">
              <EmptyState icon={SearchX} title="No students match this search" action={<Button variant="outline" size="sm" onClick={() => setQuery("")}>Clear search</Button>} />
            </div>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Students in {ctx.course.title}. Sample data.</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="px-5 pb-2 text-start font-medium sm:px-6">Student</th>
                  <th scope="col" className="pb-2 text-start font-medium">Course average</th>
                  <th scope="col" className="hidden pb-2 text-start font-medium lg:table-cell">Lowest concept</th>
                  <th scope="col" className="hidden pb-2 text-start font-medium md:table-cell">Last active</th>
                  <th scope="col" className="px-5 pb-2 text-end font-medium sm:px-6">Flags</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => {
                  const avg = courseAverage(s, courseId);
                  const low = lowestConcept(s, courseId);
                  const risk = assessStudent(s, courseId, attempts);
                  return (
                    <tr key={s.id} className="border-b border-border last:border-b-0">
                      <th scope="row" className="px-5 py-2.5 text-start font-medium sm:px-6">
                        <Link href={instructorRoutes.student(s.id)} className="-mx-2 inline-flex items-center gap-3 rounded-md px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                          <StudentAvatar name={s.name} />
                          {s.name}
                          <ChevronRight className="size-3.5 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
                        </Link>
                      </th>
                      <td className="py-2.5 pe-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <MasteryBar value={avg} label={`${s.name} course average`} className="hidden h-1.5 w-20 sm:block" />
                          <span className="tabular-nums">{avg}%</span>
                          <MasteryBadge value={avg} className="hidden py-0 text-[11px] xl:inline-flex" />
                        </div>
                      </td>
                      <td className="hidden py-2.5 pe-4 text-muted-foreground lg:table-cell">
                        {low ? (
                          <>
                            {low.title} <span className="tabular-nums text-foreground">{s.mastery[low.id]}%</span>
                          </>
                        ) : null}
                      </td>
                      <td className="hidden py-2.5 pe-4 text-muted-foreground md:table-cell">{formatDays(s.lastActiveDays)}</td>
                      <td className="px-5 py-2.5 text-end sm:px-6">
                        {risk ? <Badge tone={risk.level === "Needs support" ? "danger" : "warning"}>{risk.level}</Badge> : <Badge tone="success">On track</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <PrivacyNotice courseTitle={ctx.course.title} />
    </div>
  );
}
