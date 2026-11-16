"use client";
import { useState } from "react";
import { FilePlus2, FileQuestion, SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { conceptsForCourse, findConcept, questions } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { contentGaps, gapKindLabel, instructorLinks, QUESTIONS_PER_CONCEPT_TARGET, type ContentGap } from "./data";
import { fieldClass, P1Screen, ScreenLink, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

type Added = { gapId: string; title: string; type: string; language: string; fileName: string };

/** IN11 content gaps + IN12 add missing materials. */
export function ContentGapsScreen() {
  return (
    <P1Screen screenIds="IN11 · IN12" title="Content gaps" description="Where students need material that the course does not yet provide, based on sample tutor questions and question-bank coverage. Add the missing material as a simulated draft.">
      {ctx => <GapsContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

function GapsContent({ courseId, course }: CourseContext) {
  const gaps = contentGaps.filter(g => g.courseId === courseId).sort((a, b) => b.signal - a.signal);
  const [selectedId, setSelectedId] = useState<string | null>(gaps[0]?.id ?? null);
  const [added, setAdded] = useState<Added[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const selected = gaps.find(g => g.id === selectedId) ?? null;
  const coverage = conceptsForCourse(courseId).map(c => ({ concept: c, count: questions.filter(q => q.conceptId === c.id).length }));
  const resolvedIds = new Set(added.map(a => a.gapId));

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="min-w-0 space-y-6 xl:col-span-7">
        <Card as="section" aria-labelledby="gaps-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning-ink"><SearchX className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="gaps-heading">Detected gaps (IN11)</CardTitle>
                <CardDescription>{gaps.length} sample gaps · sorted by number of student signals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {gaps.length === 0 ? (
              <EmptyState title="No content gaps" description="No sample gaps are recorded for this course." />
            ) : (
              <ul className="space-y-3" role="list">
                {gaps.map(g => {
                  const concept = findConcept(g.conceptId);
                  const active = g.id === selectedId;
                  const resolved = resolvedIds.has(g.id);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedId(g.id)}
                        className={cn("w-full rounded-lg border p-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/50", active ? "border-brand-2 bg-secondary/50" : "border-border")}
                      >
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{concept?.title} · {gapKindLabel[g.kind]}</span>
                          {resolved ? <Badge tone="ai">Draft added (simulated)</Badge> : <Badge tone="warning">{g.signal} signals</Badge>}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{g.evidence}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">Source: {g.origin} · sample data</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <ScreenLink href={instructorLinks.tutorAudit}>Tutor audit (IN15)</ScreenLink>
              <ScreenLink href={instructorLinks.questions}>Question approvals (IN5)</ScreenLink>
            </div>
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="coverage-heading">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand-2"><FileQuestion className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="coverage-heading">Question-bank coverage</CardTitle>
                <CardDescription>From the shared illustrative bank. Target {QUESTIONS_PER_CONCEPT_TARGET} per concept; the full bank is a release blocker (MAH-28).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2" role="list">
              {coverage.map(({ concept, count }) => (
                <li key={concept.id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{concept.title}</span>
                    <span className="tabular-nums text-muted-foreground">{count}/{QUESTIONS_PER_CONCEPT_TARGET}</span>
                  </div>
                  <Progress value={(100 * count) / QUESTIONS_PER_CONCEPT_TARGET} tone={count >= QUESTIONS_PER_CONCEPT_TARGET ? "success" : "warning"} aria-label={`${concept.title}: ${count} of ${QUESTIONS_PER_CONCEPT_TARGET} questions`} className="mt-1.5 h-1.5" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6 xl:col-span-5">
        <AddMaterialForm
          key={selected?.id ?? "none"}
          gap={selected}
          courseTitle={course.title}
          onAdd={item => {
            setAdded(a => [...a, item]);
            setMessage(`“${item.title}” saved as a simulated draft. Nothing was uploaded or published.`);
          }}
        />
        <StatusMessage message={message} />
        <Card as="section" aria-labelledby="added-heading">
          <CardHeader>
            <div>
              <CardTitle id="added-heading">Drafts added this session</CardTitle>
              <CardDescription>Local demo state only; cleared on reload.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {added.length === 0 ? (
              <EmptyState icon={FilePlus2} title="No drafts yet" description="Select a gap and add the missing material." />
            ) : (
              <ul className="divide-y divide-border" role="list">
                {added.map((a, i) => (
                  <li key={`${a.gapId}-${i}`} className="py-2.5 text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.type} · {a.language}{a.fileName ? ` · ${a.fileName}` : ""} · awaiting concept link review</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddMaterialForm({ gap, courseTitle, onAdd }: { gap: ContentGap | null; courseTitle: string; onAdd: (item: Added) => void }) {
  const concept = gap ? findConcept(gap.conceptId) : undefined;
  const defaultType = gap?.kind === "questions" ? "Practice questions" : gap?.kind === "arabic" ? "Translated slides" : "Worked example";
  const [title, setTitle] = useState(concept ? `${concept.title}: ${defaultType.toLowerCase()}` : "");
  const [type, setType] = useState(defaultType);
  const [language, setLanguage] = useState(gap?.kind === "arabic" ? "Arabic" : "English");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Card as="section" aria-labelledby="add-heading">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink"><FilePlus2 className="size-4" aria-hidden="true" /></span>
          <div>
            <CardTitle id="add-heading">Add missing material (IN12)</CardTitle>
            <CardDescription>{concept ? `For ${concept.title} in ${courseTitle}` : "Select a gap first"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!gap ? (
          <EmptyState title="No gap selected" description="Choose a gap from the list to prepare material for it." />
        ) : (
          <form
            noValidate
            className="space-y-4"
            onSubmit={e => {
              e.preventDefault();
              if (!title.trim()) {
                setError("Enter a title for the material.");
                return;
              }
              setError(null);
              onAdd({ gapId: gap.id, title: title.trim(), type, language, fileName: fileName.trim() });
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="material-title" className="text-xs font-semibold text-muted-foreground">Title</label>
              <input id="material-title" value={title} onChange={e => setTitle(e.target.value)} className={fieldClass} aria-invalid={Boolean(error)} aria-describedby={error ? "material-title-error" : undefined} />
              {error ? <p id="material-title-error" className="text-xs text-danger-ink">{error}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="material-type" className="text-xs font-semibold text-muted-foreground">Material type</label>
                <select id="material-type" value={type} onChange={e => setType(e.target.value)} className={fieldClass}>
                  <option>Worked example</option>
                  <option>Practice questions</option>
                  <option>Translated slides</option>
                  <option>Short explainer video</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="material-language" className="text-xs font-semibold text-muted-foreground">Language</label>
                <select id="material-language" value={language} onChange={e => setLanguage(e.target.value)} className={fieldClass}>
                  <option>English</option>
                  <option>Arabic</option>
                  <option>English and Arabic</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="material-file" className="text-xs font-semibold text-muted-foreground">File name (simulated, nothing is uploaded)</label>
              <input id="material-file" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. call-stack-trace.pdf" className={fieldClass} />
            </div>
            <SimulatedNote>Saving creates a local draft linked to {concept?.title}. No file is uploaded, processed or shown to students. Use Materials (IN2) for the full upload flow.</SimulatedNote>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit"><FilePlus2 aria-hidden="true" />Save draft (simulated)</Button>
              <ScreenLink href={instructorLinks.materials}>Open Materials (IN2)</ScreenLink>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
