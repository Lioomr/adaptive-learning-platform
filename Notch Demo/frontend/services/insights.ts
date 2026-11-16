import { conceptsForCourse, courses } from "@/data/fixtures";
import { MASTERY_BANDS, masteryBand, recommendation, type Tone } from "@/services/mastery";
import type { Attempt, Concept, CourseId, MasteryBand, Student } from "@/types";

/**
 * Read-only derived views over the shared state. Every portal should use these
 * helpers instead of re-implementing averages or support rules in JSX.
 * Support indicators are simulated demo rules, not risk predictions.
 */
export const INACTIVITY_DAYS = 14;
export const NEEDS_REVIEW_BELOW = 40;

export function courseAverage(student: Student, courseId: CourseId): number {
  const items = conceptsForCourse(courseId);
  return items.length ? Math.round(items.reduce((n, c) => n + (student.mastery[c.id] ?? 0), 0) / items.length) : 0;
}

export function bandCounts(values: number[]): Record<MasteryBand, number> {
  const counts = Object.fromEntries(MASTERY_BANDS.map(b => [b.band, 0])) as Record<MasteryBand, number>;
  for (const v of values) counts[masteryBand(v).band] += 1;
  return counts;
}

export function lowestConcept(student: Student, courseId: CourseId): Concept | undefined {
  return [...conceptsForCourse(courseId)].sort((a, b) => (student.mastery[a.id] ?? 0) - (student.mastery[b.id] ?? 0))[0];
}

/** The concept the student should focus on next: lowest mastery, ties by course order. */
export const focusConcept = lowestConcept;

export function conceptsNeedingReview(student: Student, courseId: CourseId): Concept[] {
  return conceptsForCourse(courseId).filter(c => (student.mastery[c.id] ?? 0) < NEEDS_REVIEW_BELOW);
}

export type SupportIndicator = { key: string; label: string; detail: string; tone: Tone };

/** Supportive, non-diagnostic language (RULES.md §3). */
export function supportIndicators(student: Student, courseIds: CourseId[] = student.enrolledCourseIds): SupportIndicator[] {
  const out: SupportIndicator[] = [];
  if (student.lastActiveDays >= INACTIVITY_DAYS) out.push({ key: "inactive", label: "Check in", detail: `No simulated activity for ${student.lastActiveDays} days`, tone: "warning" });
  for (const courseId of courseIds) {
    const course = courses.find(c => c.id === courseId);
    const avg = courseAverage(student, courseId);
    const review = conceptsNeedingReview(student, courseId);
    if (avg < NEEDS_REVIEW_BELOW) out.push({ key: `support-${courseId}`, label: "Needs support", detail: `${course?.shortTitle} average ${avg}%`, tone: "danger" });
    else if (review.length) out.push({ key: `review-${courseId}`, label: "Needs review", detail: `${review.length} ${course?.shortTitle} concept${review.length === 1 ? "" : "s"} below ${NEEDS_REVIEW_BELOW}%`, tone: "warning" });
  }
  return out;
}

export type SupportLevel = { label: "On track" | "Monitor" | "Needs support"; tone: Tone };

export function supportLevel(student: Student, courseIds?: CourseId[]): SupportLevel {
  const indicators = supportIndicators(student, courseIds);
  if (indicators.some(i => i.tone === "danger")) return { label: "Needs support", tone: "danger" };
  if (indicators.length) return { label: "Monitor", tone: "warning" };
  return { label: "On track", tone: "success" };
}

export function attemptsFor(attempts: Attempt[], filter: { studentId?: string; courseId?: CourseId }): Attempt[] {
  return attempts
    .filter(a => (!filter.studentId || a.studentId === filter.studentId) && (!filter.courseId || a.courseId === filter.courseId))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function prerequisiteStatus(student: Student, concept: Concept) {
  return concept.prerequisites.map(id => ({ id, value: student.mastery[id] ?? 0 }));
}

export { recommendation };

export const formatDays = (days: number) => (days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`);

export function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
