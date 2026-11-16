import { concepts, findConcept } from "@/data/fixtures";
import type { MasteryBand, Student } from "@/types";

/**
 * Approved deterministic simulation (DEMO-AGREEMENTS.md). Not BKT, DKT or IRT.
 *   score       = round(100 × correct / total)          (unanswered = incorrect)
 *   new mastery = round(0.60 × previous + 0.40 × score)  clamped to 0–100
 */
export const MASTERY_WEIGHTS = { previous: 0.6, score: 0.4 } as const;
export const PREREQUISITE_READY = 70;

export const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

/** Integer percentage correct. */
export const scorePercent = (correct: number, total: number) => (total > 0 ? clamp((100 * correct) / total) : 0);

/** Integer arithmetic (6p + 4s) / 10 avoids floating-point drift in 0.6p + 0.4s. */
export const nextMastery = (previous: number, score: number) => clamp((6 * clamp(previous) + 4 * clamp(score)) / 10);

export const isMasteryValue = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;

export type Tone = "danger" | "warning" | "progress" | "success";
export type BandInfo = { band: MasteryBand; min: number; max: number; tone: Tone };

export const MASTERY_BANDS: readonly BandInfo[] = [
  { band: "Needs Support", min: 0, max: 39, tone: "danger" },
  { band: "Developing", min: 40, max: 69, tone: "warning" },
  { band: "Proficient", min: 70, max: 84, tone: "progress" },
  { band: "Mastered", min: 85, max: 100, tone: "success" },
];

export function masteryBand(value: number): BandInfo {
  const v = clamp(value);
  return MASTERY_BANDS.find(b => v >= b.min && v <= b.max) ?? MASTERY_BANDS[0];
}

/** Backwards-compatible label helper. */
export const status = (value: number): MasteryBand => masteryBand(value).band;

export type Recommendation =
  | { kind: "ready"; conceptId: string; message: string }
  | { kind: "review"; conceptId: string; prerequisiteId: string; message: string }
  | { kind: "unknown"; message: string };

/** Points to the first prerequisite below 70. Advisory only: it does not block practice. */
export function recommendation(student: Student, conceptId: string): Recommendation {
  const concept = findConcept(conceptId);
  if (!concept) return { kind: "unknown", message: "Select a concept." };
  const missing = concept.prerequisites.find(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY);
  if (missing) {
    const title = concepts.find(c => c.id === missing)?.title ?? missing;
    return { kind: "review", conceptId, prerequisiteId: missing, message: `Review ${title} first.` };
  }
  return { kind: "ready", conceptId, message: `Ready to practice ${concept.title}.` };
}
