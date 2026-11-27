"use client";
import { useState } from "react";
import { Check, MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EditorDialog, EmptyState, TextArea } from "@/features/instructor/portal/forms";
import { RULES } from "@/features/instructor/dashboard/data";
import { useDash } from "@/features/instructor/dashboard/store";
import { SCALE, levelOf, type RiskRow, type StudentStat } from "./data";
import type { Analytics } from "./use-analytics";
import { Bars, LevelBadge, Section, Trend, levelClass } from "./ui";

const sign = (n: number | null, num: (n: number) => string) => (n === null ? "—" : `${n > 0 ? "+" : ""}${num(n)}`);
const deltaTone = (n: number | null) => (n === null ? "text-muted-foreground" : n > 0 ? "text-success-ink" : n < 0 ? "text-danger" : "text-muted-foreground");

/* 6. Student progress */
export function Progress({ a }: { a: Analytics }) {
  const { t, num, model, filters, date } = a;
  const [pick, setPick] = useState<string[]>([]);
  const rows = model.studentStats;
  const shown = pick.length ? rows.filter((r) => pick.includes(r.student.id)) : rows;
  const classSeries = Array.from({ length: shown[0]?.series.length ?? 0 }, (_, i) => {
    const vals = shown.flatMap((r) => (r.series[i] == null ? [] : [r.series[i] as number]));
    return vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length) : null;
  });
  const fmt = (iso: string) => date(iso);
  const toggle = (id: string) => setPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <Section id="progress" title={t("Student progress", "تقدم الطلاب")} description={t("How estimated mastery moved over the selected period. Official assessment scores are shown separately and are not derived from mastery.", "كيف تغيّر الإتقان التقديري خلال الفترة المحددة. درجات التقييمات الرسمية تُعرض منفصلة ولا تُشتق من الإتقان.")}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="p-4">
          <h3 className="text-sm font-semibold">{pick.length ? t(`Selected students (${pick.length})`, `الطلاب المحددون (${num(pick.length)})`) : t("Class mastery trend", "اتجاه إتقان الصف")}</h3>
          {classSeries.some((v) => v !== null) ? <Trend className="mt-3" values={classSeries} label={t("Average estimated mastery over the period", "متوسط الإتقان التقديري خلال الفترة")} labels={[fmt(model.period.from), fmt(model.period.to)]} /> : <p className="mt-3 text-sm text-muted-foreground">{t("No mastery evidence in this period.", "لا توجد أدلة إتقان في هذه الفترة.")}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{t(`Period: last ${filters.range} days. Pick students in the table to compare them.`, `الفترة: آخر ${num(filters.range)} يومًا. اختر طلابًا من الجدول لمقارنتهم.`)}</p>
          {pick.length > 0 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setPick([])}>{t("Clear comparison", "مسح المقارنة")}</Button>}
        </Card>
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-start text-sm">
            <caption className="sr-only">{t("Student progress", "تقدم الطلاب")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Compare", "مقارنة"), t("Student", "الطالب"), t("Mastery (est.)", "الإتقان (تقديري)"), t("Change", "التغيّر"), t("Practice sessions", "جلسات التدريب"), t("Questions answered", "أسئلة مجابة"), t("Assessment score (official)", "درجة التقييم (رسمية)"), t("Mastered", "متقن"), t("Needs remediation", "يحتاج علاجًا")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student.id} className={cn("border-t", pick.includes(r.student.id) && "bg-secondary/50")}>
                  <td className="p-3"><input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={pick.includes(r.student.id)} onChange={() => toggle(r.student.id)} aria-label={t(`Compare ${r.student.name}`, `مقارنة ${r.student.name}`)} /></td>
                  <th scope="row" className="p-3 text-start font-medium"><button type="button" onClick={() => a.setStudent(r.student.id)} className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{r.student.name}</button></th>
                  <td className="p-3"><LevelBadge level={levelOf(r.avg)} value={r.avg} /></td>
                  <td className={cn("p-3 tabular-nums font-medium", deltaTone(r.delta))}>{sign(r.delta, num)}</td>
                  <td className="p-3 tabular-nums">{num(r.sessions)}</td>
                  <td className="p-3 tabular-nums">{num(r.questions)}</td>
                  <td className="p-3 tabular-nums">{r.assessment === null ? "—" : `${num(r.assessment)}%`}</td>
                  <td className="p-3 tabular-nums">{num(r.mastered.length)}</td>
                  <td className="p-3 tabular-nums">{r.remediation.length ? <Badge tone="danger">{num(r.remediation.length)}</Badge> : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState title={t("No students", "لا يوجد طلاب")} description={t("This student group is empty.", "هذه المجموعة فارغة.")} />}
        </Card>
      </div>
    </Section>
  );
}

