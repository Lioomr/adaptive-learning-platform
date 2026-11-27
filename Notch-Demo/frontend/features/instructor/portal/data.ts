import { initialStudents } from "@/data/fixtures";
import type { Student } from "@/types";
import {
  announcements as studentAnnouncements,
  assignments as studentAssignments,
  courseConcepts,
  courses,
  type Copy,
  type CourseId,
} from "@/features/student/portal/data";

/**
 * Instructor Portal mock data. Everything is fictional. The shapes below are the
 * contract a future API would return; the store (`store.ts`) is the only reader.
 */
export type { Copy, CourseId };

/** Mock "Admin assignment": which courses each instructor may open and manage. */
export type InstructorAccount = {
  id: string;
  name: Copy;
  title: Copy;
  courseIds: CourseId[];
};
export const instructorAccounts: InstructorAccount[] = [
  {
    id: "I-HANA",
    name: ["Dr. Hana", "د. هناء"],
    title: ["Computer Science", "علوم الحاسب"],
    courseIds: ["python", "algorithms", "ai"],
  },
  {
    id: "I-MATH",
    name: ["Dr. Hala Hassan", "د. هالة حسن"],
    title: ["Mathematics", "الرياضيات"],
    courseIds: ["mathematics"],
  },
  {
    id: "I-ENG",
    name: ["Dr. Dina Adel", "د. دينا عادل"],
    title: ["Languages", "اللغات"],
    courseIds: ["english"],
  },
];
export const defaultInstructorId = instructorAccounts[0].id;

export type Status = "published" | "draft";
export type Announcement = {
  id: string;
  courseId: CourseId;
  title: Copy;
  body: Copy;
  date: string;
  important: boolean;
};
export type LessonKind = "lecture" | "lab";
export type CourseLesson = {
  id: string;
  courseId: CourseId;
  kind: LessonKind;
  title: Copy;
  description: Copy;
  content: Copy;
  exercise: Copy;
  minutes: number;
  status: Status;
};
export type AssignmentKind = "assignment" | "quiz" | "lab" | "exam";
export type Attachment = { name: string; size: string };
export type CourseAssignment = {
  id: string;
  courseId: CourseId;
  kind: AssignmentKind;
  title: Copy;
  instructions: Copy;
  due: string;
  maxGrade: number;
  /** Share of the course grade, in percent. */
  weight: number;
  attachments: Attachment[];
  status: Status;
};
export type SubmissionStatus = "submitted" | "graded" | "missing";
export type StudentSubmission = {
  id: string;
  assignmentId: string;
  courseId: CourseId;
  studentId: string;
  status: SubmissionStatus;
  submittedAt?: string;
  text: Copy;
  grade?: number;
  feedback?: Copy;
};
export type MaterialKind = "document" | "file" | "link";
export type Material = {
  id: string;
  courseId: CourseId;
  kind: MaterialKind;
  title: Copy;
  description: Copy;
  url?: string;
  fileName?: string;
  addedAt: string;
};
export type Content = {
  announcements: Announcement[];
  lessons: CourseLesson[];
  assignments: CourseAssignment[];
  submissions: StudentSubmission[];
  materials: Material[];
};
export type CollectionKey = keyof Content;

export const assignmentKindLabels: Record<AssignmentKind, Copy> = {
  assignment: ["Assignment", "واجب"],
  quiz: ["Quiz", "اختبار قصير"],
  lab: ["Lab", "معمل"],
  exam: ["Exam", "امتحان"],
};

const validCourse = new Set<string>(courses.map((c) => c.id));
export const isCourseId = (id: string): id is CourseId => validCourse.has(id);

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** Fictional roster. All five courses use the same ten shared fictional students. */
export const roster = initialStudents;

