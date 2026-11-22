"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Map,
  MessageCircle,
  Settings,
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
import { MasteryBar } from "@/components/learning/mastery";

import {
  conceptsForCourse,
  courses,
  findCourse,
} from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import type { Concept, CourseId } from "@/types";

type InterfaceLanguage = "en" | "ar";
type QuestionLanguage = "en" | "ar" | "both";

type StudentPreferences = {
  interfaceLanguage: InterfaceLanguage;
  questionLanguage: QuestionLanguage;
};

type Recommendation = {
  concept: Concept;
  courseId: CourseId;
  courseTitle: string;
  mastery: number;
  reason: "prerequisites-ready" | "lowest-ready" | "fallback";
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
    return JSON.stringify({
      interfaceLanguage: data.interfaceLanguage === "ar" ? "ar" : "en",
      questionLanguage:
        data.questionLanguage === "ar" || data.questionLanguage === "both"
          ? data.questionLanguage
          : "en",
    } satisfies StudentPreferences);
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

function getAllCourseConcepts() {
  return courses.flatMap((course) =>
    conceptsForCourse(course.id).map((concept) => ({
      concept,
      courseId: course.id,
      courseTitle: course.title,
    })),
  );
}

/**
 * The demo has no week/syllabus schedule yet. This deterministic router
 * therefore prioritizes concepts whose prerequisites are ready, then picks
 * the weakest mastery among them. It never changes mastery or creates an attempt.
 */
function getNextRecommendation(
  student: { mastery: Record<string, number> },
): Recommendation | null {
  const candidates = getAllCourseConcepts();

  const ready = candidates.filter(({ concept }) =>
    concept.prerequisites.every(
      (prerequisiteId) =>
        (student.mastery[prerequisiteId] ?? 0) >= PREREQUISITE_READY,
    ),
  );

  const needsWork = ready
    .map((item) => ({
      ...item,
      mastery: student.mastery[item.concept.id] ?? 0,
    }))
    .filter((item) => item.mastery < 85)
    .sort((a, b) => a.mastery - b.mastery);

  if (needsWork.length > 0) {
    return { ...needsWork[0], reason: "lowest-ready" };
  }

  const firstNotMastered = candidates
    .map((item) => ({
      ...item,
      mastery: student.mastery[item.concept.id] ?? 0,
    }))
    .filter((item) => item.mastery < 85)
    .sort((a, b) => a.mastery - b.mastery)[0];

  if (firstNotMastered) {
    return { ...firstNotMastered, reason: "fallback" };
  }

  const first = candidates[0];
  if (!first) return null;

  return {
    ...first,
    mastery: student.mastery[first.concept.id] ?? 0,
    reason: "fallback",
  };
}

function getConceptReason(
  recommendation: Recommendation,
  isArabic: boolean,
): string {
  if (recommendation.reason === "lowest-ready") {
    return isArabic
      ? "المتطلبات السابقة لهذا المفهوم جاهزة، وهو الأقل إتقانًا بين المفاهيم المتاحة حاليًا."
      : "Its prerequisites are ready, and it is the least-mastered concept among the concepts currently available.";
  }

  if (recommendation.reason === "fallback") {
    return isArabic
      ? "هذا اقتراح مبدئي بناءً على بيانات الإتقان المتاحة. راجعي خريطة المهارات للتأكد من المتطلبات السابقة."
      : "This is a fallback suggestion based on the available mastery data. Check the skill map for prerequisite details.";
  }

  return isArabic
    ? "المتطلبات السابقة لهذا المفهوم جاهزة."
    : "The prerequisites for this concept are ready.";
}

export function StudentHome() {
  const router = useRouter();
  const hydrated = useHydrated();

  const students = useDemo((state) => state.students);
  const studentId = useDemo((state) => state.studentId);
  const courseId = useDemo((state) => state.courseId);
  const setCourse = useDemo((state) => state.setCourse);

  const preferenceSnapshot = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerSnapshot,
  );

  const preferences = JSON.parse(
    preferenceSnapshot,
  ) as StudentPreferences;

  const isArabic = preferences.interfaceLanguage === "ar";
  const student = students.find((item) => item.id === studentId);
  const selectedCourse = findCourse(courseId);

  const recommendation = useMemo(
    () => (student ? getNextRecommendation(student) : null),
    [student],
  );

  const selectedCourseConcepts = student
    ? conceptsForCourse(courseId).map((concept) => ({
        concept,
        mastery: student.mastery[concept.id] ?? 0,
      }))
    : [];

  const averageMastery =
    selectedCourseConcepts.length > 0
      ? Math.round(
          selectedCourseConcepts.reduce(
            (total, item) => total + item.mastery,
            0,
          ) / selectedCourseConcepts.length,
        )
      : 0;

  const completedCount = selectedCourseConcepts.filter(
    (item) => item.mastery >= 85,
  ).length;

  const thisWeekConcepts = [...selectedCourseConcepts]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const text = {
    eyebrow: isArabic ? "ST6 · الصفحة الرئيسية" : "ST6 · Student Home",
    description: isArabic
      ? "تابعي تقدمك واكتشفي الخطوة التالية في رحلتك التعليمية."
      : "Track your progress and find the next step in your learning journey.",
    greeting: isArabic ? `أهلًا ${student?.name ?? ""}` : `Welcome back, ${student?.name ?? ""}`,
    course: isArabic ? "الكورس" : "Course",
    chooseCourse: isArabic ? "اختاري كورسًا" : "Choose a course",
    nextUp: isArabic ? "الخطوة التالية" : "Next up",
    continue: isArabic ? "متابعة التعلم" : "Continue learning",
    thisWeek: isArabic ? "مفاهيم تحتاج إلى اهتمام" : "Concepts to focus on",
    thisWeekDescription: isArabic
      ? "أقل ثلاثة مفاهيم إتقانًا في الكورس المحدد حاليًا."
      : "The three least-mastered concepts in the currently selected course.",
    mastery: isArabic ? "متوسط الإتقان" : "Average mastery",
    completed: isArabic ? "مفاهيم متقنة" : "Mastered concepts",
    of: isArabic ? "من" : "of",
    map: isArabic ? "خريطة المهارات" : "Skill map",
    mapDescription: isArabic
      ? "استكشفي المفاهيم والعلاقات بينها."
      : "Explore concepts and their prerequisites.",
    review: isArabic ? "المراجعات" : "Reviews",
    reviewTitle: isArabic ? "أنتِ على اطلاع!" : "You're all caught up!",
    reviewDescription: isArabic
      ? "جدولة المراجعات المتباعدة غير مفعّلة في هذه النسخة التجريبية."
      : "Spaced-review scheduling is not configured in this demo yet.",
    readiness: isArabic ? "الاستعداد للامتحان" : "Exam readiness",
    tutor: isArabic ? "المعلم الذكي" : "AI Tutor",
    settings: isArabic ? "الإعدادات" : "Settings",
    courseHome: isArabic ? "افتحي الكورس" : "Open course",
    noStudent: isArabic ? "تعذر تحميل بيانات الطالب." : "Unable to load student data.",
    noRecommendation: isArabic
      ? "لا توجد مفاهيم متاحة حاليًا."
      : "There are no concepts available right now.",
    simulated: isArabic
      ? "هذه لوحة تجريبية تعتمد على بيانات محلية افتراضية. لا يوجد جدول أسبوعي أو موعد امتحان أو نظام مراجعات متصل حاليًا."
      : "This is a simulated dashboard using local demo data. A weekly syllabus, exam date, and review scheduler are not connected yet.",
    readinessUnavailable: isArabic
      ? "ستظهر هذه البطاقة عند إضافة موعد امتحان."
      : "Readiness will appear once an exam date is configured.",
  };

  if (!hydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-56 rounded-lg bg-muted" />
          <div className="h-28 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!student || !selectedCourse) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {text.noStudent}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-6xl space-y-6"
    >
      <PageHeader
        eyebrow={text.eyebrow}
        title={text.greeting}
        description={text.description}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <Card as="section" aria-labelledby="next-activity" className="relative isolate overflow-hidden rounded-[24px] border-(--notch-brand-slate) bg-(--notch-brand-ink) p-5 text-(--notch-brand-white) sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-[30%] bg-[url('/brand/adaptive-path.svg')] bg-size-[126%_auto] bg-left bg-no-repeat sm:w-[36%] rtl:bg-right" aria-hidden="true" />
          <div className="w-[71%] space-y-3 sm:w-[62%]">
            <p className="flex items-center gap-2 text-sm font-medium text-(--notch-brand-soft-lavender)">
              <BookOpen className="size-4 shrink-0" aria-hidden="true" /> {text.nextUp}
            </p>
            <h2 id="next-activity" className="text-2xl font-semibold tracking-tight sm:text-[32px] sm:leading-tight">
              {recommendation?.concept.title ?? text.noRecommendation}
            </h2>
            {recommendation && (
              <>
                <p className="text-sm text-(--notch-brand-fog)">
                  {recommendation.courseTitle} · {recommendation.mastery}% {isArabic ? "إتقان" : "mastery"}
                </p>
                <p className="max-w-prose text-sm leading-6 text-(--notch-brand-fog)">
                  {getConceptReason(recommendation, isArabic)}
                </p>
                <Button
                  className="mt-1 max-w-full whitespace-normal bg-(--notch-brand-soft-lavender) text-(--notch-brand-ink) hover:bg-(--notch-brand-violet-light) active:bg-(--notch-brand-soft-lavender)"
                  onClick={() => {
                    setCourse(recommendation.courseId, "student");
                    router.push("/student/st7");
                  }}
                >
                  {text.continue}
                  <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card className="flex flex-col justify-center gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Target className="size-5" aria-hidden="true" /> {text.mastery}
          </div>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">{averageMastery}%</p>
          <MasteryBar value={averageMastery} label={text.mastery} />
          <p className="text-sm text-muted-foreground">{selectedCourse.title}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{text.chooseCourse}</CardTitle>
          <CardDescription>{text.course}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {courses.map((course) => {
            const active = course.id === courseId;
            return (
              <button
                key={course.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCourse(course.id, "student")}
                className={`rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "border-primary bg-primary/[0.04] ring-1 ring-primary/20"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">
                    {course.title}
                  </span>
                  {active && <CheckCircle2 className="size-5 text-primary" />}
                </div>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {course.id}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{text.thisWeek}</CardTitle>
            <CardDescription>{text.thisWeekDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {thisWeekConcepts.map(({ concept, mastery }) => (
              <div key={concept.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{concept.title}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {mastery}%
                  </span>
                </div>
                <MasteryBar value={mastery} label={`${concept.title} mastery`} />
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/student/st5")}
            >
              <Map className="size-4" />
              {text.map}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-success-soft text-success-ink">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{text.completed}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {completedCount}
                  <span className="mx-1 text-sm font-normal text-muted-foreground">
                    {text.of} {selectedCourseConcepts.length}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{text.review}</p>
                <p className="mt-1 text-sm font-medium">{text.reviewTitle}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {text.reviewDescription}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={() => router.push("/student/st5")}>
          <Map className="size-5 shrink-0" />
          <span className="text-start">{text.map}</span>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={() => router.push("/student/st16")}>
          <BookOpen className="size-5 shrink-0" />
          <span className="text-start">{text.review}</span>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={() => router.push("/student/st17")}>
          <MessageCircle className="size-5 shrink-0" />
          <span className="text-start">{text.tutor}</span>
        </Button>
        <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={() => router.push("/student/st18")}>
          <Settings className="size-5 shrink-0" />
          <span className="text-start">{text.settings}</span>
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <GraduationCap className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{text.readiness}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {text.readinessUnavailable}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {text.simulated}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
