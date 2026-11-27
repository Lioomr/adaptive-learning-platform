"use client";
import { useMemo, useState } from "react";
import { Bell, CheckCheck, Mail, MailOpen, Megaphone, Search, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState, Field, NativeSelect, TextArea, TextInput, editCopy } from "@/features/instructor/portal/forms";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { roster, studentMastery } from "@/features/instructor/portal/data";
import { NOW } from "@/features/instructor/dashboard/data";
import { build, levelOf, sectionOf } from "@/features/instructor/analytics/data";
import { LevelBadge } from "@/features/instructor/analytics/ui";
import { useReports } from "@/features/instructor/reports/store";
import { commLabel, type Audience, type Comm, type CommKind, type CourseId } from "./data";
import { Confirm, Modal, checkbox, iso16, row, toIso } from "./modal";
import type { Cw } from "./use-coursework";

const SEGS = [["announcements", "Announcements", "الإعلانات"], ["messages", "Student messages", "رسائل الطلاب"], ["reminders", "Reminders & course communication", "التذكيرات وتواصل المقرر"]] as const;

export function Communication({ cw }: { cw: Cw }) {
  const { t, num, segment, unread, w } = cw;
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label={t("Communication", "التواصل")} className="inline-flex flex-wrap rounded-xl border bg-muted/50 p-1">
        {SEGS.map(([id, en, ar]) => <button key={id} type="button" role="tab" aria-selected={segment === id} onClick={() => cw.setSegment(id)} className={cn("min-h-10 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", segment === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground")}>{t(en, ar)}{id === "messages" && unread > 0 && <span className="ms-2 rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-semibold text-white" aria-label={t(`${unread} unread`, `${num(unread)} غير مقروءة`)}>{num(unread)}</span>}</button>)}
      </div>
      {segment === "announcements" && <Announcements cw={cw} />}
      {segment === "messages" && <Messages cw={cw} />}
      {segment === "reminders" && <Reminders cw={cw} />}
      <span className="sr-only" aria-live="polite">{w.notice}</span>
    </div>
  );
}

function audienceLabel(a: Audience, t: Cw["t"], num: Cw["num"]) {
  if (a.type === "course") return t("Whole course", "المقرر كاملًا");
  if (a.type === "group") return a.group === "A" ? t("Section A", "الشعبة أ") : a.group === "B" ? t("Section B", "الشعبة ب") : t("Students needing revision", "طلاب يحتاجون مراجعة");
  const n = a.ids?.length ?? 0;
  const name = n === 1 ? roster.find((s) => s.id === a.ids![0])?.name : undefined;
  return name ?? t(`${n} selected students`, `${num(n)} طلاب محددين`);
}

function History({ cw, kinds }: { cw: Cw; kinds: (k: CommKind) => boolean }) {
  const { t, num, date, pick, w, assigned } = cw;
  const content = useInstructorPortal((s) => s.content);
  const upsert = useInstructorPortal((s) => s.upsert);
  const [del, setDel] = useState<string | null>(null);
  const comms = w.comms.filter((c) => cw.inScope(c.courseId) && kinds(c.kind));
  const portal = kinds("announcement") ? content.announcements.filter((a) => cw.inScope(a.courseId) && !w.comms.some((c) => c.id === a.id)) : [];
  type R = { id: string; title: string; at: string; audience: string; status: "published" | "scheduled"; kind: string; course: string; recipients?: number; comm?: Comm };
  const rows: R[] = [
    ...comms.map((c) => ({ id: c.id, title: pick(c.title), at: c.at, audience: audienceLabel(c.audience, t, num), status: c.status, kind: t(commLabel[c.kind]), course: assigned.find((x) => x.id === c.courseId)?.code ?? "", recipients: c.recipients, comm: c })),
    ...portal.map((a) => ({ id: a.id, title: pick(a.title), at: a.date, audience: t("Whole course", "المقرر كاملًا"), status: "published" as const, kind: t("Announcement", "إعلان"), course: assigned.find((x) => x.id === a.courseId)?.code ?? "" })),
  ].sort((x, y) => y.at.localeCompare(x.at));
  const publishNow = (c: Comm) => {
    w.patchComm(c.id, { status: "published", at: NOW });
    if (c.kind === "announcement" && c.audience.type === "course") upsert("announcements", { id: c.id, courseId: c.courseId, title: c.title, body: c.body, date: NOW, important: c.important });
    w.say(t(`Published “${pick(c.title)}”.`, `تم نشر «${pick(c.title)}».`));
  };
  return rows.length ? (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-start text-sm">
        <caption className="sr-only">{t("Communication history", "سجل التواصل")}</caption>
        <thead className="bg-muted/60"><tr>{[t("Title", "العنوان"), t("Type", "النوع"), t("Course", "المقرر"), t("Publication date", "تاريخ النشر"), t("Audience", "الجمهور"), t("Status", "الحالة"), ""].map((h, i) => <th key={i} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t align-top">
            <th scope="row" className="p-3 text-start font-medium">{r.title}</th>
            <td className="p-3">{r.kind}</td><td className="p-3">{r.course}</td>
            <td className="whitespace-nowrap p-3">{date(r.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
            <td className="p-3">{r.audience}{r.recipients !== undefined && <span className="block text-xs text-muted-foreground">{t(`${r.recipients} recipients`, `${num(r.recipients)} مستلمين`)}</span>}</td>
            <td className="p-3"><Badge tone={r.status === "published" ? "success" : "progress"}>{r.status === "published" ? t("Published", "منشور") : t("Scheduled", "مجدول")}</Badge></td>
            <td className="p-3">{r.comm && <div className="flex gap-1">{r.status === "scheduled" && <Button size="sm" variant="outline" onClick={() => publishNow(r.comm!)}>{t("Publish now", "نشر الآن")}</Button>}<Button size="icon-sm" variant="ghost" className="text-danger" onClick={() => setDel(r.id)} aria-label={t(`Delete ${r.title}`, `حذف ${r.title}`)}><Trash2 /></Button></div>}</td>
          </tr>))}</tbody>
      </table>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} title={t("Delete this item?", "حذف هذا العنصر؟")} description={t("It is removed from your history. Anything already delivered to students stays with them.", "يُزال من سجلك. ما وصل إلى الطلاب يبقى لديهم.")} action={t("Delete", "حذف")} onConfirm={() => { if (del) { w.removeComm(del); w.say(t("Deleted from history.", "تم الحذف من السجل.")); } setDel(null); }} />
    </Card>
  ) : <EmptyState title={t("Nothing here yet", "لا شيء هنا بعد")} description={t("Messages you send or schedule appear here.", "تظهر هنا الرسائل التي ترسلها أو تجدولها.")} />;
}

function Announcements({ cw }: { cw: Cw }) {
  const { t, w, archived } = cw;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">{t("Announcements", "الإعلانات")}</h3><p className="text-sm text-muted-foreground">{t("Publish now or schedule. Course-wide posts also appear on the course's Announcements tab.", "انشر الآن أو جدول. تظهر منشورات المقرر كاملًا أيضًا في تبويب إعلانات المقرر.")}</p></div>
        <Button disabled={archived} onClick={() => w.openCompose({ kind: "announcement", courseId: cw.scope[0]?.id })}><Megaphone aria-hidden="true" />{t("New announcement", "إعلان جديد")}</Button></div>
      <History cw={cw} kinds={(k) => k === "announcement"} />
    </section>
  );
}

function Reminders({ cw }: { cw: Cw }) {
  const { t, num, w, scope, students, archived } = cw;
  const suggestions = useMemo(() => scope.flatMap((c) => build([c], students, { course: c.id, range: 30, group: "all", concept: "all", q: "" }).studentStats.filter((s) => s.remediation.length > 0).map((s) => ({ c, s }))).sort((a, b) => b.s.remediation.length - a.s.remediation.length).slice(0, 6), [scope, students]);
  const quick: [CommKind, string, string][] = [["assignment", "Assignment reminder", "تذكير بواجب"], ["assessment", "Assessment reminder", "تذكير بتقييم"], ["revision", "Revision reminder", "تذكير بمراجعة"]];
  return (
    <section className="space-y-6">
      <div><h3 className="text-lg font-semibold">{t("Course communication", "تواصل المقرر")}</h3><p className="text-sm text-muted-foreground">{t("Send reminders to the whole course, a group or one student.", "أرسل تذكيرات للمقرر كاملًا أو لمجموعة أو لطالب واحد.")}</p></div>
      <div className="flex flex-wrap gap-2">
        {quick.map(([k, en, ar]) => <Button key={k} variant="outline" disabled={archived} onClick={() => w.openCompose({ kind: k, courseId: scope[0]?.id })}><Bell aria-hidden="true" />{t(en, ar)}</Button>)}
        <Button variant="outline" disabled={archived} onClick={() => w.openCompose({ kind: "announcement", audience: { type: "students", ids: [] }, courseId: scope[0]?.id })}><Mail aria-hidden="true" />{t("Message a student", "مراسلة طالب")}</Button>
      </div>
      <Card className="p-5"><h4 className="mb-1 text-sm font-semibold">{t("Suggested from learning analytics", "مقترحات من تحليلات التعلم")}</h4><p className="mb-3 text-xs text-muted-foreground">{t("Students with concepts below 50% mastery (an estimate). Reminders never change grades.", "طلاب لديهم مفاهيم دون 50٪ إتقان (تقدير). التذكيرات لا تغيّر الدرجات أبدًا.")}</p>
        {suggestions.length ? <ul className="divide-y text-sm">{suggestions.map(({ c, s }) => (
          <li key={`${c.id}${s.student.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="font-medium">{s.student.name} <span className="text-xs font-normal text-muted-foreground">{c.code}</span></p><p className="text-xs text-muted-foreground">{s.remediation.slice(0, 3).map((n) => cw.t(n.title)).join(" · ")}</p></div>
            <div className="flex gap-2"><Button size="sm" variant="outline" disabled={archived} onClick={() => w.openCompose({ courseId: c.id, kind: "revision", audience: { type: "students", ids: [s.student.id] }, title: `Revision reminder: ${s.remediation[0].title[0]}`, body: `Hi ${s.student.name}, a short practice session on ${s.remediation.slice(0, 2).map((n) => n.title[0]).join(" and ")} will help. Tell me if you want to go through it together.` })}><Send aria-hidden="true" />{t("Send revision reminder", "إرسال تذكير بالمراجعة")}</Button>
              <Button size="sm" disabled={archived} onClick={() => { useReports.getState().addRevision({ courseId: c.id, examId: "", title: t(`Remediation: ${s.student.name}`, `علاج: ${s.student.name}`), mode: "targeted", conceptKeys: s.remediation.map((n) => n.key), studentIds: [s.student.id], start: NOW.slice(0, 10), due: new Date(new Date(NOW).getTime() + 7 * 86400000).toISOString().slice(0, 10), instructions: "", materialIds: [], questionIds: [] }); w.say(t(`Remediation activity assigned to ${s.student.name}. See Reports → Revision planning.`, `تم تكليف ${s.student.name} بنشاط علاجي. راجع التقارير ← تخطيط المراجعة.`)); }}>{t("Assign remediation", "تكليف بنشاط علاجي")}</Button></div>
          </li>))}</ul> : <p className="text-sm text-muted-foreground">{t("No student currently needs remediation.", "لا طالب يحتاج حاليًا إلى نشاط علاجي.")}</p>}
      </Card>
      <div><h4 className="mb-2 text-sm font-semibold">{t("Reminder and message history", "سجل التذكيرات والرسائل")}</h4><History cw={cw} kinds={(k) => k !== "announcement"} /></div>
      <span className="sr-only">{num(suggestions.length)}</span>
    </section>
  );
}

function Messages({ cw }: { cw: Cw }) {
  const { t, num, date, pick, w, assigned, language } = cw;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const mine = w.threads.filter((th) => cw.inScope(th.courseId));
  const last = (th: (typeof mine)[number]) => th.messages[th.messages.length - 1];
  const shown = mine.filter((th) => (filter === "all" || (filter === "unread" ? th.unread && !th.resolved : filter === "resolved" ? th.resolved : !th.resolved)) && (!q.trim() || [pick(th.subject), roster.find((s) => s.id === th.studentId)?.name ?? "", ...th.messages.map((m) => pick(m.text))].join(" ").toLowerCase().includes(q.trim().toLowerCase()))).sort((a, b) => last(b).at.localeCompare(last(a).at));
  const th = mine.find((x) => x.id === sel);
  const student = th && roster.find((s) => s.id === th.studentId);
  const course = th && assigned.find((c) => c.id === th.courseId);
  const send = () => {
    if (!th) return;
    if (!text.trim()) { setErr(t("Write a reply first.", "اكتب ردًا أولًا.")); return; }
    w.reply(th.id, { from: "instructor", text: language === "ar" ? ["", text.trim()] : [text.trim(), ""], at: NOW });
    setText(""); setErr(""); w.say(t(`Reply sent to ${student?.name} (demo).`, `تم إرسال الرد إلى ${student?.name} (عرض).`));
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="space-y-3 p-4">
        <label className="flex items-center gap-2 rounded-lg border bg-background px-3"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><input className="min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search conversations", "البحث في المحادثات")} placeholder={t("Search conversations", "البحث في المحادثات")} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <NativeSelect aria-label={t("Filter conversations", "تصفية المحادثات")} className="h-10" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">{t("All conversations", "كل المحادثات")}</option><option value="unread">{t("Unread", "غير مقروءة")}</option><option value="open">{t("Open", "مفتوحة")}</option><option value="resolved">{t("Resolved", "تم حلها")}</option></NativeSelect>
        <p className="text-xs text-muted-foreground">{t("Use the course filter at the top of the page to narrow by course.", "استخدم مرشح المقرر أعلى الصفحة للتصفية حسب المقرر.")}</p>
        {shown.length ? <ul className="divide-y">{shown.map((x) => { const s = roster.find((r) => r.id === x.studentId)!; return (
          <li key={x.id}><button type="button" onClick={() => { setSel(x.id); setErr(""); if (x.unread) w.patchThread(x.id, { unread: false }); }} aria-current={sel === x.id ? "true" : undefined} className={cn("w-full rounded-lg p-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", sel === x.id ? "bg-secondary/60" : "hover:bg-secondary/30")}>
            <span className="flex items-center justify-between gap-2"><span className={cn("flex items-center gap-2", x.unread && !x.resolved && "font-semibold")}>{x.unread && !x.resolved && <span className="size-2 rounded-full bg-danger" aria-label={t("Unread", "غير مقروءة")} />}{s.name}</span><span className="text-xs text-muted-foreground">{date(last(x).at, { month: "short", day: "numeric" })}</span></span>
            <span className="mt-0.5 block truncate text-muted-foreground">{pick(x.subject)}</span>
            <span className="mt-1 flex gap-1.5"><Badge tone="neutral">{assigned.find((c) => c.id === x.courseId)?.code}</Badge>{x.resolved && <Badge tone="success">{t("Resolved", "تم حلها")}</Badge>}</span></button></li>); })}</ul> : <EmptyState title={t("No conversations", "لا محادثات")} description={mine.length ? t("None match your search or filter.", "لا شيء يطابق بحثك أو مرشحك.") : t("Student messages will appear here.", "ستظهر رسائل الطلاب هنا.")} />}
      </Card>
      <Card className="flex min-h-96 flex-col p-4">
        {th && student && course ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
              <div><p className="font-semibold">{student.name} <span className="text-xs font-normal text-muted-foreground">{course.code}</span></p><p className="text-sm text-muted-foreground">{pick(th.subject)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">{t("Mastery in this course (estimate):", "الإتقان في هذا المقرر (تقدير):")}<LevelBadge level={levelOf(studentMastery(course, student))} value={studentMastery(course, student)} /></p></div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { w.patchThread(th.id, { unread: true }); setSel(null); w.say(t("Marked as unread.", "تم الوسم كغير مقروءة.")); }}><MailOpen aria-hidden="true" />{t("Mark unread", "وسم كغير مقروءة")}</Button><Button size="sm" variant="outline" onClick={() => { w.patchThread(th.id, { resolved: !th.resolved }); w.say(th.resolved ? t("Reopened.", "أُعيد فتحها.") : t("Marked as resolved.", "تم الوسم كمحلولة.")); }}><CheckCheck aria-hidden="true" />{th.resolved ? t("Reopen", "إعادة فتح") : t("Mark resolved", "وسم كمحلولة")}</Button></div>
            </div>
            <ul className="flex-1 space-y-3 overflow-y-auto py-4" aria-label={t("Conversation", "المحادثة")}>{th.messages.map((m, i) => <li key={i} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.from === "instructor" ? "ms-auto bg-primary text-primary-foreground" : "bg-muted")}><p dir="auto">{pick(m.text)}</p><p className={cn("mt-1 text-[11px]", m.from === "instructor" ? "text-primary-foreground/80" : "text-muted-foreground")}>{m.from === "instructor" ? t("You", "أنت") : student.name} · {date(m.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></li>)}</ul>
            <div className="space-y-2 border-t pt-3"><TextArea aria-label={t("Reply", "الرد")} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Write a reply…", "اكتب ردًا…")} />{err && <p role="alert" className="text-xs text-danger">{err}</p>}<div className="flex justify-end"><Button onClick={send}><Send aria-hidden="true" />{t("Send reply (demo)", "إرسال الرد (عرض)")}</Button></div></div>
          </>
        ) : <div className="grid flex-1 place-items-center text-center text-sm text-muted-foreground"><div><Mail className="mx-auto mb-2 size-8" aria-hidden="true" /><p>{t("Select a conversation to read and reply.", "اختر محادثة للقراءة والرد.")}</p><p className="mt-1 text-xs">{t(`${num(mine.filter((x) => x.unread && !x.resolved).length)} unread`, `${num(mine.filter((x) => x.unread && !x.resolved).length)} غير مقروءة`)}</p></div></div>}
      </Card>
    </div>
  );
}

/* Compose dialog, opened from the header, assignment rows, reminders and attendance */
export function Compose({ cw }: { cw: Cw }) {
  const p = cw.w.compose;
  if (!p) return null;
  return <ComposeForm key={JSON.stringify(p)} cw={cw} />;
}
function ComposeForm({ cw }: { cw: Cw }) {
  const { t, num, language, assigned, w, date } = cw;
  const p = w.compose!;
  const upsert = useInstructorPortal((s) => s.upsert);
  const [courseId, setCourseId] = useState((p.courseId as CourseId) ?? assigned[0].id);
  const [kind, setKind] = useState<CommKind>(p.kind ?? "announcement");
  const [aud, setAud] = useState<Audience>(p.audience ?? { type: "course" });
  const [title, setTitle] = useState<readonly [string, string]>(p.title ? [p.title, p.title] : ["", ""]);
  const [body, setBody] = useState<readonly [string, string]>(p.body ? [p.body, p.body] : ["", ""]);
  const [files, setFiles] = useState<string[]>([]);
  const [important, setImportant] = useState(false);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [when, setWhen] = useState(iso16(new Date(new Date(NOW).getTime() + 86400000).toISOString()));
  const [errors, setErrors] = useState<string[]>([]);
  const course = assigned.find((c) => c.id === courseId)!;
  const needRevision = useMemo(() => build([course], cw.students, { course: course.id, range: 30, group: "all", concept: "all", q: "" }).studentStats.filter((s) => s.remediation.length > 0).map((s) => s.student.id), [course, cw.students]);
  const recipients = aud.type === "course" ? roster.map((s) => s.id) : aud.type === "group" ? (aud.group === "revision" ? needRevision : roster.filter((s) => sectionOf(s) === aud.group).map((s) => s.id)) : aud.ids ?? [];
  const i = language === "ar" ? 1 : 0;
  const send = () => {
    const e: string[] = [];
    if (!title[i].trim()) e.push(t("Add a title.", "أضف عنوانًا."));
    if (!body[i].trim()) e.push(t("Write a message.", "اكتب رسالة."));
    if (!recipients.length) e.push(t("Choose at least one recipient.", "اختر مستلمًا واحدًا على الأقل."));
    if (mode === "schedule" && toIso(when) <= NOW) e.push(t("Pick a future date and time.", "اختر تاريخًا ووقتًا مستقبليين."));
    setErrors(e);
    if (e.length) return;
    const id = `cm-${Date.now().toString(36)}`;
    const at = mode === "now" ? NOW : toIso(when);
    w.addComm({ id, courseId, kind, audience: aud, title: title as never, body: body as never, files, status: mode === "now" ? "published" : "scheduled", at, recipients: recipients.length, important });
    if (mode === "now" && kind === "announcement" && aud.type === "course") upsert("announcements", { id, courseId, title: title as never, body: body as never, date: NOW, important });
    if (mode === "now" && aud.type === "students") for (const sid of aud.ids ?? []) w.startThread(courseId, sid, title as never, { from: "instructor", text: body as never, at: NOW });
    w.say(mode === "now" ? t(`Sent to ${recipients.length} student(s) (demo, nothing leaves the browser).`, `أُرسل إلى ${num(recipients.length)} طالب (عرض، لا يغادر المتصفح).`) : t(`Scheduled for ${date(toIso(when))} to ${recipients.length} student(s).`, `جُدول في ${date(toIso(when))} إلى ${num(recipients.length)} طالب.`));
    w.openCompose(null);
  };
  return (
    <Modal open onOpenChange={(o) => !o && w.openCompose(null)} size="lg" title={kind === "announcement" ? t("New announcement", "إعلان جديد") : t(commLabel[kind])} description={t("Demo only: nothing is delivered outside this browser.", "للعرض فقط: لا يُسلَّم شيء خارج هذا المتصفح.")}
      footer={<><Button variant="outline" onClick={() => w.openCompose(null)}>{t("Cancel", "إلغاء")}</Button><Button onClick={send}>{mode === "now" ? t("Publish now", "نشر الآن") : t("Schedule", "جدولة")}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Course", "المقرر")}>{({ id }) => <NativeSelect id={id} value={courseId} onChange={(e) => { setCourseId(e.target.value as CourseId); if (aud.type === "group" && aud.group === "revision") setAud({ type: "course" }); }}>{assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect>}</Field>
        <Field label={t("Type", "النوع")}>{({ id }) => <NativeSelect id={id} value={kind} onChange={(e) => setKind(e.target.value as CommKind)}>{(Object.keys(commLabel) as CommKind[]).map((k) => <option key={k} value={k}>{t(commLabel[k])}</option>)}</NativeSelect>}</Field>
        <Field label={t("Audience", "الجمهور")} className="sm:col-span-2">{({ id }) => <NativeSelect id={id} value={aud.type === "group" ? `g:${aud.group}` : aud.type} onChange={(e) => { const v = e.target.value; setAud(v === "course" ? { type: "course" } : v === "students" ? { type: "students", ids: [] } : { type: "group", group: v.slice(2) as "A" }); }}><option value="course">{t("Whole course", "المقرر كاملًا")}</option><option value="g:A">{t("Section A", "الشعبة أ")}</option><option value="g:B">{t("Section B", "الشعبة ب")}</option><option value="g:revision">{t("Students needing revision", "طلاب يحتاجون مراجعة")}</option><option value="students">{t("Selected students", "طلاب محددون")}</option></NativeSelect>}</Field>
      </div>
      {aud.type === "students" && <fieldset><legend className="mb-2 text-sm font-medium">{t("Students", "الطلاب")}</legend><div className="grid gap-2 sm:grid-cols-3">{roster.map((s) => <label key={s.id} className={row}><input type="checkbox" className={checkbox} checked={aud.ids?.includes(s.id) ?? false} onChange={() => setAud({ type: "students", ids: aud.ids?.includes(s.id) ? aud.ids.filter((x) => x !== s.id) : [...(aud.ids ?? []), s.id] })} />{s.name}</label>)}</div></fieldset>}
      <p className="text-sm text-muted-foreground">{t(`${recipients.length} recipient(s)`, `${num(recipients.length)} مستلم`)}</p>
      <Field label={t("Title", "العنوان")}>{({ id }) => <TextInput id={id} maxLength={120} value={title[i]} onChange={(e) => setTitle(editCopy(title, language, e.target.value))} />}</Field>
      <Field label={t("Message", "الرسالة")}>{({ id }) => <TextArea id={id} rows={5} value={body[i]} onChange={(e) => setBody(editCopy(body, language, e.target.value))} />}</Field>
      <div><p className="mb-1 text-sm font-medium">{t("Attach files", "إرفاق ملفات")}</p><input type="file" multiple aria-label={t("Attach files", "إرفاق ملفات")} onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? []).map((f) => f.name)]); e.target.value = ""; }} className="block w-full text-sm file:me-3 file:rounded-lg file:border file:bg-secondary file:px-3 file:py-2" />
        {files.length > 0 && <ul className="mt-2 flex flex-wrap gap-2 text-sm">{files.map((f, k) => <li key={k} className="flex items-center gap-1 rounded-full border px-3 py-1">{f}<button type="button" className="text-muted-foreground hover:text-danger" onClick={() => setFiles(files.filter((_, j) => j !== k))} aria-label={t(`Remove ${f}`, `إزالة ${f}`)}>×</button></li>)}</ul>}</div>
      <label className={row}><input type="checkbox" className={checkbox} checked={important} onChange={() => setImportant(!important)} />{t("Mark as important", "وسم كمهم")}</label>
      <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">{t("Publication", "النشر")}</legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">{([["now", t("Publish immediately", "نشر فوري")], ["schedule", t("Schedule", "جدولة")]] as const).map(([v, l]) => <label key={v} className={row}><input type="radio" name="pub" className={checkbox} checked={mode === v} onChange={() => setMode(v)} />{l}</label>)}</div>
        {mode === "schedule" && <TextInput aria-label={t("Publish at", "النشر في")} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</fieldset>
      {errors.length > 0 && <ul role="alert" className="list-disc space-y-1 ps-5 text-sm text-danger">{errors.map((x) => <li key={x}>{x}</li>)}</ul>}
    </Modal>
  );
}
