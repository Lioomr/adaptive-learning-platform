import { concepts } from "@/data/fixtures";
import type { CourseId } from "@/types";

/**
 * Local SAMPLE data for IN3 (concept approvals), IN4 (graph review) and IN5
 * (question approvals). Everything here is a fictional, simulated AI proposal.
 * It references the stable concept IDs in data/fixtures.ts and never changes the
 * shared fixtures: review decisions only change on-screen state in this session.
 */

export type SourceRef = { file: string; location: string; excerpt: string };

export type ConceptSuggestion = "approve" | "merge" | "split";

export type ProposedConcept = {
  id: string;
  courseId: CourseId;
  title: string;
  /** Existing fixture concept this proposal matches, or null for a new concept. */
  matchedConceptId: string | null;
  /** Simulated extraction confidence, 0–1. */
  confidence: number;
  suggestion: ConceptSuggestion;
  mergeTargetId?: string;
  splitParts?: string[];
  rationale: string;
  source: SourceRef;
};

export type ProposedEdge = {
  id: string;
  courseId: CourseId;
  /** Prerequisite concept ID (taught first). */
  from: string;
  /** Dependent concept ID. */
  to: string;
  confidence: number;
  rationale: string;
  /** The linked source presents these concepts in the opposite order (simulated signal). */
  sourceOrderReversed?: boolean;
  source: SourceRef;
};

export type LocalizedItem = { prompt: string; options: string[]; explanation: string };

export type FlaggedQuestion = {
  id: string;
  courseId: CourseId;
  conceptId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  flags: string[];
  /** Index into both `en.options` and `ar.options`. */
  answerIndex: number;
  en: LocalizedItem;
  ar: LocalizedItem;
  source: SourceRef;
};

/** Shared confidence cut-off used to show "Low confidence" warnings. */
export const LOW_CONFIDENCE = 0.7;

const pySlides = (week: number, topic: string) => `Sample lecture slides — Week ${week} ${topic}.pdf`;
const maNotes = (week: number, topic: string) => `Sample course notes — Week ${week} ${topic}.pdf`;

export const proposedConcepts: ProposedConcept[] = [
  {
    id: "PC-PY-01",
    courseId: "C-PY",
    title: "Call Stack Frames",
    matchedConceptId: "PY-STACK",
    confidence: 0.91,
    suggestion: "approve",
    rationale: "Wording and examples closely match the existing Call Stack concept.",
    source: { file: pySlides(7, "Functions II"), location: "Slides 12–15", excerpt: "Each function call creates a new frame on the call stack that stores its local variables." },
  },
  {
    id: "PC-PY-02",
    courseId: "C-PY",
    title: "Base Case and Recursive Case",
    matchedConceptId: "PY-REC",
    confidence: 0.88,
    suggestion: "approve",
    rationale: "Describes the two parts of every recursive function covered by Recursion.",
    source: { file: pySlides(8, "Recursion"), location: "Slides 3–6", excerpt: "A recursive function needs a base case that stops, and a recursive case that moves toward it." },
  },
  {
    id: "PC-PY-03",
    courseId: "C-PY",
    title: "Function Scope",
    matchedConceptId: null,
    confidence: 0.62,
    suggestion: "merge",
    mergeTargetId: "PY-FUNC",
    rationale: "Appears only as a short sub-topic; likely better as part of Functions.",
    source: { file: pySlides(6, "Functions"), location: "Slide 18", excerpt: "Variables created inside a function are local to that function." },
  },
  {
    id: "PC-PY-04",
    courseId: "C-PY",
    title: "Lists and Dictionaries",
    matchedConceptId: null,
    confidence: 0.55,
    suggestion: "split",
    splitParts: ["Lists", "Dictionaries"],
    rationale: "Two separate data structures were extracted as one heading.",
    source: { file: pySlides(5, "Collections"), location: "Slides 1–22", excerpt: "Collections: lists keep items in order; dictionaries map keys to values." },
  },
  {
    id: "PC-PY-05",
    courseId: "C-PY",
    title: "Loop Control (break and continue)",
    matchedConceptId: "PY-LOOP",
    confidence: 0.79,
    suggestion: "merge",
    mergeTargetId: "PY-LOOP",
    rationale: "A detail of Loops rather than a standalone concept.",
    source: { file: pySlides(4, "Loops"), location: "Slides 14–16", excerpt: "break exits the loop early; continue skips to the next iteration." },
  },
  {
    id: "PC-PY-06",
    courseId: "C-PY",
    title: "Boolean Expressions",
    matchedConceptId: null,
    confidence: 0.67,
    suggestion: "approve",
    rationale: "Taught before Conditions; could be a new concept or part of Operators.",
    source: { file: pySlides(3, "Conditions"), location: "Slides 2–5", excerpt: "Comparisons such as x > 3 produce True or False." },
  },
  {
    id: "PC-MA-01",
    courseId: "C-MATH",
    title: "Limit Notation",
    matchedConceptId: "MA-LIMIT",
    confidence: 0.9,
    suggestion: "approve",
    rationale: "Matches the existing Limits concept.",
    source: { file: maNotes(8, "Limits"), location: "Pages 2–4", excerpt: "We write lim x→a f(x) = L when f(x) gets close to L as x approaches a." },
  },
  {
    id: "PC-MA-02",
    courseId: "C-MATH",
    title: "Slope of a Tangent Line",
    matchedConceptId: "MA-DERIV",
    confidence: 0.86,
    suggestion: "merge",
    mergeTargetId: "MA-DERIV",
    rationale: "Introduces the derivative; best kept inside Derivatives.",
    source: { file: maNotes(9, "Derivatives"), location: "Page 1", excerpt: "The derivative at a point is the slope of the tangent line there." },
  },
  {
    id: "PC-MA-03",
    courseId: "C-MATH",
    title: "Solving One-Step Equations",
    matchedConceptId: null,
    confidence: 0.64,
    suggestion: "merge",
    mergeTargetId: "MA-LIN",
    rationale: "A simpler case of Linear Equations.",
    source: { file: maNotes(3, "Equations"), location: "Page 5", excerpt: "To solve x + 4 = 9, subtract 4 from both sides." },
  },
  {
    id: "PC-MA-04",
    courseId: "C-MATH",
    title: "Functions and Graphs",
    matchedConceptId: null,
    confidence: 0.58,
    suggestion: "split",
    splitParts: ["Functions", "Graphs"],
    rationale: "Two existing concepts appear under one heading.",
    source: { file: maNotes(5, "Functions"), location: "Pages 1–12", excerpt: "A function assigns one output to each input; its graph shows all input–output pairs." },
  },
  {
    id: "PC-MA-05",
    courseId: "C-MATH",
    title: "Factoring Quadratics",
    matchedConceptId: "MA-QUAD",
    confidence: 0.81,
    suggestion: "approve",
    rationale: "Core technique within Quadratic Equations.",
    source: { file: maNotes(6, "Quadratics"), location: "Pages 3–6", excerpt: "Write x² − 5x + 6 as (x − 2)(x − 3) to find its roots." },
  },
];

