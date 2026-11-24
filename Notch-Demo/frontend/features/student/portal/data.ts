import { concepts as sharedConcepts } from "@/data/fixtures";
import type { Student } from "@/types";

export type Copy = readonly [string, string];
export type CourseId =
  | "mathematics"
  | "english"
  | "python"
  | "algorithms"
  | "ai";
export type Section =
  | "progress"
  | "announcements"
  | "lectures"
  | "labs"
  | "submissions"
  | "grades"
  | "materials";
export const sections: Section[] = [
  "progress",
  "announcements",
  "lectures",
  "labs",
  "submissions",
  "grades",
  "materials",
];
export const sectionLabels: Record<Section, Copy> = {
  progress: ["Progress", "التقدم"],
  announcements: ["Announcements", "الإعلانات"],
  lectures: ["Lectures", "المحاضرات"],
  labs: ["Labs", "المعامل"],
  submissions: ["Submissions", "التسليمات"],
  grades: ["Grades", "الدرجات"],
  materials: ["Extra Materials", "مواد إضافية"],
};
export type Lesson = {
  id: string;
  title: Copy;
  description: Copy;
  minutes: number;
  done: boolean;
  content: Copy;
  exercise: Copy;
};
export type Course = {
  id: CourseId;
  sharedId?: "C-PY" | "C-MATH";
  title: Copy;
  code: string;
  instructor: Copy;
  description: Copy;
  tone: "violet" | "blue" | "mint" | "amber" | "rose";
  concepts: { id: string; title: Copy; mastery: number }[];
  lectures: Lesson[];
  labs: Lesson[];
  recommendation: Copy;
  recommendationReason: Copy;
};
const lesson = (
  id: string,
  title: Copy,
  description: Copy,
  content: Copy,
  exercise: Copy,
  minutes: number,
  done = false,
): Lesson => ({ id, title, description, content, exercise, minutes, done });
const conceptArabic: Record<string, string> = {
  "PY-VAR": "المتغيرات",
  "PY-TYPE": "أنواع البيانات",
  "PY-OP": "المعاملات",
  "PY-COND": "الشروط",
  "PY-LOOP": "الحلقات",
  "PY-FUNC": "الدوال",
  "PY-LIST": "القوائم",
  "PY-DICT": "القواميس",
  "PY-STACK": "مكدس الاستدعاء",
  "PY-REC": "الاستدعاء الذاتي",
  "MA-ARITH": "أساسيات الحساب",
  "MA-EXPR": "التعبيرات الجبرية",
  "MA-LIN": "المعادلات الخطية",
  "MA-INEQ": "المتباينات",
  "MA-FUNC": "الدوال",
  "MA-GRAPH": "الرسوم البيانية",
  "MA-QUAD": "المعادلات التربيعية",
  "MA-LIMIT": "النهايات",
  "MA-DERIV": "المشتقات",
  "MA-APP": "تطبيقات المشتقات",
};
export const courses: Course[] = [
  {
    id: "mathematics",
    sharedId: "C-MATH",
    title: ["Mathematics", "الرياضيات"],
    code: "MATH 201",
    instructor: ["Dr. Hala Hassan", "د. هالة حسن"],
    tone: "violet",
    description: [
      "Build intuition for the mathematics behind every great idea.",
      "طوّر فهمك للرياضيات التي تقف وراء الأفكار العظيمة.",
    ],
    concepts: [],
    recommendation: [
      "Review derivatives, one step at a time",
      "راجع المشتقات خطوة بخطوة",
    ],
    recommendationReason: [
      "Connect slopes and rates of change before moving to applications.",
      "اربط بين الميل ومعدل التغير قبل الانتقال إلى التطبيقات.",
    ],
    lectures: [
      lesson(
        "m1",
        ["From expressions to equations", "من التعبيرات إلى المعادلات"],
        [
          "Turn mathematical relationships into solvable equations.",
          "حوّل العلاقات الرياضية إلى معادلات قابلة للحل.",
        ],
        [
          "An equation keeps two expressions in balance. Whatever operation you apply to one side, apply to the other. To solve 2x + 4 = 10, subtract 4, then divide both sides by 2. The result is x = 3.",
          "تحافظ المعادلة على توازن طرفيها. طبّق العملية نفسها على الطرفين. لحل 2x + 4 = 10 اطرح 4 ثم اقسم الطرفين على 2. النتيجة x = 3.",
        ],
        [
          "Solve 3x + 6 = 21. Substitute your answer to check both sides.",
          "حل 3x + 6 = 21 ثم عوّض بإجابتك للتحقق من الطرفين.",
        ],
        18,
        true,
      ),
      lesson(
        "m2",
        ["Understanding derivatives", "فهم المشتقات"],
        [
          "Explore slopes, change, and the meaning of a derivative.",
          "استكشف الميل والتغير ومعنى المشتقة.",
        ],
        [
          "A derivative measures instantaneous change. For f(x) = x², f′(x) = 2x. At x = 3, the slope is 6. A positive derivative means the function is increasing at that point.",
          "تقيس المشتقة معدل التغير اللحظي. إذا كانت f(x) = x² فإن f′(x) = 2x. عند x = 3 يكون الميل 6. المشتقة الموجبة تعني أن الدالة متزايدة عند تلك النقطة.",
        ],
        [
          "Find the derivative of x³ using the power rule. What is its value at x = 2?",
          "أوجد مشتقة x³ باستخدام قاعدة القوى. ما قيمتها عند x = 2؟",
        ],
        24,
      ),
      lesson(
        "m3",
        ["Linear algebra foundations", "أساسيات الجبر الخطي"],
        [
          "Use vectors to represent and transform information.",
          "استخدم المتجهات لتمثيل المعلومات وتحويلها.",
        ],
        [
          "A vector is an ordered list of numbers. Add vectors component by component: (1, 2) + (3, 4) = (4, 6). A matrix transforms a vector into a new vector.",
          "المتجه قائمة مرتبة من الأعداد. اجمع المتجهات عنصرًا بعنصر: (1, 2) + (3, 4) = (4, 6). تحوّل المصفوفة المتجه إلى متجه جديد.",
        ],
        [
          "Add (2, 5) and (4, -1), then sketch the result on a coordinate plane.",
          "اجمع (2, 5) و(4, -1) ثم ارسم النتيجة على المستوى الإحداثي.",
        ],
        20,
      ),
    ],
    labs: [
      lesson(
        "ml1",
        ["Visualize rates of change", "تصوير معدلات التغير"],
        [
          "Compare the slopes of three simple functions.",
          "قارن ميل ثلاث دوال بسيطة.",
        ],
        [
          "Create a table for f(x) = x² at x = 0, 1, 2, 3. Calculate the average rate of change over each interval. Compare these rates with f′(x) = 2x.",
          "أنشئ جدولًا للدالة f(x) = x² عند x = 0, 1, 2, 3. احسب متوسط معدل التغير في كل فترة وقارنه بالمشتقة f′(x) = 2x.",
        ],
        [
          "Explain why the slope gets steeper as x increases.",
          "اشرح لماذا يزداد الميل مع زيادة x.",
        ],
        35,
      ),
    ],
  },
  {
    id: "english",
    title: ["English", "اللغة الإنجليزية"],
    code: "ENG 102",
    instructor: ["Dr. Dina Adel", "د. دينا عادل"],
    tone: "blue",
    description: [
      "Communicate your ideas clearly, confidently, and persuasively.",
      "عبّر عن أفكارك بوضوح وثقة وإقناع.",
    ],
    concepts: [
      {
        id: "en1",
        title: ["Reading comprehension", "فهم المقروء"],
        mastery: 94,
      },
      { id: "en2", title: ["Grammar", "القواعد"], mastery: 86 },
      {
        id: "en3",
        title: ["Academic writing", "الكتابة الأكاديمية"],
        mastery: 64,
      },
      { id: "en4", title: ["Vocabulary", "المفردات"], mastery: 89 },
    ],
    recommendation: [
      "Give your next essay a stronger structure",
      "امنح مقالك القادم بنية أقوى",
    ],
    recommendationReason: [
      "Your reading is strong. Apply it to a clear thesis and supporting paragraphs.",
      "مهارات القراءة لديك قوية. طبّقها في صياغة فكرة رئيسية وفقرات داعمة.",
    ],
    lectures: [
      lesson(
        "e1",
        ["Reading with purpose", "القراءة بهدف"],
        [
          "Identify arguments and the evidence behind them.",
          "حدّد الحجج والأدلة التي تدعمها.",
        ],
        [
          "Skim a text to find its main claim. Then read closely to identify evidence. Distinguish what the author says from what the evidence actually supports.",
          "تصفّح النص لتحديد فكرته الرئيسية ثم اقرأ بدقة لتحديد الأدلة. ميّز بين كلام الكاتب وما تدعمه الأدلة فعلًا.",
        ],
        [
          "Summarize the main claim of a short article in one sentence.",
          "لخّص الفكرة الرئيسية لمقال قصير في جملة واحدة.",
        ],
        16,
        true,
      ),
      lesson(
        "e2",
        ["Build an academic argument", "بناء حجة أكاديمية"],
        [
          "Structure a thesis, evidence, and a clear conclusion.",
          "نظّم الفكرة الرئيسية والأدلة والخاتمة.",
        ],
        [
          "A strong paragraph has a topic sentence, supporting evidence, and an explanation connecting the evidence to the claim. Use transitions to show how each paragraph advances the argument.",
          "تحتوي الفقرة القوية على جملة رئيسية ودليل داعم وشرح يربط الدليل بالفكرة. استخدم أدوات الربط لتوضيح دور كل فقرة في بناء الحجة.",
        ],
        [
          "Write a paragraph arguing for daily reading. Include one concrete example.",
          "اكتب فقرة تدعم القراءة اليومية مع مثال محدد.",
        ],
        22,
      ),
    ],
    labs: [
      lesson(
        "el1",
        ["Peer-review workshop", "ورشة مراجعة الأقران"],
        [
          "Practice giving precise, constructive writing feedback.",
          "تدرّب على تقديم ملاحظات دقيقة وبنّاءة.",
        ],
        [
          "Review this claim: Reading is good. Make it specific by naming an audience and a benefit. Then add evidence and identify one possible counterargument.",
          "راجع الفكرة التالية: القراءة مفيدة. اجعلها محددة بتسمية الجمهور والفائدة، ثم أضف دليلًا وحدّد حجة مضادة محتملة.",
        ],
        [
          "Rewrite the claim and write two sentences of constructive feedback.",
          "أعد كتابة الفكرة واكتب جملتين من الملاحظات البنّاءة.",
        ],
        30,
      ),
    ],
  },
  {
    id: "python",
    sharedId: "C-PY",
    title: ["Python Programming", "البرمجة بلغة بايثون"],
    code: "CS 101",
    instructor: ["Dr. Omar Khaled", "د. عمر خالد"],
    tone: "mint",
    description: [
      "Think in code. Turn small building blocks into useful programs.",
      "فكّر برمجيًا وحوّل اللبنات الصغيرة إلى برامج مفيدة.",
    ],
    concepts: [],
    recommendation: [
      "Build confidence with Python functions",
      "عزّز ثقتك في دوال بايثون",
    ],
    recommendationReason: [
      "Trace a function call before exploring the call stack and recursion.",
      "تتبّع استدعاء دالة قبل استكشاف مكدس الاستدعاء والاستدعاء الذاتي.",
    ],
    lectures: [
      lesson(
        "p1",
        ["Variables and control flow", "المتغيرات وتدفق التحكم"],
        [
          "Use conditions and loops to express your logic.",
          "استخدم الشروط والحلقات للتعبير عن منطقك.",
        ],
        [
          "Variables name values. An if statement chooses a branch; a for loop repeats work for each item. Keep variable names descriptive so that another reader can understand your intent.",
          "تسمّي المتغيرات القيم. تختار if مسارًا بينما تكرر for العمل لكل عنصر. اختر أسماء واضحة للمتغيرات حتى يفهم القارئ مقصدك.",
        ],
        [
          "Write a loop that prints the even numbers from 2 to 10.",
          "اكتب حلقة تطبع الأعداد الزوجية من 2 إلى 10.",
        ],
        18,
        true,
      ),
      lesson(
        "p2",
        ["Functions and the call stack", "الدوال ومكدس الاستدعاء"],
        [
          "Follow parameters, return values, and nested function calls.",
          "تتبّع المعاملات والقيم المرجعة واستدعاءات الدوال المتداخلة.",
        ],
        [
          "A function groups reusable steps. Parameters receive inputs and return sends a result back. Every call adds a frame to the call stack. When the function returns, its frame is removed. Recursion works the same way, but a function calls itself until a base case is reached.",
          "تجمع الدالة خطوات قابلة لإعادة الاستخدام. تستقبل المعاملات المدخلات وترسل return النتيجة. يضيف كل استدعاء إطارًا إلى المكدس يُزال عند العودة. في الاستدعاء الذاتي تستدعي الدالة نفسها حتى تصل إلى الحالة الأساسية.",
        ],
        [
          "Write double(n) that returns n * 2. Trace double(double(3)) by evaluating the inner call first.",
          "اكتب double(n) لإرجاع n * 2 ثم تتبّع double(double(3)) بحساب الاستدعاء الداخلي أولًا.",
        ],
        25,
      ),
      lesson(
        "p3",
        ["Working with collections", "العمل مع المجموعات"],
        [
          "Choose between lists and dictionaries.",
          "اختر بين القوائم والقواميس.",
        ],
        [
          "Lists store ordered items. Dictionaries map keys to values. Use a list for a sequence of scores and a dictionary to associate a student name with a score.",
          "تخزّن القوائم عناصر مرتبة بينما تربط القواميس المفاتيح بالقيم. استخدم قائمة للدرجات وقاموسًا لربط اسم الطالب بدرجته.",
        ],
        [
          "Create a dictionary with three fictional names and scores. Print each name and score.",
          "أنشئ قاموسًا بثلاثة أسماء خيالية ودرجاتها ثم اطبع كل اسم ودرجته.",
        ],
        20,
      ),
    ],
    labs: [
      lesson(
        "pl1",
        ["Build a study-time calculator", "بناء حاسبة وقت الدراسة"],
        [
          "Combine functions and lists in a practical mini-project.",
          "اجمع الدوال والقوائم في مشروع عملي صغير.",
        ],
        [
          "Create total_minutes(sessions), where sessions is a list of positive numbers. Return their sum. Test an empty list, one session, and several sessions. Keep input validation separate from calculation.",
          "أنشئ total_minutes(sessions) حيث sessions قائمة أعداد موجبة. أرجع مجموعها واختبر القائمة الفارغة وجلسة واحدة وعدة جلسات. افصل التحقق من المدخلات عن الحساب.",
        ],
        [
          "Add an average_minutes function and explain how you handle an empty list.",
          "أضف دالة average_minutes واشرح كيفية التعامل مع قائمة فارغة.",
        ],
        40,
      ),
    ],
  },
  {
    id: "algorithms",
    title: ["Data Structures & Algorithms", "هياكل البيانات والخوارزميات"],
    code: "CS 202",
    instructor: ["Dr. Youssef Amin", "د. يوسف أمين"],
    tone: "amber",
    description: [
      "Choose the right structure. Find a more efficient solution.",
      "اختر الهيكل المناسب وابحث عن حل أكثر كفاءة.",
    ],
    concepts: [
      { id: "ds1", title: ["Arrays", "المصفوفات"], mastery: 90 },
      { id: "ds2", title: ["Linked lists", "القوائم المرتبطة"], mastery: 82 },
      {
        id: "ds3",
        title: ["Sorting algorithms", "خوارزميات الترتيب"],
        mastery: 48,
      },
      { id: "ds4", title: ["Complexity", "التعقيد الحسابي"], mastery: 60 },
    ],
    recommendation: [
      "Make sense of sorting algorithms",
      "افهم خوارزميات الترتيب",
    ],
    recommendationReason: [
      "Compare two strategies on the same small input to understand their trade-offs.",
      "قارن استراتيجيتين على نفس المدخلات لفهم مزايا كل منهما.",
    ],
    lectures: [
      lesson(
        "d1",
        ["Arrays and linked lists", "المصفوفات والقوائم المرتبطة"],
        [
          "Compare access, insertion, and memory trade-offs.",
          "قارن الوصول والإدراج واستخدام الذاكرة.",
        ],
        [
          "An array supports indexed access in constant time. A linked list follows links between nodes, so accessing an arbitrary position takes linear time. Inserting after a known node can be constant time.",
          "تدعم المصفوفة الوصول بالفهرس في زمن ثابت. تتبع القائمة المرتبطة الروابط بين العقد، لذا يستغرق الوصول لموضع عشوائي زمنًا خطيًا. الإدراج بعد عقدة معروفة قد يتم في زمن ثابت.",
        ],
        [
          "Which structure fits frequent indexed reads? Explain your choice.",
          "أي هيكل يناسب القراءة المتكررة بالفهرس؟ اشرح اختيارك.",
        ],
        20,
        true,
      ),
      lesson(
        "d2",
        ["Sorting, step by step", "الترتيب خطوة بخطوة"],
        [
          "Trace insertion sort and compare it with merge sort.",
          "تتبّع ترتيب الإدراج وقارنه بترتيب الدمج.",
        ],
        [
          "Insertion sort grows a sorted prefix by placing each new item in its correct position. Its worst-case runtime is O(n²). Merge sort splits, sorts, and merges halves in O(n log n) time.",
          "يبني ترتيب الإدراج جزءًا مرتبًا بوضع كل عنصر جديد في موضعه الصحيح. تعقيده في أسوأ حالة O(n²). يقسم ترتيب الدمج العناصر ويرتب الأجزاء ثم يدمجها في زمن O(n log n).",
        ],
        [
          "Trace insertion sort on [5, 2, 4, 1]. Record the array after each insertion.",
          "تتبّع ترتيب الإدراج على [5, 2, 4, 1] وسجّل المصفوفة بعد كل إدراج.",
        ],
        28,
      ),
    ],
    labs: [
      lesson(
        "dl1",
        ["Compare sorting strategies", "مقارنة استراتيجيات الترتيب"],
        [
          "Count comparisons on sorted and reversed inputs.",
          "احسب المقارنات في مدخلات مرتبة ومعكوسة.",
        ],
        [
          "Implement insertion sort with a counter for comparisons. Test [1, 2, 3, 4] and [4, 3, 2, 1]. Explain why the work differs even though the inputs have the same size.",
          "نفّذ ترتيب الإدراج مع عداد للمقارنات. اختبر [1, 2, 3, 4] و[4, 3, 2, 1] واشرح اختلاف العمل رغم تساوي حجم المدخلات.",
        ],
        [
          "Predict how the comparison count changes when you double the reversed input size.",
          "توقّع كيف يتغير عدد المقارنات عند مضاعفة حجم المدخلات المعكوسة.",
        ],
        45,
      ),
    ],
  },
  {
    id: "ai",
    title: ["Artificial Intelligence", "الذكاء الاصطناعي"],
    code: "AI 201",
    instructor: ["Dr. Salma Nabil", "د. سلمى نبيل"],
    tone: "rose",
    description: [
      "Explore how intelligent systems learn, reason, and make decisions.",
      "استكشف كيف تتعلم الأنظمة الذكية وتستدل وتتخذ القرارات.",
    ],
    concepts: [
      {
        id: "ai1",
        title: ["Intelligent agents", "الوكلاء الأذكياء"],
        mastery: 84,
      },
      {
        id: "ai2",
        title: ["Search strategies", "استراتيجيات البحث"],
        mastery: 76,
      },
      { id: "ai3", title: ["Machine learning", "تعلم الآلة"], mastery: 55 },
      { id: "ai4", title: ["Model evaluation", "تقييم النماذج"], mastery: 42 },
    ],
    recommendation: [
      "Continue your introduction to AI",
      "واصل مقدمتك في الذكاء الاصطناعي",
    ],
    recommendationReason: [
      "Your agent foundations are ready. Explore how models learn from examples.",
      "أساسيات الوكلاء لديك جيدة. استكشف كيف تتعلم النماذج من الأمثلة.",
    ],
    lectures: [
      lesson(
        "a1",
        ["What makes an agent intelligent?", "ما الذي يجعل الوكيل ذكيًا؟"],
        [
          "Understand perception, actions, and goals.",
          "افهم الإدراك والأفعال والأهداف.",
        ],
        [
          "An agent observes its environment and chooses an action. A rational agent selects actions expected to improve its performance measure given what it knows. Rationality does not require perfect knowledge.",
          "يراقب الوكيل بيئته ويختار فعلًا. يختار الوكيل العقلاني أفعالًا يُتوقع أن تحسن معيار أدائه بناءً على معرفته. لا تتطلب العقلانية معرفة كاملة.",
        ],
        [
          "Describe the observations, actions, and goal of a robot vacuum.",
          "صف ملاحظات مكنسة روبوتية وأفعالها وهدفها.",
        ],
        15,
        true,
      ),
      lesson(
        "a2",
        ["Learning from examples", "التعلم من الأمثلة"],
        [
          "Meet features, labels, and the train-test split.",
          "تعرّف على السمات والتصنيفات وتقسيم التدريب والاختبار.",
        ],
        [
          "Supervised learning uses labeled examples to learn a mapping from inputs to outputs. Keep test data separate during training to estimate performance on unseen examples. A model that memorizes training data may generalize poorly.",
          "يستخدم التعلم الموجّه أمثلة مصنّفة لتعلم العلاقة بين المدخلات والمخرجات. افصل بيانات الاختبار أثناء التدريب لتقدير الأداء على أمثلة جديدة. قد يفشل النموذج الذي يحفظ بيانات التدريب في التعميم.",
        ],
        [
          "For a spam classifier, identify two features and the label. Why should test emails stay out of training?",
          "حدّد سمتين والتصنيف لنموذج كشف البريد المزعج. لماذا يجب فصل رسائل الاختبار عن التدريب؟",
        ],
        23,
      ),
    ],
    labs: [
      lesson(
        "al1",
        ["Design a simple classifier", "تصميم مصنّف بسيط"],
        [
          "Plan a small dataset and evaluate predictions.",
          "خطط لمجموعة بيانات صغيرة وقيّم التنبؤات.",
        ],
        [
          "Create ten fictional messages labeled spam or not spam. Propose two rules for classification. Reserve three messages for testing. Compare predictions with labels and count correct results.",
          "أنشئ عشر رسائل خيالية مصنفة كمزعجة أو غير مزعجة. اقترح قاعدتين للتصنيف واحتفظ بثلاث رسائل للاختبار. قارن التنبؤات بالتصنيفات واحسب النتائج الصحيحة.",
        ],
        [
          "Explain one way your rules could fail on a new message.",
          "اشرح طريقة قد تفشل بها قواعدك مع رسالة جديدة.",
        ],
        35,
      ),
    ],
  },
];
export function courseConcepts(course: Course, student: Student) {
  return course.sharedId
    ? sharedConcepts
        .filter((c) => c.courseId === course.sharedId)
        .map((c) => ({
          id: c.id,
          title: [c.title, conceptArabic[c.id]] as Copy,
          mastery: student.mastery[c.id] ?? 0,
        }))
    : course.concepts;
}
export function mastery(course: Course, student: Student) {
  const values = courseConcepts(course, student);
  return Math.round(
    values.reduce((sum, c) => sum + c.mastery, 0) / values.length,
  );
}
export const courseHref = (id: CourseId, section: Section = "progress") =>
  `/student/courses/${id}/${section}`;
