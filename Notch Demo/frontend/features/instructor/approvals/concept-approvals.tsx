"use client";
import { useId, useState } from "react";
import { CheckCircle2, GitMerge, Inbox, Layers, ListChecks, RotateCcw, Split, XCircle } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import type { CourseId } from "@/types";
import { proposedConceptsFor, type ConceptSuggestion, type ProposedConcept } from "./mock-data";
import { AiBadge, AssignedCourseGate, ConfidenceBadge, LiveAnnouncement, ReviewSteps, SimulatedNotice, SourceLink, conceptTitle } from "./shared";

type Status = "pending" | "approved" | "merged" | "split" | "rejected";
type Draft = { title: string; decision: ConceptSuggestion; mergeTargetId: string; splitParts: string[] };
type Review = Draft & { status: Status };

const statusMeta: Record<Status, { label: string; tone: "neutral" | "success" | "progress" | "danger" | "brand" }> = {
  pending: { label: "Needs review", tone: "neutral" },
  approved: { label: "Approved (simulated)", tone: "success" },
  merged: { label: "Merged (simulated)", tone: "progress" },
  split: { label: "Split (simulated)", tone: "brand" },
  rejected: { label: "Rejected (simulated)", tone: "danger" },
};

const suggestionLabel: Record<ConceptSuggestion, string> = { approve: "Approve", merge: "Merge", split: "Split" };

const initialReview = (p: ProposedConcept, courseId: CourseId): Review => ({
  status: "pending",
  title: p.title,
  decision: p.suggestion,
  mergeTargetId: p.mergeTargetId ?? p.matchedConceptId ?? conceptsForCourse(courseId)[0].id,
  splitParts: p.splitParts ?? [p.title, ""],
});

/** IN3 — Concept approvals (simulated). */
export function ConceptApprovals() {
  return (
    <>
      <PageHeader
        eyebrow={<>Instructor portal · IN3 <AiBadge /></>}
        title="Concept approvals"
        description="Review concepts proposed from your course materials. Edit, merge, split or approve each one, and check the linked source before deciding."
      />
      <ReviewSteps />
      <SimulatedNotice />
      <AssignedCourseGate>{({ courseId }) => <ConceptReview courseId={courseId} />}</AssignedCourseGate>
    </>
  );
}