/** Mastery for a student in a course. English, Algorithms and AI are mock extensions. */
export function studentMastery(
  course: { id: CourseId; sharedId?: "C-PY" | "C-MATH" },
  student: Student,
) {
  const c = courses.find((x) => x.id === course.id)!;
  if (c.sharedId) {
    const values = courseConcepts(c, student);
    return Math.round(
      values.reduce((s, v) => s + v.mastery, 0) / values.length,
    );
  }
  const py = courses.find((x) => x.id === "python")!;
  const base =
    courseConcepts(py, student).reduce((s, v) => s + v.mastery, 0) /
    courseConcepts(py, student).length;
  return clamp(
    Math.round(base) + ((hash(student.id + course.id) % 17) - 8),
    15,
    98,
  );
}
export type Health = "on-track" | "attention" | "at-risk";
export function health(mastery: number, lastActiveDays: number): Health {
  if (mastery < 45 || lastActiveDays >= 10) return "at-risk";
  if (mastery < 65 || lastActiveDays >= 5) return "attention";
  return "on-track";
}
/** Share of lectures and labs the student has completed, 0–100. */
export function studentCompletion(
  courseId: CourseId,
  student: Student,
  mastery: number,
) {
  return clamp(
    Math.round(mastery * 0.88 + (hash(student.id + courseId + "c") % 14)),
    4,
    100,
  );
}

const sampleWork: Copy[] = [
  [
    "I broke the problem into small steps, tested each one, and wrote down what I learned from the mistakes along the way.",
    "قسّمت المسألة إلى خطوات صغيرة واختبرت كل خطوة ودوّنت ما تعلمته من الأخطاء.",
  ],
  [
    "My approach starts with a worked example, then generalises it. I compare two methods and explain which one I prefer and why.",
    "تبدأ طريقتي بمثال محلول ثم أعمّمه. قارنت بين أسلوبين وشرحت أيهما أفضل ولماذا.",
  ],
  [
    "Summary of my solution with a short reflection. I would like feedback on the clarity of my explanation.",
    "ملخص لحلي مع تأمل قصير. أرغب في ملاحظات حول وضوح الشرح.",
  ],
];
const feedbackBands: [number, Copy][] = [
  [
    90,
    [
      "Excellent work. Clear reasoning and well-chosen examples.",
      "عمل ممتاز. تفكير واضح وأمثلة مختارة بعناية.",
    ],
  ],
  [
    75,
    [
      "Solid work. Tighten the explanation of your second step.",
      "عمل جيد. حسّن شرح الخطوة الثانية.",
    ],
  ],
  [
    0,
    [
      "A good start. Review the lecture examples and try the practice set again.",
      "بداية جيدة. راجع أمثلة المحاضرة وأعد حل التمارين.",
    ],
  ],
];
const feedbackFor = (grade: number) =>
  feedbackBands.find(([min]) => grade >= min)![1];

const attachmentFor = (kind: AssignmentKind): Attachment[] =>
  kind === "assignment" ? [{ name: "brief.pdf", size: "212 KB" }] : [];

function seedAssignments(): CourseAssignment[] {
  return studentAssignments.map((a) => {
    const kind = a.kind[0].toLowerCase() as AssignmentKind;
    return {
      id: a.id,
      courseId: a.courseId,
      kind,
      title: a.title,
      instructions: [
        "Use the current lecture and lab to prepare your response. Describe your approach, include a worked example, and explain what you learned.",
        "استخدم المحاضرة والمعمل الحاليين لإعداد إجابتك. صف طريقتك وأضف مثالًا محلولًا واشرح ما تعلمته.",
      ],
      due: a.due,
      maxGrade: 100,
      weight: a.weight,
      attachments: attachmentFor(kind),
      status: "published",
    };
  });
}

