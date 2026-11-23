"use client";
import { useId, useMemo, useState } from "react";
import { BookOpen, Bot, CheckCircle2, Flag, FlagOff, Info, MessageSquareText, PencilLine, RotateCcw, UserCheck } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { InstructorPreviewSkeleton } from "@/components/feedback/loading-skeletons";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { findConcept, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import { conversationsForCourse, findSource, type Grounding, type TutorConversation } from "./mock-tutor-conversations";

type ReviewStatus = "needs-review" | "approved" | "corrected";
type Review = { status: ReviewStatus; correction?: string; gapFlagged: boolean };
type Filter = "all" | ReviewStatus | "gap";

const STATUS_META: Record<ReviewStatus, { label: string; tone: "warning" | "success" | "progress" }> = {
  "needs-review": { label: "Needs review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  corrected: { label: "Corrected", tone: "progress" },
};

const GROUNDING_META: Record<Grounding, { label: string; tone: "success" | "warning" | "danger"; hint: string }> = {
  grounded: { label: "Source-backed", tone: "success", hint: "Every claim maps to a cited passage." },
  partial: { label: "Partly supported", tone: "warning", hint: "The cited passage does not fully support the answer. Check it carefully." },
  none: { label: "No source found", tone: "danger", hint: "No course material matched, so the tutor declined to answer." },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs-review", label: "Needs review" },
  { id: "approved", label: "Approved" },
  { id: "corrected", label: "Corrected" },
  { id: "gap", label: "Content gaps" },
];

const initialReview = (): Review => ({ status: "needs-review", gapFlagged: false });

/** IN15 Tutor audit — review scripted tutor answers, their sources and content gaps. */
export function TutorAudit() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow={<>IN15 · Tutor audit <Badge tone="ai">Demo / Simulated</Badge></>}
        title="Tutor audit"
        description="Check tutor answers against your course material, approve or correct them, and flag topics where the material is missing."
      />
      {hydrated ? <TutorAuditContent /> : <InstructorPreviewSkeleton />}
    </>
  );
}

