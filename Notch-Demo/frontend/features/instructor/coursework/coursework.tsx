"use client";
import { ClipboardList, Megaphone, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NativeSelect, Status } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { useInstructorPortal } from "@/features/instructor/portal/store";
import { TERMS } from "@/features/instructor/reports/data";
import { Assignments } from "./assignments";
import { AssignmentWizard } from "./assignment-wizard";
import { Attendance } from "./attendance";
import { Communication, Compose } from "./communication";
import { canRecord } from "./data";
import { useCoursework, type Tab } from "./use-coursework";

export function Coursework() {
  const cw = useCoursework();
  const { t, num, w, tab, scope, archived } = cw;
  const submissions = useInstructorPortal((s) => s.content.submissions);
  const waiting = submissions.filter((s) => s.status === "submitted" && cw.inScope(s.courseId)).length;
  const unrecorded = w.sessions.filter((s) => s.courseId === scope[0]?.id && canRecord(s) && !s.recorded).length;
  const tabs: [Tab, string, string, number, string][] = [["assignments", "Assignments", "الواجبات", waiting, "bg-warning text-white"], ["attendance", "Attendance", "الحضور", unrecorded, "bg-warning text-white"], ["communication", "Communication", "التواصل", cw.unread, "bg-danger text-white"]];
  const takeAttendance = () => {
    const course = scope[0];
    const s = [...w.sessions].filter((x) => x.courseId === course.id && canRecord(x) && !x.recorded).sort((a, b) => b.date.localeCompare(a.date))[0];
    cw.goTo({ tab: "attendance", ...(s ? { session: s.id } : {}) });
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle eyebrow={t("COURSEWORK", "الأعمال الدراسية")} title={t("Assignments, Attendance & Communication", "الواجبات والحضور والتواصل")} description={t("Manage coursework, track attendance, and communicate with students.", "أدر الأعمال الدراسية وتابع الحضور وتواصل مع الطلاب.")}
        action={<div className="flex flex-wrap gap-2">
          <Button disabled={archived} onClick={() => { cw.goTo({ tab: "assignments" }); w.openWizard("new"); }}><ClipboardList aria-hidden="true" />{t("Create assignment", "إنشاء واجب")}</Button>
          <Button variant="outline" disabled={archived} onClick={takeAttendance}><UserCheck aria-hidden="true" />{t("Take attendance", "تسجيل الحضور")}</Button>
          <Button variant="outline" disabled={archived} onClick={() => { cw.goTo({ tab: "communication", segment: "announcements" }); w.openCompose({ kind: "announcement", courseId: scope[0]?.id }); }}><Megaphone aria-hidden="true" />{t("Send announcement", "إرسال إعلان")}</Button>
        </div>} />
      <div role="search" aria-label={t("Filters", "المرشحات")} className="grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Course", "المقرر")}<NativeSelect value={cw.course} onChange={(e) => cw.setCourse(e.target.value)}><option value="all">{t("All my courses", "كل مقرراتي")}</option>{cw.assigned.map((c) => <option key={c.id} value={c.id}>{c.code} · {t(c.title)}</option>)}</NativeSelect></label>
        <label className="grid gap-1 text-xs text-muted-foreground">{t("Academic term", "الفصل الأكاديمي")}<NativeSelect value={cw.term.id} onChange={(e) => cw.setTerm(e.target.value)}>{TERMS.map((x) => <option key={x.id} value={x.id}>{t(x.label)}</option>)}</NativeSelect></label>
      </div>
      {archived && <p role="status" className="rounded-lg bg-warning-soft p-3 text-sm text-warning-ink">{t("Archived term: shown read-only as a mock snapshot of the current data. Creating, recording and sending are turned off.", "فصل مؤرشف: يُعرض للقراءة فقط كلقطة تجريبية من البيانات الحالية. الإنشاء والتسجيل والإرسال معطلة.")}</p>}
      <div role="status" aria-live="polite" className="min-h-5">{w.notice && <Status message={w.notice} />}</div>
      <div role="tablist" aria-label={t("Sections", "الأقسام")} className="flex gap-1 overflow-x-auto border-b">
        {tabs.map(([id, en, ar, n, badge]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => cw.setTab(id)} className={cn("relative min-h-11 whitespace-nowrap px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === id ? "text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground")}>{t(en, ar)}{n > 0 && <span className={cn("ms-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", badge)}>{num(n)}</span>}</button>)}
      </div>
      <div role="tabpanel">
        {tab === "assignments" && <Assignments cw={cw} />}
        {tab === "attendance" && <Attendance cw={cw} />}
        {tab === "communication" && <Communication cw={cw} />}
      </div>
      <AssignmentWizard cw={cw} />
      <Compose cw={cw} />
    </div>
  );
}
