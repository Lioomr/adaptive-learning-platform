"use client";
import * as React from "react";
import { AlertTriangle, CheckCircle2, FileText, FlaskConical, History, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { findConcept, findCourse } from "@/data/fixtures";
import { useHydrated } from "@/hooks/use-hydrated";
import { canInstructorViewCourse, instructorForCourse } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useDemo } from "@/store/demo";
import type { CourseId } from "@/types";
import {
  ACCEPTED_TYPES,
  LOW_CONFIDENCE,
  MAX_SIZE_MB,
  formatSize,
  initialMaterials,
  sampleAdditions,
  simulatedOutcomeFor,
  stageFor,
  statusLabel,
  type Material,
  type MaterialStatus,
} from "./materials-mock";

const TICK_MS = 500;
const STEP = 9;

/** IN2 Upload materials (Demo / Simulated — no file is uploaded or read). */
export function MaterialsWorkspace() {
  const hydrated = useHydrated();
  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <span>IN2 · Upload materials</span>
            <Badge tone="ai">
              <FlaskConical aria-hidden="true" /> Demo / Simulated
            </Badge>
          </>
        }
        title="Course materials"
        description="Add lecture slides, notes and handouts. Extraction is simulated: files are not uploaded, read or stored, and results are sample data."
      />
      {hydrated ? (
        <MaterialsContent />
      ) : (
        <div role="status" aria-label="Loading materials" className="space-y-6">
          <Skeleton className="h-44" />
          <Skeleton className="h-72" />
        </div>
      )}
    </>
  );
}

