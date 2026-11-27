import type { Copy } from "@/features/instructor/portal/data";

/**
 * Question Bank mock data: one fictional university statistics course.
 * Everything is simulated: no model writes, validates or learns anything.
 */
export type { Copy };
export type Bank = "practice" | "exam";
export type QType = "mcq" | "tf" | "short" | "essay" | "math" | "numeric" | "matching" | "fill";
export type Diff = "easy" | "medium" | "hard";
export type Bloom = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type Lang = "en" | "ar" | "both";
export type QStatus = "approved" | "pending" | "rejected" | "archived";
export type CheckStatus = "passed" | "review" | "failed" | "na";
export type CheckKey = "relevance" | "answer" | "options" | "duplicate" | "evidence" | "difficulty" | "math" | "bilingual";

export const qtypes: QType[] = ["mcq", "tf", "short", "essay", "math", "numeric", "matching", "fill"];
export const diffs: Diff[] = ["easy", "medium", "hard"];
export const blooms: Bloom[] = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
export const checkKeys: CheckKey[] = ["relevance", "answer", "options", "duplicate", "evidence", "difficulty", "math", "bilingual"];

export const typeLabel: Record<QType, Copy> = {
  mcq: ["Multiple choice", "اختيار من متعدد"],
  tf: ["True / False", "صح / خطأ"],
  short: ["Short answer", "إجابة قصيرة"],
  essay: ["Essay", "مقالي"],
  math: ["Mathematical problem", "مسألة رياضية"],
  numeric: ["Numerical", "عددي"],
  matching: ["Matching", "مطابقة"],
  fill: ["Fill in the blanks", "أكمل الفراغات"],
};
export const diffLabel: Record<Diff, Copy> = { easy: ["Easy", "سهل"], medium: ["Medium", "متوسط"], hard: ["Hard", "صعب"] };
export const bloomLabel: Record<Bloom, Copy> = {
  remember: ["Remember", "التذكر"], understand: ["Understand", "الفهم"], apply: ["Apply", "التطبيق"],
  analyze: ["Analyze", "التحليل"], evaluate: ["Evaluate", "التقويم"], create: ["Create", "الإبداع"],
};
export const langLabel: Record<Lang, Copy> = { en: ["English", "الإنجليزية"], ar: ["Arabic", "العربية"], both: ["Bilingual", "ثنائي اللغة"] };
export const statusLabel: Record<QStatus, Copy> = {
  approved: ["Approved", "معتمد"], pending: ["Needs review", "بانتظار المراجعة"], rejected: ["Rejected", "مرفوض"], archived: ["Archived", "مؤرشف"],
};
export const checkLabel: Record<CheckKey, Copy> = {
  relevance: ["Concept relevance", "صلة المفهوم"],
  answer: ["Correct answer validity", "صحة الإجابة الصحيحة"],
  options: ["Answer-option quality", "جودة الخيارات"],
  duplicate: ["Duplicate detection", "اكتشاف التكرار"],
  evidence: ["Source evidence available", "توفر دليل المصدر"],
  difficulty: ["Difficulty consistency", "اتساق الصعوبة"],
  math: ["Mathematical solution correctness", "صحة الحل الرياضي"],
  bilingual: ["Arabic–English equivalence", "تكافؤ العربية والإنجليزية"],
};

export type Option = { id: string; text: Copy; correct: boolean; why?: Copy };
export type Source = { lectureId: string; slide: number; snippet: Copy };
export type Feedback = {
  showCorrect: boolean; explanations: boolean; explainWrong: boolean; hints: boolean; steps: boolean; multipleAttempts: boolean;
};
export type Question = {
  id: string;
  bank: Bank;
  type: QType;
  difficulty: Diff;
  bloom: Bloom;
  marks: number;
  lang: Lang;
  text: Copy;
  options: Option[];
  /** Model answer for short, essay, math, numeric and fill questions. */
  answer: Copy;
  /** Matching pairs. */
  pairs: { left: Copy; right: Copy }[];
  explanation: Copy;
  hint: Copy;
  steps: Copy[];
  conceptIds: string[];
  source: Source;
  validation: Record<CheckKey, { status: CheckStatus; note: Copy }>;
  status: QStatus;
  /** Exam-style tag shown for exam-preparation questions. */
  pattern?: string;
  feedback: Feedback;
  /** Generation settings, kept so Regenerate can create another variant. */
  seed: number;
  prerequisite?: boolean;
  createdAt: string;
};

