import type { CourseId } from "@/types";

/**
 * IN15 Tutor audit — scripted, fictional tutor exchanges.
 *
 * No real AI, retrieval or student conversation is involved: every question,
 * answer and citation below was hand-written for the Phase 1 demo. Course and
 * concept IDs are the stable contracts from `data/fixtures.ts`. Students are
 * shown only as anonymized labels (privacy boundary for tutor transcripts).
 */

export type MockSource = {
  id: string;
  /** Fictional course material title. */
  title: string;
  /** Where in the material the cited passage lives. */
  location: string;
  /** Short illustrative excerpt (written for the demo). */
  excerpt: string;
};

export type Grounding = "grounded" | "partial" | "none";

export type TutorConversation = {
  id: string;
  courseId: CourseId;
  conceptId: string;
  /** Anonymized label; real identities are never shown in the audit. */
  learnerLabel: string;
  askedLabel: string;
  lang: "en" | "ar";
  question: string;
  answer: string;
  grounding: Grounding;
  sourceIds: string[];
  /** Preset content-gap suggestion (instructor may still toggle the flag). */
  suggestedGap?: string;
};

export const mockSources: MockSource[] = [
  { id: "SRC-PY-M3-L2", title: "Module 3 lecture notes · Functions", location: "Section 3.2, slide 9", excerpt: "Each call to a function creates a new frame that stores its own parameters and local variables." },
  { id: "SRC-PY-M4-L1", title: "Module 4 lecture notes · Call Stack", location: "Section 4.1, slide 4", excerpt: "Frames are pushed onto the call stack when a function is called and popped when it returns." },
  { id: "SRC-PY-M4-L2", title: "Module 4 lecture notes · Recursion", location: "Section 4.2, slide 12", excerpt: "Every recursive function needs a base case that returns without making another recursive call." },
  { id: "SRC-PY-M2-LAB", title: "Module 2 lab sheet · Loops", location: "Exercise 2.4", excerpt: "range(start, stop) produces values from start up to, but not including, stop." },
  { id: "SRC-PY-M3-DICT", title: "Module 3 reading · Dictionaries", location: "Page 6", excerpt: "Dictionary keys must be immutable; lists cannot be used as keys." },
  { id: "SRC-MA-M4-L3", title: "Unit 4 lecture notes · Derivatives", location: "Section 4.3, slide 7", excerpt: "The power rule: the derivative of xⁿ is n·xⁿ⁻¹." },
  { id: "SRC-MA-M4-L1", title: "Unit 4 lecture notes · Limits", location: "Section 4.1, slide 3", excerpt: "A limit describes the value a function approaches as the input approaches a point." },
  { id: "SRC-MA-M2-WS", title: "Unit 2 worksheet · Linear Equations", location: "Worked example 3", excerpt: "Apply the same operation to both sides of the equation to keep it balanced." },
];

