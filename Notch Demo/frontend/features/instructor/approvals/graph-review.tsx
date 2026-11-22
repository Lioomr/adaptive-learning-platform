"use client";
import { useId, useState } from "react";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, GitBranch, Inbox, ListChecks, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/learning/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { conceptsForCourse } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import type { Concept, CourseId } from "@/types";
import { checkEdge, conceptLevels, fixtureEdges, type Edge, type EdgeCheck } from "./graph-utils";
import { proposedEdgesFor, type ProposedEdge } from "./mock-data";
import { AiBadge, AssignedCourseGate, ConfidenceBadge, LiveAnnouncement, ReviewSteps, SimulatedNotice, SourceLink, conceptTitle } from "./shared";

type Status = "pending" | "accepted" | "rejected";
type EdgeState = { status: Status; flipped: boolean };

const statusMeta: Record<Status, { label: string; tone: "neutral" | "success" | "danger" }> = {
  pending: { label: "Needs review", tone: "neutral" },
  accepted: { label: "Accepted (simulated)", tone: "success" },
  rejected: { label: "Rejected (simulated)", tone: "danger" },
};

/** IN4 — Prerequisite graph review (simulated, local state only). */
export function GraphReview() {
  return (
    <>
      <PageHeader
        eyebrow={<>Instructor portal · IN4 <AiBadge /></>}
        title="Graph review"
        description="Check AI-proposed prerequisite links before they shape student recommendations. Accept, reject or flip each link; direction and cycle warnings update as you decide."
      />
      <ReviewSteps />
      <SimulatedNotice>AI-proposed links are fictional. Decisions change the graph on this page only; the shared course map and student recommendations are not modified.</SimulatedNotice>
      <AssignedCourseGate>{({ courseId }) => <GraphWorkspace courseId={courseId} />}</AssignedCourseGate>
    </>
  );
}

const effective = (e: ProposedEdge, s: EdgeState): ProposedEdge => (s.flipped ? { ...e, from: e.to, to: e.from, sourceOrderReversed: !e.sourceOrderReversed } : e);

