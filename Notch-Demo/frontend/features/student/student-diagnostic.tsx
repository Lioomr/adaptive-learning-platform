
"use client";

import { useSyncExternalStore, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
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
import { useHydrated } from "@/hooks/use-hydrated";
import { concepts, findCourse, questions } from "@/data/fixtures";
import { masteryBand, recommendation } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { CourseId } from "@/types";

type Language = "en" | "ar";
type QuestionLanguage = "en" | "ar" | "both";

type Preferences = {
  interfaceLanguage: Language;
  questionLanguage: QuestionLanguage;
};

type QuestionCopy = {
  prompt: string;
  options: string[];
  explanation: string;
};

const PREFERENCES_KEY = "notch-student-preferences";

const DEFAULT_PREFERENCES: Preferences = {
  interfaceLanguage: "en",
  questionLanguage: "both",
};

const DEFAULT_PREFERENCES_JSON = JSON.stringify(DEFAULT_PREFERENCES);

/**
 * Read ST3 preferences through useSyncExternalStore.
 * The server snapshot is fixed, so the first server/client render matches.
 */
function subscribeToPreferences(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener("notch-preferences-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("notch-preferences-change", callback);
  };
}

function getPreferencesSnapshot() {
  try {
    return window.localStorage.getItem(PREFERENCES_KEY) ?? DEFAULT_PREFERENCES_JSON;
  } catch {
    return DEFAULT_PREFERENCES_JSON;
  }
}

function getPreferencesServerSnapshot() {
  return DEFAULT_PREFERENCES_JSON;
}

function parsePreferences(raw: string): Preferences {
  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;

    return {
      interfaceLanguage: parsed.interfaceLanguage === "ar" ? "ar" : "en",
      questionLanguage:
        parsed.questionLanguage === "ar" || parsed.questionLanguage === "en"
          ? parsed.questionLanguage
          : "both",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function getQuestionCopy(questionId: string): QuestionCopy | null {
  if (questionId === "PY-VAR-001") {
    return {
      prompt: "أي عبارة تسند القيمة 10 بشكل صحيح إلى متغير اسمه age في بايثون؟",
      options: ["age = 10", "10 = age", "var age == 10"],
      explanation:
        "في بايثون، نستخدم العامل = لإسناد قيمة، مع اسم المتغير على اليسار والقيمة على اليمين.",
    };
  }

  if (questionId === "PY-REC-001") {
    return {
      prompt:
        "ما الذي يمنع الدالة التكرارية من استدعاء نفسها إلى ما لا نهاية؟",
      options: ["حالة أساسية (Base case)", "اسم متغير", "تعليق برمجي"],
      explanation:
        "الحالة الأساسية (Base case) تسمح للدالة بالتوقف دون إجراء استدعاء تكراري آخر.",
    };
  }

  if (questionId === "MA-DERIV-001") {
    return {
      prompt: "ما مشتقة س² عند س = ٣؟",
      options: ["٣", "٦", "٩"],
      explanation:
        "مشتقة س² هي ٢س، وعند س = ٣ تكون النتيجة ٦.",
    };
  }

  return null;
}

const interfaceText = {
  en: {
    eyebrow: "Student portal · ST4",
    title: "Course diagnostic",
    description:
      "Answer this illustrative question to explore how the diagnostic experience works.",
    demo: "Illustrative demo",
    question: "Question",
    of: "of",
    choose: "Choose the best answer.",
    dontKnow: "I don't know",
    next: "Next",
    pause: "Pause assessment",
    resume: "Resume assessment",
    paused: "Assessment paused",
    pausedDescription:
      "Your current answer is still available on this screen. Resume whenever you're ready.",
    progress: "Assessment progress",
    result: "Your diagnostic result",
    correct: "Correct answer!",
    incorrect: "Not quite this time.",
    unknown: "It's okay not to know yet.",
    correctDescription:
      "You selected the correct answer for this illustrative question.",
    incorrectDescription:
      "This answer suggests that reviewing the concept may help.",
    unknownDescription:
      "This question was left unanswered, so it is treated as incorrect in this demo.",
    correctAnswer: "Correct answer",
    explanation: "Explanation",
    nextStep: "Suggested next step",
    continue: "Continue to Skill Map",
    retry: "Try again",
    review: "Review the concept and its prerequisites.",
    ready: "Explore the next available learning steps in your Skill Map.",
    loading: "Preparing your diagnostic...",
    unavailable: "No illustrative question is available for this course yet.",
    back: "Back to learning space",
    note:
      "Demo only: this illustrative question does not update your mastery or create a recorded assessment attempt.",
    questionLanguage: "Question language",
    english: "English",
    arabic: "Arabic",
    both: "English and Arabic",
    currentLevel: "Current simulated mastery",
    status: "Current status",
    recommendation: "Recommendation",
    course: "Selected course",
  },
  ar: {
    eyebrow: "بوابة الطالب · ST4",
    title: "التقييم المبدئي للكورس",
    description:
      "جاوب على السؤال التجريبي ده علشان تتعرف على طريقة عمل تجربة التقييم.",
    demo: "نسخة تجريبية توضيحية",
    question: "السؤال",
    of: "من",
    choose: "اختار أفضل إجابة.",
    dontKnow: "مش عارف",
    next: "التالي",
    pause: "إيقاف مؤقت",
    resume: "استكمال التقييم",
    paused: "التقييم متوقف مؤقتًا",
    pausedDescription:
      "إجابتك الحالية ما زالت محفوظة على الشاشة. تقدر تستكمل وقت ما تكون جاهز.",
    progress: "تقدم التقييم",
    result: "نتيجة التقييم المبدئي",
    correct: "إجابة صحيحة!",
    incorrect: "الإجابة مش صحيحة المرة دي.",
    unknown: "عادي لو لسه مش عارف الإجابة.",
    correctDescription: "اخترت الإجابة الصحيحة في السؤال التجريبي ده.",
    incorrectDescription: "الإجابة دي بتوضح إن مراجعة المفهوم ممكن تساعدك.",
    unknownDescription:
      "السؤال اتساب من غير إجابة، وبيتحسب كإجابة غير صحيحة في النسخة التجريبية.",
    correctAnswer: "الإجابة الصحيحة",
    explanation: "التفسير",
    nextStep: "الخطوة المقترحة",
    continue: "الانتقال إلى خريطة المهارات",
    retry: "حاول مرة تانية",
    review: "راجع المفهوم والمتطلبات السابقة ليه.",
    ready: "استكشف خطوات التعلم المتاحة في خريطة المهارات.",
    loading: "جاري تجهيز التقييم...",
    unavailable: "لا يوجد سؤال تجريبي متاح لهذا الكورس حاليًا.",
    back: "العودة لمساحة التعلم",
    note:
      "نسخة تجريبية فقط: السؤال التوضيحي لا يغيّر مستوى الإتقان ولا ينشئ محاولة تقييم مسجلة.",
    questionLanguage: "لغة السؤال",
    english: "الإنجليزية",
    arabic: "العربية",
    both: "الإنجليزية والعربية",
    currentLevel: "مستوى الإتقان التجريبي الحالي",
    status: "الحالة الحالية",
    recommendation: "التوصية",
    course: "الكورس المحدد",
  },
} as const;

export function StudentDiagnostic() {
  const router = useRouter();
  const hydrated = useHydrated();

  const courseId = useDemo((state) => state.courseId);
  const studentId = useDemo((state) => state.studentId);
  const students = useDemo((state) => state.students);

  const preferencesRaw = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getPreferencesServerSnapshot,
  );

  const preferences = useMemo(
    () => parsePreferences(preferencesRaw),
    [preferencesRaw],
  );

  const isArabic = preferences.interfaceLanguage === "ar";
  const text = interfaceText[preferences.interfaceLanguage];

  const course = findCourse(courseId);
  const question = questions.find((item) => item.courseId === courseId);
  const student = students.find((item) => item.id === studentId);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const questionCopy = question ? getQuestionCopy(question.id) : null;
  const concept = question
    ? concepts.find((item) => item.id === question.conceptId)
    : undefined;

  if (!hydrated) {
    return (
      <>
        <PageHeader
          eyebrow={text.eyebrow}
          title={text.title}
          description={text.description}
        />
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Clock3 className="size-5 animate-pulse" aria-hidden="true" />
            {text.loading}
          </CardContent>
        </Card>
      </>
    );
  }

  if (!course || !question || !concept || !student || !questionCopy) {
    return (
      <div lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"} className="space-y-6">
        <PageHeader
          eyebrow={text.eyebrow}
          title={text.title}
          description={text.description}
        />
        <Card>
          <CardContent className="space-y-4 py-8">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-5 text-warning-ink" aria-hidden="true" />
              {text.unavailable}
            </div>
            <div className="flex flex-wrap gap-3">
              {course && student && (
                <Button onClick={() => router.push("/student/st5")}>
                  {text.continue}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/student")}>
                <ArrowLeft className="rtl:-scale-x-100" aria-hidden="true" />
                {text.back}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correct = selectedAnswer === question.answer;
  const answered = selectedAnswer !== null && selectedAnswer !== "__DONT_KNOW__";
  const isDontKnow = selectedAnswer === "__DONT_KNOW__";

  const currentMastery = student.mastery[concept.id] ?? 0;
  const band = masteryBand(currentMastery);
  const nextRecommendation = recommendation(student, concept.id);

  const questionPrompt =
    preferences.questionLanguage === "ar"
      ? questionCopy.prompt
      : question.prompt;

  const showEnglish =
    preferences.questionLanguage === "en" ||
    preferences.questionLanguage === "both";

  const showArabic =
    preferences.questionLanguage === "ar" ||
    preferences.questionLanguage === "both";

  const optionLabels = question.options.map((option, index) => ({
    value: option,
    english: option,
    arabic: questionCopy.options[index] ?? option,
  }));

  function handleNext() {
    if (selectedAnswer !== null) {
      setIsComplete(true);
    }
  }

  function handleRetry() {
    setSelectedAnswer(null);
    setIsComplete(false);
    setIsPaused(false);
  }

  const resultTitle = correct
    ? text.correct
    : isDontKnow
      ? text.unknown
      : text.incorrect;

  const resultDescription = correct
    ? text.correctDescription
    : isDontKnow
      ? text.unknownDescription
      : text.incorrectDescription;

  return (
    <div lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"} className="space-y-6">
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.title}
        description={text.description}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-brand-2">
            {text.demo}
          </span>
          <span className="text-sm text-muted-foreground">
            {course.title}
          </span>
        </div>

        {!isComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused((current) => !current)}
          >
            {isPaused ? (
              <Play aria-hidden="true" />
            ) : (
              <Pause aria-hidden="true" />
            )}
            {isPaused ? text.resume : text.pause}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{text.progress}</span>
            <span className="text-muted-foreground tabular-nums">
              {isComplete ? "100%" : isPaused ? "0%" : "0%"}
            </span>
          </div>
          <Progress value={isComplete ? 100 : 0} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {text.question} 1 {text.of} 1
            </span>
            <span>{course.shortTitle}</span>
          </div>
        </CardContent>
      </Card>

      {isPaused ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-brand-2">
              <Pause className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{text.paused}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {text.pausedDescription}
              </p>
            </div>
            <Button onClick={() => setIsPaused(false)}>
              <Play aria-hidden="true" />
              {text.resume}
            </Button>
          </CardContent>
        </Card>
      ) : isComplete ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span
                className={`grid size-11 place-items-center rounded-full ${
                  correct
                    ? "bg-success-soft text-success-ink"
                    : "bg-warning-soft text-warning-ink"
                }`}
              >
                {correct ? (
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                ) : (
                  <CircleHelp className="size-5" aria-hidden="true" />
                )}
              </span>
              <div>
                <CardTitle>{text.result}</CardTitle>
                <CardDescription>{resultTitle}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm leading-6 text-muted-foreground">
              {resultDescription}
            </p>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">{text.correctAnswer}</p>
              <p className="mt-2 text-sm">
                {question.answer}
                {showArabic && (
                  <span className="mt-1 block" lang="ar" dir="rtl">
                    {questionCopy.options[question.options.indexOf(question.answer)]}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{text.explanation}</h3>
              {showEnglish && (
                <p className="text-sm leading-6 text-muted-foreground">
                  {question.explanation}
                </p>
              )}
              {showArabic && (
                <p lang="ar" dir="rtl" className="text-sm leading-6 text-muted-foreground">
                  {questionCopy.explanation}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-ai" aria-hidden="true" />
                {text.nextStep}
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {nextRecommendation.kind === "review"
                  ? `${text.review} ${nextRecommendation.message}`
                  : text.ready}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {text.currentLevel}:
                </span>
                <strong className="tabular-nums">{currentMastery}%</strong>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                  {band.band}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw aria-hidden="true" />
                {text.retry}
              </Button>

              <Button onClick={() => router.push("/student/st5")}>
                {text.continue}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-progress-ink">
                <BookOpen className="size-4" aria-hidden="true" />
                {concept.title}
              </div>
              <CardTitle>
                {text.question} 1
              </CardTitle>
              <CardDescription>{text.choose}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/40 p-4 sm:p-5">
              {showEnglish && (
                <p
                  lang="en" dir="ltr"
                  className="text-base font-medium leading-7 text-foreground"
                >
                  {question.prompt}
                </p>
              )}
              {showArabic && (
                <p
                  lang="ar" dir="rtl"
                  className={`text-base font-medium leading-7 text-foreground ${
                    showEnglish ? "mt-3 border-t border-border pt-3" : ""
                  }`}
                >
                  {questionCopy.prompt}
                </p>
              )}
            </div>

            <div className="space-y-3" role="radiogroup" aria-label={text.choose}>
              {optionLabels.map((option, index) => {
                const isSelected = selectedAnswer === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedAnswer(option.value)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-brand-2 bg-secondary"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <span className="size-2 rounded-full bg-primary-foreground" />
                      )}
                    </span>

                    <span className="min-w-0 flex-1 space-y-1">
                      {showEnglish && (
                        <span lang="en" dir="ltr" className="block text-sm font-medium">
                          {index + 1}. {option.english}
                        </span>
                      )}
                      {showArabic && (
                        <span
                          lang="ar" dir="rtl"
                          className="block text-sm font-medium"
                        >
                          {option.arabic}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => setSelectedAnswer("__DONT_KNOW__")}
                className={
                  isDontKnow
                    ? "bg-warning-soft text-warning-ink hover:bg-warning-soft"
                    : ""
                }
              >
                <CircleHelp aria-hidden="true" />
                {text.dontKnow}
              </Button>

              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
                className="sm:min-w-32"
              >
                {text.next}
                <ArrowRight className="rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        {text.note}
      </p>
    </div>
  );
}
