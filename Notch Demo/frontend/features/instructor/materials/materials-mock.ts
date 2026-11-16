import type { CourseId } from "@/types";

/**
 * IN2 Upload materials — local sample data (Demo / Simulated).
 * File names, page counts and confidence values are fictional presets. Concept IDs
 * reference the shared fixtures in data/fixtures.ts. Nothing is uploaded or parsed.
 */

export type MaterialStatus = "queued" | "extracting" | "detecting" | "ready" | "needs-review";
export type MaterialKind = "PDF" | "Slides" | "Document" | "Scan";

export type MaterialVersion = {
  version: number;
  /** Relative, fictional timing so the sample never implies a real date. */
  addedLabel: string;
  note: string;
};

export type Material = {
  id: string;
  courseId: CourseId;
  name: string;
  kind: MaterialKind;
  pages: number;
  sizeKb: number;
  conceptIds: string[];
  /** Simulated extraction confidence, 0–100. Below LOW_CONFIDENCE is flagged for review. */
  confidence: number;
  lowConfidenceReason?: string;
  status: MaterialStatus;
  /** Simulated extraction progress, 0–100. */
  progress: number;
  versions: MaterialVersion[];
};

export const LOW_CONFIDENCE = 70;

export const ACCEPTED_TYPES = ".pdf,.pptx,.docx,.png,.jpg";
export const MAX_SIZE_MB = 50;

export const statusLabel: Record<MaterialStatus, string> = {
  queued: "Queued",
  extracting: "Extracting text",
  detecting: "Detecting concepts",
  ready: "Ready for concept review",
  "needs-review": "Needs review",
};

/** Progress thresholds at which the simulated pipeline changes stage. */
export function stageFor(progress: number): MaterialStatus {
  if (progress < 10) return "queued";
  if (progress < 60) return "extracting";
  return "detecting";
}

type Seed = Omit<Material, "status" | "progress"> & { status?: MaterialStatus };

const seeds: Seed[] = [
  {
    id: "MAT-PY-01",
    courseId: "C-PY",
    name: "Week 4 – Functions (slides).pptx",
    kind: "Slides",
    pages: 32,
    sizeKb: 4200,
    conceptIds: ["PY-FUNC", "PY-VAR", "PY-OP"],
    confidence: 93,
    versions: [
      { version: 2, addedLabel: "Sample: 3 days ago", note: "Added worked examples on return values." },
      { version: 1, addedLabel: "Sample: 2 weeks ago", note: "Initial sample upload." },
    ],
  },
  {
    id: "MAT-PY-02",
    courseId: "C-PY",
    name: "Call stack and recursion – lecture notes.pdf",
    kind: "PDF",
    pages: 18,
    sizeKb: 1650,
    conceptIds: ["PY-STACK", "PY-REC", "PY-COND"],
    confidence: 86,
    versions: [{ version: 1, addedLabel: "Sample: 5 days ago", note: "Initial sample upload." }],
  },
  {
    id: "MAT-PY-03",
    courseId: "C-PY",
    name: "Whiteboard photo – recursion trace.jpg",
    kind: "Scan",
    pages: 1,
    sizeKb: 2900,
    conceptIds: ["PY-REC"],
    confidence: 54,
    lowConfidenceReason: "Handwritten stack frames were hard to read; the concept match is uncertain.",
    versions: [{ version: 1, addedLabel: "Sample: 5 days ago", note: "Initial sample upload." }],
  },
  {
    id: "MAT-MA-01",
    courseId: "C-MATH",
    name: "Unit 3 – Linear equations (slides).pptx",
    kind: "Slides",
    pages: 28,
    sizeKb: 3800,
    conceptIds: ["MA-LIN", "MA-EXPR"],
    confidence: 91,
    versions: [
      { version: 2, addedLabel: "Sample: 4 days ago", note: "Corrected answer on slide 14." },
      { version: 1, addedLabel: "Sample: 3 weeks ago", note: "Initial sample upload." },
    ],
  },
  {
    id: "MAT-MA-02",
    courseId: "C-MATH",
    name: "Limits and derivatives – handout.docx",
    kind: "Document",
    pages: 12,
    sizeKb: 940,
    conceptIds: ["MA-LIMIT", "MA-DERIV", "MA-FUNC"],
    confidence: 84,
    versions: [{ version: 1, addedLabel: "Sample: 1 week ago", note: "Initial sample upload." }],
  },
  {
    id: "MAT-MA-03",
    courseId: "C-MATH",
    name: "Scanned past exam – derivative applications.pdf",
    kind: "Scan",
    pages: 6,
    sizeKb: 5100,
    conceptIds: ["MA-APP", "MA-DERIV"],
    confidence: 61,
    lowConfidenceReason: "Scanned formulas lost some symbols; check the extracted equations before use.",
    versions: [{ version: 1, addedLabel: "Sample: 1 week ago", note: "Initial sample upload." }],
  },
];

const finalStatus = (confidence: number): MaterialStatus => (confidence < LOW_CONFIDENCE ? "needs-review" : "ready");

export function initialMaterials(): Record<CourseId, Material[]> {
  const make = (courseId: CourseId) =>
    seeds.filter(s => s.courseId === courseId).map<Material>(s => ({ ...s, status: s.status ?? finalStatus(s.confidence), progress: 100 }));
  return { "C-PY": make("C-PY"), "C-MATH": make("C-MATH") };
}

/** Deterministic sample files that the "Add sample file" action cycles through. */
export const sampleAdditions: Record<CourseId, Omit<Material, "id" | "status" | "progress" | "versions">[]> = {
  "C-PY": [
    { courseId: "C-PY", name: "Week 5 – Loops practice sheet.pdf", kind: "PDF", pages: 8, sizeKb: 720, conceptIds: ["PY-LOOP", "PY-LIST"], confidence: 89 },
    { courseId: "C-PY", name: "Dictionaries – scanned textbook pages.pdf", kind: "Scan", pages: 10, sizeKb: 6400, conceptIds: ["PY-DICT"], confidence: 58, lowConfidenceReason: "Low scan quality on two pages; some code samples may be incomplete." },
  ],
  "C-MATH": [
    { courseId: "C-MATH", name: "Quadratic equations – worked examples.docx", kind: "Document", pages: 9, sizeKb: 610, conceptIds: ["MA-QUAD", "MA-EXPR"], confidence: 90 },
    { courseId: "C-MATH", name: "Graph sketching – phone photos.jpg", kind: "Scan", pages: 1, sizeKb: 3300, conceptIds: ["MA-GRAPH"], confidence: 49, lowConfidenceReason: "Photo glare hides axis labels; the graph concept match is uncertain." },
  ],
};

/** Simulated outcome for a file the instructor picks from their device (name and size only). */
export function simulatedOutcomeFor(name: string) {
  const lower = name.toLowerCase();
  const isImage = /\.(png|jpe?g)$/.test(lower);
  const kind: MaterialKind = isImage ? "Scan" : lower.endsWith(".pptx") ? "Slides" : lower.endsWith(".docx") ? "Document" : "PDF";
  // Deterministic pseudo-confidence from the file name so repeated demos match.
  const hash = [...name].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 997, 7);
  const confidence = isImage ? 50 + (hash % 15) : 76 + (hash % 20);
  return {
    kind,
    confidence,
    lowConfidenceReason: confidence < LOW_CONFIDENCE ? "Image-based content; text and formulas could not be read reliably." : undefined,
  };
}

export const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