export const mockConversations: TutorConversation[] = [
  {
    id: "TC-PY-01",
    courseId: "C-PY",
    conceptId: "PY-REC",
    learnerLabel: "Learner A",
    askedLabel: "Today, 09:12",
    lang: "en",
    question: "Why does my recursive factorial keep running until it crashes?",
    answer: "Your function probably never reaches a base case. Add a condition such as `if n <= 1: return 1` before the recursive call, so each call moves closer to a value that returns without recursing again.",
    grounding: "grounded",
    sourceIds: ["SRC-PY-M4-L2", "SRC-PY-M4-L1"],
  },
  {
    id: "TC-PY-02",
    courseId: "C-PY",
    conceptId: "PY-STACK",
    learnerLabel: "Learner B",
    askedLabel: "Today, 08:40",
    lang: "en",
    question: "What actually happens on the call stack when a function calls itself?",
    answer: "Each call pushes a new frame with its own copy of the parameters. When a call returns, its frame is popped and control goes back to the frame beneath it.",
    grounding: "grounded",
    sourceIds: ["SRC-PY-M4-L1", "SRC-PY-M3-L2"],
    suggestedGap: "Three learners asked about stack frames this week; the course has no visual trace of frames for a recursive call.",
  },
  {
    id: "TC-PY-03",
    courseId: "C-PY",
    conceptId: "PY-LOOP",
    learnerLabel: "Learner C",
    askedLabel: "Yesterday, 17:05",
    lang: "ar",
    question: "لماذا لا تطبع range(1, 5) الرقم 5؟",
    answer: "لأن range تتوقف قبل القيمة الثانية مباشرة. القيم الناتجة هي 1 و2 و3 و4. لطباعة 5 استخدم range(1, 6).",
    grounding: "grounded",
    sourceIds: ["SRC-PY-M2-LAB"],
  },
  {
    id: "TC-PY-04",
    courseId: "C-PY",
    conceptId: "PY-DICT",
    learnerLabel: "Learner D",
    askedLabel: "Yesterday, 14:22",
    lang: "en",
    question: "Can I use a list as a dictionary key if I don't change it?",
    answer: "Yes, as long as you never modify the list it will work as a key.",
    grounding: "partial",
    sourceIds: ["SRC-PY-M3-DICT"],
  },
  {
    id: "TC-PY-05",
    courseId: "C-PY",
    conceptId: "PY-REC",
    learnerLabel: "Learner E",
    askedLabel: "2 days ago",
    lang: "en",
    question: "When should I use recursion instead of a loop for the assignment?",
    answer: "I could not find course material that compares recursion and loops for this assignment. Please check with your instructor.",
    grounding: "none",
    sourceIds: [],
    suggestedGap: "No course material compares recursion with iteration; learners are asking for guidance on when to choose each.",
  },
  {
    id: "TC-MA-01",
    courseId: "C-MATH",
    conceptId: "MA-DERIV",
    learnerLabel: "Learner A",
    askedLabel: "Today, 10:03",
    lang: "en",
    question: "How do I find the derivative of x³?",
    answer: "Use the power rule: bring the exponent down and subtract one from it. The derivative of x³ is 3x².",
    grounding: "grounded",
    sourceIds: ["SRC-MA-M4-L3"],
  },
  {
    id: "TC-MA-02",
    courseId: "C-MATH",
    conceptId: "MA-LIMIT",
    learnerLabel: "Learner B",
    askedLabel: "Yesterday, 19:47",
    lang: "ar",
    question: "هل النهاية هي نفسها قيمة الدالة عند النقطة؟",
    answer: "النهاية هي القيمة التي تقترب منها الدالة كلما اقتربنا من النقطة، وقد تختلف عن قيمة الدالة عند النقطة نفسها أو لا تكون الدالة معرفة عندها.",
    grounding: "grounded",
    sourceIds: ["SRC-MA-M4-L1"],
  },
  {
    id: "TC-MA-03",
    courseId: "C-MATH",
    conceptId: "MA-LIN",
    learnerLabel: "Learner C",
    askedLabel: "Yesterday, 11:30",
    lang: "en",
    question: "Can I just move the 3 to the other side in 2x + 3 = 11?",
    answer: "Moving a term across the equals sign changes its sign, so 2x = 11 + 3.",
    grounding: "partial",
    sourceIds: ["SRC-MA-M2-WS"],
  },
  {
    id: "TC-MA-04",
    courseId: "C-MATH",
    conceptId: "MA-APP",
    learnerLabel: "Learner D",
    askedLabel: "3 days ago",
    lang: "en",
    question: "How do derivatives help with optimisation word problems?",
    answer: "I could not find course material with worked optimisation problems. Please check with your instructor.",
    grounding: "none",
    sourceIds: [],
    suggestedGap: "Applications of Derivatives has no worked optimisation examples in the uploaded materials.",
  },
];

export const findSource = (id: string) => mockSources.find(s => s.id === id);
export const conversationsForCourse = (courseId: CourseId) => mockConversations.filter(c => c.courseId === courseId);