export type Assignment = {
  id: string;
  courseId: CourseId;
  title: Copy;
  due: string;
  status: "pending" | "submitted" | "graded";
  priority: "high" | "normal";
  kind: Copy;
  score?: number;
  weight: number;
};
export const assignments: Assignment[] = [
  {
    id: "py-functions",
    courseId: "python",
    title: ["Functions in practice", "تطبيقات الدوال"],
    due: "2026-11-25T20:00:00+02:00",
    status: "pending",
    priority: "high",
    kind: ["Assignment", "واجب"],
    weight: 20,
  },
  {
    id: "math-slopes",
    courseId: "mathematics",
    title: ["Derivatives worksheet", "ورقة عمل المشتقات"],
    due: "2026-11-26T18:00:00+02:00",
    status: "pending",
    priority: "high",
    kind: ["Assignment", "واجب"],
    weight: 20,
  },
  {
    id: "en-essay",
    courseId: "english",
    title: ["An argument for daily reading", "حجة للقراءة اليومية"],
    due: "2026-11-27T21:00:00+02:00",
    status: "pending",
    priority: "normal",
    kind: ["Assignment", "واجب"],
    weight: 20,
  },
  {
    id: "ds-sort",
    courseId: "algorithms",
    title: ["Sorting comparison report", "تقرير مقارنة خوارزميات الترتيب"],
    due: "2026-11-29T18:00:00+02:00",
    status: "submitted",
    priority: "normal",
    kind: ["Assignment", "واجب"],
    weight: 20,
  },
  {
    id: "ai-model",
    courseId: "ai",
    title: ["Your first classification plan", "خطة التصنيف الأولى"],
    due: "2026-11-30T20:00:00+02:00",
    status: "pending",
    priority: "normal",
    kind: ["Assignment", "واجب"],
    weight: 20,
  },
  ...courses.flatMap((c, i) => [
    {
      id: `${c.id}-assignment`,
      courseId: c.id,
      title: ["Foundations reflection", "تأملات في الأساسيات"] as Copy,
      due: "2026-11-16T18:00:00+02:00",
      status: "graded" as const,
      priority: "normal" as const,
      kind: ["Assignment", "واجب"] as Copy,
      score: [88, 94, 90, 82, 86][i],
      weight: 10,
    },
    {
      id: `${c.id}-quiz`,
      courseId: c.id,
      title: ["Foundations quiz", "اختبار الأساسيات"] as Copy,
      due: "2026-11-18T12:00:00+02:00",
      status: "graded" as const,
      priority: "normal" as const,
      kind: ["Quiz", "اختبار قصير"] as Copy,
      score: [86, 92, 88, 75, 82][i],
      weight: 15,
    },
    {
      id: `${c.id}-lab`,
      courseId: c.id,
      title: ["Introductory lab", "المعمل التمهيدي"] as Copy,
      due: "2026-11-20T12:00:00+02:00",
      status: "graded" as const,
      priority: "normal" as const,
      kind: ["Lab", "معمل"] as Copy,
      score: [90, 88, 95, 80, 85][i],
      weight: 15,
    },
    {
      id: `${c.id}-exam`,
      courseId: c.id,
      title: ["Midterm exam", "امتحان منتصف الفصل"] as Copy,
      due: "2026-11-22T12:00:00+02:00",
      status: "graded" as const,
      priority: "normal" as const,
      kind: ["Exam", "امتحان"] as Copy,
      score: [82, 90, 84, 72, 78][i],
      weight: 40,
    },
  ]),
];
export const events: {
  id: string;
  courseId: CourseId;
  title: Copy;
  kind: Copy;
  start: string;
  location: Copy;
}[] = [
  {
    id: "s1",
    courseId: "python",
    title: ["Functions & call stacks", "الدوال ومكدسات الاستدعاء"],
    kind: ["Lecture", "محاضرة"],
    start: "2026-11-24T10:00:00+02:00",
    location: ["Room B204 · 60 min", "قاعة B204 · ٦٠ دقيقة"],
  },
  {
    id: "s2",
    courseId: "mathematics",
    title: ["Rates of change workshop", "ورشة معدلات التغير"],
    kind: ["Lab", "معمل"],
    start: "2026-11-24T13:00:00+02:00",
    location: ["Lab A12 · 90 min", "معمل A12 · ٩٠ دقيقة"],
  },
  {
    id: "s3",
    courseId: "algorithms",
    title: ["Sorting & complexity", "الترتيب والتعقيد الحسابي"],
    kind: ["Quiz", "اختبار قصير"],
    start: "2026-11-26T11:00:00+02:00",
    location: ["Room C101 · 30 min", "قاعة C101 · ٣٠ دقيقة"],
  },
  {
    id: "s4",
    courseId: "ai",
    title: ["Intelligent systems", "الأنظمة الذكية"],
    kind: ["Lecture", "محاضرة"],
    start: "2026-11-27T09:00:00+02:00",
    location: ["Room B108 · 60 min", "قاعة B108 · ٦٠ دقيقة"],
  },
  {
    id: "s5",
    courseId: "english",
    title: ["Academic writing assessment", "تقييم الكتابة الأكاديمية"],
    kind: ["Exam", "امتحان"],
    start: "2026-12-02T10:00:00+02:00",
    location: ["Hall A · 90 min", "قاعة A · ٩٠ دقيقة"],
  },
];
export const diagnosticQuestions: {
  id: string;
  prompt: Copy;
  options: Copy[];
}[] = [
  {
    id: "format",
    prompt: [
      "How would you like to explore a new idea?",
      "كيف تفضّل استكشاف فكرة جديدة؟",
    ],
    options: [
      ["A visual explanation", "شرح مرئي"],
      ["A worked example", "مثال محلول"],
      ["A short reading", "قراءة قصيرة"],
    ],
  },
  {
    id: "pace",
    prompt: [
      "What study rhythm fits your day?",
      "ما إيقاع الدراسة المناسب ليومك؟",
    ],
    options: [
      ["Short, focused sessions", "جلسات قصيرة ومركّزة"],
      ["Longer, deeper sessions", "جلسات أطول وأكثر عمقًا"],
      ["A flexible mix", "مزيج مرن"],
    ],
  },
  {
    id: "support",
    prompt: [
      "When you get stuck, what helps you move forward?",
      "عندما تواجه صعوبة، ما الذي يساعدك؟",
    ],
    options: [
      ["A small hint", "تلميح صغير"],
      ["A step-by-step walkthrough", "شرح خطوة بخطوة"],
      ["Trying a different example", "تجربة مثال مختلف"],
    ],
  },
];
export const announcements = [
  {
    id: "an1",
    title: [
      "This week: connect ideas with practice",
      "هذا الأسبوع: اربط الأفكار بالتطبيق",
    ] as Copy,
    body: [
      "Review the next lecture before our workshop. Bring one question and a worked example. We will use the lab to compare approaches together.",
      "راجع المحاضرة القادمة قبل الورشة. أحضر سؤالًا ومثالًا محلولًا. سنستخدم المعمل لمقارنة طرق الحل معًا.",
    ] as Copy,
    date: "2026-11-23T09:00:00+02:00",
    important: true,
  },
  {
    id: "an2",
    title: ["Office hours and feedback", "الساعات المكتبية والملاحظات"] as Copy,
    body: [
      "Office hours are Wednesday, 14:00–15:00 in the faculty study room. Feedback on the foundations quiz is now available in Grades.",
      "الساعات المكتبية يوم الأربعاء من ١٤:٠٠ إلى ١٥:٠٠ في غرفة الدراسة بالكلية. ملاحظات اختبار الأساسيات متاحة الآن في الدرجات.",
    ] as Copy,
    date: "2026-11-21T12:00:00+02:00",
    important: false,
  },
];
export const resourceKinds: Copy[] = [
  ["Study guide", "دليل الدراسة"],
  ["Worked examples", "أمثلة محلولة"],
  ["Reading notes", "ملاحظات القراءة"],
];

export const recentActivity: { title: Copy; detail: Copy }[] = [
  {
    title: ["Midterm grades published", "نُشرت درجات منتصف الفصل"],
    detail: [
      "22 Nov · Review your course Grades tab",
      "٢٢ نوفمبر · راجع تبويب الدرجات",
    ],
  },
  {
    title: ["Sorting report submitted", "تم تسليم تقرير الترتيب"],
    detail: [
      "21 Nov · Data Structures & Algorithms",
      "٢١ نوفمبر · هياكل البيانات والخوارزميات",
    ],
  },
  {
    title: ["Lab feedback received", "وصلت ملاحظات المعمل"],
    detail: ["20 Nov · Python Programming", "٢٠ نوفمبر · البرمجة بلغة بايثون"],
  },
];
