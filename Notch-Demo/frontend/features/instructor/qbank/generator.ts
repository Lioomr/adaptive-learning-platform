import {
  concepts, conceptOf, type Bank, type Bloom, type CheckKey, type CheckStatus, type Copy, type Diff, type ExamStyle,
  type Feedback, type Lang, type Option, type QConcept, type QType, type Question, checkKeys,
} from "./data";

/**
 * Deterministic mock "generator". It fills templates from the approved concepts and
 * runs rule-based checks. It is NOT an AI model and is labelled as a simulation in the UI.
 */
export type GenSpec = {
  bank: Bank;
  type: QType;
  difficulty: Diff;
  bloom: Bloom;
  marks: number;
  lang: Lang;
  conceptIds: string[];
  feedback: Feedback;
  seed: number;
  targetMisconceptions?: boolean;
  wording?: ExamStyle["wording"];
  prerequisite?: boolean;
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, list: T[]) => list[Math.floor(r() * list.length)];
const shuffle = <T,>(r: () => number, list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const c = (en: string, ar: string): Copy => [en, ar];
const f = (x: number) => String(Number(x.toFixed(4)));
const comb = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

type Calc = { text: Copy; answer: Copy; steps: Copy[] };
function mathFor(id: string, d: Diff, r: () => number): Calc {
  switch (id) {
    case "prob": {
      const a = pick(r, [0.3, 0.4, 0.5, 0.6]), b = pick(r, [0.2, 0.3, 0.4]), i = pick(r, [0.1, 0.15, 0.2]);
      const u = a + b - i;
      const hard = d === "hard";
      const ans = hard ? 1 - u : u;
      return {
        text: c(`For events A and B, P(A) = ${a}, P(B) = ${b} and P(A ∩ B) = ${i}. Find ${hard ? "the probability that neither A nor B occurs" : "P(A ∪ B)"}.`, `للحدثين A وB: P(A) = ${a} وP(B) = ${b} وP(A ∩ B) = ${i}. أوجد ${hard ? "احتمال ألا يقع أي من A وB" : "P(A ∪ B)"}.`),
        answer: c(f(ans), f(ans)),
        steps: [c(`P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = ${a} + ${b} − ${i} = ${f(u)}`, `P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = ${a} + ${b} − ${i} = ${f(u)}`), ...(hard ? [c(`P(neither) = 1 − ${f(u)} = ${f(ans)}`, `احتمال عدم وقوع أي منهما = 1 − ${f(u)} = ${f(ans)}`)] : [])],
      };
    }
    case "cond": {
      const b = pick(r, [0.4, 0.5, 0.6]), i = pick(r, [0.1, 0.2, 0.25]);
      const p = i / b;
      const hard = d === "hard";
      const ans = hard ? 1 - p : p;
      return {
        text: c(`P(B) = ${b} and P(A ∩ B) = ${i}. Find ${hard ? "P(A′ | B)" : "P(A | B)"}.`, `P(B) = ${b} وP(A ∩ B) = ${i}. أوجد ${hard ? "P(A′ | B)" : "P(A | B)"}.`),
        answer: c(f(ans), f(ans)),
        steps: [c(`P(A | B) = P(A ∩ B) / P(B) = ${i} / ${b} = ${f(p)}`, `P(A | B) = P(A ∩ B) / P(B) = ${i} / ${b} = ${f(p)}`), ...(hard ? [c(`P(A′ | B) = 1 − ${f(p)} = ${f(ans)}`, `P(A′ | B) = 1 − ${f(p)} = ${f(ans)}`)] : [])],
      };
    }
    case "indep": {
      const a = pick(r, [0.3, 0.4, 0.5]), b = pick(r, [0.2, 0.5, 0.6]);
      const hard = d === "hard";
      const ans = hard ? a + b - a * b : a * b;
      return {
        text: c(`Events A and B are independent with P(A) = ${a} and P(B) = ${b}. Find ${hard ? "P(A ∪ B)" : "P(A ∩ B)"}.`, `الحدثان A وB مستقلان وP(A) = ${a} وP(B) = ${b}. أوجد ${hard ? "P(A ∪ B)" : "P(A ∩ B)"}.`),
        answer: c(f(ans), f(ans)),
        steps: [c(`Independence: P(A ∩ B) = ${a} × ${b} = ${f(a * b)}`, `الاستقلال: P(A ∩ B) = ${a} × ${b} = ${f(a * b)}`), ...(hard ? [c(`P(A ∪ B) = ${a} + ${b} − ${f(a * b)} = ${f(ans)}`, `P(A ∪ B) = ${a} + ${b} − ${f(a * b)} = ${f(ans)}`)] : [])],
      };
    }
    case "bayes": {
      const p = pick(r, [0.01, 0.02, 0.05]), s = pick(r, [0.9, 0.95]), fp = pick(r, [0.05, 0.1]);
      const pos = p * s + (1 - p) * fp;
      const ans = (p * s) / pos;
      return {
        text: c(`A condition affects ${p * 100}% of students. A screening test is positive for ${s * 100}% of affected students and for ${fp * 100}% of unaffected students. A student tests positive. Find the probability they have the condition.`, `تصيب حالة ما ${p * 100}% من الطلاب. الفحص إيجابي لدى ${s * 100}% من المصابين و${fp * 100}% من غير المصابين. أجرى طالب الفحص وكانت نتيجته إيجابية. أوجد احتمال إصابته.`),
        answer: c(f(ans), f(ans)),
        steps: [c(`P(+) = ${p}×${s} + ${f(1 - p)}×${fp} = ${f(pos)}`, `P(+) = ${p}×${s} + ${f(1 - p)}×${fp} = ${f(pos)}`), c(`P(D | +) = ${f(p * s)} / ${f(pos)} = ${f(ans)}`, `P(D | +) = ${f(p * s)} / ${f(pos)} = ${f(ans)}`)],
      };
    }
    case "rv": {
      const [pa, pb, pd] = pick(r, [[0.1, 0.3, 0.2], [0.2, 0.25, 0.15], [0.05, 0.35, 0.3]]);
      const cc = 1 - pa - pb - pd;
      return {
        text: c(`A random variable X takes values 1, 2, 3, 4 with probabilities ${pa}, ${pb}, c and ${pd}. Find c.`, `يتخذ المتغير العشوائي X القيم 1 و2 و3 و4 باحتمالات ${pa} و${pb} وc و${pd}. أوجد c.`),
        answer: c(f(cc), f(cc)),
        steps: [c(`Probabilities must sum to 1: ${pa} + ${pb} + c + ${pd} = 1`, `مجموع الاحتمالات يساوي 1: ${pa} + ${pb} + c + ${pd} = 1`), c(`c = 1 − ${f(pa + pb + pd)} = ${f(cc)}`, `c = 1 − ${f(pa + pb + pd)} = ${f(cc)}`)],
      };
    }
    case "dist": {
      const n = pick(r, [5, 6, 8]), p = pick(r, [0.3, 0.5, 0.6]), k = d === "easy" ? 1 : 2;
      const hard = d === "hard";
      const pk = (x: number) => comb(n, x) * p ** x * (1 - p) ** (n - x);
      const ans = hard ? pk(n) + pk(n - 1) : pk(k);
      return {
        text: c(`X ~ Binomial(n = ${n}, p = ${p}). Find ${hard ? `P(X ≥ ${n - 1})` : `P(X = ${k})`}.`, `X ~ ذو حدين (n = ${n}، p = ${p}). أوجد ${hard ? `P(X ≥ ${n - 1})` : `P(X = ${k})`}.`),
        answer: c(f(ans), f(ans)),
        steps: hard
          ? [c(`P(X = ${n}) = ${p}^${n} = ${f(pk(n))}`, `P(X = ${n}) = ${p}^${n} = ${f(pk(n))}`), c(`P(X = ${n - 1}) = C(${n}, ${n - 1}) ${p}^${n - 1} ${f(1 - p)} = ${f(pk(n - 1))}`, `P(X = ${n - 1}) = C(${n}, ${n - 1}) ${p}^${n - 1} ${f(1 - p)} = ${f(pk(n - 1))}`), c(`Sum = ${f(ans)}`, `المجموع = ${f(ans)}`)]
          : [c(`P(X = ${k}) = C(${n}, ${k}) ${p}^${k} (${f(1 - p)})^${n - k}`, `P(X = ${k}) = C(${n}, ${k}) ${p}^${k} (${f(1 - p)})^${n - k}`), c(`= ${comb(n, k)} × ${f(p ** k)} × ${f((1 - p) ** (n - k))} = ${f(ans)}`, `= ${comb(n, k)} × ${f(p ** k)} × ${f((1 - p) ** (n - k))} = ${f(ans)}`)],
      };
    }
    case "ev": {
      const [p0, p1, p2] = pick(r, [[0.2, 0.5, 0.3], [0.1, 0.6, 0.3], [0.3, 0.3, 0.4]]);
      const e = p1 + 2 * p2;
      const hard = d === "hard";
      const ans = hard ? 2 * e + 1 : e;
      return {
        text: c(`X takes values 0, 1, 2 with probabilities ${p0}, ${p1}, ${p2}. Find ${hard ? "E[2X + 1]" : "E[X]"}.`, `يتخذ X القيم 0 و1 و2 باحتمالات ${p0} و${p1} و${p2}. أوجد ${hard ? "E[2X + 1]" : "E[X]"}.`),
        answer: c(f(ans), f(ans)),
        steps: [c(`E[X] = 0×${p0} + 1×${p1} + 2×${p2} = ${f(e)}`, `E[X] = 0×${p0} + 1×${p1} + 2×${p2} = ${f(e)}`), ...(hard ? [c(`E[2X + 1] = 2×${f(e)} + 1 = ${f(ans)}`, `E[2X + 1] = 2×${f(e)} + 1 = ${f(ans)}`)] : [])],
      };
    }
    default: {
      const a = pick(r, [0.3, 0.4, 0.5]), ba = pick(r, [0.4, 0.5, 0.6]);
      const hard = d === "hard";
      const bn = pick(r, [0.2, 0.3]);
      const joint = a * ba;
      const ans = hard ? joint + (1 - a) * bn : joint;
      return {
        text: c(hard ? `P(A) = ${a}, P(B | A) = ${ba} and P(B | A′) = ${bn}. Find P(B).` : `P(A) = ${a} and P(B | A) = ${ba}. Find P(A ∩ B).`, hard ? `P(A) = ${a} وP(B | A) = ${ba} وP(B | A′) = ${bn}. أوجد P(B).` : `P(A) = ${a} وP(B | A) = ${ba}. أوجد P(A ∩ B).`),
        answer: c(f(ans), f(ans)),
        steps: [c(`P(A ∩ B) = P(A) P(B | A) = ${a} × ${ba} = ${f(joint)}`, `P(A ∩ B) = P(A) P(B | A) = ${a} × ${ba} = ${f(joint)}`), ...(hard ? [c(`P(B) = ${f(joint)} + ${f(1 - a)}×${bn} = ${f(ans)}`, `P(B) = ${f(joint)} + ${f(1 - a)}×${bn} = ${f(ans)}`)] : [])],
      };
    }
  }
}

const stems: Record<Bloom, (k: QConcept) => Copy> = {
  remember: (k) => c(`Which statement correctly defines ${k.en}?`, `أي العبارات تعرّف ${k.ar} تعريفًا صحيحًا؟`),
  understand: (k) => c(`Which statement best explains ${k.en}?`, `أي العبارات تشرح ${k.ar} على نحو أفضل؟`),
  apply: (k) => c(`A student is about to use ${k.en} in a problem. Which description should guide them?`, `سيستخدم طالب ${k.ar} في مسألة. أي وصف ينبغي أن يوجّهه؟`),
  analyze: (k) => c(`Which description of ${k.en} is accurate?`, `أي وصف لـ ${k.ar} صحيح؟`),
  evaluate: (k) => c(`A classmate describes ${k.en}. Which description should you accept as correct?`, `يصف زميل ${k.ar}. أي وصف ينبغي أن تقبله على أنه صحيح؟`),
  create: (k) => c(`Which description would you use as the basis of a lesson on ${k.en}?`, `أي وصف ستجعله أساسًا لدرس عن ${k.ar}؟`),
};
const scenario = c("A university survey records exam outcomes for a cohort. ", "تسجّل دراسة جامعية نتائج امتحان لدفعة من الطلاب. ");
const multipart = c("\n(b) Interpret your result in one sentence.", "\n(ب) فسّر نتيجتك في جملة واحدة.");

function localize(v: Copy, lang: Lang): Copy {
  return lang === "en" ? [v[0], ""] : lang === "ar" ? ["", v[1]] : v;
}

export function generate(spec: GenSpec, id: string, existing: Question[] = []): Question {
  const r = rng(spec.seed);
  const k = conceptOf(spec.conceptIds[0]) ?? concepts[0];
  const second = spec.conceptIds[1] ? conceptOf(spec.conceptIds[1]) : undefined;
  const others = shuffle(r, concepts.filter((x) => x.approved && x.id !== k.id));
  let text: Copy = c("", "");
  let options: Option[] = [];
  let answer: Copy = c("", "");
  let pairs: Question["pairs"] = [];
  let explanation: Copy = c(`${k.en}: ${k.def[0]}`, `${k.ar}: ${k.def[1]}`);
  let steps: Copy[] = [];
  const hint = k.hint;
  const t = spec.type;
  if (t === "mcq") {
    const wrong: Option[] = others.slice(0, 2).map((o, i) => ({ id: `w${i}`, text: o.def, correct: false, why: c(`This describes ${o.en}, not ${k.en}.`, `هذا يصف ${o.ar} وليس ${k.ar}.`) }));
    if (spec.targetMisconceptions !== false && k.misconception[0]) wrong.push({ id: "m", text: k.misconception, correct: false, why: k.why });
    else if (others[2]) wrong.push({ id: "w2", text: others[2].def, correct: false, why: c(`This describes ${others[2].en}, not ${k.en}.`, `هذا يصف ${others[2].ar} وليس ${k.ar}.`) });
    options = shuffle(r, [{ id: "ok", text: k.def, correct: true, why: c("Correct definition.", "تعريف صحيح.") }, ...wrong]).map((o, i) => ({ ...o, id: `o${i}` }));
    text = stems[spec.bloom](k);
    if (spec.wording === "scenario") text = c(scenario[0] + text[0], scenario[1] + text[1]);
  } else if (t === "tf") {
    const truth = r() < 0.5 || !k.misconception[0];
    const stmt: Copy = truth ? k.def : k.misconception;
    text = c(`True or false: ${stmt[0]}`, `صح أم خطأ: ${stmt[1]}`);
    options = [
      { id: "t", text: c("True", "صح"), correct: truth },
      { id: "f", text: c("False", "خطأ"), correct: !truth },
    ];
    explanation = truth ? c(`True. ${k.en}: ${k.def[0]}`, `صحيح. ${k.ar}: ${k.def[1]}`) : c(`False. ${k.why[0]}`, `خطأ. ${k.why[1]}`);
  } else if (t === "short") {
    text = second
      ? c(`Define ${k.en} and explain how it relates to ${second.en}.`, `عرّف ${k.ar} واشرح علاقته بـ ${second.ar}.`)
      : c(`Define ${k.en} and give one example from the lecture.`, `عرّف ${k.ar} وأعطِ مثالًا واحدًا من المحاضرة.`);
    answer = c(`${k.def[0]}${second ? ` It builds on or combines with ${second.en}.` : ""}`, `${k.def[1]}${second ? ` وهو يرتبط بـ ${second.ar}.` : ""}`);
  } else if (t === "essay") {
    text = c(`Discuss the role of ${k.en} in probabilistic reasoning. Support your answer with an example and mention one common mistake.`, `ناقش دور ${k.ar} في الاستدلال الاحتمالي. ادعم إجابتك بمثال واذكر خطأً شائعًا واحدًا.`);
    answer = c(`Expected points: (1) definition — ${k.def[0]} (2) a worked example (3) a common mistake — ${k.misconception[0] || "n/a"}`, `النقاط المتوقعة: (1) التعريف — ${k.def[1]} (2) مثال محلول (3) خطأ شائع — ${k.misconception[1] || "—"}`);
  } else if (t === "math" || t === "numeric") {
    const m = mathFor(k.id, spec.difficulty, r);
    text = t === "numeric" ? c(`${m.text[0]} Give your answer to 2 decimal places.`, `${m.text[1]} اكتب إجابتك لمنزلتين عشريتين.`) : m.text;
    answer = t === "numeric" ? c(Number(m.answer[0]).toFixed(2), Number(m.answer[1]).toFixed(2)) : m.answer;
    steps = m.steps;
    if (spec.wording === "scenario") text = c(scenario[0] + text[0], scenario[1] + text[1]);
    if (spec.wording === "multipart") text = c(text[0] + multipart[0], text[1] + multipart[1]);
    explanation = c(`Solution: ${m.steps.map((s) => s[0]).join("; ")}.`, `الحل: ${m.steps.map((s) => s[1]).join("؛ ")}.`);
  } else if (t === "matching") {
    const group = [k, ...others.slice(0, 3)];
    pairs = group.map((g) => ({ left: c(g.en, g.ar), right: g.def }));
    text = c("Match each concept with its definition.", "طابق كل مفهوم مع تعريفه.");
    explanation = c("Each concept pairs with exactly one definition from the lectures.", "يرتبط كل مفهوم بتعريف واحد فقط من المحاضرات.");
  } else {
    text = c(`______ is defined as: ${k.def[0]}`, `______ يُعرَّف بأنه: ${k.def[1]}`);
    answer = c(k.en, k.ar);
  }
  const q: Question = {
    id,
    bank: spec.bank,
    type: t,
    difficulty: spec.difficulty,
    bloom: spec.bloom,
    marks: spec.marks,
    lang: spec.lang,
    text: localize(text, spec.lang),
    options: options.map((o) => ({ ...o, text: localize(o.text, spec.lang), why: o.why && localize(o.why, spec.lang) })),
    answer: localize(answer, spec.lang),
    pairs: pairs.map((p) => ({ left: localize(p.left, spec.lang), right: localize(p.right, spec.lang) })),
    explanation: localize(explanation, spec.lang),
    hint: localize(hint, spec.lang),
    steps: steps.map((s) => localize(s, spec.lang)),
    conceptIds: spec.conceptIds,
    source: { lectureId: k.lecture, slide: k.slide, snippet: k.snippet },
    validation: {} as Question["validation"],
    status: "pending",
    pattern: spec.bank === "exam" ? `${spec.wording ?? "direct"}${second ? "+multi" : ""}` : undefined,
    feedback: spec.feedback,
    seed: spec.seed,
    prerequisite: spec.prerequisite,
    createdAt: new Date().toISOString(),
  };
  q.validation = validate(q, existing);
  return q;
}

/** Rule-based, deterministic "quality checks". Simulated; not real AI validation. */
export function validate(q: Question, existing: Question[]): Question["validation"] {
  const h = hash(q.id + q.seed + q.type);
  const out = {} as Question["validation"];
  const set = (key: CheckKey, status: CheckStatus, en: string, ar: string) => (out[key] = { status, note: [en, ar] });
  const sig = (x: Question) => [x.text[0], x.text[1], x.answer[0], x.options.map((o) => o.text[0]).sort().join("|")].join("§");
  const dupe = existing.find((e) => e.id !== q.id && e.bank === q.bank && e.status !== "archived" && e.text[0] && sig(e) === sig(q));
  set("relevance", h % 17 === 0 ? "review" : "passed", h % 17 === 0 ? "The wording is only loosely tied to the selected concept." : "Tied directly to the selected concept and its source slide.", h % 17 === 0 ? "الصياغة مرتبطة بالمفهوم المحدد بشكل فضفاض فقط." : "مرتبط مباشرة بالمفهوم المحدد وبشريحة المصدر.");
  const correct = q.options.filter((o) => o.correct).length;
  const bad = (q.type === "mcq" || q.type === "tf") && correct !== 1;
  set("answer", bad ? "failed" : "passed", bad ? "Exactly one option must be correct." : "A single, unambiguous correct answer was found.", bad ? "يجب أن يكون خيار واحد فقط صحيحًا." : "تم العثور على إجابة صحيحة واحدة وغير ملتبسة.");
  if (q.type === "mcq" || q.type === "tf" || q.type === "matching") {
    const weak = h % 9 === 0;
    set("options", weak ? "review" : "passed", weak ? "Two distractors read as very similar." : "Distractors are plausible and distinct.", weak ? "خياران مشتتان متشابهان جدًا." : "المشتتات معقولة ومتمايزة.");
  } else set("options", "na", "Not applicable to this question type.", "لا ينطبق على هذا النوع من الأسئلة.");
  if (dupe) set("duplicate", dupe.status === "approved" ? "failed" : "review", `Identical wording to ${dupe.id}.`, `صياغة مطابقة للسؤال ${dupe.id}.`);
  else set("duplicate", "passed", "No similar question found in this bank.", "لا يوجد سؤال مشابه في هذا البنك.");
  set("evidence", q.source.snippet[0] ? "passed" : "failed", q.source.snippet[0] ? "Supporting slide text is available." : "No supporting source text.", q.source.snippet[0] ? "نص الشريحة الداعم متوفر." : "لا يوجد نص مصدر داعم.");
  const mismatch = (q.difficulty === "hard" && q.marks <= 1) || (q.difficulty === "easy" && ["analyze", "evaluate", "create"].includes(q.bloom));
  set("difficulty", mismatch ? "review" : "passed", mismatch ? "Difficulty, marks or cognitive level look inconsistent." : "Difficulty matches marks and cognitive level.", mismatch ? "الصعوبة أو الدرجات أو المستوى المعرفي غير متسقة." : "الصعوبة متسقة مع الدرجات والمستوى المعرفي.");
  if (q.type === "math" || q.type === "numeric") {
    const fail = h % 23 === 0;
    set("math", fail ? "failed" : "passed", fail ? "Re-computation gave a different final value." : "Re-computation reproduced the final answer.", fail ? "أعطت إعادة الحساب قيمة نهائية مختلفة." : "أعادت إعادة الحساب الإجابة النهائية.");
  } else set("math", "na", "Not a mathematical question.", "ليس سؤالًا رياضيًا.");
  if (q.lang === "both") {
    const diff = h % 11 === 0;
    set("bilingual", diff ? "review" : "passed", diff ? "Arabic phrasing may differ slightly in emphasis." : "Both versions have equivalent meaning and answers.", diff ? "قد تختلف صياغة العربية قليلًا في التركيز." : "للنسختين المعنى والإجابات نفسها.");
  } else set("bilingual", "na", "Single-language question.", "سؤال بلغة واحدة.");
  return out;
}

export function overall(v: Question["validation"]): "passed" | "review" | "failed" {
  const s = checkKeys.map((k) => v[k]?.status);
  return s.includes("failed") ? "failed" : s.includes("review") ? "review" : "passed";
}