/* 7. Engagement */
export function Engagement({ a }: { a: Analytics }) {
  const { t, num, model, filters } = a;
  const rows = model.studentStats;
  const active = rows.filter((r) => r.active).length;
  const idle = rows.filter((r) => r.student.lastActiveDays >= RULES.inactiveDays).sort((x, y) => y.student.lastActiveDays - x.student.lastActiveDays);
  const weeks = Math.max(...rows.map((r) => r.weekly.length), 1);
  const weeklyTotals = Array.from({ length: weeks }, (_, j) => rows.reduce((s, r) => s + (r.weekly[j + (r.weekly.length - weeks)] ?? 0), 0));
  const perWeek = rows.length ? (rows.reduce((s, r) => s + r.weekly.reduce((x, y) => x + y, 0) / Math.max(1, r.weekly.length), 0) / rows.length) : 0;
  const completion = rows.length ? Math.round(rows.reduce((s, r) => s + r.completion, 0) / rows.length) : 0;
  const questions = rows.reduce((s, r) => s + r.questions, 0);
  return (
    <Section id="engagement" title={t("Engagement analytics", "تحليلات المشاركة")} description={t("Engagement describes effort and activity. It is shown on its own and is not evidence that students learned.", "تصف المشاركة الجهد والنشاط. تُعرض وحدها وليست دليلًا على أن الطلاب تعلموا.")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Active vs inactive", "النشطون مقابل غير النشطين")}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{num(active)} <span className="text-base font-normal text-muted-foreground">/ {num(rows.length)}</span></p><span className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={t(`${active} active of ${rows.length}`, `${num(active)} نشط من ${num(rows.length)}`)}><span className="bg-primary" style={{ width: `${rows.length ? (active / rows.length) * 100 : 0}%` }} /></span><p className="mt-2 text-xs text-muted-foreground">{t("Active = practised in the last 3 days.", "نشط = تدرّب خلال آخر 3 أيام.")}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Practice frequency", "معدل التدريب")}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{num(Math.round(perWeek * 10) / 10)}</p><p className="mt-2 text-xs text-muted-foreground">{t("practice sessions per student per week", "جلسة تدريب لكل طالب أسبوعيًا")}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Questions answered", "الأسئلة المجابة")}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{num(questions)}</p><p className="mt-2 text-xs text-muted-foreground">{t(`in the last ${filters.range} days`, `خلال آخر ${num(filters.range)} يومًا`)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("Assigned activities completed", "الأنشطة المكلّف بها المكتملة")}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{num(completion)}%</p><span className="mt-2 flex h-2 overflow-hidden rounded-full bg-muted"><span className="bg-primary" style={{ width: `${completion}%` }} /></span></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("Learning sessions per week", "جلسات التعلم الأسبوعية")}</h3><Bars values={weeklyTotals} label={t("Learning sessions per week, whole class", "جلسات التعلم الأسبوعية للصف")} className="h-24" /><p className="mt-2 text-xs text-muted-foreground">{t("Oldest week on the left, latest on the right.", "أقدم أسبوع إلى اليسار وأحدثه إلى اليمين.")}</p></Card>
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("Not practised recently", "لم يتدربوا مؤخرًا")}</h3>
          {idle.length ? <ul className="divide-y text-sm">{idle.map((r) => <li key={r.student.id} className="flex items-center justify-between gap-3 py-2"><button type="button" onClick={() => a.setStudent(r.student.id)} className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{r.student.name}</button><Badge tone={r.student.lastActiveDays >= 10 ? "danger" : "warning"}>{t(`${r.student.lastActiveDays} days ago`, `قبل ${num(r.student.lastActiveDays)} أيام`)}</Badge></li>)}</ul> : <p className="text-sm text-muted-foreground">{t(`Everyone practised within the last ${RULES.inactiveDays} days.`, `تدرّب الجميع خلال آخر ${num(RULES.inactiveDays)} أيام.`)}</p>}</Card>
      </div>
    </Section>
  );
}