export const proposedEdges: ProposedEdge[] = [
  {
    id: "PE-PY-01",
    courseId: "C-PY",
    from: "PY-DICT",
    to: "PY-LIST",
    confidence: 0.58,
    rationale: "Both appear in the same lecture; the order may have been read backwards.",
    sourceOrderReversed: true,
    source: { file: pySlides(5, "Collections"), location: "Slide 1", excerpt: "Lists are introduced first, then dictionaries." },
  },
  {
    id: "PE-PY-02",
    courseId: "C-PY",
    from: "PY-TYPE",
    to: "PY-COND",
    confidence: 0.74,
    rationale: "Conditions compare values of different types (bool, int, str).",
    source: { file: pySlides(3, "Conditions"), location: "Slide 4", excerpt: "A condition always evaluates to a bool value." },
  },
  {
    id: "PE-PY-03",
    courseId: "C-PY",
    from: "PY-REC",
    to: "PY-STACK",
    confidence: 0.52,
    rationale: "Recursion examples are used to explain stack frames.",
    source: { file: pySlides(8, "Recursion"), location: "Slide 9", excerpt: "Watch the call stack grow with each recursive call." },
  },
  {
    id: "PE-PY-04",
    courseId: "C-PY",
    from: "PY-LOOP",
    to: "PY-REC",
    confidence: 0.61,
    rationale: "Recursion is compared with an equivalent loop.",
    source: { file: pySlides(8, "Recursion"), location: "Slide 14", excerpt: "Any loop can be rewritten as a recursive function." },
  },
  {
    id: "PE-PY-05",
    courseId: "C-PY",
    from: "PY-FUNC",
    to: "PY-VAR",
    confidence: 0.45,
    rationale: "Local variables are discussed in the Functions lecture.",
    source: { file: pySlides(6, "Functions"), location: "Slide 18", excerpt: "Variables created inside a function are local to that function." },
  },
  {
    id: "PE-MA-01",
    courseId: "C-MATH",
    from: "MA-ARITH",
    to: "MA-LIN",
    confidence: 0.7,
    rationale: "Solving equations relies on inverse arithmetic operations.",
    source: { file: maNotes(3, "Equations"), location: "Page 2", excerpt: "Undo addition with subtraction and multiplication with division." },
  },
  {
    id: "PE-MA-02",
    courseId: "C-MATH",
    from: "MA-GRAPH",
    to: "MA-QUAD",
    confidence: 0.6,
    rationale: "Parabola graphs are used to show the roots of quadratics.",
    source: { file: maNotes(6, "Quadratics"), location: "Page 8", excerpt: "The roots are where the parabola crosses the x-axis." },
  },
  {
    id: "PE-MA-03",
    courseId: "C-MATH",
    from: "MA-DERIV",
    to: "MA-LIMIT",
    confidence: 0.48,
    rationale: "The derivative definition uses a limit.",
    source: { file: maNotes(9, "Derivatives"), location: "Page 2", excerpt: "f′(x) is defined as a limit of difference quotients." },
  },
  {
    id: "PE-MA-04",
    courseId: "C-MATH",
    from: "MA-QUAD",
    to: "MA-INEQ",
    confidence: 0.5,
    rationale: "Quadratic inequalities appear in the practice set.",
    sourceOrderReversed: true,
    source: { file: maNotes(4, "Inequalities"), location: "Page 9", excerpt: "Inequalities are taught in Week 4, before Quadratics in Week 6. Extension: solve x² − 4 < 0." },
  },
  {
    id: "PE-MA-05",
    courseId: "C-MATH",
    from: "MA-APP",
    to: "MA-GRAPH",
    confidence: 0.44,
    rationale: "Curve sketching links derivatives back to graphs.",
    source: { file: maNotes(10, "Applications"), location: "Page 3", excerpt: "Use the derivative to sketch the graph of f." },
  },
];

