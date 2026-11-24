"use client";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { courses, diagnosticQuestions, courseConcepts, mastery } from "./data";
import { useStudent } from "./context";
import {
  CourseCard,
  MasteryMetrics,
  PageTitle,
  Recommendation,
  SectionTitle,
} from "./ui";

export function StudentHome() {
  const { t, student, profile } = useStudent();
  const recommendations = [...courses]
    .sort((a, b) => mastery(a, student) - mastery(b, student))
    .slice(0, 3);
  const mastered = courses
    .flatMap((c) => courseConcepts(c, student))
    .filter((c) => c.mastery >= 80).length;
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle
        eyebrow={t("YOUR LEARNING SPACE", "مساحة تعلّمك")}
        title={t(`A little progress, every day.`, "تقدّم صغير، كل يوم.")}
        description={t(
          `Welcome back, ${student.name}. Let’s turn your next question into a new skill.`,
          "مرحبًا بعودتك. لنحوّل سؤالك القادم إلى مهارة جديدة.",
        )}
        action={
          <Badge tone="brand">
            {t("Autumn semester · 2026", "الفصل الخريفي · ٢٠٢٦")}
          </Badge>
        }
      />
      <MasteryMetrics />
      <section className="relative isolate overflow-hidden rounded-2xl bg-[var(--notch-brand-ink)] p-6 text-white sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-1/2 bg-[url('/brand/adaptive-path.svg')] bg-contain bg-right bg-no-repeat opacity-35"
        />
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--notch-brand-soft-lavender)]">
            <Sparkles className="size-4" aria-hidden="true" />
            {t("A path built around your progress", "مسار يُبنى حول تقدمك")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
            {t("You’re building something that lasts.", "أنت تبني معرفة تدوم.")}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--notch-brand-fog)]">
            {t(
              `You’ve mastered ${mastered} concepts. Keep your momentum with a focused session on the concepts that need a little more attention.`,
              `أتقنت ${mastered} مفهومًا. واصل تقدمك بجلسة مركّزة على المفاهيم التي تحتاج مزيدًا من الاهتمام.`,
            )}
          </p>
          <Button
            asChild
            className="mt-5 bg-[var(--notch-brand-soft-lavender)] text-[var(--notch-brand-ink)] hover:bg-[var(--notch-brand-violet-light)]"
          >
            <Link href="#next-step">
              {t("Find my next step", "اكتشف خطوتي التالية")}
            </Link>
          </Button>
        </div>
      </section>
      <section>
        <SectionTitle
          title={t("Your courses, at a glance", "مقرراتك في لمحة")}
          description={t(
            "See what’s clicking—and where a little practice will help.",
            "تعرّف على نقاط قوتك وما يحتاج قليلًا من التدريب.",
          )}
        >
          <Button variant="ghost" asChild>
            <Link href="/student/courses">
              {t("All courses", "كل المقررات")}
            </Link>
          </Button>
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} insights />
          ))}
        </div>
      </section>
      <section id="next-step" className="scroll-mt-24">
        <SectionTitle
          title={t("Your Next Learning Step", "خطوتك التعليمية التالية")}
          description={t(
            "Prioritized by your simulated concept mastery. Small steps, meaningful progress.",
            "مرتبة حسب إتقانك التجريبي للمفاهيم. خطوات صغيرة وتقدم ملموس.",
          )}
        >
          <Badge tone="ai">
            <Sparkles aria-hidden="true" />
            {t("AI recommendations · Simulated", "توصيات ذكية · محاكاة")}
          </Badge>
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((c, i) => (
            <Recommendation key={c.id} course={c} featured={i === 0} />
          ))}
        </div>
      </section>
      <Card className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
        <div>
          <h2 className="font-semibold">
            {t("Your learning preferences", "تفضيلات تعلّمك")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {profile.preferences?.map((answer, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Check className="size-4 text-success" aria-hidden="true" />
                {t(diagnosticQuestions[i].options[answer])}
              </span>
            )) ?? (
              <p className="text-sm text-muted-foreground">
                {t(
                  "Complete your welcome diagnostic to personalize this space.",
                  "أكمل الاستبيان الترحيبي لتخصيص هذه المساحة.",
                )}
              </p>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/chatbot">
            {t("Study with your assistant", "تعلّم مع مساعدك")}
          </Link>
        </Button>
      </Card>
    </div>
  );
}
