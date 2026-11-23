import type { Advisor, Concept, Course, CourseId, Instructor, Question, Student } from "@/types";

/**
 * Authoritative shared Phase 1 fixtures. All people are fictional.
 * IDs are stable contracts: do not rename them without Integration Lead review.
 */
export const courses: Course[] = [
  { id: "C-PY", title: "Introduction to Python", shortTitle: "Python" },
  { id: "C-MATH", title: "Mathematics", shortTitle: "Mathematics" },
];

const rawConcepts: [CourseId, string, string, string[]][] = [
  ["C-PY", "PY-VAR", "Variables", []],
  ["C-PY", "PY-TYPE", "Data Types", ["PY-VAR"]],
  ["C-PY", "PY-OP", "Operators", ["PY-VAR", "PY-TYPE"]],
  ["C-PY", "PY-COND", "Conditions", ["PY-OP"]],
  ["C-PY", "PY-LOOP", "Loops", ["PY-COND"]],
  ["C-PY", "PY-FUNC", "Functions", ["PY-VAR", "PY-OP"]],
  ["C-PY", "PY-LIST", "Lists", ["PY-VAR", "PY-LOOP"]],
  ["C-PY", "PY-DICT", "Dictionaries", ["PY-VAR", "PY-TYPE"]],
  ["C-PY", "PY-STACK", "Call Stack", ["PY-FUNC"]],
  ["C-PY", "PY-REC", "Recursion", ["PY-COND", "PY-FUNC", "PY-STACK"]],
  ["C-MATH", "MA-ARITH", "Arithmetic Foundations", []],
  ["C-MATH", "MA-EXPR", "Algebraic Expressions", ["MA-ARITH"]],
  ["C-MATH", "MA-LIN", "Linear Equations", ["MA-EXPR"]],
  ["C-MATH", "MA-INEQ", "Inequalities", ["MA-LIN"]],
  ["C-MATH", "MA-FUNC", "Functions", ["MA-LIN"]],
  ["C-MATH", "MA-GRAPH", "Graphs", ["MA-FUNC"]],
  ["C-MATH", "MA-QUAD", "Quadratic Equations", ["MA-EXPR", "MA-LIN"]],
  ["C-MATH", "MA-LIMIT", "Limits", ["MA-FUNC", "MA-GRAPH"]],
  ["C-MATH", "MA-DERIV", "Derivatives", ["MA-LIMIT", "MA-FUNC"]],
  ["C-MATH", "MA-APP", "Applications of Derivatives", ["MA-DERIV", "MA-GRAPH"]],
];

export const concepts: Concept[] = rawConcepts.map(([courseId, id, title, prerequisites]) => ({ courseId, id, title, prerequisites }));

// [name, lastActiveDays, Python baseline, Mathematics baseline]
const profiles: [string, number, number, number][] = [
  ["Nour", 1, 88, 88],
  ["Ahmed", 2, 55, 90],
  ["Salma", 1, 92, 94],
  ["Youssef", 14, 28, 32],
  ["Mariam", 3, 38, 40],
  ["Laila", 2, 75, 68],
  ["Omar", 4, 64, 72],
  ["Farah", 1, 83, 86],
  ["Karim", 6, 52, 57],
  ["Hana", 2, 78, 80],
];

export const initialStudents: Student[] = profiles.map(([name, lastActiveDays, python, math]) => ({
  id: `S-${name.toUpperCase()}`,
  name,
  lastActiveDays,
  enrolledCourseIds: ["C-PY", "C-MATH"],
  mastery: Object.fromEntries(concepts.map(c => [c.id, c.courseId === "C-PY" ? python : math])),
}));

// Story overrides: Nour needs Call Stack before Recursion; Ahmed needs Loops; Mariam needs foundations.
Object.assign(initialStudents[0].mastery, { "PY-STACK": 55, "PY-REC": 35, "MA-DERIV": 45, "MA-APP": 25 });
Object.assign(initialStudents[1].mastery, { "PY-LOOP": 35 });
Object.assign(initialStudents[4].mastery, { "PY-VAR": 30, "MA-ARITH": 30 });

/** Fictional course-level personas. Assignment drives the Instructor course restriction contract. */
export const instructors: Instructor[] = [
  { id: "I-PY", name: "Python course instructor", courseIds: ["C-PY"] },
  { id: "I-MATH", name: "Mathematics course instructor", courseIds: ["C-MATH"] },
];

/** Fictional advisor persona. The caseload drives the Advisor student restriction contract. */
export const advisors: Advisor[] = [
  { id: "A-MAIN", name: "Academic advisor", studentIds: initialStudents.map(s => s.id) },
];

/**
 * Small illustrative bank only; this is not the required 100-question bank.
 * The independently reviewed bank is tracked in MAH-28 and is a release blocker.
 */
export const questions: Question[] = [
  {
    id: "PY-VAR-001",
    courseId: "C-PY",
    conceptId: "PY-VAR",
    prompt: "Which statement correctly assigns the value 10 to a variable named age in Python?",
    options: ["age = 10", "10 = age", "var age == 10"],
    answer: "age = 10",
    explanation: "In Python, assignment uses the = operator with the variable name on the left and the value on the right.",
  },
  {
    id: "PY-REC-001",
    courseId: "C-PY",
    conceptId: "PY-REC",
    prompt: "What stops a recursive function from calling itself indefinitely?",
    options: ["A base case", "A variable name", "A comment"],
    answer: "A base case",
    explanation: "A base case returns without making another recursive call.",
  },
  {
    id: "MA-DERIV-001",
    courseId: "C-MATH",
    conceptId: "MA-DERIV",
    prompt: "What is the derivative of x² at x = 3?",
    options: ["3", "6", "9"],
    answer: "6",
    explanation: "The derivative is 2x, which equals 6 at x = 3.",
  },
  {
    id: "MA-ARITH-001",
    courseId: "C-MATH",
    conceptId: "MA-ARITH",
    prompt: "What is the value of 8 + 4 × 2?",
    options: ["16", "24", "20"],
    answer: "16",
    explanation: "Multiply before adding: 4 × 2 = 8, then 8 + 8 = 16.",
  },
];

export const findCourse = (id: string) => courses.find(c => c.id === id);
export const findConcept = (id: string) => concepts.find(c => c.id === id);
export const findQuestion = (id: string) => questions.find(q => q.id === id);
export const conceptsForCourse = (courseId: CourseId) => concepts.filter(c => c.courseId === courseId);
export const baselineStudent = (id: string) => initialStudents.find(s => s.id === id);
