"use client";
import { useState } from "react";
import { CheckCircle2, Circle, Eye, Lock, Rocket, Settings2 } from "lucide-react";
import { MasteryBar } from "@/components/learning/mastery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { findConcept } from "@/data/fixtures";
import { useDemo } from "@/store/demo";
import type { CourseId } from "@/types";
import { defaultRules, launchChecklist, upcomingLecture, type CourseRules } from "./data";
import { controlClass, fieldClass, P1Screen, ScreenLink, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

/** IN6 — course rules/settings, student preview and simulated launch checklist. */
export function CourseSettingsScreen() {
  return (
    <P1Screen screenIds="IN6" title="Course rules & launch" description="Set how the course behaves for students, preview what they will see, and walk through a simulated launch checklist.">
      {ctx => <SettingsContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

function SettingsContent({ courseId, course, enrolled }: CourseContext) {
  const [rules, setRules] = useState<CourseRules>(defaultRules[courseId]);
  const [saved, setSaved] = useState<CourseRules | null>(null);
  const [launched, setLaunched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = saved === null || JSON.stringify(saved) !== JSON.stringify(rules);
  const update = <K extends keyof CourseRules>(key: K, value: CourseRules[K]) => setRules(r => ({ ...r, [key]: value }));

  const checklist = launchChecklist[courseId].map(item => (item.id === "rules" ? { ...item, done: saved !== null && !dirty, detail: saved && !dirty ? "Rules saved in this browser session (simulated)." : item.detail } : item));
  const outstanding = checklist.filter(i => !i.done);
  const doneCount = checklist.length - outstanding.length;

  return (
    <>
      {launched ? (
        <SimulatedNote className="text-sm">
          Course launch simulated for {course.title}. No students were notified, nothing was published, and no real course was opened. Reset by reloading this page.
        </SimulatedNote>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="rules-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-brand-2"><Settings2 className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="rules-heading">Course rules</CardTitle>
                <CardDescription>Changes apply to this demo session only.</CardDescription>
              </div>
            </div>
            {saved && !dirty ? <Badge tone="success">Saved (simulated)</Badge> : <Badge tone="warning">Unsaved changes</Badge>}
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-5 sm:grid-cols-2"
              onSubmit={e => {
                e.preventDefault();
                setSaved(rules);
                setMessage("Rules saved locally (simulated). No student settings were changed.");
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="mastery-target" className="text-xs font-semibold text-muted-foreground">Mastery target for “ready” (%)</label>
                <input id="mastery-target" type="number" min={40} max={95} step={5} value={rules.masteryTarget} onChange={e => update("masteryTarget", Math.max(40, Math.min(95, Number(e.target.value) || 70)))} className={fieldClass} aria-describedby="mastery-target-help" />
                <p id="mastery-target-help" className="text-xs text-muted-foreground">Shared demo default is 70 (Proficient).</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="weekly-questions" className="text-xs font-semibold text-muted-foreground">Weekly practice questions</label>
                <input id="weekly-questions" type="number" min={5} max={40} value={rules.weeklyQuestions} onChange={e => update("weeklyQuestions", Math.max(5, Math.min(40, Number(e.target.value) || 5)))} className={fieldClass} />
              </div>

              <fieldset className="space-y-2 sm:col-span-2">
                <legend className="text-xs font-semibold text-muted-foreground">When a prerequisite is below the target</legend>
                <label className="flex items-start gap-2 text-sm">
                  <input type="radio" name="prereq" className={controlClass} checked={rules.prerequisiteMode === "advise"} onChange={() => update("prerequisiteMode", "advise")} />
                  <span><span className="font-medium">Advise</span> — recommend the prerequisite but allow practice (current shared agreement).</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input type="radio" name="prereq" className={controlClass} checked={rules.prerequisiteMode === "block"} onChange={() => update("prerequisiteMode", "block")} />
                  <span><span className="font-medium">Require</span> — lock the assessment until the prerequisite is ready. <span className="text-muted-foreground">Proposal: preview only, not enforced in the student portal.</span></span>
                </label>
              </fieldset>

              <div className="space-y-1.5">
                <label htmlFor="tutor-mode" className="text-xs font-semibold text-muted-foreground">AI tutor style</label>
                <select id="tutor-mode" value={rules.tutorMode} onChange={e => update("tutorMode", e.target.value as CourseRules["tutorMode"])} className={fieldClass}>
                  <option value="hints">Hints first, no full solutions</option>
                  <option value="worked">Worked solutions allowed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="course-language" className="text-xs font-semibold text-muted-foreground">Course language</label>
                <select id="course-language" value={rules.language} onChange={e => update("language", e.target.value as CourseRules["language"])} className={fieldClass}>
                  <option value="both">English and Arabic</option>
                  <option value="en">English only</option>
                  <option value="ar">Arabic only</option>
                </select>
              </div>

              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <input type="checkbox" className={controlClass} checked={rules.showMasteryToStudents} onChange={e => update("showMasteryToStudents", e.target.checked)} />
                <span>Show mastery bands to students</span>
              </label>
              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <input type="checkbox" className={controlClass} checked={rules.tutorCitesSources} onChange={e => update("tutorCitesSources", e.target.checked)} />
                <span>Tutor must cite an approved course source in every answer</span>
              </label>

              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <Button type="submit" disabled={!dirty}>Save rules (simulated)</Button>
                <Button type="button" variant="ghost" onClick={() => { setRules(defaultRules[courseId]); setMessage("Defaults restored. Save to confirm."); }}>Restore defaults</Button>
              </div>
              <div className="sm:col-span-2"><StatusMessage message={message} /></div>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6 xl:col-span-5">
          <StudentPreview courseId={courseId} rules={rules} enrolledIds={enrolled.map(s => s.id)} />

          <Card as="section" aria-labelledby="launch-heading">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-progress-soft text-progress-ink"><Rocket className="size-4" aria-hidden="true" /></span>
                <div>
                  <CardTitle id="launch-heading">Launch checklist</CardTitle>
                  <CardDescription>{doneCount} of {checklist.length} complete · sample status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-3" role="list">
                {checklist.map(item => (
                  <li key={item.id} className="flex items-start gap-3">
                    {item.done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> : <Circle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {item.label} <span className="sr-only">{item.done ? "(complete)" : "(outstanding)"}</span>
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      {item.id !== "rules" ? <ScreenLink href={item.href} className="text-xs">Open {item.screen}</ScreenLink> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3">
              <SimulatedNote>Launch is simulated: it does not publish the course, enrol anyone or send notifications.</SimulatedNote>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={launched}>
                    <Rocket aria-hidden="true" />
                    {launched ? "Launch simulated" : "Simulate launch"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Simulate course launch?</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      <p>This only changes the status on this screen. No students are notified and nothing is published.</p>
                      {outstanding.length ? (
                        <>
                          <p className="mt-2 font-medium text-foreground">Outstanding items ({outstanding.length}):</p>
                          <ul className="mt-1 list-disc ps-5">
                            {outstanding.map(i => <li key={i.id}>{i.label}</li>)}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setLaunched(true); setMessage(`Launch simulated for ${course.shortTitle}. No notifications were sent.`); }}>
                      {outstanding.length ? "Simulate anyway (demo)" : "Simulate launch"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

function StudentPreview({ courseId, rules, enrolledIds }: { courseId: CourseId; rules: CourseRules; enrolledIds: string[] }) {
  const students = useDemo(s => s.students);
  const selectedId = useDemo(s => s.studentId);
  const student = students.find(s => s.id === selectedId && enrolledIds.includes(s.id)) ?? students.find(s => enrolledIds.includes(s.id));
  const concept = findConcept(upcomingLecture[courseId].conceptId);
  if (!student || !concept) return null;
  const missing = concept.prerequisites.map(findConcept).find(p => p && (student.mastery[p.id] ?? 0) < rules.masteryTarget);
  const locked = rules.prerequisiteMode === "block" && Boolean(missing);
  const showAr = rules.language !== "en";
  const showEn = rules.language !== "ar";

  return (
    <Card as="section" aria-labelledby="preview-heading">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink"><Eye className="size-4" aria-hidden="true" /></span>
          <div>
            <CardTitle id="preview-heading">Student preview</CardTitle>
            <CardDescription>How {student.name} would see {concept.title} with these rules (fictional student).</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {showEn ? (
          <div className="rounded-lg border border-border bg-background p-4" lang="en" dir="ltr">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{concept.title}</p>
              {locked ? <Badge tone="warning"><Lock aria-hidden="true" />Locked</Badge> : <Badge tone="progress">Open</Badge>}
            </div>
            {rules.showMasteryToStudents ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <MasteryBar value={student.mastery[concept.id] ?? 0} label={`${student.name} ${concept.title} mastery preview`} className="h-1.5 w-28" />
                <span className="tabular-nums">{student.mastery[concept.id] ?? 0}%</span>
              </div>
            ) : <p className="mt-2 text-xs text-muted-foreground">Mastery hidden from students.</p>}
            <p className="mt-2 text-xs leading-5">
              {missing ? (locked ? `Complete ${missing.title} (target ${rules.masteryTarget}%) to unlock this assessment.` : `Suggested: review ${missing.title} first. You can still practise.`) : "You are ready to practise this concept."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Tutor: {rules.tutorMode === "hints" ? "hints first" : "worked solutions allowed"}{rules.tutorCitesSources ? " · cites course sources" : ""}</p>
          </div>
        ) : null}
        {showAr ? (
          <div className="rounded-lg border border-border bg-background p-4" lang="ar" dir="rtl">
            <p className="text-sm font-semibold">معاينة الطالب · {concept.title}</p>
            <p className="mt-2 text-xs leading-6">
              {missing ? (locked ? `أكمل ${missing.title} للوصول إلى هذا التقييم.` : `مقترح: راجع ${missing.title} أولًا، ويمكنك متابعة التدريب.`) : "أنت جاهز للتدرّب على هذا المفهوم."}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">نص تجريبي للعرض فقط</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
