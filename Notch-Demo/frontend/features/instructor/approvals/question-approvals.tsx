"use client";
import { useId, useState } from "react";
import { Check, CheckCircle2, Flag, Inbox, ListChecks, Pencil, RotateCcw, XCircle } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { questions as fixtureQuestions } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import type { CourseId } from "@/types";
import { flaggedQuestionsFor, type FlaggedQuestion, type LocalizedItem } from "./mock-data";
import { AiBadge, AssignedCourseGate, LiveAnnouncement, ReviewSteps, SimulatedNotice, SourceLink, conceptTitle } from "./shared";

type Status = "flagged" | "accepted" | "edited" | "rejected";
type Review = { status: Status; answerIndex: number; en: LocalizedItem; ar: LocalizedItem };

const statusMeta: Record<Status, { label: string; tone: "warning" | "success" | "progress" | "danger" }> = {
  flagged: { label: "Flagged", tone: "warning" },
  accepted: { label: "Accepted (simulated)", tone: "success" },
  edited: { label: "Edited & accepted (simulated)", tone: "progress" },
  rejected: { label: "Rejected (simulated)", tone: "danger" },
};

const initialReview = (q: FlaggedQuestion): Review => ({ status: "flagged", answerIndex: q.answerIndex, en: q.en, ar: q.ar });

/** IN5 — Question approvals (simulated). */
export function QuestionApprovals() {
  return (
    <>
      <PageHeader
        eyebrow={<>Instructor portal · IN5 <AiBadge label="AI generated" /></>}
        title="Question approvals"
        description="Review generated questions that were flagged for checking. Compare the English and Arabic versions, then accept, edit or reject each item."
      />
      <ReviewSteps />
      <SimulatedNotice>Generated questions are fictional samples and have not been checked by a subject reviewer. Accepting an item only changes its status on this page; it is not added to the shared question bank or shown to students.</SimulatedNotice>
      <AssignedCourseGate>{({ courseId }) => <QuestionReview courseId={courseId} />}</AssignedCourseGate>
    </>
  );
}

