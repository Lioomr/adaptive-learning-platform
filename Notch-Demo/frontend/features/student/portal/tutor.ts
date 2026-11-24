import type { Copy, Course } from "./data";
import type { Message } from "./store";
type Translate = (en: string | Copy, ar?: string) => string;
/** Deterministic mock service, replaceable by a future tutor API. */
export function initialConversation(course: Course, t: Translate): Message[] {
  return [
    {
      role: "user",
      content: t(
        "What should I focus on next?",
        "على ماذا أركز في الخطوة القادمة؟",
      ),
    },
    {
      role: "assistant",
      content: `${t(course.recommendation)}\n\n${t(course.recommendationReason)}\n\n${t("We can walk through an explanation, try a worked example, or make a short study plan.", "يمكننا استكشاف شرح أو تجربة مثال محلول أو إعداد خطة دراسة قصيرة.")}`,
    },
  ];
}
export function tutorReply(
  course: Course,
  message: string,
  t: Translate,
): string {
  const lesson = course.lectures[1] ?? course.lectures[0];
  const plan = /plan|schedule|خطة|جدول/i.test(message);
  const practice = /practice|quiz|exercise|تدريب|تمرين|اختبر/i.test(message);
  // Deterministic, course-grounded fixtures. No network or model inference.
  const relevant =
    course.lectures.find((l) =>
      l.title.some((title) =>
        title
          .toLowerCase()
          .split(/\s+/)
          .some(
            (word) => word.length > 4 && message.toLowerCase().includes(word),
          ),
      ),
    ) ?? lesson;
  return plan
    ? t(
        `Try this 25-minute plan for ${t(course.title)}:\n\n1. Spend 5 minutes recalling the previous lesson without notes.\n2. Spend 10 minutes reviewing “${t(relevant.title)}”.\n3. Spend 10 minutes on the exercise below.\n\n${t(relevant.exercise)}\n\nFinish by writing down one question you still have.`,
        `جرّب خطة من ٢٥ دقيقة لمقرر ${t(course.title)}:\n\n١. استرجع الدرس السابق دون ملاحظات لمدة ٥ دقائق.\n٢. راجع «${t(relevant.title)}» لمدة ١٠ دقائق.\n٣. خصص ١٠ دقائق للتمرين التالي.\n\n${t(relevant.exercise)}\n\nاختم بكتابة سؤال ما زلت تبحث عن إجابته.`,
      )
    : practice
      ? `${t("Let’s practice. Work through this in your notes:", "لنتدرّب. حل هذا التمرين في ملاحظاتك:")}\n\n${t(relevant.exercise)}\n\n${t("Hint: start with the core idea below, then trace one small example.", "تلميح: ابدأ بالفكرة الأساسية التالية ثم تتبّع مثالًا صغيرًا.")}\n\n${t(relevant.content)}`
      : `${t("Here is a prepared explanation from your selected course:", "إليك شرحًا مُعدًا مسبقًا من المقرر المختار:")}\n\n${t(relevant.content)}\n\n${t("Try this next:", "جرّب بعد ذلك:")} ${t(relevant.exercise)}\n\n${t("This demo uses sample replies and cannot evaluate your answers yet.", "يستخدم هذا العرض إجابات نموذجية ولا يمكنه تقييم إجاباتك حاليًا.")}`;
}
