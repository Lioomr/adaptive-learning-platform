"use client";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courses, type CourseId } from "./data";
import { useStudent } from "./context";
import { useStudentPortal, type Message } from "./store";
import { PageTitle } from "./ui";
import { initialConversation, tutorReply } from "./tutor";

export function StudentChatbot({
  initialCourse = "python",
}: {
  initialCourse?: CourseId;
}) {
  const { t, student, profile } = useStudent();
  const [courseId, setCourseId] = useState(initialCourse);
  const [input, setInput] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const course = courses.find((c) => c.id === courseId)!;
  const lesson = course.lectures[1] ?? course.lectures[0];
  const seeded = initialConversation(course, t);
  const messages = profile.conversations[courseId] ?? seeded;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages.length, courseId]);
  function save(next: Message[]) {
    useStudentPortal.getState().update(student.id, {
      conversations: {
        ...profile.conversations,
        [courseId]: next.slice(-60),
      },
    });
  }
  function send(value: string) {
    const message = value.trim();
    if (!message) return;
    const response = tutorReply(course, message, t);
    save([
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: response },
    ]);
    setInput("");
  }
  const suggestions = [
    t(`Explain ${t(lesson.title).toLowerCase()}`, `اشرح ${t(lesson.title)}`),
    t("Give me a practice exercise", "أعطني تمرينًا تدريبيًا"),
    t("Help me make a study plan", "ساعدني في إعداد خطة دراسة"),
  ];
  return (
    <div className="animate-fade-in">
      <PageTitle
        eyebrow={t(
          "A LITTLE HELP, A NEW PERSPECTIVE",
          "مساعدة صغيرة، منظور جديد",
        )}
        title={t("Think it through, together.", "لنفكّر فيها معًا.")}
        description={t(
          "A calm space to ask questions, untangle concepts, and keep learning.",
          "مساحة هادئة لطرح الأسئلة وفهم المفاهيم ومواصلة التعلّم.",
        )}
      />
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_260px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <Sparkles aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">
                  {t("Notch learning assistant", "مساعد نوتش التعليمي")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Prepared responses · No live AI",
                    "إجابات مُعدّة مسبقًا · دون ذكاء اصطناعي مباشر",
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                save([]);
                setInput("");
              }}
            >
              <Plus />
              {t("New conversation", "محادثة جديدة")}
            </Button>
          </div>
          <div
            role="log"
            aria-live="polite"
            aria-label={t("Conversation", "المحادثة")}
            className="h-[440px] space-y-5 overflow-y-auto overscroll-contain p-4 sm:p-6"
          >
            {messages.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <MessageCircle
                  className="mb-4 size-10 text-primary"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold">
                  {t(
                    "Every good question is a beginning.",
                    "كل سؤال جيد هو بداية.",
                  )}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {t(
                    "Choose a prompt below or ask about your selected course.",
                    "اختر اقتراحًا أدناه أو اسأل عن مقررك المختار.",
                  )}
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[85%] ${m.role === "user" ? "rounded-ee-sm bg-primary text-primary-foreground" : "rounded-es-sm border bg-muted/40"}`}
                >
                  <p
                    className={`mb-2 text-xs font-semibold ${m.role === "user" ? "text-primary-foreground/80" : "text-primary"}`}
                  >
                    {m.role === "user"
                      ? t("You", "أنت")
                      : t("Notch · Simulated", "نوتش · محاكاة")}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-7">
                    {m.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <div className="border-t p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border bg-background px-3 py-2 text-start text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-3 rounded-xl border border-input bg-background p-2"
            >
              <textarea
                aria-label={t(
                  "Message your learning assistant",
                  "راسل مساعدك التعليمي",
                )}
                placeholder={t(
                  "What would you like to understand?",
                  "ما الذي تود فهمه؟",
                )}
                rows={2}
                maxLength={2000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                className="min-w-0 flex-1 resize-none bg-transparent p-2 text-sm outline-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                aria-label={t("Send message", "إرسال الرسالة")}
              >
                <Send className="rtl:-scale-x-100" />
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                "Enter to send · Shift + Enter for a new line · Saved in this browser",
                "Enter للإرسال · Shift + Enter لسطر جديد · تُحفظ في هذا المتصفح",
              )}
            </p>
          </div>
        </Card>
        <aside className="space-y-4">
          <Card className="p-5">
            <BookOpen className="mb-3 size-5 text-primary" />
            <h2 className="font-semibold">
              {t("Learning context", "سياق التعلّم")}
            </h2>
            <label
              htmlFor="chat-course"
              className="mb-2 mt-4 block text-sm text-muted-foreground"
            >
              {t("Choose a course", "اختر مقررًا")}
            </label>
            <div className="relative">
              <select
                id="chat-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value as CourseId)}
                className="min-h-11 w-full appearance-none rounded-lg border border-input bg-background py-2 pe-8 ps-3 text-sm"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.title)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-2 top-3 size-4" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {t(
                "Each course keeps its own conversation, so you can pick up where you left off.",
                "لكل مقرر محادثته الخاصة لتواصل من حيث توقفت.",
              )}
            </p>
          </Card>
          <div className="rounded-xl border border-primary/20 bg-secondary/40 p-5">
            <Badge tone="ai">{t("Demo assistant", "مساعد تجريبي")}</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t(
                "Responses use prepared course examples. Ask for an explanation, practice, or a study plan to explore the experience.",
                "تستخدم الردود أمثلة مُعدّة من المقرر. اطلب شرحًا أو تدريبًا أو خطة دراسة لاستكشاف التجربة.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