function ConceptReview({ courseId }: { courseId: CourseId }) {
  const proposals = proposedConceptsFor(courseId);
  const [reviews, setReviews] = useState<Record<string, Review>>(() => Object.fromEntries(proposals.map(p => [p.id, initialReview(p, courseId)])));
  const [selectedId, setSelectedId] = useState(proposals[0]?.id);
  const [announcement, setAnnouncement] = useState("");
  const [resetCount, setResetCount] = useState(0);

  if (!proposals.length) {
    return <EmptyState icon={Inbox} title="No proposed concepts" description="When materials are processed (simulated), proposed concepts appear here for review." />;
  }

  const counts = proposals.reduce<Record<Status, number>>((acc, p) => ({ ...acc, [reviews[p.id].status]: acc[reviews[p.id].status] + 1 }), { pending: 0, approved: 0, merged: 0, split: 0, rejected: 0 });
  const selected = proposals.find(p => p.id === selectedId) ?? proposals[0];

  const update = (id: string, patch: Partial<Review>, message?: string) => {
    setReviews(r => ({ ...r, [id]: { ...r[id], ...patch } }));
    if (message) setAnnouncement(message);
  };
  const resetAll = () => {
    setReviews(Object.fromEntries(proposals.map(p => [p.id, initialReview(p, courseId)])));
    setResetCount(n => n + 1);
    setAnnouncement("All concept decisions were reset.");
  };

  return (
    <div className="space-y-6">
      <LiveAnnouncement message={announcement} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Needs review" value={counts.pending} icon={ListChecks} accent="warning" hint="Sample proposals awaiting a decision" />
        <StatCard label="Approved" value={counts.approved} icon={CheckCircle2} accent="success" hint="Simulated status only" />
        <StatCard label="Merged or split" value={counts.merged + counts.split} icon={Layers} accent="progress" hint="Preview of the course map change" />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} accent="danger" hint="Hidden from students (simulated)" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="proposed-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="proposed-heading">Proposed concepts</CardTitle>
              <CardDescription>Select a row to review it. Confidence is a simulated extraction score.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw aria-hidden="true" />
              Reset decisions
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-2 sm:px-0">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">AI-proposed concepts for review (sample data)</caption>
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th scope="col" className="px-6 pb-2 text-start font-medium">Proposed concept</th>
                  <th scope="col" className="pb-2 pe-4 text-start font-medium">Matches existing</th>
                  <th scope="col" className="pb-2 pe-4 text-start font-medium">Confidence</th>
                  <th scope="col" className="pb-2 pe-4 text-start font-medium">AI suggestion</th>
                  <th scope="col" className="px-6 pb-2 text-end font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => {
                  const r = reviews[p.id];
                  const isSelected = p.id === selected.id;
                  return (
                    <tr key={p.id} className={cn("border-b border-border last:border-b-0", isSelected && "bg-secondary/60")}>
                      <th scope="row" className="px-6 py-2.5 text-start font-medium">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedId(p.id)}
                          className="-mx-2 rounded-md px-2 py-1 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {r.title}
                          {r.title !== p.title ? <span className="block text-xs font-normal text-muted-foreground">Edited from “{p.title}”</span> : null}
                        </button>
                      </th>
                      <td className="py-2.5 pe-4 text-muted-foreground">{p.matchedConceptId ? conceptTitle(p.matchedConceptId) : <Badge tone="outline">New concept</Badge>}</td>
                      <td className="py-2.5 pe-4"><ConfidenceBadge value={p.confidence} /></td>
                      <td className="py-2.5 pe-4 text-muted-foreground">
                        {suggestionLabel[p.suggestion]}
                        {p.suggestion === "merge" && p.mergeTargetId ? ` into ${conceptTitle(p.mergeTargetId)}` : ""}
                      </td>
                      <td className="px-6 py-2.5 text-end"><Badge tone={statusMeta[r.status].tone}>{statusMeta[r.status].label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <ConceptDetail
          key={`${selected.id}-${reviews[selected.id].status}-${resetCount}`}
          proposal={selected}
          review={reviews[selected.id]}
          courseId={courseId}
          onApply={(draft, status, message) => update(selected.id, { ...draft, status }, message)}
          onUndo={() => update(selected.id, { status: "pending" }, `${reviews[selected.id].title}: decision undone, back to Needs review.`)}
        />
      </div>
    </div>
  );
}

