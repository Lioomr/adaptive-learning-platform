"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Info,
  Map as MapIcon,
  RotateCcw,
  Compass,
  Target,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MasteryBadge,
  MasteryBar,
} from "@/components/learning/mastery";

import {
  conceptsForCourse,
  findConcept,
  findCourse,
  questions,
} from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  masteryBand,
  recommendation,
  PREREQUISITE_READY,
} from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { Concept, Question } from "@/types";

type InterfaceLanguage = "en" | "ar";
type QuestionLanguage = "en" | "ar" | "both";

type StudentPreferences = {
  interfaceLanguage: InterfaceLanguage;
  questionLanguage: QuestionLanguage;
};

const PREFERENCES_KEY = "notch-student-preferences";
const PREFERENCES_EVENT = "notch-preferences-changed";

const DEFAULT_PREFERENCES: StudentPreferences = {
  interfaceLanguage: "en",
  questionLanguage: "en",
};

const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_PREFERENCES);

function getPreferencesSnapshot(): string {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);

    if (!stored) return DEFAULT_SNAPSHOT;

    const parsed: unknown = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_SNAPSHOT;
    }

    const data = parsed as Record<string, unknown>;

    const preferences: StudentPreferences = {
      interfaceLanguage:
        data.interfaceLanguage === "ar" ? "ar" : "en",
      questionLanguage:
        data.questionLanguage === "ar" ||
        data.questionLanguage === "both"
          ? data.questionLanguage
          : "en",
    };

    return JSON.stringify(preferences);
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

function getServerSnapshot(): string {
  return DEFAULT_SNAPSHOT;
}

function subscribeToPreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PREFERENCES_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PREFERENCES_EVENT, callback);
  };
}

/**
 * Finds the first concept that needs attention and whose prerequisites
 * are already ready. This is a deterministic demo recommendation.
 */
function findStartingConcept(
  items: Concept[],
  mastery: Record<string, number>,
): Concept | undefined {
  const availableConcept = items.find((concept) => {
    const value = mastery[concept.id] ?? 0;

    const prerequisitesReady = concept.prerequisites.every(
      (id) => (mastery[id] ?? 0) >= PREREQUISITE_READY,
    );

    return value < 70 && prerequisitesReady;
  });

  if (availableConcept) return availableConcept;

  return items.find((concept) => (mastery[concept.id] ?? 0) < 85)
    ?? items[0];
}

/** Calculates the visual depth of each concept in the prerequisite graph. */
function getConceptLevel(
  concept: Concept,
  allConcepts: Concept[],
  memo: globalThis.Map<string, number> = new globalThis.Map<string, number>(),
): number {
  const cached = memo.get(concept.id);

  if (cached !== undefined) return cached;

  if (concept.prerequisites.length === 0) {
    memo.set(concept.id, 0);
    return 0;
  }

  const prerequisiteLevels = concept.prerequisites.map((id) => {
    const prerequisite = allConcepts.find((item) => item.id === id);

    return prerequisite
      ? getConceptLevel(prerequisite, allConcepts, memo)
      : 0;
  });

  const level = Math.max(...prerequisiteLevels) + 1;

  memo.set(concept.id, level);

  return level;
}

/** Localized wording for the two illustrative questions in the shared fixture. */
function getLocalizedQuestion(question: Question) {
  if (question.id === "PY-REC-001") {
    return {
      prompt: "ما الذي يمنع الدالة التكرارية من استدعاء نفسها إلى ما لا نهاية؟",
      options: [
        "الحالة الأساسية",
        "اسم متغير",
        "تعليق",
      ],
      explanation:
        "الحالة الأساسية تنهي الدالة دون إجراء استدعاء تكراري آخر.",
    };
  }

  if (question.id === "MA-DERIV-001") {
    return {
      prompt: "ما مشتقة س² عند س = ٣؟",
      options: ["٣", "٦", "٩"],
      explanation:
        "مشتقة س² هي ٢س، وعند س = ٣ تكون النتيجة ٦.",
    };
  }

  return {
    prompt: question.prompt,
    options: question.options,
    explanation: question.explanation,
  };
}

function getMapStatus(value: number) {
  if (value === 0) {
    return {
      label: "Not yet seen",
      labelAr: "لم يتم استكشافه بعد",
      className: "border-border bg-muted text-muted-foreground",
      dotClassName: "bg-muted-foreground",
    };
  }

  if (value < PREREQUISITE_READY) {
    return {
      label: "Needs attention",
      labelAr: "يحتاج إلى اهتمام",
      className: "border-warning/30 bg-warning-soft text-warning-ink",
      dotClassName: "bg-warning",
    };
  }

  return {
    label: "Likely known",
    labelAr: "متقن غالبًا",
    className: "border-success/30 bg-success-soft text-success-ink",
    dotClassName: "bg-success",
  };
}

