"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Brain, CheckCircle2, CircleHelp, Lightbulb, RotateCcw, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findConcept, findCourse } from "@/data/fixtures";
import { useDemo } from "@/store/demo";
import { useHydrated } from "@/hooks/use-hydrated";

type Stage = "lesson" | "adaptive" | "practice" | "results" | "recommendation";

const lessonSections = [
  { title: "Build the foundation", body: "Start by connecting this idea to what you already know. Identify the key terms, the problem this concept solves, and where it fits in the course." },
  { title: "Understand the idea", body: "Work through the explanation slowly. Focus on the relationship between the main idea and its parts, then try to explain it in your own words." },
  { title: "See it in context", body: "Look for a small example, predict what should happen, and compare your reasoning with the explanation. Learning becomes stronger when you actively make a prediction." },
];

export function StudentLearningSession({ conceptId }: { conceptId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const courseId = useDemo((state) => state.courseId);
  const studentId = useDemo((state) => state.studentId);
  const students = useDemo((state) => state.students);
  const concept = findConcept(conceptId);
  const course = findCourse(courseId);
  const student = students.find((item) => item.id === studentId);
  const [stage, setStage] = useState<Stage>("lesson");
  const [section, setSection] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  const mastery = concept && student ? student.mastery[concept.id] ?? 0 : 0;
  const learningPath = useMemo(() => mastery < 50 ? "guided" : mastery < 80 ? "balanced" : "challenge", [mastery]);
  const pathCopy = {
    guided: { label: "Guided learning", description: "We'll take this concept one step at a time, with clear foundations and hints.", focus: "Start with the foundations and use the hint before checking your answer." },
    balanced: { label: "Balanced learning", description: "You have some foundation already. Review the key idea, then apply it in a short practice.", focus: "Connect the explanation to an example, then test your understanding." },
    challenge: { label: "Challenge mode", description: "Your current mastery suggests you're ready to move faster and test deeper understanding.", focus: "Try to explain the concept independently, then use the practice as a knowledge check." },
  }[learningPath];

  if (!hydrated) return <div className="mx-auto max-w-5xl p-6"><div className="h-48 animate-pulse rounded-2xl bg-muted" /></div>;
  if (!concept || !course || !student || concept.courseId !== courseId) return (
    <div className="mx-auto max-w-4xl p-6"><Card><CardContent className="space-y-4 p-8 text-center"><h2 className="text-xl font-semibold">This lesson is unavailable</h2><p className="text-sm text-muted-foreground">Choose a concept from your current course to continue.</p><Button asChild><Link href="/student/st7">Back to course</Link></Button></CardContent></Card></div>
  );

  const isCorrect = answer === 0;
  const progress = stage === "lesson" ? Math.round(((section + 1) / 3) * 35) : stage === "adaptive" ? 45 : stage === "practice" ? 65 : 100;
  const stageIndex = ["lesson", "adaptive", "practice", "results", "recommendation"].indexOf(stage);

  function startPractice() { setAnswer(null); setShowHint(false); setStage("practice"); }
  function submitPractice() { if (answer !== null) setStage("results"); }
  function retry() { setAnswer(null); setShowHint(false); setStage("practice"); }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-12 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild><Link href="/student/st7"><ArrowLeft className="mr-2 size-4" />Back to course</Link></Button>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{course.shortTitle} · Learning session</span>
      </div>
      <PageHeader eyebrow={`CONCEPT · ${concept.id}`} title={concept.title} description="A focused learning experience that moves from explanation to adaptive practice and a clear next step." />
      <Card><CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between text-sm"><span className="font-medium">Session progress</span><span className="tabular-nums text-muted-foreground">{progress}%</span></div>
        <Progress value={progress} />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className={stageIndex >= 0 ? "font-semibold text-primary" : ""}>01 Learn</span><span>·</span><span className={stageIndex >= 1 ? "font-semibold text-primary" : ""}>02 Adapt</span><span>·</span><span className={stageIndex >= 2 ? "font-semibold text-primary" : ""}>03 Practice</span><span>·</span><span className={stageIndex >= 3 ? "font-semibold text-primary" : ""}>04 Results</span><span>·</span><span className={stageIndex >= 4 ? "font-semibold text-primary" : ""}>05 Next step</span></div>
      </CardContent></Card>

      {stage === "lesson" && <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <Card><CardHeader><div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><BookOpen className="size-4" />Learning material · Part {section + 1} of 3</div><CardTitle>{lessonSections[section].title}</CardTitle><CardDescription>Learn the concept at a comfortable pace.</CardDescription></CardHeader><CardContent className="space-y-5">
          <p className="text-sm leading-7 text-muted-foreground">{lessonSections[section].body}</p>
          <div className="rounded-xl border bg-muted/30 p-5"><div className="mb-2 flex items-center gap-2 font-semibold"><Lightbulb className="size-4 text-amber-500" />Think about it</div><p className="text-sm leading-6">Before moving on, ask yourself: what is the main purpose of <strong>{concept.title}</strong>, and how would you recognize it in a real problem?</p></div>
          <div className="flex justify-between gap-3"><Button variant="outline" disabled={section === 0} onClick={() => setSection((v) => v - 1)}>Previous</Button><Button onClick={() => section < 2 ? setSection((v) => v + 1) : setStage("adaptive")}>{section < 2 ? "Continue lesson" : "Personalize my learning"}<ArrowRight className="ml-2 size-4" /></Button></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Learning objective</CardTitle><CardDescription>By the end of this session</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><div className="flex gap-2"><Target className="size-4 shrink-0 text-primary" />Explain the core idea of {concept.title}.</div><div className="flex gap-2"><CheckCircle2 className="size-4 shrink-0 text-primary" />Recognize when and why it is used.</div><div className="flex gap-2"><Brain className="size-4 shrink-0 text-primary" />Apply the idea in a short knowledge check.</div></CardContent></Card>
      </div>}

      {stage === "adaptive" && <Card><CardHeader><div className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="size-4" />Your adaptive learning path</div><CardTitle>{pathCopy.label}</CardTitle><CardDescription>{pathCopy.description}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Current mastery</p><p className="mt-1 text-2xl font-bold">{mastery}%</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Recommended pace</p><p className="mt-1 font-semibold">{learningPath === "guided" ? "Step by step" : learningPath === "balanced" ? "Steady" : "Fast track"}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Session focus</p><p className="mt-1 font-semibold">{learningPath === "guided" ? "Foundations" : learningPath === "balanced" ? "Application" : "Challenge"}</p></div></div><div className="rounded-xl bg-primary/5 p-4"><p className="text-sm leading-6">{pathCopy.focus}</p></div><div className="flex justify-between gap-3"><Button variant="outline" onClick={() => setStage("lesson")}>Review lesson</Button><Button onClick={startPractice}>Start practice<ArrowRight className="ml-2 size-4" /></Button></div></CardContent></Card>}

      {stage === "practice" && <Card><CardHeader><div className="flex items-center gap-2 text-sm font-medium text-primary"><Target className="size-4" />Knowledge check</div><CardTitle>Which approach is most useful when learning {concept.title}?</CardTitle><CardDescription>Choose the best learning action for this concept.</CardDescription></CardHeader><CardContent className="space-y-4">
        {["Understand the core idea, then apply it to an example.", "Memorize the title without understanding the idea.", "Skip the explanation and guess the result."].map((option, index) => <button key={option} type="button" onClick={() => setAnswer(index)} className={`w-full rounded-xl border p-4 text-left text-sm transition-colors ${answer === index ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><span className="mr-3 inline-grid size-7 place-items-center rounded-full border text-xs font-semibold">{String.fromCharCode(65 + index)}</span>{option}</button>)}
        {showHint && <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><strong>Hint:</strong> Effective learning combines understanding with active application.</div>}
        <div className="flex flex-wrap justify-between gap-3 border-t pt-4"><Button variant="ghost" onClick={() => setShowHint((v) => !v)}><CircleHelp className="mr-2 size-4" />{showHint ? "Hide hint" : "Need a hint?"}</Button><Button disabled={answer === null} onClick={submitPractice}>Check answer<ArrowRight className="ml-2 size-4" /></Button></div>
      </CardContent></Card>}

      {stage === "results" && <Card><CardHeader><div className="flex items-center gap-3"><span className={`grid size-11 place-items-center rounded-full ${isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{isCorrect ? <CheckCircle2 className="size-5" /> : <CircleHelp className="size-5" />}</span><div><CardTitle>{isCorrect ? "Good thinking!" : "A chance to strengthen your understanding"}</CardTitle><CardDescription>Practice feedback for {concept.title}</CardDescription></div></div></CardHeader><CardContent className="space-y-5"><div className="rounded-xl bg-muted/40 p-4"><p className="text-sm font-semibold">Recommended answer</p><p className="mt-2 text-sm leading-6">Understand the core idea, then apply it to an example.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{isCorrect ? "Correct. You selected an approach that connects understanding with active application." : "The strongest approach is to understand the idea first and then apply it to an example. Try once more if you want to reinforce it."}</p></div><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={retry}><RotateCcw className="mr-2 size-4" />Try again</Button><Button onClick={() => setStage("recommendation")}>See my next step<ArrowRight className="ml-2 size-4" /></Button></div></CardContent></Card>}

      {stage === "recommendation" && <Card><CardHeader><div className="flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="size-4" />Personal learning recommendation</div><CardTitle>{isCorrect ? "Move forward with confidence" : "Revisit the key idea before moving on"}</CardTitle><CardDescription>Your next step for {concept.title}</CardDescription></CardHeader><CardContent className="space-y-5"><p className="text-sm leading-6 text-muted-foreground">{isCorrect ? "You completed this learning check successfully. Continue to the next concept and keep building on this foundation." : "A short review can help make the idea clearer. Revisit the lesson, use the hint, and try the knowledge check again."}</p><div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested action</p><p className="mt-2 font-semibold">{isCorrect ? "Continue to the next concept" : "Review this concept"} </p></div><div className="flex flex-wrap justify-between gap-3"><Button variant="outline" onClick={() => { setStage("lesson"); setSection(0); }}>Review lesson</Button><Button onClick={() => router.push("/student/st7")}>Back to course<ArrowRight className="ml-2 size-4" /></Button></div></CardContent></Card>}
    </div>
  );
}
