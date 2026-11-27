"use client";
import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstructor } from "./context";
import { courseStats } from "./stats";
import { InstructorSwitcher, PageTitle } from "./ui";
import { NativeSelect, TextInput } from "./forms";

type Message = { role: "user" | "assistant"; text: string };

/** Scripted teaching assistant. Answers come from the same mock course data; no model call. */
export function InstructorChatbot() {
  const { t, assigned, content, students, num, pick } = useInstructor();
  const [courseId, setCourseId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const course = assigned.find((c) => c.id === courseId) ?? assigned[0];
  const prompts = [
    t("Who is at risk?", "من المعرّضون للتعثر؟"),
    t("What needs grading?", "ما الذي ينتظر التقييم؟"),
    t("How is the class doing?", "كيف حال الصف؟"),
  ];
  function answer(question: string) {
    if (!course) return;
    const stats = courseStats(course, students, content);
    const q = question.toLowerCase();
    let text: string;
    if (/risk|struggl|تعثر|متعثر|خطر/.test(q)) {
      const names = stats.rows.filter((r) => r.health === "at-risk").map((r) => r.student.name);
      text = names.length
        ? t(`${num(names.length)} students are at risk in ${t(course.title)}: ${names.join(", ")}. Consider a short check-in message.`, `${num(names.length)} طلاب معرّضون للتعثر في ${t(course.title)}: ${names.join("، ")}. فكّر في رسالة متابعة قصيرة.`)
        : t(`No students are at risk in ${t(course.title)} right now.`, `لا يوجد طلاب معرّضون للتعثر في ${t(course.title)} حاليًا.`);
    } else if (/grad|submi|قيّم|تقييم|تسليم/.test(q)) {
      const waiting = content.submissions.filter((s) => s.courseId === course.id && s.status === "submitted");
      const titles = [...new Set(waiting.map((s) => content.assignments.find((a) => a.id === s.assignmentId)).filter(Boolean).map((a) => pick(a!.title)))];
      text = waiting.length
        ? t(`${num(waiting.length)} submissions are waiting in ${t(course.title)} (${titles.join(", ")}). Open Submissions → Student submissions to review them.`, `${num(waiting.length)} تسليمًا بانتظار التقييم في ${t(course.title)} (${titles.join("، ")}). افتح التسليمات ثم تسليمات الطلاب للمراجعة.`)
        : t("Everything is graded. Nice work.", "تم تقييم كل شيء. عمل رائع.");
    } else {
      text = t(
        `${t(course.title)}: average mastery ${num(stats.avgMastery)}%, average completion ${num(stats.avgCompletion)}%. ${num(stats.counts["on-track"])} on track, ${num(stats.counts.attention)} need attention, ${num(stats.counts["at-risk"])} at risk.`,
        `${t(course.title)}: متوسط الإتقان ${num(stats.avgMastery)}٪ ومتوسط الإكمال ${num(stats.avgCompletion)}٪. ${num(stats.counts["on-track"])} على المسار، ${num(stats.counts.attention)} يحتاجون متابعة، ${num(stats.counts["at-risk"])} معرّضون للتعثر.`,
      );
    }
    setMessages((m) => [...m, { role: "user", text: question }, { role: "assistant", text }]);
  }
  return (
    <div className="animate-fade-in">
      <PageTitle
        eyebrow={t("TEACHING ASSISTANT", "مساعد التدريس")}
        title={t("Ask about your classes.", "اسأل عن صفوفك.")}
        description={t(
          "A scripted demo assistant that answers from your courses' mock data. Nothing leaves this browser.",
          "مساعد تجريبي يجيب من بيانات مقرراتك الوهمية. لا يغادر شيء هذا المتصفح.",
        )}
        action={<InstructorSwitcher />}
      />
      {!course ? (
        <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          {t("No courses are assigned to you yet.", "لا توجد مقررات مسندة إليك بعد.")}
        </p>
      ) : (
        <Card className="mx-auto flex max-w-3xl flex-col p-5 sm:p-6">
          <label className="mb-4 flex items-center gap-3 text-sm font-medium">
            {t("Course", "المقرر")}
            <NativeSelect className="w-auto min-w-56" value={course.id} onChange={(e) => { setCourseId(e.target.value); setMessages([]); }}>
              {assigned.map((c) => <option key={c.id} value={c.id}>{t(c.title)}</option>)}
            </NativeSelect>
          </label>
          <div role="log" aria-live="polite" aria-label={t("Conversation", "المحادثة")} className="min-h-56 space-y-3 rounded-xl bg-muted/40 p-4">
            {!messages.length && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="size-4 text-primary" aria-hidden="true" />
                {t("Try one of the questions below.", "جرّب أحد الأسئلة أدناه.")}
              </p>
            )}
            {messages.map((m, i) => (
              <p key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${m.role === "user" ? "ms-auto bg-primary text-primary-foreground" : "bg-card"}`}>
                {m.text}
              </p>
            ))}
          </div>
          <div className="my-4 flex flex-wrap gap-2">
            {prompts.map((p) => <Button key={p} variant="outline" size="sm" onClick={() => answer(p)}>{p}</Button>)}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { answer(draft.trim()); setDraft(""); } }}>
            <TextInput aria-label={t("Ask a question", "اطرح سؤالًا")} placeholder={t("Ask about risk, grading or progress…", "اسأل عن التعثر أو التقييم أو التقدم…")} value={draft} maxLength={300} onChange={(e) => setDraft(e.target.value)} />
            <Button type="submit" disabled={!draft.trim()}>
              <Send className="rtl:-scale-x-100" aria-hidden="true" />
              {t("Send", "إرسال")}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
