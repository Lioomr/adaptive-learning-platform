"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardList, MessageSquareText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Rating = 1 | 2 | 3 | 4 | 5;

const ratingLabels = {
  en: ["Very poor", "Poor", "Okay", "Good", "Excellent"],
  ar: ["ضعيف جدًا", "ضعيف", "مقبول", "جيد", "ممتاز"],
};

export function StudentSurvey() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [overall, setOverall] = useState<Rating | null>(null);
  const [clarity, setClarity] = useState<Rating | null>(null);
  const [pace, setPace] = useState<Rating | null>(null);
  const [confidence, setConfidence] = useState<Rating | null>(null);
  const [helpfulFeature, setHelpfulFeature] = useState("");
  const [recommend, setRecommend] = useState<"yes" | "maybe" | "no" | "">("");
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ar = language === "ar";
  const tr = (en: string, arabic: string) => ar ? arabic : en;
  const complete = overall !== null && clarity !== null && pace !== null && confidence !== null && !!helpfulFeature && !!recommend;

  function RatingQuestion({ title, value, onChange }: { title: string; value: Rating | null; onChange: (value: Rating) => void }) {
    return (
      <fieldset className="space-y-3">
        <legend className="font-medium">{title}</legend>
        <div className="grid grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as const).map(score => (
            <button key={score} type="button" aria-pressed={value === score} onClick={() => onChange(score)} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border p-2 transition ${value === score ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}>
              <span className="font-semibold">{score}</span>
              <span className="text-center text-[10px] leading-tight text-muted-foreground">{ratingLabels[language][score - 1]}</span>
            </button>
          ))}
        </div>
      </fieldset>
    );
  }

  return (
    <main dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-4xl space-y-5 p-4 pb-12 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st19"><ArrowLeft className="me-2 size-4" />{tr("Back to post-test", "العودة للاختبار البعدي")}</Link></Button>
        <select aria-label="Language" className="rounded-md border bg-background px-3 py-2 text-sm" value={language} onChange={e => setLanguage(e.target.value as "en" | "ar")}><option value="en">English</option><option value="ar">العربية</option></select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardList className="size-4" />ST20 · {tr("Learning experience survey", "استبيان تجربة التعلم")}</div>
          <div className="flex items-start gap-3"><MessageSquareText className="mt-1 size-7 text-primary" /><div><h1 className="text-2xl font-semibold">{tr("Help us improve your learning experience", "ساعدينا نحسّن تجربة التعلم")}</h1><p className="mt-1 text-muted-foreground">{tr("Share a little feedback about the course and the learning journey you just completed. There are no right or wrong answers.", "شاركينا رأيك في الكورس ورحلة التعلم اللي خلصتيها. مفيش إجابات صح أو غلط.")}</p></div></div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{tr("Your feedback is optional in a real learning service. In this demo, required ratings are used only to demonstrate the survey flow.", "رأيك اختياري في الخدمة التعليمية الحقيقية. في الديمو، التقييمات المطلوبة هدفها توضيح خطوات الاستبيان فقط.")}</div>
        </CardContent>
      </Card>

      {!submitted ? <Card>
        <CardHeader><CardTitle>{tr("Your feedback", "رأيك يهمنا")}</CardTitle><CardDescription>{tr("Rate each item from 1 (lowest) to 5 (highest).", "قيّمي كل نقطة من 1 (الأقل) إلى 5 (الأعلى).")}</CardDescription></CardHeader>
        <CardContent className="space-y-7">
          <RatingQuestion title={tr("1. Overall, how would you rate your learning experience?", "1. بشكل عام، تقيّمي تجربة التعلم إزاي؟")} value={overall} onChange={setOverall} />
          <RatingQuestion title={tr("2. How clear and understandable was the learning content?", "2. المحتوى التعليمي كان واضح وسهل الفهم قد إيه؟")} value={clarity} onChange={setClarity} />
          <RatingQuestion title={tr("3. How suitable was the learning pace for you?", "3. سرعة التعلم كانت مناسبة ليكي قد إيه؟")} value={pace} onChange={setPace} />
          <RatingQuestion title={tr("4. How confident do you feel about the topics now?", "4. حاسة بثقة قد إيه في فهم الموضوعات دلوقتي؟")} value={confidence} onChange={setConfidence} />

          <fieldset className="space-y-3">
            <legend className="font-medium">{tr("5. Which part helped you the most?", "5. إيه أكتر جزء ساعدك؟")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["lessons", tr("Lessons and explanations", "الدروس والشرح")],
                ["practice", tr("Practice questions", "أسئلة التدريب")],
                ["feedback", tr("Assessment feedback", "التغذية الراجعة على التقييم")],
                ["tutor", tr("Learning tutor", "المساعد التعليمي")],
                ["roadmap", tr("Learning roadmap", "خريطة التعلم")],
                ["review", tr("Review and revision", "المراجعة")],
              ].map(([value, label]) => <button key={value} type="button" aria-pressed={helpfulFeature === value} onClick={() => setHelpfulFeature(value)} className={`rounded-lg border p-3 text-start text-sm ${helpfulFeature === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}>{label}</button>)}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-medium">{tr("6. Would you recommend this learning experience to another student?", "6. هل ترشحي تجربة التعلم دي لطالب تاني؟")}</legend>
            <div className="flex flex-wrap gap-2">{([
              ["yes", tr("Yes", "أيوه")],
              ["maybe", tr("Not sure", "مش متأكدة")],
              ["no", tr("No", "لأ")],
            ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={recommend === value} onClick={() => setRecommend(value)} className={`rounded-lg border px-4 py-2 text-sm ${recommend === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"}`}>{label}</button>)}</div>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="survey-feedback" className="font-medium">{tr("7. Anything else you'd like us to know? (Optional)", "7. في أي ملاحظات أو اقتراحات تانية؟ (اختياري)")}</label>
            <Textarea id="survey-feedback" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={tr("Tell us what worked well or what could be better…", "اكتبي إيه اللي كان مفيد وإيه اللي ممكن يتحسن...")} rows={4} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">{tr("Complete the four ratings and two selections to continue.", "كمّلي الأربع تقييمات والاختيارين علشان تكمّلي.")}</p>
            <Button disabled={!complete} onClick={() => setSubmitted(true)}><Star className="me-2 size-4" />{tr("Submit feedback", "إرسال التقييم")}</Button>
          </div>
        </CardContent>
      </Card> : <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3"><CheckCircle2 className="size-8 text-primary" /><div><h2 className="text-xl font-semibold">{tr("Thank you for your feedback!", "شكرًا لمشاركتك رأيك!")}</h2><p className="text-sm text-muted-foreground">{tr("Your survey is complete for this demo session.", "كده الاستبيان اكتمل في جلسة الديمو دي.")}</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [tr("Overall experience", "تجربة التعلم"), overall],
              [tr("Content clarity", "وضوح المحتوى"), clarity],
              [tr("Learning pace", "سرعة التعلم"), pace],
              [tr("Confidence", "الثقة في الفهم"), confidence],
            ].map(([label, score]) => <div key={String(label)} className="rounded-lg border p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{score}/5</p></div>)}
          </div>
          <div className="flex flex-wrap gap-2"><Button asChild><Link href="/student/st21">{tr("View course summary", "عرض ملخص الكورس")}<ArrowLeft className="ms-2 size-4" /></Link></Button><Button variant="outline" asChild><Link href="/student/st19">{tr("Review post-test", "مراجعة الاختبار البعدي")}</Link></Button></div>
        </CardContent>
      </Card>}

      <p className="text-xs text-muted-foreground">{tr("Demo limitation: survey answers remain in this page session only. They are not saved to the shared learning store, sent to a server, or used for analytics. The survey is an illustrative prototype, not a validated research questionnaire.", "حدود الديمو: إجابات الاستبيان موجودة خلال جلسة الصفحة فقط، ومش بتتحفظ في سجل التعلم المشترك أو بتتبعت لسيرفر أو بتستخدم في تحليلات. ده نموذج توضيحي مش استبيان بحثي معتمد.")}</p>
    </main>
  );
}