export function StudentSkillMap() {
  const router = useRouter();
  const hydrated = useHydrated();

  const students = useDemo((state) => state.students);
  const studentId = useDemo((state) => state.studentId);
  const courseId = useDemo((state) => state.courseId);

  const [selectedConceptId, setSelectedConceptId] =
    useState<string | null>(null);

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    null,
  );
  const [challengeSubmitted, setChallengeSubmitted] = useState(false);

  const preferenceSnapshot = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerSnapshot,
  );

  const preferences = JSON.parse(
    preferenceSnapshot,
  ) as StudentPreferences;

  const isArabic = preferences.interfaceLanguage === "ar";
  const questionLanguage = preferences.questionLanguage;

  const student = students.find((item) => item.id === studentId);
  const course = findCourse(courseId);
  const items = conceptsForCourse(courseId);

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-56 rounded-lg bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!student || !course || items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 font-semibold text-foreground">
              {isArabic ? "تعذر تحميل خريطة التعلم" : "Unable to load your skill map"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isArabic
                ? "يرجى التأكد من اختيار طالب وكورس صالحين."
                : "Please make sure a valid student and course are selected."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startingConcept = findStartingConcept(items, student.mastery);

  const selectedConcept =
    items.find((item) => item.id === selectedConceptId)
    ?? startingConcept
    ?? items[0];

  const selectedMastery = student.mastery[selectedConcept.id] ?? 0;

  const selectedRecommendation = recommendation(
    student,
    selectedConcept.id,
  );

  const challengeQuestion = questions.find(
    (question) => question.conceptId === selectedConcept.id
      && question.courseId === courseId,
  );

  const translatedQuestion = challengeQuestion
    ? getLocalizedQuestion(challengeQuestion)
    : null;

  const isCorrect = challengeQuestion
    ? selectedAnswer === challengeQuestion.answer
    : false;

  const knownCount = items.filter(
    (concept) => (student.mastery[concept.id] ?? 0) >= 70,
  ).length;

  const uncertainCount = items.filter((concept) => {
    const value = student.mastery[concept.id] ?? 0;
    return value > 0 && value < 70;
  }).length;

  const notSeenCount = items.filter(
    (concept) => (student.mastery[concept.id] ?? 0) === 0,
  ).length;

  const averageMastery = Math.round(
    items.reduce(
      (total, concept) => total + (student.mastery[concept.id] ?? 0),
      0,
    ) / items.length,
  );

  const conceptLevels = Array.from(
    new Set(
      items.map((concept) => getConceptLevel(concept, items)),
    ),
  ).sort((a, b) => a - b);

  const content = {
    eyebrow: isArabic ? "ST5 · خريطة المهارات" : "ST5 · Skill Map",
    title: isArabic ? "خريطة تعلمك" : "Your learning map",
    description: isArabic
      ? "اكتشف المفاهيم التي أتقنتها، وما يحتاج إلى مراجعة، وكيف ترتبط المفاهيم ببعضها."
      : "Explore what you know, what needs attention, and how concepts connect to each other.",

    summaryTitle: isArabic ? `أهلًا ${student.name}` : `You're making progress, ${student.name}`,
    summaryText: isArabic
      ? startingConcept
        ? `بناءً على مستواك الحالي، نقترح أن تبدأ بمفهوم ${startingConcept.title}.`
        : "يمكنك متابعة التعلم من خريطة المفاهيم."
      : startingConcept
        ? `Based on your current progress, we recommend starting with ${startingConcept.title}.`
        : "You can continue learning from your concept map.",

    course: isArabic ? "الكورس الحالي" : "Current course",
    overall: isArabic ? "متوسط الإتقان" : "Average mastery",
    concepts: isArabic ? "المفاهيم" : "Concepts",
    known: isArabic ? "متقن غالبًا" : "Likely known",
    uncertain: isArabic ? "يحتاج إلى اهتمام" : "Needs attention",
    notSeen: isArabic ? "لم يتم استكشافه" : "Not yet seen",

    mapTitle: isArabic ? "خريطة مفاهيم الكورس" : "Course concept map",
    mapDescription: isArabic
      ? "اختر أي مفهوم لمعرفة مستواه والمتطلبات السابقة له."
      : "Select any concept to see its mastery and prerequisites.",

    legendTitle: isArabic ? "دليل الألوان" : "Map legend",
    detailsTitle: isArabic ? "تفاصيل المفهوم" : "Concept details",
    mastery: isArabic ? "مستوى الإتقان" : "Mastery level",
    prerequisites: isArabic ? "المتطلبات السابقة" : "Prerequisites",
    noPrerequisites: isArabic
      ? "هذا المفهوم لا يتطلب مفاهيم سابقة."
      : "This concept has no prerequisites.",

    challengeTitle: isArabic ? "هل يبدو هذا التقييم غير صحيح؟" : "Does this look wrong?",
    challengeDescription: isArabic
      ? "يمكنك تجربة سؤال توضيحي قصير لمراجعة تقدير هذا المفهوم."
      : "Try a short illustrative check to review this concept estimate.",

    thisLooksWrong: isArabic ? "هذا التقييم يبدو غير صحيح" : "This looks wrong",
    challengeUnavailable: isArabic
      ? "لا يوجد سؤال توضيحي معتمد لهذا المفهوم في النسخة التجريبية الحالية."
      : "There is no illustrative question available for this concept in the current demo.",

    questionLabel: isArabic ? "سؤال توضيحي" : "Illustrative check",
    chooseAnswer: isArabic ? "اختر إجابتك:" : "Choose your answer:",
    checkAnswer: isArabic ? "تحقق من الإجابة" : "Check answer",
    correct: isArabic ? "إجابة صحيحة!" : "That's correct!",
    incorrect: isArabic ? "لنراجع المتطلبات السابقة أولًا." : "Let's review the prerequisites first.",
    explanation: isArabic ? "التوضيح" : "Explanation",

    reviewPrerequisite: isArabic ? "راجع المتطلب السابق" : "Review prerequisite",
    noWeakPrerequisite: isArabic
      ? "المتطلبات السابقة لهذا المفهوم جاهزة. يمكنك متابعة التعلم."
      : "The prerequisites for this concept are ready. You can continue learning.",

    startLearning: isArabic ? "ابدأ التعلم" : "Start learning",
    backToMap: isArabic ? "العودة إلى الخريطة" : "Back to map",
    resetChallenge: isArabic ? "إعادة المحاولة" : "Try again",

    simulatedNote: isArabic
      ? "هذه خريطة تجريبية تعتمد على بيانات تعليمية افتراضية. الأسئلة التوضيحية لا تغيّر مستوى الإتقان."
      : "This is a simulated learning map based on fictional learning data. Illustrative checks do not change mastery.",
  };

  function openChallenge() {
    setSelectedConceptId(selectedConcept.id);
    setChallengeOpen(true);
    setSelectedAnswer(null);
    setChallengeSubmitted(false);
  }

  function closeChallenge() {
    setChallengeOpen(false);
    setSelectedAnswer(null);
    setChallengeSubmitted(false);
  }

  function handleChallengeSubmit() {
    if (!selectedAnswer) return;
    setChallengeSubmitted(true);
  }

  function handlePrerequisiteReview() {
    if (selectedRecommendation.kind !== "review") return;

    setSelectedConceptId(selectedRecommendation.prerequisiteId);
    closeChallenge();
  }

  function handleStartLearning() {
    router.push("/student/st6");
  }

  return (
    <div
      lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-6xl"
    >
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="space-y-6">
        {/* Personalized starting recommendation */}
        <Card className="overflow-hidden">
          <div className="bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Compass className="size-4" />
                  {content.summaryTitle}
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {content.summaryText}
                </p>

                {startingConcept && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary">
                      {startingConcept.title}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {student.mastery[startingConcept.id]}% mastery
                    </span>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {content.overall}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {averageMastery}%
                  </p>
                </div>

                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Target className="size-6" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Course overview */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success-ink">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {knownCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {content.known}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning-ink">
                <CircleAlert className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {uncertainCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {content.uncertain}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <CircleHelp className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {notSeenCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {content.notSeen}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Concept map and legend */}
        <Card as="section" aria-labelledby="skill-map-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapIcon className="size-5" />
              </span>

              <div>
                <CardTitle id="skill-map-heading">
                  {content.mapTitle}
                </CardTitle>
                <CardDescription>
                  {content.mapDescription}
                </CardDescription>
              </div>
            </div>

            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {course.title} · {items.length} {content.concepts}
            </span>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-muted/40 p-3">
              <span className="w-full text-xs font-semibold text-foreground">
                {content.legendTitle}
              </span>

              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-success" />
                {content.known}
              </span>

              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-warning" />
                {content.uncertain}
              </span>

              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full bg-muted-foreground" />
                {content.notSeen}
              </span>
            </div>

            <div className="space-y-5">
              {conceptLevels.map((level) => {
                const levelConcepts = items.filter(
                  (concept) => getConceptLevel(concept, items) === level,
                );

                return (
                  <div key={level} className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isArabic ? `المستوى ${level + 1}` : `Learning level ${level + 1}`}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {levelConcepts.map((concept) => {
                        const value = student.mastery[concept.id] ?? 0;
                        const mapStatus = getMapStatus(value);
                        const selected = selectedConcept.id === concept.id;

                        return (
                          <div
                            key={concept.id}
                            className={`rounded-xl border p-3 transition-colors ${
                              selected
                                ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                                : "border-border bg-card"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedConceptId(concept.id);
                                closeChallenge();
                              }}
                              aria-pressed={selected}
                              className="w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-start gap-2">
                                  <span
                                    className={`mt-1 size-2.5 shrink-0 rounded-full ${mapStatus.dotClassName}`}
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-foreground">
                                      {concept.title}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-muted-foreground">
                                      {concept.id}
                                    </span>
                                  </span>
                                </div>

                                <span className="shrink-0 text-sm font-semibold tabular-nums">
                                  {value}%
                                </span>
                              </div>

                              <Progress
                                value={value}
                                className="mt-3 h-1.5"
                                aria-label={`${concept.title} mastery`}
                              />

                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${mapStatus.className}`}
                                >
                                  {isArabic
                                    ? mapStatus.labelAr
                                    : mapStatus.label}
                                </span>

                                {selected && (
                                  <span className="text-[10px] font-semibold text-primary">
                                    {isArabic ? "محدد" : "Selected"}
                                  </span>
                                )}
                              </div>
                            </button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-8 w-full justify-start px-1 text-xs text-muted-foreground"
                              onClick={() => {
                                setSelectedConceptId(concept.id);
                                setChallengeOpen(true);
                                setSelectedAnswer(null);
                                setChallengeSubmitted(false);
                              }}
                            >
                              <CircleHelp className="size-3.5" />
                              {content.thisLooksWrong}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected concept details */}
        <Card as="section" aria-labelledby="concept-details-heading">
          <CardHeader>
            <div>
              <CardTitle id="concept-details-heading">
                {content.detailsTitle}: {selectedConcept.title}
              </CardTitle>
              <CardDescription>
                {selectedConcept.id}
              </CardDescription>
            </div>

            <MasteryBadge value={selectedMastery} showValue />
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">
                  {content.mastery}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {selectedMastery}%
                </span>
              </div>

              <MasteryBar
                value={selectedMastery}
                label={`${selectedConcept.title} mastery`}
              />

              <p className="mt-2 text-xs text-muted-foreground">
                {isArabic
                  ? `حالة الإتقان: ${masteryBand(selectedMastery).band}`
                  : `Mastery status: ${masteryBand(selectedMastery).band}`}
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">
                {content.prerequisites}
              </h3>

              {selectedConcept.prerequisites.length === 0 ? (
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  {content.noPrerequisites}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedConcept.prerequisites.map((id) => {
                    const prerequisite = findConcept(id);
                    const value = student.mastery[id] ?? 0;
                    const ready = value >= PREREQUISITE_READY;

                    if (!prerequisite) return null;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedConceptId(id);
                          closeChallenge();
                        }}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          ready
                            ? "border-success/30 bg-success-soft text-success-ink"
                            : "border-warning/30 bg-warning-soft text-warning-ink"
                        }`}
                      >
                        {ready ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : (
                          <CircleAlert className="size-3.5" />
                        )}

                        {prerequisite.title}
                        <span className="font-semibold tabular-nums">
                          {value}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedRecommendation.kind === "review" && (
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft/50 p-4">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-ink" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {isArabic
                      ? `يُفضّل مراجعة ${findConcept(selectedRecommendation.prerequisiteId)?.title ?? selectedRecommendation.prerequisiteId} أولًا.`
                      : selectedRecommendation.message}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {isArabic
                      ? "هذا اقتراح تعليمي وليس حظرًا على متابعة التعلم."
                      : "This is a learning recommendation, not a restriction."}
                  </p>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handlePrerequisiteReview}
                  >
                    <BookOpen className="size-4" />
                    {content.reviewPrerequisite}
                  </Button>
                </div>
              </div>
            )}

            {selectedRecommendation.kind === "ready" && (
              <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-soft/50 p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-ink" />

                <p className="text-sm leading-6 text-foreground">
                  {isArabic
                    ? "المتطلبات السابقة جاهزة، ويمكنك البدء في هذا المفهوم."
                    : selectedRecommendation.message}
                </p>
              </div>
            )}

            {/* Challenge / confirming check preview */}
            {challengeOpen && (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CircleHelp className="size-4 text-primary" />
                      {content.challengeTitle}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {content.challengeDescription}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeChallenge}
                    aria-label={content.backToMap}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>

                {!challengeQuestion || !translatedQuestion ? (
                  <div className="mt-4 rounded-lg border border-border bg-card p-4">
                    <Info className="size-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {content.challengeUnavailable}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {content.questionLabel}
                      </p>

                      {(questionLanguage === "en" ||
                        questionLanguage === "both") && (
                        <p
                          lang="en" dir="ltr"
                          className="mt-2 text-sm font-semibold leading-6 text-foreground"
                        >
                          {challengeQuestion.prompt}
                        </p>
                      )}

                      {(questionLanguage === "ar" ||
                        questionLanguage === "both") && (
                        <p
                          lang="ar" dir="rtl"
                          className="mt-2 text-sm font-semibold leading-6 text-foreground"
                        >
                          {translatedQuestion.prompt}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {content.chooseAnswer}
                      </p>

                      {challengeQuestion.options.map((option, index) => {
                        const translatedOption =
                          translatedQuestion.options[index];

                        const selected = selectedAnswer === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            disabled={challengeSubmitted}
                            onClick={() => setSelectedAnswer(option)}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card hover:bg-muted/40"
                            }`}
                          >
                            <span className="min-w-0">
                              {(questionLanguage === "en" ||
                                questionLanguage === "both") && (
                                <span lang="en" dir="ltr" className="block">
                                  {option}
                                </span>
                              )}

                              {(questionLanguage === "ar" ||
                                questionLanguage === "both") && (
                                <span lang="ar" dir="rtl" className="mt-1 block">
                                  {translatedOption}
                                </span>
                              )}
                            </span>

                            {selected && (
                              <CheckCircle2 className="size-4 shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {!challengeSubmitted ? (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={!selectedAnswer}
                        onClick={handleChallengeSubmit}
                      >
                        {content.checkAnswer}
                        <ArrowRight className="size-4 rtl:-scale-x-100" />
                      </Button>
                    ) : (
                      <div
                        role="status"
                        className={`rounded-lg border p-4 ${
                          isCorrect
                            ? "border-success/30 bg-success-soft/50"
                            : "border-warning/30 bg-warning-soft/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="size-5 text-success-ink" />
                          ) : (
                            <CircleAlert className="size-5 text-warning-ink" />
                          )}

                          <p className="text-sm font-semibold text-foreground">
                            {isCorrect
                              ? content.correct
                              : content.incorrect}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {content.explanation}
                          </p>

                          {(questionLanguage === "en" ||
                            questionLanguage === "both") && (
                            <p
                              lang="en" dir="ltr"
                              className="mt-1 text-sm leading-6 text-foreground"
                            >
                              {challengeQuestion.explanation}
                            </p>
                          )}

                          {(questionLanguage === "ar" ||
                            questionLanguage === "both") && (
                            <p
                              lang="ar" dir="rtl"
                              className="mt-1 text-sm leading-6 text-foreground"
                            >
                              {translatedQuestion.explanation}
                            </p>
                          )}
                        </div>

                        {!isCorrect && selectedRecommendation.kind === "review" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={handlePrerequisiteReview}
                          >
                            <BookOpen className="size-4" />
                            {content.reviewPrerequisite}:{" "}
                            {findConcept(selectedRecommendation.prerequisiteId)?.title}
                          </Button>
                        )}

                        {!isCorrect && selectedRecommendation.kind !== "review" && (
                          <p className="mt-3 text-xs leading-5 text-muted-foreground">
                            {content.noWeakPrerequisite}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedAnswer(null);
                              setChallengeSubmitted(false);
                            }}
                          >
                            <RotateCcw className="size-3.5" />
                            {content.resetChallenge}
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={closeChallenge}
                          >
                            {content.backToMap}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Final navigation */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Compass className="size-5" />
            </span>

            <div>
              <p className="font-semibold text-foreground">
                {isArabic ? "مستعد للخطوة التالية؟" : "Ready for your next step?"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {isArabic
                  ? "انتقل إلى الصفحة الرئيسية لمعرفة ما ستتعلمه بعد ذلك."
                  : "Continue to your learning home to see what comes next."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={handleStartLearning}
          >
            {content.startLearning}
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </Button>
        </div>

        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          {content.simulatedNote}
        </p>
      </div>
    </div>
  );
}
