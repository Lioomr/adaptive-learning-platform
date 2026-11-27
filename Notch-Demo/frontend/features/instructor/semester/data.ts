import type { Copy, CourseId } from "@/features/instructor/portal/data";

/**
 * Semester Preparation mock data. Everything here is simulated: no document is read
 * and no AI model runs. Extraction confidence is a fixed number per mock concept.
 */
export type { Copy, CourseId };

export const semesters = [
  { id: "fall-2026", label: ["Fall 2026", "خريف 2026"] as Copy },
  { id: "spring-2027", label: ["Spring 2027", "ربيع 2027"] as Copy },
];
export const ACCEPTED = /\.(pdf|pptx?)$/i;
export const MAX_BYTES = 50 * 1024 * 1024;

export type FileStatus = "uploading" | "uploaded" | "error";
export type StoredFile = {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  error?: string;
};
export type ProcessState = "not-processed" | "processing" | "processed";
export type Lecture = {
  id: string;
  number: number;
  title: string;
  file: StoredFile | null;
  process: ProcessState;
  slides: number;
};
export type Reference = StoredFile & { indexed: boolean; processing: boolean };
export type Source = { lectureId: string; slide: number; snippet: string };
export type Decision = "none" | "approved" | "rejected";
export type Concept = {
  id: string;
  en: string;
  ar: string;
  definition: Copy;
  /** Extraction confidence, 0–100. Not related to prerequisite confidence. */
  confidence: number;
  sources: Source[];
  decision: Decision;
  edited?: boolean;
};
export type EffectiveStatus = "approved" | "pending" | "rejected";
export type Workspace = {
  lectures: Lecture[];
  references: Reference[];
  concepts: Concept[];
  threshold: number;
  phase: "idle" | "processing" | "complete" | "error";
  /** Mock pipeline step for the document being processed (0–3). */
  stage: number;
  currentId?: string;
  /** Documents in this extraction run, and how many are finished. */
  batch: number;
  done: number;
  error?: string;
  /** The user closed the review banner for this workspace. */
  reviewed: boolean;
};

export const emptyWorkspace = (): Workspace => ({
  lectures: [],
  references: [],
  concepts: [],
  threshold: 80,
  phase: "idle",
  stage: 0,
  batch: 0,
  done: 0,
  reviewed: false,
});

/** Approved automatically (undecided and at or above the threshold) vs by the instructor. */
export function statusOf(c: Concept, threshold: number): EffectiveStatus {
  if (c.decision === "rejected") return "rejected";
  if (c.decision === "approved" || c.confidence >= threshold) return "approved";
  return "pending";
}
export const isAuto = (c: Concept, threshold: number) =>
  c.decision === "none" && c.confidence >= threshold;

export function counts(w: Workspace) {
  const s = { auto: 0, manual: 0, pending: 0, rejected: 0, total: w.concepts.length };
  for (const c of w.concepts) {
    const st = statusOf(c, w.threshold);
    if (st === "rejected") s.rejected++;
    else if (st === "pending") s.pending++;
    else if (isAuto(c, w.threshold)) s.auto++;
    else s.manual++;
  }
  return s;
}

type Seed = {
  en: string;
  ar: string;
  def: Copy;
  conf: number;
  /** [lecture slot 1–4, slide, optional second slot, second slide] */
  at: [number, number, number?, number?];
};
const s = (
  en: string,
  ar: string,
  defEn: string,
  defAr: string,
  conf: number,
  at: Seed["at"],
): Seed => ({ en, ar, def: [defEn, defAr], conf, at });

