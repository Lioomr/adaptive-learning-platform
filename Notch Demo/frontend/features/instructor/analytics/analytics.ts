import { concepts, conceptsForCourse, findConcept, questions } from "@/data/fixtures";
import { bandCounts } from "@/services/insights";
import { PREREQUISITE_READY } from "@/services/mastery";
import type { Concept, CourseId, Student } from "@/types";
import { contentGapSamples, tutorQuestionSamples, wrongChoiceSamples } from "./sample-data";

/**
 * Read-only IN8/IN9 derivations over the shared demo state. All numbers come
 * from fixture mastery values (or local sample data in ./sample-data.ts) and are
 * simulated, not validated analytics.
 */

/** Stable URLs for screens linked from IN8/IN9 (lib/routes.ts holds only portal roots). */
export const instructorLinks = {
  dashboard: "/instructor/dashboard",
  concept: (conceptId: string) => `/instructor/concepts/${encodeURIComponent(conceptId)}`,
  atRisk: "/instructor/at-risk",
  student: (studentId: string) => `/instructor/students/${encodeURIComponent(studentId)}`,
} as const;

export const ACTIVE_WITHIN_DAYS = 7;

export const enrolledIn = (students: Student[], courseId: CourseId) => students.filter(s => s.enrolledCourseIds.includes(courseId));

export function conceptAverage(students: Student[], conceptId: string): number {
  return students.length ? Math.round(students.reduce((n, s) => n + (s.mastery[conceptId] ?? 0), 0) / students.length) : 0;
}

export const notReady = (students: Student[], conceptId: string) => students.filter(s => (s.mastery[conceptId] ?? 0) < PREREQUISITE_READY);

export type ConceptStat = { concept: Concept; average: number; notReadyCount: number };

export function conceptStats(students: Student[], courseId: CourseId): ConceptStat[] {
  return conceptsForCourse(courseId).map(concept => ({ concept, average: conceptAverage(students, concept.id), notReadyCount: notReady(students, concept.id).length }));
}

export type Roadblock = {
  concept: Concept;
  average: number;
  notReadyCount: number;
  /** Prerequisite with the lowest class average; undefined for root concepts. */
  prerequisite?: { concept: Concept; average: number; alsoNotReady: number };
};

/**
 * Top roadblocks: concepts with the most students below 70, then lowest class
 * average. Each is paired with its weakest prerequisite by class average and the
 * number of not-ready students who are also below 70 on that prerequisite.
 */
export function topRoadblocks(students: Student[], courseId: CourseId, limit = 3): Roadblock[] {
  return conceptStats(students, courseId)
    .filter(s => s.notReadyCount > 0)
    .sort((a, b) => a.average - b.average || b.notReadyCount - a.notReadyCount)
    .slice(0, limit)
    .map(({ concept, average, notReadyCount }) => {
      const stuck = notReady(students, concept.id);
      const prereqs = concept.prerequisites
        .map(id => findConcept(id))
        .filter((c): c is Concept => Boolean(c))
        .map(c => ({ concept: c, average: conceptAverage(students, c.id), alsoNotReady: notReady(stuck, c.id).length }))
        .sort((a, b) => a.average - b.average);
      return { concept, average, notReadyCount, prerequisite: prereqs[0] };
    });
}

export const masteryDistribution = (students: Student[], conceptId: string) => bandCounts(students.map(s => s.mastery[conceptId] ?? 0));

/** Concepts that list this one as a prerequisite. */
export const unlocks = (conceptId: string) => concepts.filter(c => c.prerequisites.includes(conceptId));

export const questionCount = (conceptId: string) => questions.filter(q => q.conceptId === conceptId).length;

/** Wrong-choice samples, filtered to students still below 70 so counts match live mastery. */
export function wrongChoices(students: Student[], conceptId: string) {
  const stuckIds = new Set(notReady(students, conceptId).map(s => s.id));
  return (wrongChoiceSamples[conceptId] ?? [])
    .map(w => ({ ...w, studentIds: w.studentIds.filter(id => stuckIds.has(id)) }))
    .filter(w => w.studentIds.length > 0);
}

export const tutorQuestions = (conceptId: string) => tutorQuestionSamples[conceptId] ?? [];

export type ContentGap = { conceptId: string; title: string; gap: string; source: string };

/** Concepts with no question in the illustrative bank, plus sample tutor-audit gaps. */
export function contentGaps(courseId: CourseId): { missingQuestions: Concept[]; notes: ContentGap[] } {
  const items = conceptsForCourse(courseId);
  const ids = new Set(items.map(c => c.id));
  return {
    missingQuestions: items.filter(c => questionCount(c.id) === 0),
    notes: contentGapSamples.filter(g => ids.has(g.conceptId)).map(g => ({ ...g, title: findConcept(g.conceptId)?.title ?? g.conceptId })),
  };
}