function MaterialsContent() {
  const courseId = useDemo(s => s.courseId);
  const course = findCourse(courseId);
  const instructor = instructorForCourse(courseId);
  const [byCourse, setByCourse] = React.useState(initialMaterials);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const sampleIndex = React.useRef<Record<CourseId, number>>({ "C-PY": 0, "C-MATH": 0 });
  const counter = React.useRef(0);

  const materials = byCourse[courseId];
  const processing = Object.values(byCourse).some(list => list.some(m => m.progress < 100));

  // Simulated extraction pipeline: advance progress on a timer, then settle on a preset result.
  React.useEffect(() => {
    if (!processing) return;
    const timer = window.setInterval(() => {
      setByCourse(prev => {
        const next = { ...prev };
        (Object.keys(next) as CourseId[]).forEach(cid => {
          next[cid] = next[cid].map(m => {
            if (m.progress >= 100) return m;
            const progress = Math.min(100, m.progress + STEP);
            const status: MaterialStatus = progress >= 100 ? (m.confidence < LOW_CONFIDENCE ? "needs-review" : "ready") : stageFor(progress);
            return { ...m, progress, status };
          });
        });
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [processing]);

  if (!course || !instructor || !canInstructorViewCourse(instructor.id, courseId)) {
    return <ErrorState title="Course not assigned" description="This simulated instructor is not assigned to the selected course." />;
  }

  const nextId = () => `MAT-LOCAL-${++counter.current}`;

  const addMaterials = (items: Material[]) => {
    setByCourse(prev => ({ ...prev, [courseId]: [...items, ...prev[courseId]] }));
    setAnnouncement(`${items.length} file${items.length === 1 ? "" : "s"} added. Simulated extraction started.`);
  };

  const addFromDevice = (files: FileList | File[]) => {
    const list = Array.from(files);
    const accepted = list.filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024);
    const rejected = list.length - accepted.length;
    if (accepted.length) {
      addMaterials(
        accepted.map<Material>(f => {
          const outcome = simulatedOutcomeFor(f.name);
          return {
            id: nextId(),
            courseId,
            name: f.name,
            kind: outcome.kind,
            pages: outcome.kind === "Scan" ? 1 : 1 + (f.name.length % 24),
            sizeKb: Math.max(1, Math.round(f.size / 1024)),
            conceptIds: [],
            confidence: outcome.confidence,
            lowConfidenceReason: outcome.lowConfidenceReason,
            status: "queued",
            progress: 0,
            versions: [{ version: 1, addedLabel: "Just now (this session)", note: "Added from this device. Name and size only; contents were not read." }],
          };
        }),
      );
    }
    if (rejected) setAnnouncement(`${rejected} file${rejected === 1 ? " was" : "s were"} larger than ${MAX_SIZE_MB} MB and not added.`);
  };

  const addSample = () => {
    const pool = sampleAdditions[courseId];
    const i = sampleIndex.current[courseId] % pool.length;
    sampleIndex.current[courseId] += 1;
    const sample = pool[i];
    addMaterials([
      { ...sample, id: nextId(), status: "queued", progress: 0, versions: [{ version: 1, addedLabel: "Just now (this session)", note: "Sample file added for the demo." }] },
    ]);
  };

  const addVersion = (id: string) => {
    setByCourse(prev => ({
      ...prev,
      [courseId]: prev[courseId].map(m =>
        m.id === id
          ? {
              ...m,
              status: "queued",
              progress: 0,
              versions: [{ version: m.versions[0].version + 1, addedLabel: "Just now (this session)", note: "New version (simulated). Previous version kept for reference." }, ...m.versions],
            }
          : m,
      ),
    }));
    setAnnouncement("New version added. Simulated extraction restarted.");
  };

  const remove = (id: string) => {
    const target = materials.find(m => m.id === id);
    setByCourse(prev => ({ ...prev, [courseId]: prev[courseId].filter(m => m.id !== id) }));
    if (selectedId === id) setSelectedId(null);
    setAnnouncement(`${target?.name ?? "File"} removed from this list (demo state only).`);
  };

  const lowConfidence = materials.filter(m => m.status === "needs-review");
  const selected = materials.find(m => m.id === selectedId) ?? materials[0];
  const readyCount = materials.filter(m => m.status === "ready").length;
  const inProgress = materials.filter(m => m.progress < 100).length;

  return (
    <div className="space-y-6">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge tone="brand">{course.title}</Badge>
        <span>
          Materials for <span className="font-medium text-foreground">{instructor.name}</span> (simulated assignment) · {materials.length} files · {readyCount} ready ·{" "}
          {lowConfidence.length} need review{inProgress ? ` · ${inProgress} processing` : ""}
        </span>
      </p>

      <Dropzone onFiles={addFromDevice} onSample={addSample} />

      {lowConfidence.length ? (
        <section aria-labelledby="low-conf-heading" className="flex gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="low-conf-heading" className="font-semibold text-warning-ink">
              Low-confidence extraction · {lowConfidence.length} file{lowConfidence.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-0.5 leading-6 text-foreground/80">
              Simulated confidence is below {LOW_CONFIDENCE}%. Check these files before their suggested concepts are used in concept approvals (IN3).
            </p>
            <ul className="mt-2 space-y-1" role="list">
              {lowConfidence.map(m => (
                <li key={m.id}>
                  <button type="button" onClick={() => setSelectedId(m.id)} className="rounded text-start font-medium text-warning-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                    {m.name}
                  </button>{" "}
                  <span className="text-foreground/80">— {m.confidence}%. {m.lowConfidenceReason}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="files-heading" className="min-w-0 xl:col-span-8">
          <CardHeader>
            <div>
              <CardTitle id="files-heading">Files</CardTitle>
              <CardDescription>Sample data · confidence and concept matches are simulated.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className={cn(materials.length && "px-0 pb-2 sm:px-0")}>
            {materials.length ? (
              <ul className="divide-y divide-border" role="list">
                {materials.map(m => (
                  <FileRow key={m.id} material={m} selected={m.id === selected?.id} onSelect={() => setSelectedId(m.id)} onRemove={() => remove(m.id)} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={FileText} title="No materials yet" description="Drop files above or add a sample file to see simulated extraction." />
            )}
          </CardContent>
        </Card>

        <Card as="aside" aria-labelledby="versions-heading" className="min-w-0 xl:col-span-4 xl:self-start">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <History className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <CardTitle id="versions-heading">Versions</CardTitle>
                <CardDescription className="break-words">{selected ? selected.name : "Select a file to see its versions."}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Suggested concepts (simulated)</p>
                  {selected.progress < 100 ? (
                    <p className="text-sm text-muted-foreground">Available when simulated extraction finishes.</p>
                  ) : selected.conceptIds.length ? (
                    <ul className="flex flex-wrap gap-1.5" role="list">
                      {selected.conceptIds.map(id => (
                        <li key={id}>
                          <Badge tone="ai">{findConcept(id)?.title ?? id}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No concept match in the demo for files added from your device.</p>
                  )}
                </div>
                <ol className="space-y-3 border-s border-border ps-4" role="list">
                  {selected.versions.map((v, i) => (
                    <li key={v.version} className="relative">
                      <span aria-hidden="true" className={cn("absolute -start-[21px] top-1.5 size-2.5 rounded-full", i === 0 ? "bg-progress" : "bg-border")} />
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        Version {v.version}
                        {i === 0 ? <Badge tone="progress">Current</Badge> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.addedLabel}</p>
                      <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{v.note}</p>
                    </li>
                  ))}
                </ol>
                <Button variant="outline" className="w-full" onClick={() => addVersion(selected.id)} disabled={selected.progress < 100}>
                  <UploadCloud aria-hidden="true" /> Add new version (simulated)
                </Button>
              </div>
            ) : (
              <EmptyState icon={History} title="No file selected" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dropzone({ onFiles, onSample }: { onFiles: (files: FileList) => void; onSample: () => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  return (
    <section
      aria-labelledby="dropzone-heading"
      onDragOver={e => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        dragging ? "border-progress bg-progress-soft/60" : "border-border bg-card",
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <UploadCloud className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h2 id="dropzone-heading" className="text-base font-semibold text-foreground">
          Drop course files here
        </h2>
        <p id="dropzone-hint" className="mt-1 text-sm text-muted-foreground">
          PDF, PPTX, DOCX or images up to {MAX_SIZE_MB} MB. Simulated: only the file name and size are used; nothing leaves this browser.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => inputRef.current?.click()} aria-describedby="dropzone-hint">
          <UploadCloud aria-hidden="true" /> Choose files
        </Button>
        <Button variant="outline" onClick={onSample}>
          <Plus aria-hidden="true" /> Add sample file
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={e => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}

const statusTone: Record<MaterialStatus, "neutral" | "progress" | "success" | "warning"> = {
  queued: "neutral",
  extracting: "progress",
  detecting: "progress",
  ready: "success",
  "needs-review": "warning",
};

function FileRow({ material: m, selected, onSelect, onRemove }: { material: Material; selected: boolean; onSelect: () => void; onRemove: () => void }) {
  const busy = m.progress < 100;
  return (
    <li className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 sm:px-6", selected && "bg-secondary/60")}>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{m.name}</span>
          <span className="block text-xs text-muted-foreground">
            {m.kind} · {m.pages} {m.pages === 1 ? "page" : "pages"} · {formatSize(m.sizeKb)} · v{m.versions[0].version}
          </span>
        </span>
      </button>

      <div className="flex w-full items-center gap-3 sm:w-56">
        {busy ? (
          <div className="w-full">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-progress-ink">
                <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden="true" />
                {statusLabel[m.status]}
              </span>
              <span className="tabular-nums text-muted-foreground">{m.progress}%</span>
            </div>
            <Progress value={m.progress} aria-label={`${m.name} simulated extraction progress`} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[m.status]}>
              {m.status === "ready" ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              {statusLabel[m.status]}
            </Badge>
            <span className={cn("text-xs tabular-nums", m.confidence < LOW_CONFIDENCE ? "text-warning-ink" : "text-muted-foreground")}>{m.confidence}% confidence</span>
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={busy} aria-label={`Remove ${m.name} from list`} title="Remove from list (demo state only)">
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}