const bank: Record<CourseId, Seed[]> = {
  python: [
    s("Variable", "المتغير", "A named location that stores a value which can change while a program runs.", "موقع مسمّى يخزّن قيمة يمكن أن تتغير أثناء تشغيل البرنامج.", 92, [1, 6]),
    s("Data type", "نوع البيانات", "A classification that tells Python how a value is stored and which operations it supports.", "تصنيف يحدد كيف تُخزَّن القيمة وما العمليات المسموح بها عليها.", 88, [1, 9]),
    s("Type conversion", "تحويل النوع", "Changing a value from one data type to another, such as turning text into an integer.", "تغيير القيمة من نوع بيانات إلى آخر، كتحويل نص إلى عدد صحيح.", 74, [1, 12]),
    s("Conditional statement", "الجملة الشرطية", "A statement that runs a block of code only when a condition is true.", "جملة تنفّذ كتلة من الشيفرة فقط عندما يكون الشرط صحيحًا.", 90, [2, 5]),
    s("Boolean expression", "التعبير المنطقي", "An expression that evaluates to either True or False.", "تعبير ناتجه إما صحيح أو خطأ.", 77, [2, 8]),
    s("Loop", "الحلقة التكرارية", "A construct that repeats a block of code while a condition holds or for each item in a sequence.", "بنية تكرّر كتلة شيفرة ما دام الشرط متحققًا أو لكل عنصر في تسلسل.", 86, [2, 14]),
    s("Function", "الدالة", "A reusable, named block of code that can take inputs and produce an output.", "كتلة شيفرة مسمّاة قابلة لإعادة الاستخدام، تستقبل مدخلات وتنتج مخرجًا.", 94, [3, 4]),
    s("Parameter", "المعامل", "A name in a function definition that receives a value when the function is called.", "اسم في تعريف الدالة يستقبل قيمة عند استدعائها.", 81, [3, 7]),
    s("Return value", "القيمة المُرجَعة", "The value a function sends back to the code that called it.", "القيمة التي تعيدها الدالة إلى الشيفرة التي استدعتها.", 68, [3, 11]),
    s("Call stack", "مكدس الاستدعاء", "The structure Python uses to track which functions are running and where to return.", "البنية التي تستخدمها بايثون لتتبع الدوال الجارية ومكان العودة.", 72, [3, 16, 4, 3]),
    s("List", "القائمة", "An ordered, changeable collection of items.", "مجموعة مرتبة قابلة للتعديل من العناصر.", 91, [4, 5]),
    s("Dictionary", "القاموس", "A collection that maps unique keys to values.", "مجموعة تربط مفاتيح فريدة بقيم.", 79, [4, 10]),
    s("Recursion", "الاستدعاء الذاتي", "A technique where a function solves a problem by calling itself on a smaller version.", "أسلوب تحل فيه الدالة المسألة باستدعاء نفسها على نسخة أصغر منها.", 63, [4, 15, 3, 17]),
    s("Base case", "الحالة الأساسية", "The simplest input of a recursive function, answered directly so the recursion can stop.", "أبسط مدخل في دالة ذاتية الاستدعاء يُجاب عنه مباشرة لإيقاف التكرار.", 58, [4, 17]),
  ],
  mathematics: [
    s("Linear equation", "المعادلة الخطية", "An equation whose variables appear only to the first power.", "معادلة تظهر متغيراتها بالقوة الأولى فقط.", 93, [1, 5]),
    s("Inequality", "المتباينة", "A statement comparing two expressions using <, >, ≤ or ≥.", "عبارة تقارن بين تعبيرين باستخدام <، >، ≤ أو ≥.", 85, [1, 11]),
    s("Function", "الدالة", "A rule that assigns exactly one output to each input.", "قاعدة تُسند ناتجًا واحدًا بالضبط لكل مدخل.", 90, [2, 4]),
    s("Slope", "الميل", "The rate at which a line rises or falls, rise divided by run.", "معدل ارتفاع المستقيم أو انخفاضه، التغير الرأسي مقسومًا على الأفقي.", 78, [2, 13]),
    s("Quadratic equation", "المعادلة التربيعية", "A polynomial equation of degree two, written ax² + bx + c = 0.", "معادلة كثيرة حدود من الدرجة الثانية على الصورة ax² + bx + c = 0.", 82, [3, 6]),
    s("Limit", "النهاية", "The value a function approaches as its input approaches a point.", "القيمة التي تقترب منها الدالة عندما يقترب المدخل من نقطة ما.", 66, [3, 15]),
    s("Derivative", "المشتقة", "The instantaneous rate of change of a function at a point.", "معدل التغير اللحظي للدالة عند نقطة.", 71, [4, 7]),
    s("Chain rule", "قاعدة السلسلة", "A rule for differentiating a function composed of other functions.", "قاعدة لاشتقاق دالة مركبة من دوال أخرى.", 59, [4, 16]),
  ],
  algorithms: [
    s("Algorithm complexity", "تعقيد الخوارزمية", "A measure of how an algorithm's time or memory grows with input size.", "مقياس لنمو زمن الخوارزمية أو ذاكرتها مع حجم المدخلات.", 91, [1, 5]),
    s("Big-O notation", "رمز Big-O", "Notation that describes an upper bound on growth rate.", "رمز يصف الحد الأعلى لمعدل النمو.", 87, [1, 12]),
    s("Array", "المصفوفة", "A contiguous block of memory holding items accessed by index.", "كتلة ذاكرة متجاورة تحفظ عناصر يُوصل إليها بالفهرس.", 92, [2, 4]),
    s("Linked list", "القائمة المترابطة", "A sequence of nodes where each node points to the next.", "تسلسل من العقد تشير كل عقدة منها إلى التالية.", 80, [2, 14]),
    s("Stack", "المكدس", "A last-in, first-out collection.", "مجموعة تُخرج آخر عنصر أُدخل أولًا.", 84, [3, 6]),
    s("Queue", "الطابور", "A first-in, first-out collection.", "مجموعة تُخرج أول عنصر أُدخل أولًا.", 79, [3, 13]),
    s("Binary search", "البحث الثنائي", "Finding an item in a sorted list by repeatedly halving the search range.", "إيجاد عنصر في قائمة مرتبة بتنصيف نطاق البحث تكرارًا.", 73, [4, 8]),
    s("Sorting algorithm", "خوارزمية الترتيب", "A procedure that arranges items in a defined order.", "إجراء يرتّب العناصر وفق ترتيب محدد.", 65, [4, 17]),
  ],
  ai: [
    s("Machine learning", "التعلم الآلي", "Methods that let computers improve at a task from data rather than explicit rules.", "طرق تتيح للحاسوب تحسين أدائه في مهمة من البيانات لا من قواعد صريحة.", 94, [1, 4]),
    s("Supervised learning", "التعلم الموجَّه", "Learning from examples that include the correct answers.", "التعلم من أمثلة تتضمن الإجابات الصحيحة.", 88, [1, 9]),
    s("Classification", "التصنيف", "Predicting which category an item belongs to.", "التنبؤ بالفئة التي ينتمي إليها العنصر.", 83, [2, 5]),
    s("Training data", "بيانات التدريب", "The examples a model learns from.", "الأمثلة التي يتعلم منها النموذج.", 76, [2, 11]),
    s("Overfitting", "فرط التخصيص", "When a model memorises training data and performs poorly on new data.", "عندما يحفظ النموذج بيانات التدريب ويؤدي ضعيفًا على بيانات جديدة.", 69, [3, 8]),
    s("Neural network", "الشبكة العصبية", "A model made of layers of connected units that learn weights.", "نموذج من طبقات وحدات مترابطة تتعلم أوزانًا.", 81, [3, 14]),
    s("Loss function", "دالة الخسارة", "A measure of how far a model's predictions are from the truth.", "مقياس لبُعد تنبؤات النموذج عن الحقيقة.", 62, [4, 6]),
    s("Feature", "الخاصية", "A measurable property used as input to a model.", "خاصية قابلة للقياس تُستخدم مدخلًا للنموذج.", 77, [4, 12]),
  ],
  english: [
    s("Thesis statement", "الجملة المحورية للمقال", "A sentence that states the central claim of an essay.", "جملة تعرض الفكرة الرئيسة للمقال.", 89, [1, 5]),
    s("Topic sentence", "جملة الموضوع", "The opening sentence of a paragraph that states its main point.", "الجملة الافتتاحية للفقرة التي تبيّن فكرتها الرئيسة.", 84, [1, 10]),
    s("Evidence", "الدليل", "Facts, examples or quotations that support a claim.", "حقائق أو أمثلة أو اقتباسات تدعم الادعاء.", 78, [2, 7]),
    s("Counterargument", "الحجة المضادة", "An opposing view that a writer acknowledges and answers.", "رأي مخالف يعترف به الكاتب ويردّ عليه.", 67, [2, 15]),
    s("Paraphrasing", "إعادة الصياغة", "Restating a source's ideas in your own words.", "إعادة عرض أفكار المصدر بكلماتك الخاصة.", 73, [3, 6]),
    s("Cohesion", "التماسك", "How ideas and sentences connect smoothly in a text.", "كيفية ترابط الأفكار والجمل بسلاسة في النص.", 60, [3, 13]),
  ],
};