function QuestionReview({ courseId }: { courseId: CourseId }) {
  const items = flaggedQuestionsFor(courseId);
  const [reviews, setReviews] = useState<Record<string, Review>>(() => Object.fromEntries(items.map(q => [q.id, initialReview(q)])));
  const [selectedId, setSelectedId] = useState(items[0]?.id);
  const [editing, setEditing] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  if (!items.length) {
    return <EmptyState icon={Inbox} title="No flagged questions" description="Generated questions that need a check appear here (simulated)." />;
  }

  const selected = items.find(q => q.id === selectedId) ?? items[0];
  const review = reviews[selected.id];
  const count = (s: Status) => items.filter(q => reviews[q.id].status === s).length;
  const update = (id: string, patch: Partial<Review>, message: string) => {
    setReviews(r => ({ ...r, [id]: { ...r[id], ...patch } }));
    setAnnouncement(message);
  };
  const reviewed = items.filter(q => reviews[q.id].status === "accepted" || reviews[q.id].status === "edited");

  return (
    <div className="space-y-6">
      <LiveAnnouncement message={announcement} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flagged" value={count("flagged")} icon={Flag} accent="warning" hint="Sample items needing a check" />
        <StatCard label="Accepted" value={count("accepted")} icon={CheckCircle2} accent="success" hint="Simulated status only" />
        <StatCard label="Edited & accepted" value={count("edited")} icon={Pencil} accent="progress" hint="Changes kept on this page only" />
        <StatCard label="Rejected" value={count("rejected")} icon={XCircle} accent="danger" hint="Simulated status only" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="flagged-heading" className="min-w-0 xl:col-span-4">
          <CardHeader>
            <div>
              <CardTitle id="flagged-heading">Flagged items</CardTitle>
              <CardDescription>{items.length} generated questions (sample)</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReviews(Object.fromEntries(items.map(q => [q.id, initialReview(q)])));
                setEditing(false);
                setAnnouncement("All question decisions were reset.");
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            <ul className="space-y-2" role="list">
              {items.map(q => {
                const r = reviews[q.id];
                const isSelected = q.id === selected.id;
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedId(q.id);
                        setEditing(false);
                      }}
                      className={cn("w-full rounded-lg border p-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", isSelected ? "border-primary bg-secondary/60" : "border-border hover:bg-muted")}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{conceptTitle(q.conceptId)} · {q.difficulty}</span>
                        <Badge tone={statusMeta[r.status].tone}>{statusMeta[r.status].label}</Badge>
                      </span>
                      <span className="mt-1.5 block text-sm font-medium leading-5 text-foreground">{r.en.prompt}</span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {q.flags.map(f => (
                          <Badge key={f} tone="outline">
                            <Flag aria-hidden="true" />
                            {f}
                          </Badge>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="question-detail-heading" className="min-w-0 xl:col-span-8">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle id="question-detail-heading">
                {selected.id} · {conceptTitle(selected.conceptId)}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <Badge tone={statusMeta[review.status].tone}>{statusMeta[review.status].label}</Badge>
                <AiBadge label="AI generated" />
                <span>{selected.difficulty}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm text-warning-ink">
              <p className="font-semibold">Why this item was flagged (simulated check)</p>
              <ul className="mt-1 list-disc ps-5 leading-6">
                {selected.flags.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>

            {editing ? (
              <QuestionEditor
                key={selected.id}
                review={review}
                onCancel={() => setEditing(false)}
                onSave={next => {
                  update(selected.id, { ...next, status: "edited" }, `${selected.id}: edited and accepted (simulated).`);
                  setEditing(false);
                }}
              />
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2">
                  <QuestionPreview lang="en" item={review.en} answerIndex={review.answerIndex} />
                  <QuestionPreview lang="ar" item={review.ar} answerIndex={review.answerIndex} />
                </div>
                <section aria-labelledby="q-source-heading">
                  <h3 id="q-source-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Linked source</h3>
                  <SourceLink source={selected.source} />
                </section>
                <div className="flex flex-wrap gap-2">
                  {review.status === "flagged" ? (
                    <>
                      <Button onClick={() => update(selected.id, { status: "accepted" }, `${selected.id}: accepted (simulated).`)}>
                        <CheckCircle2 aria-hidden="true" />
                        Accept
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(true)}>
                        <Pencil aria-hidden="true" />
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => update(selected.id, { status: "rejected" }, `${selected.id}: rejected (simulated).`)}>
                        <XCircle aria-hidden="true" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" onClick={() => update(selected.id, { ...initialReview(selected) }, `${selected.id}: decision undone, flagged again.`)}>
                      <RotateCcw aria-hidden="true" />
                      Undo decision
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SampleReviewed courseId={courseId} reviewed={reviewed.map(q => ({ id: q.id, conceptId: q.conceptId, review: reviews[q.id] }))} />
    </div>
  );
}

function QuestionPreview({ lang, item, answerIndex }: { lang: "en" | "ar"; item: LocalizedItem; answerIndex: number }) {
  const uid = useId();
  const ar = lang === "ar";
  return (
    <article aria-labelledby={`${uid}-h`} className="rounded-lg border border-border bg-card p-4">
      <h3 id={`${uid}-h`} className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {ar ? "Arabic preview" : "English preview"}
        <Badge tone="outline">{ar ? "AR · RTL" : "EN · LTR"}</Badge>
      </h3>
      <div lang={lang} dir={ar ? "rtl" : "ltr"} className="text-start">
        <p className="text-[15px] font-medium leading-7 text-foreground">{item.prompt}</p>
        <ol className="mt-3 space-y-2" role="list">
          {item.options.map((o, i) => {
            const correct = i === answerIndex;
            return (
              <li key={i} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", correct ? "border-success/40 bg-success-soft text-success-ink" : "border-border")}>
                <span className="grid size-5 shrink-0 place-items-center rounded-full border border-current text-[11px]" aria-hidden="true">
                  {correct ? <Check className="size-3" /> : String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1" dir="auto">{o}</span>
                {correct ? <span className="sr-only">{ar ? "(الإجابة الصحيحة)" : "(correct answer)"}</span> : null}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">{ar ? "التوضيح: " : "Explanation: "}</span>
          {item.explanation}
        </p>
      </div>
    </article>
  );
}

function QuestionEditor({ review, onSave, onCancel }: { review: Review; onSave: (r: Omit<Review, "status">) => void; onCancel: () => void }) {
  const uid = useId();
  const [en, setEn] = useState(review.en);
  const [ar, setAr] = useState(review.ar);
  const [answerIndex, setAnswerIndex] = useState(review.answerIndex);
  const invalid = !en.prompt.trim() || !ar.prompt.trim() || en.options.some(o => !o.trim()) || ar.options.some(o => !o.trim());
  const field = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form
      className="space-y-4"
      aria-label="Edit question (simulated)"
      onSubmit={e => {
        e.preventDefault();
        if (!invalid) onSave({ en, ar, answerIndex });
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {(["en", "ar"] as const).map(lang => {
          const item = lang === "en" ? en : ar;
          const set = lang === "en" ? setEn : setAr;
          const isAr = lang === "ar";
          return (
            <fieldset key={lang} className="space-y-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{isAr ? "Arabic version" : "English version"}</legend>
              <label htmlFor={`${uid}-${lang}-prompt`} className="text-xs font-semibold text-muted-foreground">Question</label>
              <textarea id={`${uid}-${lang}-prompt`} lang={lang} dir={isAr ? "rtl" : "ltr"} rows={3} value={item.prompt} onChange={e => set({ ...item, prompt: e.target.value })} className={field} />
              {item.options.map((o, i) => (
                <div key={i} className="grid gap-1">
                  <label htmlFor={`${uid}-${lang}-opt-${i}`} className="text-xs text-muted-foreground">Option {String.fromCharCode(65 + i)}</label>
                  <input id={`${uid}-${lang}-opt-${i}`} lang={lang} dir={isAr ? "rtl" : "ltr"} value={o} onChange={e => set({ ...item, options: item.options.map((x, j) => (j === i ? e.target.value : x)) })} className={cn(field, "h-10 py-0")} />
                </div>
              ))}
            </fieldset>
          );
        })}
      </div>
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="mb-1 w-full text-xs font-semibold text-muted-foreground">Correct answer (applies to both languages)</legend>
        {en.options.map((o, i) => (
          <label key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
            <input type="radio" name={`${uid}-answer`} checked={answerIndex === i} onChange={() => setAnswerIndex(i)} className="accent-primary" />
            {String.fromCharCode(65 + i)} · {o || "…"}
          </label>
        ))}
      </fieldset>
      {invalid ? <p className="text-xs text-danger-ink" role="alert">Fill in the question and every option in both languages.</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={invalid}>
          <CheckCircle2 aria-hidden="true" />
          Save and accept (simulated)
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function SampleReviewed({ courseId, reviewed }: { courseId: CourseId; reviewed: { id: string; conceptId: string; review: Review }[] }) {
  const fixtures = fixtureQuestions.filter(q => q.courseId === courseId);
  return (
    <Card as="section" aria-labelledby="reviewed-heading">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success-soft text-success-ink">
            <ListChecks className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle id="reviewed-heading">Sample reviewed questions</CardTitle>
            <CardDescription>Illustrative items from the shared fixtures, plus items you accepted on this page (simulated).</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 sm:pt-0">
        <ul className="divide-y divide-border" role="list">
          {fixtures.map(q => (
            <li key={q.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.id} · {conceptTitle(q.conceptId)} · Answer: {q.answer} · Arabic version not yet provided
                </p>
              </div>
              <Badge tone="neutral">Illustrative · pending subject review</Badge>
            </li>
          ))}
          {reviewed.map(({ id, conceptId, review }) => (
            <li key={id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{review.en.prompt}</p>
                <p lang="ar" dir="rtl" className="mt-0.5 text-sm text-foreground">{review.ar.prompt}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {id} · {conceptTitle(conceptId)} · Answer: {review.en.options[review.answerIndex]}
                </p>
              </div>
              <Badge tone={statusMeta[review.status].tone}>{statusMeta[review.status].label}</Badge>
            </li>
          ))}
        </ul>
        {!reviewed.length ? <p className="mt-2 text-sm text-muted-foreground">Accept or edit a flagged item above to see it here.</p> : null}
      </CardContent>
    </Card>
  );
}