/* 8. Learning difficulties and at-risk students */
export function AtRisk({ a }: { a: Analytics }) {
  const { t, num, model, filters } = a;
  const contacted = useDash((s) => s.contacted);
  const [msg, setMsg] = useState<RiskRow | null>(null);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const rows = model.risks
    .filter((r) => filters.concept === "all" || r.low.some((n) => n.key === filters.concept))
    .filter((r) => !filters.q.trim() || r.risk.student.name.toLowerCase().includes(filters.q.trim().toLowerCase()))
    .sort((x, y) => (y.risk.severity === "high" ? 1 : 0) - (x.risk.severity === "high" ? 1 : 0) || x.risk.student.name.localeCompare(y.risk.student.name));
  const start = (r: RiskRow) => {
    setMsg(r);
    setText(t(`Hi ${r.risk.student.name}, I noticed ${r.risk.course.title[0]} may be difficult right now. Let's find a time to go through it together.`, `مرحبًا ${r.risk.student.name}، لاحظت أن ${r.risk.course.title[1]} قد يكون صعبًا الآن. دعنا نحدد وقتًا لمراجعته معًا.`));
  };
  return (
    <Section id="risk" title={t("Learning difficulties and at-risk students", "صعوبات التعلم والطلاب المعرضون للتعثر")} description={t("Every flag comes from a stated rule applied to real activity and performance. Rules are listed below the table.", "كل وسم يأتي من قاعدة معلنة مطبقة على النشاط والأداء الفعلي. القواعد مدرجة أسفل الجدول.")}>
      <div role="status" aria-live="polite" className="min-h-5 text-sm text-success">{notice}</div>
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-start text-sm">
            <caption className="sr-only">{t("At-risk students", "الطلاب المعرضون للتعثر")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Student", "الطالب"), t("Course", "المقرر"), t("Main difficulty", "الصعوبة الرئيسية"), t("Low-mastery concepts", "مفاهيم منخفضة الإتقان"), t("Recent activity", "النشاط الأخير"), t("Why flagged", "سبب الوسم"), t("Suggested action", "الإجراء المقترح"), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => {
                const done = contacted.includes(r.risk.id);
                return (
                  <tr key={r.risk.id} className="border-t align-top">
                    <th scope="row" className="p-3 text-start font-medium">{r.risk.student.name}<Badge tone={r.risk.severity === "high" ? "danger" : "warning"} className="ms-2">{r.risk.severity === "high" ? t("High", "مرتفع") : t("Medium", "متوسط")}</Badge></th>
                    <td className="whitespace-nowrap p-3">{r.risk.course.code}</td>
                    <td className="p-3">{t(r.main)}</td>
                    <td className="p-3">{r.low.length ? <span className="flex flex-wrap gap-1">{r.low.map((n) => <button key={n.key} type="button" onClick={() => a.setFocus(n.key)} className={cn("rounded-md px-2 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", levelClass.low)}>{t(n.title)}</button>)}</span> : <span className="text-muted-foreground">{t("None with enough evidence", "لا يوجد بأدلة كافية")}</span>}</td>
                    <td className="p-3">{t(r.recent)}</td>
                    <td className="p-3"><ul className="space-y-1">{r.risk.reasons.map((x) => <li key={x.key}>{t(x.text)}</li>)}</ul></td>
                    <td className="p-3">{t(r.risk.action)}</td>
                    <td className="p-3"><div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => a.setStudent(r.risk.student.id)}><User aria-hidden="true" />{t("Profile", "الملف")}</Button>
                      {done ? <Badge tone="success"><Check aria-hidden="true" />{t("Followed up", "تمت المتابعة")}</Badge> : <Button size="sm" onClick={() => start(r)} aria-label={t(`Message ${r.risk.student.name}`, `مراسلة ${r.risk.student.name}`)}><MessageSquare aria-hidden="true" />{t("Message", "مراسلة")}</Button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState title={t("No students flagged", "لا يوجد طلاب موسومون")} description={t("No student meets a risk rule in this selection, or there is not enough evidence yet.", "لا يستوفي أي طالب قاعدة خطر في هذا التحديد، أو لا توجد أدلة كافية بعد.")} />}
      <Card className="p-4 text-sm"><h3 className="mb-2 font-semibold">{t("Risk rules", "قواعد الخطر")}</h3><ul className="list-disc space-y-1 ps-5 text-muted-foreground">
        <li>{t(`Inactive: no activity for ${RULES.inactiveDays}+ days.`, `غير نشط: لا نشاط منذ ${num(RULES.inactiveDays)} أيام أو أكثر.`)}</li>
        <li>{t(`Stuck: mastery below ${RULES.stuckBelow}% in a concept.`, `متعثر: إتقان أقل من ${num(RULES.stuckBelow)}٪ في مفهوم.`)}</li>
        <li>{t(`Prerequisite gap: a concept below ${RULES.stuckPrereqConcept}% while a prerequisite is below ${RULES.prereqBelow}%.`, `فجوة متطلب: مفهوم أقل من ${num(RULES.stuckPrereqConcept)}٪ بينما متطلب أقل من ${num(RULES.prereqBelow)}٪.`)}</li>
        <li>{t(`Behind: under ${RULES.behindBelow}% of lectures and labs completed.`, `متأخر: أُنجز أقل من ${num(RULES.behindBelow)}٪ من المحاضرات والمعامل.`)}</li>
      </ul></Card>
      <EditorDialog key={msg?.risk.id ?? "closed"} open={!!msg} onOpenChange={(o) => !o && setMsg(null)} title={t(`Message ${msg?.risk.student.name ?? ""}`, `مراسلة ${msg?.risk.student.name ?? ""}`)} description={t("Demo only: nothing is sent. Sending records the follow-up.", "للعرض فقط: لا يُرسل شيء. يسجّل الإرسال المتابعة.")} submitLabel={t("Send (demo)", "إرسال (عرض)")} onSubmit={() => {
        if (!msg || !text.trim()) return;
        const d = useDash.getState();
        d.contact(msg.risk.id); d.log(msg.risk.course.id, "help", [`Messaged ${msg.risk.student.name}`, `تمت مراسلة ${msg.risk.student.name}`]);
        setNotice(t(`Message to ${msg.risk.student.name} recorded (demo, not sent).`, `تم تسجيل الرسالة إلى ${msg.risk.student.name} (عرض، لم تُرسل).`)); setMsg(null);
      }}>
        <TextArea aria-label={t("Message", "الرسالة")} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </EditorDialog>
    </Section>
  );
}

/* Student learning profile drawer */
export function StudentDrawer({ a }: { a: Analytics }) {
  const { t, num, model, language } = a;
  const s = a.student;
  const st: StudentStat | undefined = s ? model.studentStats.find((x) => x.student.id === s.id) : undefined;
  const risks = s ? model.risks.filter((r) => r.risk.student.id === s.id) : [];
  const nodes = model.allNodes.map((n) => ({ n, c: model.cell(s?.id ?? "", n.key) }));
  return (
    <Sheet open={!!s} onOpenChange={(o) => !o && a.setStudent(null)}>
      <SheetContent side="end" dir={language === "ar" ? "rtl" : "ltr"} closeLabel={t("Close", "إغلاق")} className="w-[min(100vw,30rem)] overflow-y-auto bg-card p-6">
        {s && st && (
          <div className="space-y-6">
            <div className="pe-10"><SheetTitle className="text-xl font-semibold">{s.name}</SheetTitle><SheetDescription className="mt-1 text-sm text-muted-foreground">{t(`Learning profile · Section ${st.section === "A" ? "A" : "B"} · last active ${s.lastActiveDays} days ago`, `ملف التعلم · الشعبة ${st.section === "A" ? "أ" : "ب"} · آخر نشاط قبل ${num(s.lastActiveDays)} أيام`)}</SheetDescription></div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("Mastery (est.)", "الإتقان (تقديري)")}</p><LevelBadge level={levelOf(st.avg)} value={st.avg} /></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("Change", "التغيّر")}</p><p className={cn("font-semibold tabular-nums", deltaTone(st.delta))}>{sign(st.delta, num)}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{t("Assessment (official)", "التقييم (رسمي)")}</p><p className="font-semibold tabular-nums">{st.assessment === null ? "—" : `${num(st.assessment)}%`}</p></div>
            </div>
            {st.avg !== null ? <div><h3 className="mb-2 text-sm font-semibold">{t("Mastery trend", "اتجاه الإتقان")}</h3><Trend values={st.series} label={t(`${s.name} mastery trend`, `اتجاه إتقان ${s.name}`)} /></div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("Not enough practice evidence to estimate mastery yet.", "لا توجد أدلة تدريب كافية لتقدير الإتقان بعد.")}</p>}
            <div><h3 className="mb-2 text-sm font-semibold">{t("Weekly practice sessions", "جلسات التدريب الأسبوعية")}</h3><Bars values={st.weekly} label={t("Weekly practice sessions", "جلسات التدريب الأسبوعية")} /><p className="mt-1 text-xs text-muted-foreground">{t(`${num(st.sessions)} sessions · ${num(st.questions)} questions answered · ${num(st.completion)}% of assigned activities done`, `${num(st.sessions)} جلسة · ${num(st.questions)} سؤالًا · ${num(st.completion)}٪ من الأنشطة المكلّف بها`)}</p></div>
            <div><h3 className="mb-2 text-sm font-semibold">{t("Concepts", "المفاهيم")}</h3><ul className="space-y-1.5 text-sm">{nodes.map(({ n, c }) => <li key={n.key} className="flex items-center justify-between gap-2"><button type="button" onClick={() => { a.setStudent(null); a.setFocus(n.key); }} className="rounded text-start outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{model.inScope.length > 1 && <span className="text-xs text-muted-foreground">{n.course.code} · </span>}{t(n.title)}</button><LevelBadge level={c.level} value={c.mastery} /></li>)}</ul></div>
            <div className="rounded-xl bg-secondary/50 p-4 text-sm"><h3 className="mb-1 font-semibold">{t("Why this student is flagged", "لماذا وُسم هذا الطالب")}</h3>{risks.length ? <ul className="list-disc space-y-1 ps-5">{risks.flatMap((r) => r.risk.reasons.map((x) => <li key={`${r.risk.id}${x.key}`}>{r.risk.course.code}: {t(x.text)}</li>))}</ul> : <p className="text-muted-foreground">{t("No risk rule is triggered.", "لا تنطبق أي قاعدة خطر.")}</p>}{risks[0] && <p className="mt-2 font-medium">{t("Suggested:", "المقترح:")} {t(risks[0].risk.action)}</p>}</div>
            <p className="text-xs text-muted-foreground">{t(`Mastery scale: low below ${SCALE.low}%, high from ${SCALE.high}%. Estimates are not grades.`, `مقياس الإتقان: منخفض أقل من ${num(SCALE.low)}٪ ومرتفع من ${num(SCALE.high)}٪. التقديرات ليست درجات.`)}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

