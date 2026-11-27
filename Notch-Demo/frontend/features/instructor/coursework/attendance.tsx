"use client";
import { useState } from "react";
import { Check, Download, History, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState, NativeSelect } from "@/features/instructor/portal/forms";
import { roster } from "@/features/instructor/portal/data";
import { Bars, Stat } from "@/features/instructor/analytics/ui";
import { ATT, attLabel, attendanceOf, canRecord, type AStatus, type Session } from "./data";
import { Confirm, Modal } from "./modal";
import type { Cw } from "./use-coursework";
import { useParam } from "@/features/instructor/dashboard/hooks";

const tone = { present: "success", absent: "danger", late: "warning", excused: "progress" } as const;
const activeCls: Record<AStatus, string> = { present: "bg-success-soft text-success-ink border-success/40", absent: "bg-danger-soft text-danger-ink border-danger/40", late: "bg-warning-soft text-warning-ink border-warning/40", excused: "bg-progress-soft text-progress-ink border-progress/40" };

export function Attendance({ cw }: { cw: Cw }) {
  const { t, num, date, pick, w, scope, archived } = cw;
  const course = cw.course === "all" ? scope[0] : scope[0];
  const sessions = w.sessions, records = w.records;
  const mine = sessions.filter((s) => s.courseId === course.id).sort((a, b) => a.date.localeCompare(b.date));
  const held = mine.filter(canRecord);
  const upcoming = mine.filter((s) => !canRecord(s));
  const [sessionRaw, setSession] = useParam("session", "auto");
  const [threshold, setThreshold] = useState(75);
  const [drafts, setDrafts] = useState<Record<string, Record<string, AStatus>>>({});
  const [confirm, setConfirm] = useState(false);
  const [history, setHistory] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fallback = [...held].reverse().find((s) => !s.recorded) ?? held[held.length - 1];
  const session: Session | undefined = held.find((s) => s.id === sessionRaw) ?? fallback;
  const stats = roster.map((s) => ({ s, a: attendanceOf(s.id, course.id, sessions, records) }));
  const withPct = stats.filter((x) => x.a.pct !== null);
  const avg = withPct.length ? Math.round(withPct.reduce((x, y) => x + (y.a.pct as number), 0) / withPct.length) : null;
  const low = stats.filter((x) => x.a.pct !== null && (x.a.pct as number) < threshold);
  const unrecorded = held.filter((s) => !s.recorded);
  const repeated = stats.filter((x) => x.a.repeated);
  const stored = session ? records[session.id] ?? {} : {};
  const draft: Record<string, AStatus> = session ? (drafts[session.id] ?? stored) : {};
  const setStatus = (sid: string, v: AStatus) => session && setDrafts({ ...drafts, [session.id]: { ...draft, [sid]: v } });
  const dirty = !!session && !!drafts[session.id] && JSON.stringify(drafts[session.id]) !== JSON.stringify(stored);
  const missing = roster.filter((s) => !draft[s.id]).length;
  const save = () => {
    if (!session) return;
    if (missing) { setErrors([t(`${missing} student(s) have no status. Mark everyone, or use “Mark all present” and adjust.`, `${num(missing)} طالب بلا حالة. حدّد الجميع أو استخدم «تسجيل الجميع حاضرين» ثم عدّل.`)]); return; }
    setErrors([]);
    w.saveAttendance(session.id, draft);
    setDrafts((d) => { const n = { ...d }; delete n[session.id]; return n; });
    w.say(t(`Attendance saved for ${pick(session.title)} (${date(session.date)}). No grades were changed.`, `تم حفظ الحضور لـ ${pick(session.title)} (${date(session.date)}). لم تتغير أي درجات.`));
  };
  const counts = (s: Session) => { const r = records[s.id] ?? {}; const c = { present: 0, absent: 0, late: 0, excused: 0 }; Object.values(r).forEach((v) => c[v]++); const counted = c.present + c.late + c.absent; return { ...c, pct: s.recorded && counted ? Math.round(((c.present + c.late) / counted) * 100) : null }; };
  const exportCsv = () => {
    const lines = [[t("Attendance report", "تقرير الحضور"), `${course.code} ${t(course.title)}`].join(","), "", `# ${t("By session", "حسب الجلسة")}`, [t("Session", "الجلسة"), t("Date", "التاريخ"), "Present", "Late", "Absent", "Excused", "%"].join(",")]
      .concat(mine.filter((s) => s.recorded).map((s) => { const c = counts(s); return [`"${pick(s.title)}"`, s.date.slice(0, 10), c.present, c.late, c.absent, c.excused, c.pct ?? ""].join(","); }))
      .concat(["", `# ${t("By student", "حسب الطالب")}`, [t("Student", "الطالب"), "ID", "Present", "Late", "Absent", "Excused", "%", t("Repeated absences", "غياب متكرر")].join(",")])
      .concat(stats.map(({ s, a }) => [s.name, s.id, a.present, a.late, a.absent, a.excused, a.pct ?? "", a.repeated ? t("Yes", "نعم") : t("No", "لا")].join(",")));
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const l = document.createElement("a"); l.href = url; l.download = `attendance-${course.id}.csv`; document.body.appendChild(l); l.click(); l.remove(); URL.revokeObjectURL(url);
    w.say(t("Attendance report exported as CSV.", "تم تصدير تقرير الحضور بصيغة CSV."));
  };
  const hist = roster.find((s) => s.id === history);
  return (
    <div className="space-y-6">
      {cw.course === "all" && <p className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">{t(`Attendance is recorded per course. Showing ${course.code}; choose a course above to switch.`, `يُسجَّل الحضور لكل مقرر. المعروض ${course.code}؛ اختر مقررًا من الأعلى للتبديل.`)}</p>}
      <section aria-label={t("Attendance overview", "نظرة عامة على الحضور")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("Total sessions", "إجمالي الجلسات")} value={num(held.length)} note={t(`${upcoming.length} upcoming`, `${num(upcoming.length)} قادمة`)} />
        <Stat label={t("Average attendance", "متوسط الحضور")} value={avg === null ? "—" : `${num(avg)}%`} note={t("Present or late, excluding excused", "حاضر أو متأخر، دون المعذورين")} />
        <Stat label={t("Students with low attendance", "طلاب بحضور منخفض")} tone={low.length ? "warning" : undefined} value={num(low.length)} note={t(`below ${threshold}%`, `أقل من ${num(threshold)}٪`)} />
        <Stat label={t("Sessions not recorded", "جلسات لم يُسجَّل حضورها")} tone={unrecorded.length ? "danger" : undefined} value={num(unrecorded.length)} />
      </section>
      <p className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{t("Attendance is a record only. No grade or academic status changes automatically, and no attendance policy is configured for this course.", "الحضور سجل فقط. لا تتغير أي درجة أو حالة أكاديمية تلقائيًا، ولا توجد سياسة حضور مضبوطة لهذا المقرر.")}</p>

      <Card className="space-y-4 p-5 sm:p-6" id="register">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="text-lg font-semibold">{t("Attendance register", "سجل الحضور")}</h3><p className="text-sm text-muted-foreground">{course.code} · {t(course.title)}</p></div>
          <label className="grid gap-1 text-xs text-muted-foreground">{t("Session", "الجلسة")}
            <NativeSelect className="min-w-72" value={session?.id ?? ""} onChange={(e) => setSession(e.target.value)}>
              <optgroup label={t("Held sessions", "الجلسات المنعقدة")}>{[...held].reverse().map((s) => <option key={s.id} value={s.id}>{date(s.date)} · {pick(s.title)} {s.recorded ? "✓" : `(${t("not recorded", "غير مسجَّلة")})`}</option>)}</optgroup>
              {upcoming.length > 0 && <optgroup label={t("Upcoming (locked)", "قادمة (مقفلة)")}>{upcoming.map((s) => <option key={s.id} value={s.id} disabled>{date(s.date)} · {pick(s.title)}</option>)}</optgroup>}
            </NativeSelect></label>
        </div>
        {!session ? <EmptyState title={t("No sessions yet", "لا جلسات بعد")} description={t("Attendance can be taken once a session has started.", "يمكن تسجيل الحضور بعد بدء الجلسة.")} /> : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={session.recorded ? "success" : "warning"}>{session.recorded ? (w.edited.includes(session.id) ? t("Recorded · edited", "مسجَّل · معدَّل") : t("Recorded", "مسجَّل")) : t("Not recorded", "غير مسجَّل")}</Badge>
              <Badge tone="neutral">{session.kind === "lecture" ? t("Lecture", "محاضرة") : t("Lab", "معمل")}</Badge>
              {dirty && <Badge tone="progress">{t("Unsaved changes", "تغييرات غير محفوظة")}</Badge>}
              <div className="ms-auto flex flex-wrap gap-2">
                <Button variant="outline" disabled={archived} onClick={() => { setDrafts({ ...drafts, [session.id]: Object.fromEntries(roster.map((s) => [s.id, "present" as AStatus])) }); }}><Check aria-hidden="true" />{t("Mark all present", "تسجيل الجميع حاضرين")}</Button>
                <Button variant="ghost" disabled={!dirty} onClick={() => setDrafts((d) => { const n = { ...d }; delete n[session.id]; return n; })}>{t("Discard changes", "تجاهل التغييرات")}</Button>
                <Button disabled={archived || (!dirty && session.recorded)} onClick={() => (session.recorded ? setConfirm(true) : save())}>{t("Save attendance", "حفظ الحضور")}</Button>
              </div>
            </div>
            {errors.length > 0 && <p role="alert" className="text-sm text-danger">{errors[0]}</p>}
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[820px] text-start text-sm">
                <caption className="sr-only">{t("Class attendance", "حضور الصف")}</caption>
                <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Student ID", "رقم الطالب"), t("Status", "الحالة"), t("Attendance", "الحضور"), t("Absences", "الغياب"), ""].map((h, i) => <th key={i} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>
                  {stats.map(({ s, a }) => (
                    <tr key={s.id} className="border-t">
                      <th scope="row" className="p-3 text-start font-medium">{s.name}</th>
                      <td className="p-3 tabular-nums text-muted-foreground">{s.id}</td>
                      <td className="p-3"><div role="radiogroup" aria-label={t(`Status for ${s.name}`, `حالة ${s.name}`)} className="inline-flex gap-1">{ATT.map((v) => <button key={v} type="button" role="radio" aria-checked={draft[s.id] === v} disabled={archived} onClick={() => setStatus(s.id, v)} className={cn("min-h-9 rounded-lg border px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60", draft[s.id] === v ? activeCls[v] : "text-muted-foreground hover:bg-secondary")}>{t(attLabel[v])}</button>)}</div></td>
                      <td className="p-3"><span className={cn("tabular-nums", a.pct !== null && a.pct < threshold && "font-semibold text-danger")}>{a.pct === null ? "—" : `${num(a.pct)}%`}</span></td>
                      <td className="p-3 tabular-nums">{num(a.absent)}{a.repeated && <Badge tone="danger" className="ms-2">{t("Repeated", "متكرر")}</Badge>}</td>
                      <td className="p-3"><Button size="sm" variant="ghost" onClick={() => setHistory(s.id)} aria-label={t(`Attendance history: ${s.name}`, `سجل حضور ${s.name}`)}><History aria-hidden="true" />{t("History", "السجل")}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{t("Attendance history", "سجل الحضور")}</h3></div>
        {mine.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-start text-sm"><caption className="sr-only">{t("Sessions", "الجلسات")}</caption>
          <thead className="bg-muted/60"><tr>{[t("Date", "التاريخ"), t("Session", "الجلسة"), t("Status", "الحالة"), t("Present", "حاضر"), t("Late", "متأخر"), t("Absent", "غائب"), t("Excused", "بعذر"), t("Rate", "النسبة"), ""].map((h, i) => <th key={i} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{[...mine].reverse().map((s) => { const c = counts(s); const up = !canRecord(s); return (
            <tr key={s.id} className="border-t"><td className="whitespace-nowrap p-3">{date(s.date)}</td><th scope="row" className="p-3 text-start font-medium">{pick(s.title)}</th>
              <td className="p-3"><Badge tone={up ? "neutral" : s.recorded ? "success" : "warning"}>{up ? t("Upcoming", "قادمة") : s.recorded ? t("Recorded", "مسجَّل") : t("Not recorded", "غير مسجَّل")}</Badge></td>
              {s.recorded ? <><td className="p-3 tabular-nums">{num(c.present)}</td><td className="p-3 tabular-nums">{num(c.late)}</td><td className="p-3 tabular-nums">{num(c.absent)}</td><td className="p-3 tabular-nums">{num(c.excused)}</td><td className="p-3 tabular-nums">{c.pct === null ? "—" : `${num(c.pct)}%`}</td></> : <td colSpan={5} className="p-3 text-muted-foreground">—</td>}
              <td className="p-3">{!up && <Button size="sm" variant="outline" onClick={() => { setSession(s.id); document.getElementById("register")?.scrollIntoView({ behavior: "smooth" }); }}>{s.recorded ? t("Edit", "تعديل") : t("Take attendance", "تسجيل الحضور")}</Button>}</td></tr>); })}</tbody></table></div> : <EmptyState title={t("No sessions", "لا جلسات")} description={t("Sessions appear here once scheduled.", "تظهر الجلسات هنا بعد جدولتها.")} />}
      </Card>

      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h3 className="text-lg font-semibold">{t("Attendance reports", "تقارير الحضور")}</h3></div>
          <div className="flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 text-sm text-muted-foreground">{t("Low attendance below", "حضور منخفض أقل من")}<NativeSelect aria-label={t("Low attendance threshold", "عتبة الحضور المنخفض")} className="h-10 w-auto" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}>{[60, 75, 85].map((n) => <option key={n} value={n}>{num(n)}%</option>)}</NativeSelect></label>
            <Button variant="outline" onClick={exportCsv}><Download aria-hidden="true" />{t("Export CSV", "تصدير CSV")}</Button></div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div><h4 className="mb-2 text-sm font-semibold">{t("Attendance by session (%)", "الحضور حسب الجلسة (٪)")}</h4>
            {mine.some((s) => s.recorded) ? <><Bars values={mine.filter((s) => s.recorded).map((s) => counts(s).pct ?? 0)} max={100} label={t("Attendance percentage per recorded session", "نسبة الحضور لكل جلسة مسجَّلة")} className="h-24" /><p className="mt-1 text-xs text-muted-foreground">{t("Oldest session on the left.", "أقدم جلسة إلى اليسار.")}</p></> : <p className="text-sm text-muted-foreground">{t("No recorded sessions yet.", "لا جلسات مسجَّلة بعد.")}</p>}</div>
          <div><h4 className="mb-2 text-sm font-semibold">{t("Students with repeated absences", "طلاب لديهم غياب متكرر")}</h4>
            {repeated.length ? <ul className="divide-y text-sm">{repeated.map(({ s, a }) => <li key={s.id} className="flex items-center justify-between gap-3 py-2"><span>{s.name} <span className="text-muted-foreground">· {t(`${a.absent} absences${a.consecutive ? ", back to back" : ""}`, `${num(a.absent)} غياب${a.consecutive ? "، متتالٍ" : ""}`)}</span></span><Button size="sm" variant="outline" onClick={() => cw.w.openCompose({ courseId: course.id, kind: "revision", audience: { type: "students", ids: [s.id] }, title: `Checking in: ${course.title[0]}`, body: `Hi ${s.name}, I noticed you have missed a few sessions. Is everything okay? Let me know how I can help you catch up.` })}>{t("Check in", "متابعة")}</Button></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("No student has repeated absences.", "لا طالب لديه غياب متكرر.")}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{t("Repeated = 3 or more absences, or two absences in a row. This is a prompt to check in, not a penalty.", "متكرر = 3 غيابات أو أكثر أو غيابان متتاليان. هذا تنبيه للمتابعة وليس عقوبة.")}</p></div>
        </div>
        <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[700px] text-start text-sm"><caption className="sr-only">{t("Attendance by student", "الحضور حسب الطالب")}</caption>
          <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Attendance", "الحضور"), t("Present", "حاضر"), t("Late", "متأخر"), t("Absent", "غائب"), t("Excused", "بعذر")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{[...stats].sort((x, y) => (x.a.pct ?? 101) - (y.a.pct ?? 101)).map(({ s, a }) => <tr key={s.id} className="border-t"><th scope="row" className="p-3 text-start font-medium">{s.name}</th><td className="p-3"><span className="flex items-center gap-2"><span className="h-2 w-24 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full", a.pct !== null && a.pct < threshold ? "bg-danger" : "bg-success")} style={{ width: `${a.pct ?? 0}%` }} /></span><span className="tabular-nums">{a.pct === null ? "—" : `${num(a.pct)}%`}</span></span></td><td className="p-3 tabular-nums">{num(a.present)}</td><td className="p-3 tabular-nums">{num(a.late)}</td><td className="p-3 tabular-nums">{num(a.absent)}</td><td className="p-3 tabular-nums">{num(a.excused)}</td></tr>)}</tbody></table></div>
      </Card>

      <Confirm danger={false} open={confirm} onOpenChange={setConfirm} title={t("Save changes to recorded attendance?", "حفظ التغييرات على حضور مسجَّل؟")} description={t("This replaces the saved attendance for this session and marks it as edited. Attendance percentages update right away.", "يستبدل هذا الحضور المحفوظ لهذه الجلسة ويضع عليه علامة معدَّل. تتحدث نسب الحضور فورًا.")} action={t("Save changes", "حفظ التغييرات")} onConfirm={save} />
      <Modal open={!!hist} onOpenChange={(o) => !o && setHistory(null)} title={t(`Attendance history: ${hist?.name ?? ""}`, `سجل حضور ${hist?.name ?? ""}`)} description={`${course.code} · ${hist?.id ?? ""}`}>
        {hist && (<ul className="divide-y text-sm">{mine.filter((s) => s.recorded).reverse().map((s) => { const v = records[s.id]?.[hist.id]; return <li key={s.id} className="flex items-center justify-between gap-3 py-2"><span>{date(s.date)} · {pick(s.title)}</span>{v ? <Badge tone={tone[v]}>{t(attLabel[v])}</Badge> : <span className="text-muted-foreground">—</span>}</li>; })}</ul>)}
      </Modal>
    </div>
  );
}