const SLOTS = 4;
const SLIDES = [22, 26, 24, 28];
export const newId = (p: string) =>
  `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Mock lecture titles for the "sample files" shortcut. */
const sampleTitles: Record<CourseId, string[]> = {
  python: ["Variables and data types", "Control flow", "Functions and the call stack", "Collections and recursion"],
  mathematics: ["Equations and inequalities", "Functions and graphs", "Quadratics and limits", "Derivatives"],
  algorithms: ["Complexity analysis", "Arrays and linked lists", "Stacks and queues", "Searching and sorting"],
  ai: ["What is machine learning?", "Classification and data", "Neural networks", "Training and features"],
  english: ["Building an argument", "Evidence and rebuttal", "Style and cohesion"],
};
export function sampleFiles(courseId: CourseId) {
  const lectures: Lecture[] = sampleTitles[courseId].map((title, i) => ({
    id: newId("lec"),
    number: i + 1,
    title,
    file: {
      id: newId("f"),
      name: `lecture-${String(i + 1).padStart(2, "0")}-${title.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")}.${i % 2 ? "pptx" : "pdf"}`,
      size: (2.1 + i * 0.7) * 1048576,
      status: "uploaded",
      progress: 100,
    },
    process: "not-processed",
    slides: SLIDES[i % SLOTS],
  }));
  const references: Reference[] = ["course-textbook.pdf", "reference-handbook.pdf"].map((name, i) => ({
    id: newId("r"),
    name,
    size: (14.8 + i * 6) * 1048576,
    status: "uploaded",
    progress: 100,
    indexed: false,
    processing: false,
  }));
  return { lectures, references };
}

