"use client";
import { useMemo, useState } from "react";
import { BellRing, Clock, UserCheck, UserPlus, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/states";
import { StatCard } from "@/components/learning/stat-card";
import { StudentAvatar } from "@/components/learning/student-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { reminderTemplates, signupStatusLabel, signups, type SignupStatus } from "./data";
import { controlClass, P1Screen, SimulatedNote, StatusMessage, type CourseContext } from "./shared";

const statusTone: Record<SignupStatus, "success" | "warning" | "danger"> = { joined: "success", "consent-pending": "warning", "not-joined": "danger" };
type Filter = "all" | SignupStatus;

/** IN7 — sign-up monitoring with preview-only reminders. */
export function SignupsScreen() {
  return (
    <P1Screen screenIds="IN7" title="Sign-up monitoring" description="See who has joined the course space, who still needs to confirm consent, and preview a reminder. Reminders are never sent.">
      {ctx => <SignupsContent key={ctx.courseId} {...ctx} />}
    </P1Screen>
  );
}

function SignupsContent({ courseId, course, enrolled }: CourseContext) {
  const rows = useMemo(
    () => enrolled.map(s => ({ student: s, ...(signups[courseId][s.id] ?? { status: "not-joined" as SignupStatus, invitedDaysAgo: 0 }) })),
    [enrolled, courseId],
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>(() => rows.filter(r => r.status !== "joined").map(r => r.student.id));
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [previewed, setPreviewed] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const counts = { joined: 0, "consent-pending": 0, "not-joined": 0 } as Record<SignupStatus, number>;
  rows.forEach(r => (counts[r.status] += 1));
  const pct = rows.length ? Math.round((100 * counts.joined) / rows.length) : 0;
  const visible = rows.filter(r => filter === "all" || r.status === filter);
  const pending = rows.filter(r => r.status !== "joined");
  const recipients = pending.filter(r => selected.includes(r.student.id));
  const sample = recipients[0]?.student.name ?? "{name}";
  const previewText = reminderTemplates[lang].replace("{name}", sample).replace("{course}", course.shortTitle);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${rows.length})` },
    { id: "joined", label: `Joined (${counts.joined})` },
    { id: "consent-pending", label: `Consent pending (${counts["consent-pending"]})` },
    { id: "not-joined", label: `Not joined (${counts["not-joined"]})` },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Invited (sample)" value={rows.length} icon={Users} hint="Fictional roster for this course" />
        <StatCard label="Joined" value={counts.joined} icon={UserCheck} accent="success" hint={`${pct}% of invited`} footer={<Progress value={pct} tone="success" aria-label={`${pct}% joined`} className="h-1.5" />} />
        <StatCard label="Consent pending" value={counts["consent-pending"]} icon={Clock} accent="warning" hint="Signed in, consent not confirmed" />
        <StatCard label="Not joined yet" value={counts["not-joined"]} icon={UserPlus} accent="danger" hint="No simulated sign-in" />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card as="section" aria-labelledby="roster-heading" className="min-w-0 xl:col-span-7">
          <CardHeader>
            <div>
              <CardTitle id="roster-heading">Roster status</CardTitle>
              <CardDescription>Sample sign-up data. Select students to include in the reminder preview.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {filters.map(f => (
                <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                  {f.label}
                </Button>
              ))}
            </div>
            {visible.length === 0 ? (
              <EmptyState title="No students in this status" description="Choose another filter to see the roster." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <caption className="sr-only">Sign-up status for {course.title}</caption>
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th scope="col" className="w-10 pb-2 text-start font-medium"><span className="sr-only">Include in reminder</span></th>
                      <th scope="col" className="pb-2 text-start font-medium">Student</th>
                      <th scope="col" className="pb-2 text-start font-medium">Status</th>
                      <th scope="col" className="pb-2 text-end font-medium">Invited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(r => {
                      const joined = r.status === "joined";
                      return (
                        <tr key={r.student.id} className="border-b border-border last:border-b-0">
                          <td className="py-2.5">
                            <input
                              type="checkbox"
                              className={controlClass}
                              disabled={joined}
                              checked={!joined && selected.includes(r.student.id)}
                              onChange={e => setSelected(sel => (e.target.checked ? [...sel, r.student.id] : sel.filter(id => id !== r.student.id)))}
                              aria-label={joined ? `${r.student.name} has joined` : `Include ${r.student.name} in reminder preview`}
                            />
                          </td>
                          <th scope="row" className="py-2.5 text-start font-medium">
                            <span className="flex items-center gap-2"><StudentAvatar name={r.student.name} />{r.student.name}</span>
                          </th>
                          <td className="py-2.5">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <Badge tone={statusTone[r.status]}>{signupStatusLabel[r.status]}</Badge>
                              {previewed.includes(r.student.id) ? <Badge tone="ai">Reminder previewed</Badge> : null}
                            </span>
                          </td>
                          <td className="py-2.5 text-end text-muted-foreground tabular-nums">{r.invitedDaysAgo} days ago</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card as="section" aria-labelledby="reminder-heading" className="min-w-0 xl:col-span-5">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai-soft text-ai-ink"><BellRing className="size-4" aria-hidden="true" /></span>
              <div>
                <CardTitle id="reminder-heading">Reminder preview</CardTitle>
                <CardDescription>{recipients.length} of {pending.length} pending students selected</CardDescription>
              </div>
            </div>
            <Badge tone="ai">Preview only</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div role="group" aria-label="Reminder language" className="flex gap-2">
              <Button size="sm" variant={lang === "en" ? "default" : "outline"} aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</Button>
              <Button size="sm" variant={lang === "ar" ? "default" : "outline"} aria-pressed={lang === "ar"} onClick={() => setLang("ar")}>العربية</Button>
            </div>
            <blockquote lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-lg border border-border bg-background p-4 text-sm leading-6">
              {previewText}
            </blockquote>
            {recipients.length ? (
              <p className="text-xs text-muted-foreground">Would address: {recipients.map(r => r.student.name).join(", ")}</p>
            ) : null}
            <SimulatedNote>Preview only. No email, SMS or in-app message is sent to anyone, and no delivery is recorded outside this page.</SimulatedNote>
            <Button
              className="w-full"
              disabled={!recipients.length}
              onClick={() => {
                setPreviewed(p => Array.from(new Set([...p, ...recipients.map(r => r.student.id)])));
                setMessage(`Reminder preview recorded for ${recipients.length} student${recipients.length === 1 ? "" : "s"} (simulated). Nothing was sent.`);
              }}
            >
              <BellRing aria-hidden="true" />
              Mark reminder as previewed
            </Button>
            <StatusMessage message={message} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