export const flaggedQuestions: FlaggedQuestion[] = [
  {
    id: "GQ-PY-01",
    courseId: "C-PY",
    conceptId: "PY-STACK",
    difficulty: "Medium",
    flags: ["Arabic translation needs review"],
    answerIndex: 0,
    en: {
      prompt: "When a function is called, what is pushed onto the call stack?",
      options: ["A new frame for that call", "A copy of the whole program", "Only the return value"],
      explanation: "Each call gets its own frame holding its local variables and return point.",
    },
    ar: {
      prompt: "عند استدعاء دالة، ما الذي يُضاف إلى مكدس الاستدعاءات؟",
      options: ["إطار جديد لهذا الاستدعاء", "نسخة من البرنامج كاملًا", "القيمة المُعادة فقط"],
      explanation: "يحصل كل استدعاء على إطار خاص به يحتوي على متغيراته المحلية ونقطة العودة.",
    },
    source: { file: pySlides(7, "Functions II"), location: "Slide 12", excerpt: "Each function call creates a new frame on the call stack." },
  },
  {
    id: "GQ-PY-02",
    courseId: "C-PY",
    conceptId: "PY-LOOP",
    difficulty: "Easy",
    flags: ["Distractors may be too easy"],
    answerIndex: 1,
    en: {
      prompt: "How many times does the body of `for i in range(3):` run?",
      options: ["2", "3", "4"],
      explanation: "range(3) produces 0, 1 and 2 — three values.",
    },
    ar: {
      prompt: "كم مرة يُنفَّذ جسم الحلقة `for i in range(3):`؟",
      options: ["2", "3", "4"],
      explanation: "تُنتج range(3) القيم 0 و1 و2، أي ثلاث قيم.",
    },
    source: { file: pySlides(4, "Loops"), location: "Slide 6", excerpt: "range(n) produces the numbers 0 to n − 1." },
  },
  {
    id: "GQ-PY-03",
    courseId: "C-PY",
    conceptId: "PY-REC",
    difficulty: "Medium",
    flags: ["Wording may be ambiguous", "Low generation confidence"],
    answerIndex: 0,
    en: {
      prompt: "Which part of a recursive function must change so the base case is eventually reached?",
      options: ["The argument of the recursive call", "The function name", "The return type"],
      explanation: "Each call should change its argument so that the base case is eventually reached.",
    },
    ar: {
      prompt: "أي جزء من الدالة العودية يجب أن يتغيّر حتى يتم الوصول إلى الحالة الأساسية في النهاية؟",
      options: ["وسيط الاستدعاء العودي", "اسم الدالة", "نوع القيمة المُعادة"],
      explanation: "يجب أن يغيّر كل استدعاء وسيطه بحيث يتم الوصول إلى الحالة الأساسية في النهاية.",
    },
    source: { file: pySlides(8, "Recursion"), location: "Slide 6", excerpt: "A recursive case must move toward the base case." },
  },
  {
    id: "GQ-PY-04",
    courseId: "C-PY",
    conceptId: "PY-DICT",
    difficulty: "Medium",
    flags: ["Source link missing"],
    answerIndex: 0,
    en: {
      prompt: "What does `d.get('k', 0)` return if the key 'k' is missing?",
      options: ["0", "None", "A KeyError"],
      explanation: "get returns the default value passed as its second argument.",
    },
    ar: {
      prompt: "ماذا تُعيد `d.get('k', 0)` إذا كان المفتاح 'k' غير موجود؟",
      options: ["0", "None", "خطأ KeyError"],
      explanation: "تُعيد get القيمة الافتراضية المُمرَّرة كوسيط ثانٍ.",
    },
    source: { file: "No matching passage found (sample)", location: "—", excerpt: "The generator could not link this item to an uploaded material." },
  },
  {
    id: "GQ-MA-01",
    courseId: "C-MATH",
    conceptId: "MA-LIMIT",
    difficulty: "Easy",
    flags: ["Arabic translation needs review"],
    answerIndex: 1,
    en: {
      prompt: "What is the limit of 2x + 1 as x approaches 3?",
      options: ["5", "7", "9"],
      explanation: "The expression is continuous, so substitute x = 3: 2(3) + 1 = 7.",
    },
    ar: {
      prompt: "ما نهاية 2x + 1 عندما تقترب x من 3؟",
      options: ["5", "7", "9"],
      explanation: "الدالة متصلة، لذا نعوّض x = 3 فنحصل على 2(3) + 1 = 7.",
    },
    source: { file: maNotes(8, "Limits"), location: "Page 5", excerpt: "For continuous functions, the limit equals the function value." },
  },
  {
    id: "GQ-MA-02",
    courseId: "C-MATH",
    conceptId: "MA-QUAD",
    difficulty: "Medium",
    flags: ["Check distractor plausibility"],
    answerIndex: 0,
    en: {
      prompt: "Which values solve x² − 5x + 6 = 0?",
      options: ["x = 2 and x = 3", "x = −2 and x = −3", "x = 1 and x = 6"],
      explanation: "Factor as (x − 2)(x − 3) = 0, so x = 2 or x = 3.",
    },
    ar: {
      prompt: "ما قيم x التي تحقق المعادلة x² − 5x + 6 = 0؟",
      options: ["x = 2 و x = 3", "x = −2 و x = −3", "x = 1 و x = 6"],
      explanation: "نحلّل إلى (x − 2)(x − 3) = 0، إذن x = 2 أو x = 3.",
    },
    source: { file: maNotes(6, "Quadratics"), location: "Page 4", excerpt: "Write x² − 5x + 6 as (x − 2)(x − 3) to find its roots." },
  },
  {
    id: "GQ-MA-03",
    courseId: "C-MATH",
    conceptId: "MA-LIN",
    difficulty: "Easy",
    flags: ["Difficulty may be too low for this week"],
    answerIndex: 1,
    en: {
      prompt: "Solve 3x − 4 = 11.",
      options: ["x = 3", "x = 5", "x = 7"],
      explanation: "Add 4 to get 3x = 15, then divide by 3.",
    },
    ar: {
      prompt: "حُلّ المعادلة 3x − 4 = 11.",
      options: ["x = 3", "x = 5", "x = 7"],
      explanation: "نضيف 4 إلى الطرفين فنحصل على 3x = 15، ثم نقسم على 3.",
    },
    source: { file: maNotes(3, "Equations"), location: "Page 6", excerpt: "Isolate x by undoing each operation in reverse order." },
  },
  {
    id: "GQ-MA-04",
    courseId: "C-MATH",
    conceptId: "MA-DERIV",
    difficulty: "Medium",
    flags: ["Source link missing"],
    answerIndex: 0,
    en: {
      prompt: "What is the derivative of 5x³?",
      options: ["15x²", "5x²", "15x³"],
      explanation: "Power rule: multiply by the exponent 3 and reduce the exponent by 1.",
    },
    ar: {
      prompt: "ما مشتقة 5x³؟",
      options: ["15x²", "5x²", "15x³"],
      explanation: "قاعدة القوة: نضرب في الأس 3 ثم نطرح 1 من الأس.",
    },
    source: { file: "No matching passage found (sample)", location: "—", excerpt: "The generator could not link this item to an uploaded material." },
  },
];

export const proposedConceptsFor = (courseId: CourseId) => proposedConcepts.filter(c => c.courseId === courseId);
export const proposedEdgesFor = (courseId: CourseId) => proposedEdges.filter(e => e.courseId === courseId);
export const flaggedQuestionsFor = (courseId: CourseId) => flaggedQuestions.filter(q => q.courseId === courseId);

/** Development guard: every referenced concept ID must exist in the shared fixtures. */
export function unknownFixtureIds(): string[] {
  const known = new Set(concepts.map(c => c.id));
  const refs = [
    ...proposedConcepts.flatMap(c => [c.matchedConceptId, c.mergeTargetId]),
    ...proposedEdges.flatMap(e => [e.from, e.to]),
    ...flaggedQuestions.map(q => q.conceptId),
  ].filter((id): id is string => !!id);
  return refs.filter(id => !known.has(id));
}
