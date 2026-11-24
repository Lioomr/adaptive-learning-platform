"use client";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { diagnosticQuestions } from "./data";
import { LanguageControl } from "./language-control";
import { useStudent } from "./context";
import { useStudentPortal } from "./store";

export function Diagnostic() {
  const { ready, profile, student } = useStudent();
  if (!ready || profile.preferences) return null;
  return <DiagnosticSteps key={student.id} />;
}
function DiagnosticSteps() {
  const { t, student, language } = useStudent();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const question = diagnosticQuestions[step];
  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          dir={language === "ar" ? "rtl" : "ltr"}
          className="fixed start-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-raised rtl:translate-x-1/2 sm:p-8"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <div className="absolute end-4 top-4">
            <LanguageControl />
          </div>
          <span className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary">
            <Sparkles aria-hidden="true" />
          </span>
          <Dialog.Title className="text-2xl font-semibold tracking-tight">
            {t("A learning space that fits you", "مساحة تعلّم تناسبك")}
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
            {t(
              "Let’s start with a short learning-preference diagnostic. There are no right or wrong answers. These temporary questions help shape your demo experience.",
              "لنبدأ باستبيان قصير لتفضيلات التعلّم. لا توجد إجابات صحيحة أو خاطئة. هذه الأسئلة المؤقتة تساعد في تخصيص تجربتك التجريبية.",
            )}
          </Dialog.Description>
          <div className="mb-6 mt-6">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("Question", "السؤال")} {step + 1} /{" "}
              {diagnosticQuestions.length}
            </p>
            <Progress
              value={(step / diagnosticQuestions.length) * 100}
              aria-label={t("Diagnostic progress", "تقدم الاستبيان")}
            />
          </div>
          <fieldset>
            <legend className="mb-4 text-lg font-semibold">
              {t(question.prompt)}
            </legend>
            <div className="space-y-3">
              {question.options.map((option, i) => (
                <label
                  key={option[0]}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition-colors hover:border-primary ${answers[step] === i ? "border-primary bg-secondary text-secondary-foreground" : "bg-background"}`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[step] === i}
                    onChange={() =>
                      setAnswers((a) => {
                        const next = [...a];
                        next[step] = i;
                        return next;
                      })
                    }
                    className="size-4 accent-primary"
                  />
                  {t(option)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-7 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              {t("Back", "السابق")}
            </Button>
            <Button
              disabled={answers[step] === undefined}
              onClick={() => {
                if (step < diagnosticQuestions.length - 1)
                  setStep((s) => s + 1);
                else
                  useStudentPortal
                    .getState()
                    .update(student.id, { preferences: answers });
              }}
            >
              {step === diagnosticQuestions.length - 1 ? (
                <>
                  <Check aria-hidden="true" />
                  {t("Create my learning space", "إنشاء مساحة تعلّمي")}
                </>
              ) : (
                t("Continue", "متابعة")
              )}
            </Button>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            {t(
              "Saved for this fictional student in this browser. Preferences are flexible, not a fixed learning-style diagnosis.",
              "تُحفظ لهذا الطالب الخيالي في هذا المتصفح. التفضيلات مرنة وليست تشخيصًا ثابتًا لأسلوب التعلم.",
            )}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