function TutorAuditContent() {
  const courseId = useDemo(s => s.courseId);
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  const conversations = useMemo(() => conversationsForCourse(courseId), [courseId]);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }

  const reviewOf = (id: string) => reviews[id] ?? initialReview();
  const update = (id: string, patch: Partial<Review>, message: string) => {
    setReviews(r => ({ ...r, [id]: { ...(r[id] ?? initialReview()), ...patch } }));
    setAnnouncement(message);
  };

  const matches = (c: TutorConversation) => {
    const r = reviewOf(c.id);
    return filter === "all" ? true : filter === "gap" ? r.gapFlagged : r.status === filter;
  };
  const visible = conversations.filter(matches);
  const selected = visible.find(c => c.id === selectedId) ?? visible[0];

  const counts = {
    total: conversations.length,
    needsReview: conversations.filter(c => reviewOf(c.id).status === "needs-review").length,
    gaps: conversations.filter(c => reviewOf(c.id).gapFlagged).length,
    unsupported: conversations.filter(c => c.grounding !== "grounded").length,
  };

  return (
    <div className="space-y-6">
      <div role="note" className="flex gap-3 rounded-lg border border-ai/25 bg-ai-soft px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-ai-ink" aria-hidden="true" />
        <p className="leading-6 text-ai-ink">
          <span className="font-semibold">No real AI is involved.</span> These tutor questions, answers and citations are scripted, fictional examples. Approvals, corrections and gap flags change this page only and are not saved, sent to students or used to retrain anything.
        </p>
      </div>

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="brand">{course.title}</Badge>
        <span>Viewing as <span className="font-medium text-foreground">{instructor.name}</span> (simulated assignment) · learners are anonymized</span>
      </p>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="Sample conversations" value={counts.total} />
        <Summary label="Needs review" value={counts.needsReview} />
        <Summary label="Not fully source-backed" value={counts.unsupported} />
        <Summary label="Content gaps flagged" value={counts.gaps} />
      </dl>

      <div role="group" aria-label="Filter conversations" className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Button>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="tutor-list-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle id="tutor-list-heading">Tutor conversations</CardTitle>
              <CardDescription>{visible.length} of {counts.total} shown · sample data</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-2 sm:px-0">
            {visible.length === 0 ? (
              <div className="px-5 pb-4 sm:px-6">
                <EmptyState icon={MessageSquareText} title="No conversations match" description="Try another filter to see more tutor conversations." action={<Button size="sm" variant="outline" onClick={() => setFilter("all")}>Show all</Button>} />
              </div>
            ) : (
              <ul className="divide-y divide-border border-t border-border" role="list">
                {visible.map(c => {
                  const r = reviewOf(c.id);
                  const isSelected = c.id === selected?.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        aria-controls="tutor-detail"
                        onClick={() => setSelectedId(c.id)}
                        className={cn("flex w-full flex-col gap-2 px-5 py-3 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6", isSelected && "bg-secondary/60")}
                      >
                        <span className="flex w-full items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{c.learnerLabel} · {findConcept(c.conceptId)?.title}</span>
                          <span>{c.askedLabel}</span>
                        </span>
                        <span lang={c.lang} dir={c.lang === "ar" ? "rtl" : "ltr"} className="line-clamp-2 text-sm font-medium text-foreground">{c.question}</span>
                        <span className="flex flex-wrap gap-1.5">
                          <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>
                          <Badge tone={GROUNDING_META[c.grounding].tone}>{GROUNDING_META[c.grounding].label}</Badge>
                          {r.gapFlagged ? <Badge tone="danger"><Flag aria-hidden="true" />Content gap</Badge> : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div id="tutor-detail" className="min-w-0 xl:col-span-7">
          {selected ? (
            <ConversationDetail key={selected.id} conversation={selected} review={reviewOf(selected.id)} onUpdate={(patch, msg) => update(selected.id, patch, msg)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-5 py-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
    </Card>
  );
}

function ConversationDetail({ conversation: c, review, onUpdate }: { conversation: TutorConversation; review: Review; onUpdate: (patch: Partial<Review>, message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(review.correction ?? c.answer);
  const fieldId = useId();
  const concept = findConcept(c.conceptId);
  const grounding = GROUNDING_META[c.grounding];
  const sources = c.sourceIds.map(findSource).filter(s => s !== undefined);
  const textDir = c.lang === "ar" ? "rtl" : "ltr";

  const saveCorrection = () => {
    const text = draft.trim();
    if (!text) return;
    onUpdate({ status: "corrected", correction: text }, "Correction saved on this page (simulated).");
    setEditing(false);
  };

  return (
    <Card as="article" aria-labelledby="tutor-detail-heading">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle id="tutor-detail-heading">{concept?.title} · {c.learnerLabel}</CardTitle>
          <CardDescription>{c.askedLabel} · {c.lang === "ar" ? "Asked in Arabic" : "Asked in English"}</CardDescription>
        </div>
        <Badge tone={STATUS_META[review.status].tone}>{STATUS_META[review.status].label}</Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <section aria-label="Learner question">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Learner question</p>
          <p lang={c.lang} dir={textDir} className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-foreground">{c.question}</p>
        </section>

        <section aria-label="Simulated tutor answer" className="rounded-lg border border-ai/25 bg-ai-soft/60 p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ai-ink">
              <Bot className="size-4" aria-hidden="true" /> Tutor answer · scripted mock
            </p>
            <Badge tone={grounding.tone}>{grounding.label}</Badge>
          </div>
          <p lang={c.lang} dir={textDir} className={cn("text-sm leading-6 text-foreground", review.status === "corrected" && "text-muted-foreground line-through decoration-muted-foreground/60")}>{c.answer}</p>
          <p className="mt-2 text-xs text-muted-foreground">{grounding.hint}</p>
        </section>

        {review.status === "corrected" && review.correction && !editing ? (
          <section aria-label="Instructor correction" className="rounded-lg border border-progress/30 bg-progress-soft p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-progress-ink">
              <UserCheck className="size-4" aria-hidden="true" /> Instructor-approved correction
            </p>
            <p dir="auto" className="whitespace-pre-line text-sm leading-6 text-foreground">{review.correction}</p>
          </section>
        ) : null}

        <section aria-labelledby="sources-heading">
          <h3 id="sources-heading" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <BookOpen className="size-4" aria-hidden="true" /> Cited course material (mock sources)
          </h3>
          {sources.length ? (
            <ul className="space-y-2" role="list">
              {sources.map(s => (
                <li key={s.id} className="rounded-lg border border-border px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.location}</p>
                  <blockquote className="mt-2 border-s-2 border-border ps-3 text-sm leading-6 text-muted-foreground">{s.excerpt}</blockquote>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">No matching passage in the course material. Consider flagging this as a content gap.</p>
          )}
        </section>

        {c.suggestedGap ? (
          <section aria-label="Suggested content gap" className="flex gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
            <Flag className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden="true" />
            <p className="leading-6 text-warning-ink">
              <span className="font-semibold">Possible content gap (simulated suggestion): </span>{c.suggestedGap}
            </p>
          </section>
        ) : null}

        {editing ? (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>Corrected answer</Label>
            <textarea
              id={fieldId}
              dir="auto"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={4}
              aria-describedby={`${fieldId}-hint`}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm leading-6 text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">Kept on this page only. Nothing is sent to learners.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={saveCorrection} disabled={!draft.trim()}>Save correction</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraft(review.correction ?? c.answer); setEditing(false); }}>Cancel</Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      {!editing ? (
        <CardFooter className="flex-wrap">
          <Button size="sm" onClick={() => onUpdate({ status: "approved" }, "Answer approved on this page (simulated).")} disabled={review.status === "approved"}>
            <CheckCircle2 aria-hidden="true" /> {review.status === "approved" ? "Approved" : "Approve answer"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <PencilLine aria-hidden="true" /> {review.status === "corrected" ? "Edit correction" : "Correct answer"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-pressed={review.gapFlagged}
            onClick={() => onUpdate({ gapFlagged: !review.gapFlagged }, review.gapFlagged ? "Content gap flag removed." : "Flagged as a content gap (simulated).")}
          >
            {review.gapFlagged ? <FlagOff aria-hidden="true" /> : <Flag aria-hidden="true" />}
            {review.gapFlagged ? "Remove gap flag" : "Flag content gap"}
          </Button>
          {review.status !== "needs-review" || review.gapFlagged ? (
            <Button size="sm" variant="ghost" className="ms-auto" onClick={() => { setDraft(c.answer); onUpdate(initialReview(), "Review reset to Needs review."); }}>
              <RotateCcw aria-hidden="true" /> Reset
            </Button>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