/** Concepts the mock extractor "finds" in one lecture, mapped by lecture position. */
export function conceptsFor(
  courseId: CourseId,
  lecture: Lecture,
  all: Lecture[],
  existing: Concept[],
): Concept[] {
  const ordered = [...all].sort((a, b) => a.number - b.number);
  const slotLecture = (slot: number) => ordered[(slot - 1) % ordered.length];
  const out: Concept[] = [];
  bank[courseId].forEach((seed, index) => {
    const id = `${courseId}-c${index}`;
    const [slot, slide, slot2, slide2] = seed.at;
    if (slotLecture(slot).id !== lecture.id || existing.some((c) => c.id === id)) return;
    const sources: Source[] = [
      { lectureId: lecture.id, slide: Math.min(slide, lecture.slides), snippet: `${seed.en}: ${seed.def[0]}` },
    ];
    if (slot2 && slide2) {
      const other = slotLecture(slot2);
      if (other.id !== lecture.id)
        sources.push({ lectureId: other.id, slide: Math.min(slide2, other.slides), snippet: `Revisited — ${seed.en.toLowerCase()} is applied again in this lecture's worked example.` });
    }
    out.push({ id, en: seed.en, ar: seed.ar, definition: seed.def, confidence: seed.conf, sources, decision: "none" });
  });
  return out;
}

const filler = [
  "Key idea summarised with a short worked example.",
  "Common mistakes and how to avoid them.",
  "Try it: predict the output before running.",
  "Link to the reference textbook chapter.",
];
/** Representative mock slide content. Evidence snippets come from the concepts. */
export function slideContent(lecture: Lecture, slide: number, concepts: Concept[]) {
  const evidence = concepts.flatMap((c) =>
    c.sources.filter((x) => x.lectureId === lecture.id && x.slide === slide).map((x) => ({ concept: c, snippet: x.snippet })),
  );
  const heading = evidence[0]?.concept.en ?? (slide === 1 ? lecture.title : `${lecture.title} · part ${slide}`);
  return { heading, evidence, bullets: slide === 1 ? [] : [filler[slide % filler.length], filler[(slide + 1) % filler.length]] };
}

export const sourceHref = (s: Source, conceptId?: string) =>
  `/instructor/semester/lectures/${s.lectureId}?slide=${s.slide}${conceptId ? `&concept=${encodeURIComponent(conceptId)}` : ""}`;
