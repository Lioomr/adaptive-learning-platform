"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Info, LifeBuoy, SearchX, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDays } from "@/services/insights";
import { MASTERY_BANDS, masteryBand } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { assessStudent, RISK_RULES, type RiskAssessment, type RiskReasonKey } from "./risk-data";
import { CourseContext, CourseNotAssigned, FilterSelect, instructorRoutes, PrivacyNotice, ReasonBadge, SearchInput, useInstructorCourse } from "./shared";

/** IN13 — At-risk students: explainable preset flags for the assigned course. */
export function AtRiskList() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow="Instructor portal · IN13"
        title="Students who may need support"
        description="Students flagged by simple, explainable preset rules. Flags are simulated support indicators, not predictions or grades."
        actions={
          <Button asChild variant="outline">
            <Link href={instructorRoutes.students}>
              <Users aria-hidden="true" />
              All students
            </Link>
          </Button>
        }
      />
      {hydrated ? <AtRiskContent /> : <InstructorPreviewSkeleton />}
    </>
  );
}

const ALL = "all";

function AtRiskContent() {
  const ctx = useInstructorCourse();
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [query, setQuery] = useState("");
  const [reason, setReason] = useState<string>(ALL);
  const [level, setLevel] = useState<string>(ALL);
  const [band, setBand] = useState<string>(ALL);
  const courseId = ctx?.course.id;

  const enrolled = useMemo(() => (courseId ? students.filter(s => s.enrolledCourseIds.includes(courseId)) : []), [students, courseId]);
  const flagged = useMemo(() => (courseId ? enrolled.map(s => assessStudent(s, courseId, attempts)).filter((a): a is RiskAssessment => a !== null) : []), [enrolled, courseId, attempts]);

  if (!ctx) return <CourseNotAssigned />;

  const q = query.trim().toLowerCase();
  const rows = flagged
    .filter(a => (!q || a.student.name.toLowerCase().includes(q)) && (reason === ALL || a.reasons.some(r => r.key === reason)) && (level === ALL || a.level === level) && (band === ALL || masteryBand(a.average).band === band))
    .sort((a, b) => Number(b.level === "Needs support") - Number(a.level === "Needs support") || b.reasons.length - a.reasons.length || a.average - b.average);
  const filtersActive = q || reason !== ALL || level !== ALL || band !== ALL;
  const countFor = (key: RiskReasonKey) => flagged.filter(a => a.reasons.some(r => r.key === key)).length;
  const reset = () => {
    setQuery("");
    setReason(ALL);
    setLevel(ALL);
    setBand(ALL);
  };

  return (
    <div className="space-y-6">
      <CourseContext {...ctx} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flagged students" value={flagged.length} unit={`/${enrolled.length}`} icon={LifeBuoy} accent="warning" hint="Sample data · fictional students" />
        <StatCard label="Needs support" value={flagged.filter(a => a.level === "Needs support").length} icon={LifeBuoy} accent="danger" hint="Low average, or two or more reasons" />
        <StatCard label="Prerequisite gaps" value={countFor("prerequisite-gap")} icon={Info} accent="ai" hint="Concept below 40% with a prerequisite below 70%" />
        <StatCard label="Inactive 7+ days" value={countFor("inactivity")} icon={Users} accent="brand" hint="Based on simulated last activity" />
      </div>

      <Card as="section" aria-labelledby="at-risk-heading" className="min-w-0">
        <CardHeader>
          <div>
            <CardTitle id="at-risk-heading">Flagged students</CardTitle>
            <CardDescription>Each flag lists the exact values that triggered it. Open a student for course-scoped detail.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-2">
          <form role="search" aria-label="Filter flagged students" onSubmit={e => e.preventDefault()} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
            <SearchInput id="risk-search" label="Search by name" value={query} onChange={setQuery} placeholder="e.g. Nour" />
            <FilterSelect id="risk-reason" label="Reason" value={reason} onChange={setReason} options={[{ value: ALL, label: "All reasons" }, ...(Object.keys(RISK_RULES) as RiskReasonKey[]).map(k => ({ value: k, label: `${RISK_RULES[k].label} (${countFor(k)})` }))]} />
            <FilterSelect id="risk-level" label="Support level" value={level} onChange={setLevel} options={[{ value: ALL, label: "All levels" }, { value: "Needs support", label: "Needs support" }, { value: "Monitor", label: "Monitor" }]} />
            <FilterSelect id="risk-band" label="Course average band" value={band} onChange={setBand} options={[{ value: ALL, label: "All bands" }, ...MASTERY_BANDS.map(b => ({ value: b.band, label: `${b.band} (${b.min}–${b.max})` }))]} />
            <Button type="button" variant="ghost" onClick={reset} disabled={!filtersActive}>
              Clear filters
            </Button>
          </form>
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            Showing {rows.length} of {flagged.length} flagged students ({enrolled.length} enrolled).
          </p>
        </CardContent>

        <CardContent className="px-0 pt-0 pb-2 sm:px-0 sm:pt-0">
          {rows.length === 0 ? (
            <div className="px-5 pb-4 sm:px-6">
              {flagged.length === 0 ? (
                <EmptyState icon={LifeBuoy} title="No students flagged" description="No student in this course currently meets any preset rule." />
              ) : (
                <EmptyState icon={SearchX} title="No students match these filters" action={<Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} />
              )}
            </div>
          ) : (
            <>
              <table className="hidden w-full text-sm md:table">
                <caption className="sr-only">Flagged students in {ctx.course.title}, with reasons and course average. Sample data.</caption>
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-6 pb-2 text-start font-medium">Student</th>
                    <th scope="col" className="pb-2 text-start font-medium">Why flagged</th>
                    <th scope="col" className="pb-2 text-start font-medium">Course average</th>
                    <th scope="col" className="pb-2 text-start font-medium">Last active</th>
                    <th scope="col" className="px-6 pb-2 text-end font-medium">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => (
                    <tr key={a.student.id} className="border-b border-border align-top last:border-b-0">
                      <th scope="row" className="px-6 py-3 text-start font-medium">
                        <Link href={instructorRoutes.student(a.student.id)} className="-mx-2 inline-flex items-center gap-3 rounded-md px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                          <StudentAvatar name={a.student.name} />
                          <span>{a.student.name}</span>
                          <span className="sr-only">, open student view</span>
                        </Link>
                      </th>
                      <td className="py-3 pe-4">
                        <ul className="space-y-1.5" role="list">
                          {a.reasons.map(r => (
                            <li key={r.key} className="flex flex-wrap items-center gap-2">
                              <ReasonBadge reason={r.key} />
                              <span className="text-xs text-muted-foreground">{r.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 pe-4">
                        <div className="flex items-center gap-3">
                          <MasteryBar value={a.average} label={`${a.student.name} course average`} className="h-1.5 w-20" />
                          <span className="tabular-nums">{a.average}%</span>
                        </div>
                        <MasteryBadge value={a.average} className="mt-1.5 py-0 text-[11px]" />
                      </td>
                      <td className="py-3 pe-4 text-muted-foreground">{formatDays(a.student.lastActiveDays)}</td>
                      <td className="px-6 py-3 text-end">
                        <Badge tone={a.level === "Needs support" ? "danger" : "warning"}>{a.level}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-border md:hidden" role="list">
                {rows.map(a => (
                  <li key={a.student.id}>
                    <Link href={instructorRoutes.student(a.student.id)} className="flex items-start gap-3 px-5 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                      <StudentAvatar name={a.student.name} />
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="flex items-center justify-between gap-2 text-sm font-medium">
                          {a.student.name}
                          <Badge tone={a.level === "Needs support" ? "danger" : "warning"}>{a.level}</Badge>
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          Average {a.average}% · {formatDays(a.student.lastActiveDays)}
                        </span>
                        <span className="flex flex-wrap gap-1.5">
                          {a.reasons.map(r => (
                            <ReasonBadge key={r.key} reason={r.key} />
                          ))}
                        </span>
                      </span>
                      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="rules-heading" className="min-w-0 xl:col-span-8">
          <CardHeader>
            <div>
              <CardTitle id="rules-heading">How flags are decided</CardTitle>
              <CardDescription>Fixed preset rules over the shared demo data (Demo / Simulated). No model or risk score is used.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(RISK_RULES) as RiskReasonKey[]).map(k => (
                <div key={k}>
                  <dt>
                    <ReasonBadge reason={k} />
                  </dt>
                  <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">{RISK_RULES[k].rule}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <div className="min-w-0 xl:col-span-4">
          <PrivacyNotice courseTitle={ctx.course.title} />
        </div>
      </div>
    </div>
  );
}
