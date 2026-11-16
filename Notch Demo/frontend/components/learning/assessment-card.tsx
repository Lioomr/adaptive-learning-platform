"use client";
import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, FileQuestion, FlaskConical, RotateCcw, XCircle } from "lucide-react";
import { ErrorState, EmptyState } from "@/components/feedback/states";
import { useRole } from "@/components/layout/role-context";
import { MasteryBadge, MasteryBar } from "@/components/learning/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import { findConcept, questions } from "@/data/fixtures";
import { can, ROLE_DENIED_MESSAGE } from "@/lib/permissions";
import { useDemo } from "@/store/demo";
import type { Attempt, CourseId } from "@/types";

/** One ID per intended attempt. Retries of the same attempt reuse it (idempotency key). */
function newSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Illustrative single-question assessment for the selected student and course.
 * Parent should key it by `${studentId}:${courseId}` so context changes start a fresh attempt.
 */
export function AssessmentCard({ studentId, courseId }: { studentId: string; courseId: CourseId }) {
  const role = useRole();
  const submit = useDemo(s => s.submit);
  const headingId = useId();
  const question = questions.find(q => q.courseId === courseId);
  const [answer, setAnswer] = useState("");
  const [submissionId, setSubmissionId] = useState(newSubmissionId);
  const [result, setResult] = useState<{ attempt: Attempt; duplicate: boolean } | null>(null);
  const [error, setError] = useState("");

  const concept = question ? findConcept(question.conceptId) : undefined;

  if (!question || !concept) {
    return (
      <Card as="section" aria-labelledby={headingId}>
        <CardHeader>
          <CardTitle id={headingId}>Practice question</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState icon={FileQuestion} title="No illustrative question for this course" description="The reviewed 100-question bank is tracked separately (MAH-28)." />
        </CardContent>
      </Card>
    );
  }

  const allowed = can(role, "assessment:submit");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const r = submit({ submissionId, studentId, courseId, conceptId: question.conceptId, questionIds: [question.id], answers: answer ? { [question.id]: answer } : {} }, role);
    if (r.ok) {
      setResult({ attempt: r.attempt, duplicate: r.duplicate });
      setError("");
    } else setError(r.error);
  };

  const startNew = () => {
    setResult(null);
    setAnswer("");
    setError("");
    setSubmissionId(newSubmissionId());
  };

  return (
    <Card as="section" aria-labelledby={headingId} data-tour="assessment">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle id={headingId}>Practice: {concept.title}</CardTitle>
          <CardDescription>Illustrative question · the reviewed bank is pending (MAH-28)</CardDescription>
        </div>
        <Badge tone="ai">
          <FlaskConical aria-hidden="true" />
          Simulated mastery
        </Badge>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4" aria-live="polite">
            <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${result.attempt.score === 100 ? "border-success/25 bg-success-soft" : "border-warning/30 bg-warning-soft"}`}>
              {result.attempt.score === 100 ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-ink" aria-hidden="true" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-warning-ink" aria-hidden="true" />}
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-foreground">{result.attempt.score === 100 ? "Correct — well done." : "Not quite this time."}</p>
                <p className="mt-0.5 leading-6 text-muted-foreground">{question.explanation}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{concept.title} mastery (simulated)</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight tabular-nums">
                <span className="text-muted-foreground">{result.attempt.previous}%</span>
                <ArrowRight className="size-5 text-[#94a3b8] rtl:-scale-x-100" aria-hidden="true" />
                <span data-testid="mastery-after">{result.attempt.mastery}%</span>
                <MasteryBadge value={result.attempt.mastery} />
              </p>
              <MasteryBar value={result.attempt.mastery} label={`${concept.title} mastery after attempt`} className="mt-3" />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Score {result.attempt.score}% → round(0.60 × {result.attempt.previous} + 0.40 × {result.attempt.score}) = {result.attempt.mastery}%.
                {result.duplicate ? " This was a retry of an attempt already recorded, so mastery was not applied twice." : ""}
              </p>
            </div>
            <Button variant="outline" onClick={startNew}>
              <RotateCcw aria-hidden="true" />
              Start a new attempt
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <fieldset disabled={!allowed} className="min-w-0">
              <legend className="text-[15px] font-medium leading-6 text-foreground">{question.prompt}</legend>
              <RadioGroup value={answer} onValueChange={setAnswer} className="mt-3" aria-label="Answer options">
                {question.options.map(option => (
                  <RadioOption key={option} value={option}>
                    {option}
                  </RadioOption>
                ))}
              </RadioGroup>
            </fieldset>
            {error ? <ErrorState title="Assessment not recorded" description={error} /> : null}
            {!allowed ? <p className="text-sm text-muted-foreground">{ROLE_DENIED_MESSAGE["assessment:submit"]}</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Unanswered questions count as incorrect.</p>
              <Button type="submit" disabled={!allowed || !answer}>
                Submit answer
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