function seedSubmissions(list: CourseAssignment[]): StudentSubmission[] {
  const out: StudentSubmission[] = [];
  const open = new Set(
    studentAssignments.filter((a) => a.score === undefined).map((a) => a.id),
  );
  for (const a of list) {
    const course = courses.find((c) => c.id === a.courseId)!;
    roster.forEach((student, i) => {
      const id = `${a.id}:${student.id}`;
      const text = sampleWork[hash(id) % sampleWork.length];
      if (open.has(a.id)) {
        const roll = hash(id) % 10;
        if (roll < 4)
          return void out.push({
            id,
            assignmentId: a.id,
            courseId: a.courseId,
            studentId: student.id,
            status: "missing",
            text: ["", ""],
          });
        return void out.push({
          id,
          assignmentId: a.id,
          courseId: a.courseId,
          studentId: student.id,
          status: "submitted",
          submittedAt: `2026-11-${String(20 + (i % 4)).padStart(2, "0")}T${String(9 + (i % 8)).padStart(2, "0")}:15:00+02:00`,
          text,
        });
      }
      const grade = clamp(
        studentMastery(course, student) + ((hash(id) % 21) - 10),
        35,
        100,
      );
      out.push({
        id,
        assignmentId: a.id,
        courseId: a.courseId,
        studentId: student.id,
        status: "graded",
        submittedAt: a.due,
        text,
        grade,
        feedback: feedbackFor(grade),
      });
    });
  }
  return out;
}

const lessonsOf = (): CourseLesson[] =>
  courses.flatMap((c) =>
    (["lecture", "lab"] as const).flatMap((kind) =>
      (kind === "lecture" ? c.lectures : c.labs).map((l) => ({
        id: l.id,
        courseId: c.id,
        kind,
        title: l.title,
        description: l.description,
        content: l.content,
        exercise: l.exercise,
        minutes: l.minutes,
        status: "published" as const,
      })),
    ),
  );

const materialsOf = (): Material[] =>
  courses.flatMap((c) => [
    {
      id: `${c.id}-m1`,
      courseId: c.id,
      kind: "document" as const,
      title: ["Study guide", "دليل الدراسة"] as Copy,
      description: c.lectures[0].description,
      fileName: `${c.id}-study-guide.pdf`,
      addedAt: "2026-11-10T10:00:00+02:00",
    },
    {
      id: `${c.id}-m2`,
      courseId: c.id,
      kind: "link" as const,
      title: ["Worked examples", "أمثلة محلولة"] as Copy,
      description: [
        "A curated set of external examples for independent practice.",
        "مجموعة مختارة من الأمثلة الخارجية للتدريب المستقل.",
      ] as Copy,
      url: "https://example.org/notch/worked-examples",
      addedAt: "2026-11-12T10:00:00+02:00",
    },
  ]);

/** Fresh seed content. Built on demand so a reset always returns the original state. */
export function seedContent(): Content {
  const assignments = seedAssignments();
  return {
    announcements: courses.flatMap((c) =>
      studentAnnouncements.map((a) => ({
        id: `${c.id}-${a.id}`,
        courseId: c.id,
        title: a.title,
        body: a.body,
        date: a.date,
        important: a.important,
      })),
    ),
    lessons: lessonsOf(),
    assignments,
    submissions: seedSubmissions(assignments),
    materials: materialsOf(),
  };
}

export const courseHref = (id: CourseId, section = "progress") =>
  `/instructor/courses/${id}/${section}`;

/** Weighted course grade for one student from graded submissions, 0–100. */
export function weightedGrade(
  assignments: CourseAssignment[],
  submissions: StudentSubmission[],
  studentId: string,
) {
  let weight = 0;
  let total = 0;
  for (const a of assignments) {
    if (a.status !== "published") continue;
    const s = submissions.find(
      (x) =>
        x.assignmentId === a.id &&
        x.studentId === studentId &&
        x.grade !== undefined,
    );
    if (!s || s.grade === undefined) continue;
    weight += a.weight;
    total += (s.grade / a.maxGrade) * 100 * a.weight;
  }
  return weight ? Math.round(total / weight) : null;
}