function ConceptDetail({
  proposal,
  review,
  courseId,
  onApply,
  onUndo,
}: {
  proposal: ProposedConcept;
  review: Review;
  courseId: CourseId;
  onApply: (draft: Draft, status: Status, message: string) => void;
  onUndo: () => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState<Draft>({ title: review.title, decision: review.decision, mergeTargetId: review.mergeTargetId, splitParts: review.splitParts });
  const courseConcepts = conceptsForCourse(courseId);
  const decided = review.status !== "pending";
  const parts = draft.splitParts.map(s => s.trim()).filter(Boolean);
  const titleMissing = !draft.title.trim();
  const splitInvalid = draft.decision === "split" && parts.length < 2;
  const statusForDecision: Record<ConceptSuggestion, Status> = { approve: "approved", merge: "merged", split: "split" };

  const preview =
    draft.decision === "approve"
      ? proposal.matchedConceptId
        ? `“${draft.title.trim() || "…"}” is confirmed as the existing concept ${conceptTitle(proposal.matchedConceptId)} (ID ${proposal.matchedConceptId}); its prerequisites stay the same.`
        : `“${draft.title.trim() || "…"}” is added as a new concept. Prerequisite links are reviewed next in Graph review (IN4).`
      : draft.decision === "merge"
        ? `“${draft.title.trim() || "…"}” is folded into ${conceptTitle(draft.mergeTargetId)} (ID ${draft.mergeTargetId}). That concept keeps its ID, prerequisites and questions; the source passage is linked to it.`
        : `“${draft.title.trim() || "…"}” becomes ${parts.length} concepts: ${parts.map(p => `“${p}”`).join(", ") || "…"}. Each needs its own prerequisite links in Graph review (IN4).`;

  return (
    <Card as="aside" aria-labelledby={`${uid}-heading`} className="min-w-0 xl:col-span-5">
      <CardHeader>
        <div className="min-w-0">
          <CardTitle id={`${uid}-heading`}>Review: {review.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta[review.status].tone}>{statusMeta[review.status].label}</Badge>
            <ConfidenceBadge value={proposal.confidence} />
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-ai/20 bg-ai-soft/60 p-3 text-sm leading-6 text-ai-ink">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">AI rationale · simulated</p>
          {proposal.rationale}
        </div>

        <section aria-labelledby={`${uid}-source`}>
          <h3 id={`${uid}-source`} className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Linked source</h3>
          <SourceLink source={proposal.source} />
        </section>

        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            if (titleMissing || splitInvalid) return;
            const status = statusForDecision[draft.decision];
            onApply({ ...draft, title: draft.title.trim() }, status, `${draft.title.trim()}: ${statusMeta[status].label}.`);
          }}
        >
          <div className="grid gap-1.5">
            <label htmlFor={`${uid}-title`} className="text-xs font-semibold text-muted-foreground">Concept name (edit)</label>
            <input
              id={`${uid}-title`}
              value={draft.title}
              disabled={decided}
              aria-invalid={titleMissing}
              aria-describedby={titleMissing ? `${uid}-title-error` : undefined}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            {titleMissing ? <p id={`${uid}-title-error`} className="text-xs text-danger-ink">Enter a concept name.</p> : null}
          </div>

          <fieldset disabled={decided} className="space-y-2">
            <legend className="mb-1 text-xs font-semibold text-muted-foreground">Decision</legend>
            {(["approve", "merge", "split"] as const).map(option => {
              const Icon = option === "approve" ? CheckCircle2 : option === "merge" ? GitMerge : Split;
              return (
                <label key={option} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", draft.decision === option ? "border-primary bg-secondary/60" : "border-border")}>
                  <input type="radio" name={`${uid}-decision`} value={option} checked={draft.decision === option} onChange={() => setDraft(d => ({ ...d, decision: option }))} className="accent-[var(--color-primary)]" />
                  <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium">{option === "approve" ? "Approve" : option === "merge" ? "Merge into an existing concept" : "Split into separate concepts"}</span>
                  {proposal.suggestion === option ? <Badge tone="ai" className="ms-auto">AI suggestion</Badge> : null}
                </label>
              );
            })}
          </fieldset>

          {draft.decision === "merge" ? (
            <div className="grid gap-1.5">
              <label htmlFor={`${uid}-merge`} className="text-xs font-semibold text-muted-foreground">Merge into</label>
              <select
                id={`${uid}-merge`}
                value={draft.mergeTargetId}
                disabled={decided}
                onChange={e => setDraft(d => ({ ...d, mergeTargetId: e.target.value }))}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {courseConcepts.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          ) : null}

          {draft.decision === "split" ? (
            <fieldset disabled={decided} className="grid gap-2">
              <legend className="mb-1 text-xs font-semibold text-muted-foreground">Split into (at least two)</legend>
              {draft.splitParts.map((part, i) => (
                <div key={i} className="grid gap-1">
                  <label htmlFor={`${uid}-part-${i}`} className="sr-only">Part {i + 1} name</label>
                  <input
                    id={`${uid}-part-${i}`}
                    value={part}
                    placeholder={`Part ${i + 1} name`}
                    onChange={e => setDraft(d => ({ ...d, splitParts: d.splitParts.map((p, j) => (j === i ? e.target.value : p)) }))}
                    className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  />
                </div>
              ))}
              {draft.splitParts.length < 4 ? (
                <Button variant="link" size="sm" className="justify-self-start" onClick={() => setDraft(d => ({ ...d, splitParts: [...d.splitParts, ""] }))}>
                  Add another part
                </Button>
              ) : null}
              {splitInvalid ? <p className="text-xs text-danger-ink">Enter at least two part names.</p> : null}
            </fieldset>
          ) : null}

          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Preview · {decided ? "applied (simulated)" : "not yet applied"}</p>
            <p className="leading-6 text-foreground">{preview}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {decided ? (
              <Button variant="outline" onClick={onUndo}>
                <RotateCcw aria-hidden="true" />
                Undo decision
              </Button>
            ) : (
              <>
                <Button type="submit" disabled={titleMissing || splitInvalid}>
                  <CheckCircle2 aria-hidden="true" />
                  {draft.decision === "approve" ? "Approve" : draft.decision === "merge" ? "Merge" : "Split"} (simulated)
                </Button>
                <Button variant="outline" onClick={() => onApply(draft, "rejected", `${draft.title}: Rejected (simulated).`)}>
                  <XCircle aria-hidden="true" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
