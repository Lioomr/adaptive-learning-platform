
"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Languages,
  MessageSquareText,
  Eye,
  CheckCircle2,
  Info,
  Globe2,
  ArrowRight,
} from "lucide-react";

type InterfaceLanguage = "en" | "ar";
type QuestionLanguage = "en" | "ar" | "both";

type StudentPreferencesData = {
  interfaceLanguage: InterfaceLanguage;
  questionLanguage: QuestionLanguage;
};

const STORAGE_KEY = "notch-student-preferences";
const CHANGE_EVENT = "notch-preferences-changed";

const DEFAULT_PREFERENCES: StudentPreferencesData = {
  interfaceLanguage: "en",
  questionLanguage: "en",
};

const DEFAULT_SNAPSHOT = JSON.stringify(DEFAULT_PREFERENCES);

function getPreferencesSnapshot(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return DEFAULT_SNAPSHOT;

    const parsed: unknown = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      return DEFAULT_SNAPSHOT;
    }

    const data = parsed as Record<string, unknown>;

    const preferences: StudentPreferencesData = {
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
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function savePreferences(preferences: StudentPreferencesData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

type PreferencesFormProps = {
  initialPreferences: StudentPreferencesData;
};

function PreferencesForm({
  initialPreferences,
}: PreferencesFormProps) {
  const router = useRouter();

  const [interfaceLanguage, setInterfaceLanguage] =
    useState<InterfaceLanguage>(
      initialPreferences.interfaceLanguage,
    );

  const [questionLanguage, setQuestionLanguage] =
    useState<QuestionLanguage>(
      initialPreferences.questionLanguage,
    );

  const [isSaved, setIsSaved] = useState(false);
  const [storageError, setStorageError] = useState("");

  const isArabic = interfaceLanguage === "ar";

  const content = {
    eyebrow: isArabic
      ? "ST3 · تفضيلات التعلم"
      : "ST3 · Learning Preferences",

    title: isArabic
      ? "خصص تجربة التعلم الخاصة بك"
      : "Personalize your learning experience",

    description: isArabic
      ? "اختر لغة واجهة المنصة واللغة التي تفضل استخدامها في الأسئلة."
      : "Choose your platform language and the language you prefer for learning questions.",

    interfaceTitle: isArabic
      ? "لغة واجهة المنصة"
      : "Interface language",

    interfaceDescription: isArabic
      ? "اختر اللغة التي تريد استخدامها أثناء تصفح Notch."
      : "Choose the language you want to use throughout Notch.",

    english: isArabic ? "الإنجليزية" : "English",
    arabic: isArabic ? "العربية" : "Arabic",

    questionTitle: isArabic ? "لغة الأسئلة" : "Question language",

    questionDescription: isArabic
      ? "اختر اللغة التي تفضل قراءة الأسئلة بها."
      : "Choose the language you prefer for learning questions.",

    both: isArabic ? "اللغتان معًا" : "Both languages",

    englishQuestions: isArabic
      ? "الأسئلة باللغة الإنجليزية"
      : "Questions in English",

    arabicQuestions: isArabic
      ? "الأسئلة باللغة العربية"
      : "Questions in Arabic",

    bothQuestions: isArabic
      ? "عرض الأسئلة باللغتين الإنجليزية والعربية"
      : "Show questions in both English and Arabic",

    previewTitle: isArabic ? "معاينة مباشرة" : "Live preview",

    previewDescription: isArabic
      ? "شاهد كيف ستظهر الأسئلة بناءً على اختياراتك."
      : "See how questions will appear based on your selections.",

    sampleQuestion: isArabic ? "سؤال تجريبي" : "Sample question",

    englishSample: "What is the result of 2 + 3?",
    arabicSample: "ما ناتج ٢ + ٣؟",

    answer: isArabic
      ? "اختر الإجابة الصحيحة:"
      : "Choose the correct answer:",

    save: isArabic ? "حفظ التفضيلات" : "Save preferences",

    saved: isArabic
      ? "تم حفظ تفضيلاتك بنجاح"
      : "Your preferences have been saved",

    savedDescription: isArabic
      ? "سيتم الاحتفاظ باختياراتك في هذا المتصفح."
      : "Your choices are saved in this browser for your demo experience.",

    note: isArabic
      ? "يمكنك تغيير هذه التفضيلات لاحقًا. هذه الإعدادات تجريبية ويتم حفظها محليًا في المتصفح."
      : "You can change these preferences later. These are demo settings saved locally in your browser.",

    saveError: isArabic
      ? "تعذر حفظ التفضيلات في المتصفح. حاول مرة أخرى."
      : "Could not save preferences in this browser. Please try again.",

    bothLabel: isArabic ? "اللغتان معًا" : "Both",
  };

  function handleSave() {
    const preferences: StudentPreferencesData = {
      interfaceLanguage,
      questionLanguage,
    };

    try {
      savePreferences(preferences);
      setIsSaved(true);
      setStorageError("");

      // Navigate to ST4 only after preferences are saved successfully.
      router.push("/student/st4");
    } catch {
      setIsSaved(false);
      setStorageError(content.saveError);
    }
  }

  function handleInterfaceLanguageChange(
    language: InterfaceLanguage,
  ) {
    setInterfaceLanguage(language);
    setIsSaved(false);
    setStorageError("");
  }

  function handleQuestionLanguageChange(
    language: QuestionLanguage,
  ) {
    setQuestionLanguage(language);
    setIsSaved(false);
    setStorageError("");
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
    >
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Languages className="size-5" />
              </div>

              <div>
                <CardTitle>{content.interfaceTitle}</CardTitle>
                <CardDescription>
                  {content.interfaceDescription}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleInterfaceLanguageChange("en")}
              aria-pressed={interfaceLanguage === "en"}
              className={`flex items-center justify-between rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                interfaceLanguage === "en"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <Globe2 className="size-5 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">
                    {content.english}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    English interface · LTR
                  </span>
                </span>
              </span>

              {interfaceLanguage === "en" && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleInterfaceLanguageChange("ar")}
              aria-pressed={interfaceLanguage === "ar"}
              className={`flex items-center justify-between rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                interfaceLanguage === "ar"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <span className="flex items-center gap-3">
                <Globe2 className="size-5 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">
                    {content.arabic}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    العربية · RTL
                  </span>
                </span>
              </span>

              {interfaceLanguage === "ar" && (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              )}
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <MessageSquareText className="size-5" />
              </div>

              <div>
                <CardTitle>{content.questionTitle}</CardTitle>
                <CardDescription>
                  {content.questionDescription}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  value: "en",
                  label: content.english,
                  description: content.englishQuestions,
                },
                {
                  value: "ar",
                  label: content.arabic,
                  description: content.arabicQuestions,
                },
                {
                  value: "both",
                  label: content.both,
                  description: content.bothQuestions,
                },
              ] as const
            ).map((option) => {
              const selected = questionLanguage === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    handleQuestionLanguageChange(option.value)
                  }
                  aria-pressed={selected}
                  className={`rounded-xl border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {option.label}
                    </span>

                    {selected && (
                      <CheckCircle2 className="size-5 shrink-0 text-primary" />
                    )}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                <Eye className="size-5" />
              </div>

              <div>
                <CardTitle>{content.previewTitle}</CardTitle>
                <CardDescription>
                  {content.previewDescription}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div
              dir={isArabic ? "rtl" : "ltr"}
              className="rounded-xl border border-border bg-muted/30 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {content.sampleQuestion}
                </span>

                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {questionLanguage === "both"
                    ? content.bothLabel
                    : questionLanguage === "ar"
                      ? content.arabic
                      : content.english}
                </span>
              </div>

              {(questionLanguage === "en" ||
                questionLanguage === "both") && (
                <div
                  dir="ltr"
                  className="rounded-lg bg-card p-4 text-left"
                >
                  <p className="font-semibold text-foreground">
                    {content.englishSample}
                  </p>

                  {questionLanguage === "both" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      English
                    </p>
                  )}
                </div>
              )}

              {(questionLanguage === "ar" ||
                questionLanguage === "both") && (
                <div
                  dir="rtl"
                  className="mt-3 rounded-lg bg-card p-4 text-right"
                >
                  <p className="font-semibold text-foreground">
                    {content.arabicSample}
                  </p>

                  {questionLanguage === "both" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      العربية
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-sm text-muted-foreground">
                {content.answer}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {["4", "5", "6"].map((option) => (
                  <div
                    key={option}
                    className="rounded-lg border border-border bg-card p-3 text-center text-sm font-medium text-foreground"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-6 text-muted-foreground">
            {content.note}
          </p>
        </div>

        {storageError && (
          <p role="alert" className="text-sm text-destructive">
            {storageError}
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
        >
          {content.save}
          <ArrowRight className="size-4" />
        </Button>

        {isSaved && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4"
          >
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />

            <div>
              <p className="font-semibold text-foreground">
                {content.saved}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {content.savedDescription}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {content.interfaceTitle}:{" "}
                {interfaceLanguage === "ar" ? "العربية" : "English"}
                {" · "}
                {content.questionTitle}:{" "}
                {questionLanguage === "ar"
                  ? "العربية"
                  : questionLanguage === "both"
                    ? content.both
                    : "English"}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export function StudentPreferences() {
  const snapshot = useSyncExternalStore(
    subscribeToPreferences,
    getPreferencesSnapshot,
    getServerSnapshot,
  );

  const preferences = JSON.parse(
    snapshot,
  ) as StudentPreferencesData;

  return (
    <PreferencesForm
      key={snapshot}
      initialPreferences={preferences}
    />
  );
}