export type Lecture = { id: string; number: number; title: Copy };
export const lectures: Lecture[] = [
  { id: "L1", number: 1, title: ["Introduction to probability", "مقدمة في الاحتمالات"] },
  { id: "L2", number: 2, title: ["Conditional probability and independence", "الاحتمال الشرطي والاستقلال"] },
  { id: "L3", number: 3, title: ["Random variables", "المتغيرات العشوائية"] },
  { id: "L4", number: 4, title: ["Probability distributions", "التوزيعات الاحتمالية"] },
  { id: "L5", number: 5, title: ["Expectation", "التوقع الرياضي"] },
  { id: "L6", number: 6, title: ["Joint probability", "الاحتمال المشترك"] },
];

export type QConcept = {
  id: string;
  en: string;
  ar: string;
  def: Copy;
  misconception: Copy;
  why: Copy;
  hint: Copy;
  lecture: string;
  slide: number;
  snippet: Copy;
  /** Mock prerequisite concept ids, used only when the instructor asks for prerequisite questions. */
  prereq: string[];
  approved: boolean;
};
export const concepts: QConcept[] = [
  { id: "prob", en: "Probability", ar: "الاحتمال", def: ["A number between 0 and 1 measuring how likely an event is.", "عدد بين 0 و1 يقيس مدى إمكانية وقوع حدث."], misconception: ["A probability can exceed 1 when many outcomes are possible.", "يمكن أن يتجاوز الاحتمال 1 عندما تكثر النواتج الممكنة."], why: ["Probabilities always lie between 0 and 1 inclusive.", "الاحتمالات تقع دائمًا بين 0 و1 شاملةً."], hint: ["Add the individual probabilities, then remove the overlap.", "اجمع الاحتمالات الفردية ثم اطرح الجزء المشترك."], lecture: "L1", slide: 6, snippet: ["Probability measures likelihood on a scale from 0 (impossible) to 1 (certain).", "يقيس الاحتمال مدى الإمكانية على مقياس من 0 (مستحيل) إلى 1 (مؤكد)."], prereq: [], approved: true },
  { id: "cond", en: "Conditional probability", ar: "الاحتمال الشرطي", def: ["The probability of an event given that another event has occurred.", "احتمال وقوع حدث علمًا بأن حدثًا آخر قد وقع."], misconception: ["P(A | B) always equals P(B | A).", "P(A | B) يساوي دائمًا P(B | A)."], why: ["Conditioning on a different event changes the reference group, so the two are usually different.", "تغيير الحدث الشرطي يغيّر المجموعة المرجعية فيختلف الاحتمالان عادةً."], hint: ["Divide the joint probability by the probability of the given event.", "اقسم الاحتمال المشترك على احتمال الحدث المعطى."], lecture: "L2", slide: 5, snippet: ["P(A | B) = P(A ∩ B) / P(B), defined when P(B) > 0.", "P(A | B) = P(A ∩ B) / P(B) عندما P(B) > 0."], prereq: ["prob"], approved: true },
  { id: "indep", en: "Independence", ar: "الاستقلال", def: ["Two events are independent when one occurring does not change the probability of the other.", "يكون الحدثان مستقلين عندما لا يغيّر وقوع أحدهما احتمال الآخر."], misconception: ["Mutually exclusive events are always independent.", "الأحداث المتنافية مستقلة دائمًا."], why: ["Mutually exclusive events with positive probabilities are dependent: if one occurs the other cannot.", "الأحداث المتنافية ذات الاحتمالات الموجبة تابعة: إذا وقع أحدها استحال وقوع الآخر."], hint: ["For independent events multiply the probabilities.", "للأحداث المستقلة اضرب الاحتمالات."], lecture: "L2", slide: 14, snippet: ["A and B are independent iff P(A ∩ B) = P(A)P(B).", "A وB مستقلان إذا وفقط إذا P(A ∩ B) = P(A)P(B)."], prereq: ["prob", "cond"], approved: true },
  { id: "bayes", en: "Bayes' theorem", ar: "نظرية بايز", def: ["A rule that updates the probability of a cause after observing an effect.", "قاعدة تحدّث احتمال سبب ما بعد ملاحظة نتيجته."], misconception: ["The result of a positive test is the probability that the person has the condition.", "نتيجة الاختبار الإيجابي تساوي احتمال إصابة الشخص بالحالة."], why: ["The posterior also depends on how common the condition is (the prior).", "يعتمد الاحتمال البعدي أيضًا على مدى شيوع الحالة (الاحتمال القبلي)."], hint: ["Use P(A|B) = P(B|A)P(A) / P(B) and find P(B) with the total probability rule.", "استخدم P(A|B) = P(B|A)P(A) / P(B) واحسب P(B) بقاعدة الاحتمال الكلي."], lecture: "L2", slide: 20, snippet: ["Bayes' theorem reverses a conditional probability using the prior and the evidence.", "تعكس نظرية بايز الاحتمال الشرطي باستخدام الاحتمال القبلي والدليل."], prereq: ["cond"], approved: true },
  { id: "rv", en: "Random variable", ar: "المتغير العشوائي", def: ["A rule that assigns a number to each outcome of a random experiment.", "قاعدة تسند عددًا إلى كل ناتج من نواتج تجربة عشوائية."], misconception: ["A random variable is the outcome itself, not a number assigned to it.", "المتغير العشوائي هو الناتج نفسه وليس عددًا مسندًا إليه."], why: ["The random variable maps outcomes to numbers; the outcome is the underlying event.", "يربط المتغير العشوائي النواتج بأعداد؛ أما الناتج فهو الحدث الأصلي."], hint: ["All probabilities in a distribution must add up to 1.", "يجب أن يكون مجموع الاحتمالات في التوزيع 1."], lecture: "L3", slide: 4, snippet: ["A random variable X maps each outcome in the sample space to a real number.", "يربط المتغير العشوائي X كل ناتج في فضاء العينة بعدد حقيقي."], prereq: ["prob"], approved: true },
  { id: "dist", en: "Probability distribution", ar: "التوزيع الاحتمالي", def: ["A description of all values a random variable can take and how likely each is.", "وصف لكل القيم التي يمكن أن يتخذها المتغير العشوائي واحتمال كل منها."], misconception: ["Every distribution is symmetric and bell-shaped.", "كل توزيع متماثل وعلى شكل جرس."], why: ["Many distributions, such as the binomial with small p, are skewed.", "توزيعات كثيرة، كالذي ذي الحدين مع p صغير، ملتوية."], hint: ["Binomial: P(X = k) = C(n, k) p^k (1 − p)^(n − k).", "ذو الحدين: P(X = k) = C(n, k) p^k (1 − p)^(n − k)."], lecture: "L4", slide: 7, snippet: ["A distribution lists the possible values of X together with their probabilities.", "يسرد التوزيع القيم الممكنة لـ X مع احتمالاتها."], prereq: ["rv"], approved: true },
  { id: "ev", en: "Expected value", ar: "القيمة المتوقعة", def: ["The long-run average of a random variable, found by weighting each value by its probability.", "المتوسط طويل المدى للمتغير العشوائي، ويُحسب بترجيح كل قيمة باحتمالها."], misconception: ["The expected value must be a value the variable can actually take.", "يجب أن تكون القيمة المتوقعة قيمة يمكن للمتغير أن يتخذها فعلًا."], why: ["An expected value is an average; for a fair die it is 3.5, which cannot be rolled.", "القيمة المتوقعة متوسط؛ ففي النرد العادل تساوي 3.5 ولا يمكن الحصول عليها."], hint: ["Multiply each value by its probability and add the results.", "اضرب كل قيمة في احتمالها ثم اجمع النتائج."], lecture: "L5", slide: 6, snippet: ["E[X] = Σ x · P(X = x) for a discrete random variable.", "E[X] = Σ x · P(X = x) لمتغير عشوائي منفصل."], prereq: ["rv", "dist"], approved: true },
  { id: "joint", en: "Joint probability", ar: "الاحتمال المشترك", def: ["The probability that two events both occur.", "احتمال وقوع حدثين معًا."], misconception: ["P(A ∩ B) is always P(A) + P(B).", "P(A ∩ B) يساوي دائمًا P(A) + P(B)."], why: ["Adding gives the union (minus overlap), not the intersection.", "الجمع يعطي الاتحاد (بعد طرح التقاطع) وليس التقاطع."], hint: ["Use P(A ∩ B) = P(A) · P(B | A).", "استخدم P(A ∩ B) = P(A) · P(B | A)."], lecture: "L6", slide: 5, snippet: ["The joint probability P(A ∩ B) is the chance that A and B happen together.", "الاحتمال المشترك P(A ∩ B) هو فرصة وقوع A وB معًا."], prereq: ["cond"], approved: true },
  { id: "clt", en: "Central limit theorem", ar: "نظرية النهاية المركزية", def: ["The distribution of sample means approaches a normal distribution as the sample grows.", "يقترب توزيع متوسطات العينات من التوزيع الطبيعي كلما كبرت العينة."], misconception: ["", ""], why: ["", ""], hint: ["", ""], lecture: "L6", slide: 18, snippet: ["", ""], prereq: [], approved: false },
];
export const conceptOf = (id: string) => concepts.find((c) => c.id === id);
export const lectureOf = (id: string) => lectures.find((l) => l.id === id);