function GraphWorkspace({ courseId }: { courseId: CourseId }) {
  const concepts = conceptsForCourse(courseId);
  const proposals = proposedEdgesFor(courseId);
  const initial = () => Object.fromEntries(proposals.map(p => [p.id, { status: "pending", flipped: false } as EdgeState]));
  const [state, setState] = useState<Record<string, EdgeState>>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(proposals[0]?.id ?? null);
  const [announcement, setAnnouncement] = useState("");

  const levels = conceptLevels(concepts);
  const approved = fixtureEdges(concepts);
  const current = proposals.map(p => ({ proposal: p, edge: effective(p, state[p.id]), state: state[p.id] }));
  const acceptedProposals = current.filter(c => c.state.status === "accepted").map(c => c.edge);
  const acceptedSet: Edge[] = [...approved, ...acceptedProposals];
  const checks: Record<string, EdgeCheck> = Object.fromEntries(
    current.map(c => [c.proposal.id, checkEdge(c.edge, c.state.status === "accepted" ? acceptedSet.filter(e => e !== c.edge) : acceptedSet)]),
  );

  const set = (id: string, patch: Partial<EdgeState>, message: string) => {
    setState(s => ({ ...s, [id]: { ...s[id], ...patch } }));
    setAnnouncement(message);
  };
  const label = (e: Edge) => `${conceptTitle(e.from)} → ${conceptTitle(e.to)}`;

  if (!proposals.length) {
    return <EmptyState icon={Inbox} title="No proposed links" description="When concepts are approved (simulated), proposed prerequisite links appear here." />;
  }

  const pending = current.filter(c => c.state.status === "pending");
  const warnings = pending.filter(c => checks[c.proposal.id].cyclePath || checks[c.proposal.id].directionWarning || checks[c.proposal.id].duplicate).length;

  return (
    <div className="space-y-6">
      <LiveAnnouncement message={announcement} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Approved links" value={approved.length} icon={GitBranch} hint="Existing course map (shared fixtures)" />
        <StatCard label="Needs review" value={pending.length} icon={ListChecks} accent="ai" hint="AI-proposed links (sample)" />
        <StatCard label="Warnings" value={warnings} icon={AlertTriangle} accent="warning" hint="Direction, cycle or duplicate checks" />
        <StatCard label="Accepted this session" value={acceptedProposals.length} icon={CheckCircle2} accent="success" hint="Simulated, not saved" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="graph-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="graph-heading">Prerequisite graph</CardTitle>
              <CardDescription>Arrows point from a prerequisite to the concept that builds on it.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setState(initial());
                setAnnouncement("All link decisions were reset.");
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reset review
            </Button>
          </CardHeader>
          <CardContent>
            <GraphLegend />
            <ConceptGraph concepts={concepts} levels={levels} approved={approved} items={current} checks={checks} selectedId={selectedId} onSelect={setSelectedId} />
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="links-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle id="links-heading">Proposed links</CardTitle>
              <CardDescription>Select a link to highlight it in the graph.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 sm:pt-0">
            <ul className="space-y-3" role="list">
              {current.map(({ proposal, edge, state: s }) => (
                <EdgeItem
                  key={proposal.id}
                  edge={edge}
                  state={s}
                  check={checks[proposal.id]}
                  selected={selectedId === proposal.id}
                  onSelect={() => setSelectedId(proposal.id)}
                  onAccept={() => set(proposal.id, { status: "accepted" }, `${label(edge)}: accepted (simulated).`)}
                  onReject={() => set(proposal.id, { status: "rejected" }, `${label(edge)}: rejected (simulated).`)}
                  onFlip={() => set(proposal.id, { flipped: !s.flipped }, `Direction flipped: now ${conceptTitle(edge.to)} → ${conceptTitle(edge.from)}.`)}
                  onUndo={() => set(proposal.id, { status: "pending" }, `${label(edge)}: back to Needs review.`)}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EdgeItem({
  edge,
  state,
  check,
  selected,
  onSelect,
  onAccept,
  onReject,
  onFlip,
  onUndo,
}: {
  edge: ProposedEdge;
  state: EdgeState;
  check: EdgeCheck;
  selected: boolean;
  onSelect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onFlip: () => void;
  onUndo: () => void;
}) {
  const uid = useId();
  const blocked = !!check.cyclePath || check.duplicate;
  const pending = state.status === "pending";
  return (
    <li className={cn("rounded-lg border p-3", selected ? "border-ai bg-ai-soft/40" : "border-border")}>
      <button type="button" aria-pressed={selected} onClick={onSelect} className="-m-1 flex w-[calc(100%+0.5rem)] flex-wrap items-center gap-2 rounded-md p-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="font-semibold text-foreground">
          {conceptTitle(edge.from)}
          <span aria-hidden="true" className="mx-1 inline-block rtl:rotate-180">→</span>
          <span className="sr-only"> is a prerequisite for </span>
          {conceptTitle(edge.to)}
        </span>
        <Badge tone={statusMeta[state.status].tone} className="ms-auto">{statusMeta[state.status].label}</Badge>
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ConfidenceBadge value={edge.confidence} />
        {state.flipped ? <Badge tone="brand">Direction flipped</Badge> : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-ai-ink">AI rationale (simulated): </span>
        {edge.rationale}
      </p>

      <div id={`${uid}-warnings`} className="mt-2 space-y-1.5">
        {check.cyclePath ? (
          <p className="flex gap-2 rounded-md bg-danger-soft px-2.5 py-1.5 text-sm text-danger-ink">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-semibold">Cycle warning:</span> accepting would create a loop ({[...check.cyclePath, check.cyclePath[0]].map(conceptTitle).join(" → ")}). Flip or reject this link.
            </span>
          </p>
        ) : null}
        {check.duplicate ? (
          <p className="flex gap-2 rounded-md bg-muted px-2.5 py-1.5 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span><span className="font-semibold">Already in the map:</span> this link duplicates an approved or accepted link. Reject it.</span>
          </p>
        ) : null}
        {check.directionWarning && !check.cyclePath && !check.duplicate ? (
          <p className="flex gap-2 rounded-md bg-warning-soft px-2.5 py-1.5 text-sm text-warning-ink">
            <ArrowLeftRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span><span className="font-semibold">Direction check:</span> the linked source presents these concepts in the opposite order. Consider flipping.</span>
          </p>
        ) : null}
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer rounded text-xs font-semibold text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">Linked source</summary>
        <SourceLink source={edge.source} className="mt-2" />
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        {pending ? (
          <>
            <Button size="sm" onClick={onAccept} disabled={blocked} aria-describedby={blocked ? `${uid}-warnings` : undefined}>
              <CheckCircle2 aria-hidden="true" />
              Accept
            </Button>
            <Button size="sm" variant="outline" onClick={onReject}>
              <XCircle aria-hidden="true" />
              Reject
            </Button>
            <Button size="sm" variant="ghost" onClick={onFlip}>
              <RefreshCcw aria-hidden="true" />
              Flip direction
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onUndo}>
            <RotateCcw aria-hidden="true" />
            Undo
          </Button>
        )}
      </div>
    </li>
  );
}

function GraphLegend() {
  const items = [
    { label: "Approved (course map)", line: "stroke-muted-foreground", dash: undefined },
    { label: "AI proposed · needs review", line: "stroke-ai", dash: "5 4" },
    { label: "Accepted this session", line: "stroke-success", dash: undefined },
    { label: "Cycle warning", line: "stroke-danger", dash: "5 4" },
  ];
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" role="list" aria-label="Graph legend">
      {items.map(i => (
        <li key={i.label} className="flex items-center gap-1.5">
          <svg width="24" height="8" aria-hidden="true">
            <line x1="0" y1="4" x2="24" y2="4" strokeWidth="2" strokeDasharray={i.dash} className={i.line} />
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}

const NODE_W = 124;
const NODE_H = 44;
const COL_W = 152;
const ROW_H = 72;
const PAD = 24;

type Tone = "approved" | "proposed" | "accepted" | "cycle";
const toneClass: Record<Tone, string> = { approved: "stroke-muted-foreground", proposed: "stroke-ai", accepted: "stroke-success", cycle: "stroke-danger" };
const markerClass: Record<Tone, string> = { approved: "fill-muted-foreground", proposed: "fill-ai", accepted: "fill-success", cycle: "fill-danger" };

function ConceptGraph({
  concepts,
  levels,
  approved,
  items,
  checks,
  selectedId,
  onSelect,
}: {
  concepts: Concept[];
  levels: Record<string, number>;
  approved: Edge[];
  items: { proposal: ProposedEdge; edge: ProposedEdge; state: EdgeState }[];
  checks: Record<string, EdgeCheck>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const maxLevel = Math.max(0, ...Object.values(levels));
  const columns: string[][] = Array.from({ length: maxLevel + 1 }, () => []);
  concepts.forEach(c => columns[levels[c.id] ?? 0].push(c.id));
  const maxRows = Math.max(...columns.map(c => c.length));
  const width = PAD * 2 + maxLevel * COL_W + NODE_W;
  const height = PAD * 2 + 40 + (maxRows - 1) * ROW_H + NODE_H;

  const pos: Record<string, { x: number; y: number }> = {};
  columns.forEach((ids, level) => {
    const offset = ((maxRows - ids.length) * ROW_H) / 2;
    ids.forEach((id, row) => {
      const x = PAD + level * COL_W;
      pos[id] = { x: rtl ? width - x - NODE_W : x, y: PAD + 40 + offset + row * ROW_H };
    });
  });

  const selected = items.find(i => i.proposal.id === selectedId);
  const highlight = selected && selected.state.status !== "rejected" ? new Set([selected.edge.from, selected.edge.to]) : new Set<string>();

  const path = (e: Edge) => {
    const a = pos[e.from];
    const b = pos[e.to];
    if (!a || !b) return "";
    const forward = rtl ? b.x < a.x : b.x > a.x;
    if (forward) {
      const x1 = rtl ? a.x : a.x + NODE_W;
      const x2 = rtl ? b.x + NODE_W : b.x;
      const y1 = a.y + NODE_H / 2;
      const y2 = b.y + NODE_H / 2;
      const dx = (x2 - x1) / 2;
      return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }
    if (a.x === b.x) {
      const x = rtl ? a.x : a.x + NODE_W;
      const bulge = rtl ? -48 : 48;
      return `M ${x} ${a.y + NODE_H / 2} C ${x + bulge} ${a.y + NODE_H / 2}, ${x + bulge} ${b.y + NODE_H / 2}, ${x} ${b.y + NODE_H / 2}`;
    }
    const x1 = a.x + NODE_W / 2;
    const x2 = b.x + NODE_W / 2;
    const top = Math.min(a.y, b.y) - 36;
    return `M ${x1} ${a.y} C ${x1} ${top}, ${x2} ${top}, ${x2} ${b.y}`;
  };

  const summary = [
    `${approved.length} approved links.`,
    ...items.filter(i => i.state.status !== "rejected").map(i => `${conceptTitle(i.edge.from)} to ${conceptTitle(i.edge.to)}: ${statusMeta[i.state.status].label}${checks[i.proposal.id].cyclePath ? ", cycle warning" : ""}.`),
  ].join(" ");

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto min-w-[720px] w-full" role="img" aria-label={`Prerequisite graph (sample review). ${summary}`}>
        <defs>
          {(Object.keys(toneClass) as Tone[]).map(t => (
            <marker key={t} id={`${uid}-arrow-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className={markerClass[t]} />
            </marker>
          ))}
        </defs>

        {Array.from({ length: maxLevel + 1 }, (_, level) => {
          const x = PAD + level * COL_W + NODE_W / 2;
          return (
            <text key={level} x={rtl ? width - x : x} y={PAD + 12} textAnchor="middle" className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
              Level {level + 1}
            </text>
          );
        })}

        {approved.map(e => (
          <path key={`${e.from}-${e.to}`} d={path(e)} fill="none" strokeWidth={1.5} className={toneClass.approved} markerEnd={`url(#${uid}-arrow-approved)`} />
        ))}

        {items
          .filter(i => i.state.status !== "rejected")
          .map(i => {
            const tone: Tone = i.state.status === "accepted" ? "accepted" : checks[i.proposal.id].cyclePath ? "cycle" : "proposed";
            const isSelected = i.proposal.id === selectedId;
            return (
              <g key={i.proposal.id} onClick={() => onSelect(i.proposal.id)} className="cursor-pointer">
                <path d={path(i.edge)} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  d={path(i.edge)}
                  fill="none"
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={tone === "accepted" ? undefined : "6 4"}
                  className={toneClass[tone]}
                  markerEnd={`url(#${uid}-arrow-${tone})`}
                />
              </g>
            );
          })}

        {concepts.map(c => {
          const p = pos[c.id];
          const hl = highlight.has(c.id);
          return (
            <g key={c.id}>
              <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={8} className={cn("fill-card", hl ? "stroke-ai" : "stroke-border")} strokeWidth={hl ? 2 : 1} />
              <foreignObject x={p.x} y={p.y} width={NODE_W} height={NODE_H}>
                <div className="flex h-full items-center justify-center px-2 text-center text-[11px] font-medium leading-tight text-foreground">{c.title}</div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
