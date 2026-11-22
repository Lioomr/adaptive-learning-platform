"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Lightbulb, MessageCircle, RotateCcw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { concepts, findCourse } from "@/data/fixtures";
import { masteryBand, PREREQUISITE_READY } from "@/services/mastery";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

type Message = { id: number; role: "user" | "tutor"; text: string; source?: string };

export function StudentTutor() {
  const hydrated = useHydrated();
  const courseId = useDemo(s => s.courseId);
  const studentId = useDemo(s => s.studentId);
  const students = useDemo(s => s.students);
  const attempts = useDemo(s => s.attempts);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const course = findCourse(courseId);
  const student = students.find(s => s.id === studentId);
  const courseConcepts = useMemo(() => concepts.filter(c => c.courseId === courseId), [courseId]);
  const selectedConcept = courseConcepts.find(c => c.id === selectedConceptId) ?? courseConcepts[0];
  const mastery = selectedConcept && student ? student.mastery[selectedConcept.id] ?? 0 : 0;
  const missing = selectedConcept && student
    ? selectedConcept.prerequisites.filter(id => (student.mastery[id] ?? 0) < PREREQUISITE_READY)
    : [];
  const latestAttempt = selectedConcept
    ? attempts.filter(a => a.studentId === studentId && a.courseId === courseId && a.conceptId === selectedConcept.id)
      .slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    : undefined;

  if (!hydrated) return <main className="mx-auto max-w-5xl p-6"><div className="h-64 animate-pulse rounded-xl bg-muted" /></main>;
  if (!course || !student || !selectedConcept) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="space-y-4 p-6"><p>{tr("The tutor is unavailable for the current demo context.", "المساعد التعليمي مش متاح في سياق العرض الحالي.")}</p><Button asChild><Link href="/student/st6">{tr("Back to home", "العودة للرئيسية")}</Link></Button></CardContent></Card></main>;

  const makeReply = (prompt: string) => {
    const normalized = prompt.toLowerCase();
    const title = selectedConcept.title;
    const prerequisiteNames = missing.map(id => concepts.find(c => c.id === id)?.title ?? id);
    if (/example|مثال/.test(normalized)) {
      return tr(
        `Try a small ${title} example: write down the input, apply the concept one step at a time, and check whether the result matches what you expected. This is a study prompt, not a worked example from a verified course source.`,
        `جربي مثال صغير على ${title}: اكتبي المدخلات، وطبقي الفكرة خطوة بخطوة، وبعدها راجعي هل النتيجة منطقية. ده توجيه للمذاكرة، مش مثال محلول من مصدر مقرر موثّق.`
      );
    }
    if (/simple|explain|ببساط|اشرح/.test(normalized)) {
      return tr(
        `${title} is one of the concepts in your ${course.shortTitle} course. Start by stating what problem it helps solve, identify its key rule, then test that rule with a small example.`,
        `${title} واحد من مفاهيم كورس ${course.shortTitle}. ابدئي بتحديد المشكلة اللي بيساعد في حلها، وبعدها حددي القاعدة الأساسية وجربيها على مثال صغير.`
      );
    }
    if (/review|prerequisite|مراجع|متطلب/.test(normalized)) {
      return prerequisiteNames.length
        ? tr(`Your current prerequisite review list is: ${prerequisiteNames.join(", ")}. These are below the demo readiness threshold of 70%. Review them before returning to ${title}.`, `المتطلبات السابقة اللي محتاجة مراجعة حاليًا: ${prerequisiteNames.join("، ")}. مستواها أقل من حد 70% الإرشادي في الديمو. راجعيها قبل الرجوع إلى ${title}.`)
        : tr(`No prerequisite for ${title} is currently below the demo threshold of 70%. You can continue practising this concept.`, `مفيش متطلب سابق لـ ${title} أقل حاليًا من حد 70% الإرشادي في الديمو. تقدري تكملي تدريب على المفهوم.`);
    }
    return tr(
      `Let's work on ${title}. In your own words, describe the main idea first. Then identify one rule or step that matters, and apply it to a small example. If you share the exact part that feels confusing, I can help you break it into smaller steps. (Scripted demo guidance.)`,
      `خلينا نشتغل على ${title}. اشرحي الفكرة الأساسية بكلامك الأول، وبعدها حددي قاعدة أو خطوة مهمة وطبقيها على مثال صغير. لو كتبتي الجزء اللي مش واضح، نقدر نقسمه لخطوات أصغر. (إرشاد تجريبي محفوظ.)`
    );
  };

  const send = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const id = Date.now();
    setMessages(current => [
      ...current,
      { id, role: "user", text: trimmed },
      { id: id + 1, role: "tutor", text: makeReply(trimmed), source: tr("Demo guidance · shared course context", "إرشاد تجريبي · سياق الكورس المشترك") },
    ]);
    setDraft("");
  };
  const quickPrompts = [
    tr("Explain it simply", "اشرحه ببساطة"),
    tr("Give me an example", "اديني مثال"),
    tr("What should I review first?", "أراجع إيه الأول؟"),
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-12 md:p-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st16"><ArrowLeft className="me-2 size-4" />{tr("Back to daily review", "العودة للمراجعة اليومية")}</Link></Button>
        <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}>
          <option value="en">English</option><option value="ar">العربية</option>
        </select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground"><span>ST17 · {tr("Learning tutor", "المساعد التعليمي")}</span><span>{course.title}</span></div>
          <div>
            <h1 className="text-2xl font-semibold">{tr("Let's learn it step by step", "يلا نفهمها خطوة بخطوة")}</h1>
            <p className="mt-1 text-muted-foreground">{tr("Ask about a course concept, request a simple explanation, or decide what to review next.", "اسألي عن مفهوم في الكورس، أو اطلبي شرح مبسط، أو حددي إيه اللي محتاج مراجعة.")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="space-y-2 text-sm font-medium">{tr("Learning topic", "موضوع التعلم")}
              <select className="w-full rounded-md border bg-background px-3 py-2" value={selectedConcept.id} onChange={e => { setSelectedConceptId(e.target.value); setMessages([]); }}>
                {courseConcepts.map(concept => <option key={concept.id} value={concept.id}>{concept.title}</option>)}
              </select>
            </label>
            <Button variant="outline" asChild><Link href={`/student/st8/${selectedConcept.id}`}><BookOpen className="me-2 size-4" />{tr("Open lesson", "افتحي الدرس")}</Link></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Current mastery", "مستوى الإتقان")}</p><p className="mt-1 text-2xl font-bold">{mastery}%</p><Badge tone={masteryBand(mastery).tone}>{masteryBand(mastery).band}</Badge></div>
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Prerequisites to review", "متطلبات تحتاج مراجعة")}</p><p className="mt-1 text-2xl font-bold">{missing.length}</p><p className="text-xs text-muted-foreground">{tr("Below 70% demo threshold", "أقل من حد 70% في الديمو")}</p></div>
            <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{tr("Latest assessment", "آخر تقييم")}</p><p className="mt-1 text-2xl font-bold">{latestAttempt ? `${latestAttempt.score}%` : "—"}</p><p className="text-xs text-muted-foreground">{latestAttempt ? new Date(latestAttempt.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US") : tr("No saved attempt", "لا توجد محاولة محفوظة")}</p></div>
          </div>
          {missing.length > 0 && <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-sm"><p className="font-medium">{tr("Suggested prerequisite review", "مراجعة مقترحة للمتطلبات السابقة")}</p><div className="mt-2 flex flex-wrap gap-2">{missing.map(id => { const prerequisite = concepts.find(c => c.id === id); return <Button key={id} size="sm" variant="outline" asChild><Link href={`/student/st8/${id}`}>{prerequisite?.title ?? id}</Link></Button>; })}</div></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="size-5" />{tr("Tutor conversation", "المحادثة مع المساعد")}</CardTitle><CardDescription>{tr("Choose a starter or write your own question. Replies are scripted examples for this demo.", "اختاري سؤال مقترح أو اكتبي سؤالك. الردود أمثلة محفوظة داخل الديمو.")}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center"><Sparkles className="mx-auto size-7 text-primary" /><p className="mt-2 font-medium">{tr("What would you like to understand?", "إيه اللي حابة تفهميه؟")}</p><p className="mt-1 text-sm text-muted-foreground">{tr("Start with one of these prompts.", "ابدئي بواحد من الأسئلة دي.")}</p></div> : <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-3">{messages.map(message => <div key={message.id} className={message.role === "user" ? "ms-8 rounded-xl bg-primary p-3 text-primary-foreground" : "me-8 rounded-xl border bg-card p-3"}><p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>{message.source && <p className="mt-2 text-xs text-muted-foreground">{message.source}</p>}</div>)}</div>}
          {messages.length === 0 && <div className="flex flex-wrap gap-2">{quickPrompts.map(prompt => <Button key={prompt} size="sm" variant="outline" onClick={() => send(prompt)}><Lightbulb className="me-2 size-4" />{prompt}</Button>)}</div>}
          <form className="flex gap-2" onSubmit={event => { event.preventDefault(); send(draft); }}>
            <input className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" value={draft} onChange={event => setDraft(event.target.value)} placeholder={tr("Ask a question about this topic…", "اكتبي سؤالك عن الموضوع...")} aria-label={tr("Your question", "سؤالك")} />
            <Button type="submit" disabled={!draft.trim()}><Send className="size-4" /><span className="sr-only">{tr("Send", "إرسال")}</span></Button>
          </form>
          {messages.length > 0 && <Button variant="ghost" size="sm" onClick={() => setMessages([])}><RotateCcw className="me-2 size-4" />{tr("Clear conversation", "مسح المحادثة")}</Button>}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link href={`/student/st9?conceptId=${selectedConcept.id}`}>{tr("Go to practice", "الانتقال للتدريب")}</Link></Button>
        <Button asChild><Link href="/student/st18">{tr("Continue to settings", "الانتقال للإعدادات")}<ArrowLeft className="ms-2 size-4" /></Link></Button>
      </div>
      <p className="text-xs text-muted-foreground">{tr("This is a scripted, deterministic tutor simulation. It does not call an AI model, retain conversation history after the page session, or provide verified external citations. The mastery and attempt indicators come from the shared browser demo state.", "دي محاكاة لمساعد بإجابات محفوظة وثابتة. مش بتتصل بنموذج ذكاء اصطناعي، ومش بتحفظ سجل المحادثة بعد جلسة الصفحة، ومش بتقدم مراجع خارجية موثقة. مؤشرات الإتقان والتقييمات جاية من بيانات الديمو المشتركة في المتصفح.")}</p>
    </main>
  );
}
