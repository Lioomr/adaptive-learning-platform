/**
 * Local IN8/IN9 sample data that the shared fixtures do not model yet
 * (wrong-choice tallies, anonymised tutor questions, teaching suggestions,
 * content-gap notes). Everything here is fictional and labelled
 * "Sample data / Simulated" in the UI.
 *
 * Consistency rules:
 * - Wrong choices reference real options of a question in data/fixtures.ts.
 * - `studentIds` are fixture IDs; at render time they are filtered to students
 *   who are still below the prerequisite-ready threshold (70) on that concept,
 *   so counts never contradict the live mastery values.
 * - Tutor questions are anonymised and carry no student identity.
 */

export type WrongChoiceSample = {
  questionId: string;
  choice: string;
  misconception: string;
  studentIds: string[];
};

export type TutorQuestionSample = { question: string; askedTimes: number; linkedConceptId?: string };

export type TeachingFixSample = { summary: string; steps: string[] };

export type ContentGapSample = { conceptId: string; gap: string; source: "Tutor audit" | "Question bank" };

export const wrongChoiceSamples: Record<string, WrongChoiceSample[]> = {
  "PY-REC": [
    { questionId: "PY-REC-001", choice: "A variable name", misconception: "Thinks naming or reassigning a variable ends the recursion, instead of a base case that returns.", studentIds: ["S-NOUR", "S-YOUSSEF", "S-KARIM"] },
    { questionId: "PY-REC-001", choice: "A comment", misconception: "Treats explanatory comments as executable stopping conditions.", studentIds: ["S-MARIAM"] },
  ],
  "MA-DERIV": [
    { questionId: "MA-DERIV-001", choice: "3", misconception: "Substitutes x = 3 directly without differentiating first.", studentIds: ["S-NOUR", "S-MARIAM"] },
    { questionId: "MA-DERIV-001", choice: "9", misconception: "Evaluates x² at x = 3 instead of its derivative 2x.", studentIds: ["S-YOUSSEF", "S-KARIM"] },
  ],
};

export const tutorQuestionSamples: Record<string, TutorQuestionSample[]> = {
  "PY-REC": [
    { question: "Why does my recursive function print the numbers in reverse order?", askedTimes: 4, linkedConceptId: "PY-STACK" },
    { question: "Where does the value go after the base case returns?", askedTimes: 3, linkedConceptId: "PY-STACK" },
    { question: "What is a RecursionError and how do I avoid it?", askedTimes: 2 },
  ],
  "PY-STACK": [
    { question: "What is a stack frame?", askedTimes: 3 },
    { question: "Why do local variables disappear when a function returns?", askedTimes: 2, linkedConceptId: "PY-FUNC" },
  ],
  "PY-LOOP": [{ question: "When should I use while instead of for?", askedTimes: 2, linkedConceptId: "PY-COND" }],
  "MA-DERIV": [
    { question: "Why is the derivative of x² equal to 2x?", askedTimes: 3, linkedConceptId: "MA-LIMIT" },
    { question: "Do I differentiate before or after substituting the value?", askedTimes: 2 },
  ],
  "MA-APP": [{ question: "How do I know if a critical point is a maximum or a minimum?", askedTimes: 2, linkedConceptId: "MA-DERIV" }],
};

export const teachingFixSamples: Record<string, TeachingFixSample> = {
  "PY-REC": {
    summary: "Re-teach the call stack with a traced example before the next recursion exercise.",
    steps: [
      "Trace factorial(3) on the board, drawing one stack frame per call.",
      "Highlight the base case as the frame that returns without a new call.",
      "Unwind the frames to show why results appear in reverse order.",
      "Assign two short Call Stack questions before returning to Recursion practice.",
    ],
  },
  "PY-STACK": {
    summary: "Use a stack-of-cards visual for function calls and returns.",
    steps: ["Model each call as a card placed on top of the pile.", "Remove the top card on return and show which locals disappear.", "Connect the visual to Python Tutor-style frame diagrams."],
  },
  "MA-DERIV": {
    summary: "Separate “differentiate” and “evaluate” as two explicit steps.",
    steps: ["Write f′(x) first, then substitute the value.", "Contrast f(3) and f′(3) side by side for x².", "Add one worked example per power-rule case."],
  },
};

export const contentGapSamples: ContentGapSample[] = [
  { conceptId: "PY-STACK", gap: "No lecture material shows stack frames visually; tutor answers relied on a generic explanation.", source: "Tutor audit" },
  { conceptId: "PY-REC", gap: "Only one illustrative question; no traced recursion example in course materials.", source: "Question bank" },
  { conceptId: "MA-APP", gap: "No worked optimisation example linked to Derivatives.", source: "Tutor audit" },
];
