"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EditorDialog, EmptyState, NativeSelect, Status, TextArea } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { assess, RULES, type Risk } from "./data";
import { useOverview, useParam } from "./hooks";
import { CourseFilter, PageBack } from "./ui";

type Row = { key: string; student: Risk["student"]; course: Risk["course"]; risk: Risk | null };

export function StudentManagement() {
  const { t, num, assigned, students, data } = useOverview();
  const [filter, setFilter] = useParam("filter", "all");
  const [course, setCourse] = useParam("course");
  const [reason, setReason] = useParam("reason");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [msg, setMsg] = useState<Row | null>(null);
  const [text, setText] = useState("");
  const rows = useMemo<Row[]>(
    () => assigned.flatMap((c) => students.map((s) => ({ key: `${c.id}:${s.id}`, student: s, course: c, risk: assess(c, s) }))),
    [assigned, students],
  );
  const match = (r: Row) => {
    if (course !== "all" && r.course.id !== course) return false;
    if (filter === "at-risk" && !r.risk) return false;
    if (query.trim() && !r.student.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    if (reason !== "all") {
      const keys = r.risk?.reasons.map((x) => x.key) ?? [];
      const ok = reason === "concept" ? keys.some((k) => k === "stuck" || k === "prerequisite" || k === "mastery") : keys.includes(reason as "inactive");
      if (!ok) return false;
    }
    return true;
  };
  const shown = rows.filter(match).sort((a, b) => (b.risk?.severity === "high" ? 2 : b.risk ? 1 : 0) - (a.risk?.severity === "high" ? 2 : a.risk ? 1 : 0) || a.student.name.localeCompare(b.student.name));
  const counts = Object.fromEntries(assigned.map((c) => [c.id, rows.filter((r) => r.course.id === c.id && r.risk && !data.contacted.includes(r.key)).length]));
  const done = (k: string) => data.contacted.includes(k);
  const startMessage = (r: Row) => {
    setMsg(r);
    setText(t(`Hi ${r.student.name}, I noticed you may be finding ${r.course.title[0]} difficult. My office hours are on Wednesday, and I'm happy to help.`, `مرحبًا ${r.student.name}، لاحظت أنك قد تواجه صعوبة في ${r.course.title[1]}. ساعاتي المكتبية يوم الأربعاء ويسعدني مساعدتك.`));
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div><PageBack /><PageTitle eyebrow={t("STUDENTS", "الطلاب")} title={filter === "at-risk" ? t("Students who may need you.", "طلاب قد يحتاجون إليك.") : t("Your students.", "طلابك.")} description={t("Flags come from explicit rules applied to real activity. Each shows why and what to do next.", "تأتي الوسوم من قواعد صريحة مطبقة على النشاط الفعلي. يوضح كل منها السبب والخطوة التالية.")} /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_1fr_1fr_1fr]">
        <div role="group" aria-label={t("View", "العرض")} className="inline-flex rounded-xl border bg-muted/50 p-1">
          {([["at-risk", t("At risk", "المعرّضون للتعثر")], ["all", t("All students", "كل الطلاب")]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`min-h-10 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${filter === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground"}`}>{label}</button>)}
        </div>
        <label className="flex items-center gap-2 rounded-lg border bg-card px-3"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><input className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search students", "البحث عن طالب")} placeholder={t("Search students", "البحث عن طالب")} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <NativeSelect aria-label={t("Reason", "السبب")} value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="all">{t("Any reason", "أي سبب")}</option><option value="inactive">{t("Inactive", "غير نشط")}</option><option value="concept">{t("Stuck on a concept", "متعثر في مفهوم")}</option><option value="behind">{t("Behind schedule", "متأخر عن الجدول")}</option>
        </NativeSelect>
      </div>
      <CourseFilter value={course} onChange={setCourse} counts={counts} />
      <div role="status" aria-live="polite" className="min-h-5">{notice && <Status message={notice} />}</div>
      {shown.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-start text-sm">
            <caption className="sr-only">{t("Students", "الطلاب")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Course", "المقرر"), t("Mastery", "الإتقان"), t("Progress", "التقدم"), t("Last active", "آخر نشاط"), t("Why flagged", "سبب الوسم"), t("Recommended follow-up", "المتابعة المقترحة"), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.key} className="border-t align-top">
                  <th scope="row" className="p-3 text-start font-medium"><Link href={`/instructor/students/${r.student.id}`} className="text-primary hover:underline">{r.student.name}</Link>{r.risk && <Badge tone={r.risk.severity === "high" ? "danger" : "warning"} className="ms-2">{r.risk.severity === "high" ? t("High", "مرتفع") : t("Medium", "متوسط")}</Badge>}</th>
                  <td className="p-3 whitespace-nowrap">{r.course.code}</td>
                  <td className="p-3 tabular-nums">{r.risk ? `${num(r.risk.mastery)}%` : "—"}</td>
                  <td className="p-3 tabular-nums">{r.risk ? `${num(r.risk.completion)}%` : "—"}</td>
                  <td className="p-3 whitespace-nowrap">{t(`${r.student.lastActiveDays} days ago`, `قبل ${num(r.student.lastActiveDays)} أيام`)}</td>
                  <td className="p-3">{r.risk ? <ul className="space-y-1">{r.risk.reasons.map((x) => <li key={x.key}>{t(x.text)}</li>)}</ul> : <Badge tone="success">{t("On track", "على المسار الصحيح")}</Badge>}</td>
                  <td className="p-3">{r.risk ? t(r.risk.action) : "—"}</td>
                  <td className="p-3">
                    {r.risk && (done(r.key) ? <Badge tone="success"><Check aria-hidden="true" />{t("Followed up", "تمت المتابعة")}</Badge> : (
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => startMessage(r)} aria-label={t(`Message ${r.student.name}`, `مراسلة ${r.student.name}`)}><MessageSquare aria-hidden="true" />{t("Message", "مراسلة")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => { data.contact(r.key); data.log(r.course.id, "help", [`Marked ${r.student.name} as followed up`, `تمت متابعة ${r.student.name}`]); setNotice(t(`${r.student.name} marked as followed up.`, `تم وسم ${r.student.name} بأنه تمت متابعته.`)); }}>{t("Mark followed up", "وسم كمتابَع")}</Button>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState title={t("No students match", "لا يوجد طلاب مطابقون")} description={filter === "at-risk" ? t("No student is flagged in this selection.", "لا يوجد طالب موسوم في هذا التحديد.") : t("Try another course or search.", "جرّب مقررًا أو بحثًا آخر.")} />}
      <Card className="p-5 text-sm">
        <h2 className="mb-2 font-semibold">{t("How students are flagged", "كيف يُوسم الطلاب")}</h2>
        <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
          <li>{t(`Inactive: no activity for ${RULES.inactiveDays}+ days.`, `غير نشط: لا نشاط منذ ${num(RULES.inactiveDays)} أيام أو أكثر.`)}</li>
          <li>{t(`Stuck: mastery below ${RULES.stuckBelow}% in a concept (overall below ${RULES.lowMastery}% where concepts are not tracked).`, `متعثر: إتقان أقل من ${num(RULES.stuckBelow)}٪ في مفهوم (أو أقل من ${num(RULES.lowMastery)}٪ عامًا حيث لا تُتتبَّع المفاهيم).`)}</li>
          <li>{t(`Prerequisite gap: a concept below ${RULES.stuckPrereqConcept}% while one of its prerequisites is below ${RULES.prereqBelow}%.`, `فجوة متطلب: مفهوم أقل من ${num(RULES.stuckPrereqConcept)}٪ بينما أحد متطلباته أقل من ${num(RULES.prereqBelow)}٪.`)}</li>
          <li>{t(`Behind: under ${RULES.behindBelow}% of lectures and labs done; about ${RULES.expectedProgress}% expected this week.`, `متأخر: أنجز أقل من ${num(RULES.behindBelow)}٪ من المحاضرات والمعامل؛ المتوقع نحو ${num(RULES.expectedProgress)}٪ هذا الأسبوع.`)}</li>
        </ul>
      </Card>
      <EditorDialog key={msg?.key ?? "closed"} open={!!msg} onOpenChange={(o) => !o && setMsg(null)} title={t(`Message ${msg?.student.name ?? ""}`, `مراسلة ${msg?.student.name ?? ""}`)} description={t("Demo only: nothing is sent. Sending records the follow-up.", "للعرض فقط: لا يُرسل شيء. يسجّل الإرسال المتابعة.")} submitLabel={t("Send (demo)", "إرسال (عرض)")} onSubmit={() => { if (!msg || !text.trim()) return; data.contact(msg.key); data.log(msg.course.id, "help", [`Messaged ${msg.student.name}`, `تمت مراسلة ${msg.student.name}`]); setNotice(t(`Message to ${msg.student.name} recorded (demo, not sent).`, `تم تسجيل الرسالة إلى ${msg.student.name} (عرض، لم تُرسل).`)); setMsg(null); }}>
        <TextArea aria-label={t("Message", "الرسالة")} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </EditorDialog>
    </div>
  );
}