export type ExamFile = { id: string; name: string; size: number; status: "uploaded" | "analyzing" | "analyzed" };
export type ExamStyle = {
  totalQuestions: number;
  totalMarks: number;
  minutes: number;
  typePct: Partial<Record<QType, number>>;
  diffPct: Record<Diff, number>;
  bloomPct: Partial<Record<Bloom, number>>;
  marksByType: Partial<Record<QType, number>>;
  wording: "direct" | "scenario" | "multipart";
  multiConcept: boolean;
  files: ExamFile[];
  /** Characteristics shown after the simulated analysis, editable by the instructor. */
  traits: { lengthWords: number; patterns: string; notes: string } | null;
};
export const defaultStyle = (): ExamStyle => ({
  totalQuestions: 20,
  totalMarks: 50,
  minutes: 60,
  typePct: { mcq: 30, math: 40, short: 20, tf: 10 },
  diffPct: { easy: 30, medium: 50, hard: 20 },
  bloomPct: { remember: 20, understand: 20, apply: 40, analyze: 20 },
  marksByType: { mcq: 2, math: 5, short: 3, tf: 1 },
  wording: "scenario",
  multiConcept: true,
  files: [],
  traits: null,
});
export const wordingLabel: Record<ExamStyle["wording"], Copy> = {
  direct: ["Direct instructions (Calculate…, State…)", "تعليمات مباشرة (احسب…، اذكر…)"],
  scenario: ["Short real-world scenario, then a question", "سيناريو واقعي قصير ثم سؤال"],
  multipart: ["Multi-part questions (a, b, c)", "أسئلة متعددة الأجزاء (أ، ب، ج)"],
};
export const sum = (r: Record<string, number | undefined>) => Object.values(r).reduce<number>((a, b) => a + (b ?? 0), 0);
export const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
