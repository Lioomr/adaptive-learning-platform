"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookPlus, Check, MessageSquarePlus, Radar, Undo2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EditorDialog, EmptyState, Field, NativeSelect, Status, TextArea } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { NOW, oobReasonLabel, type OobQuestion, type OobReason, type OobStatus } from "./data";
import { useAgo, useOverview, useParam } from "./hooks";
import { CourseFilter, CourseTag, PageBack } from "./ui";

const statusText: Record<OobStatus, [string, string]> = {
  open: ["Not reviewed yet", "لم تتم المراجعة بعد"],
  reviewed: ["Reviewed", "تمت المراجعة"],
  answered: ["Answer approved", "اعتُمدت إجابة"],
  "out-of-scope": ["Marked outside course scope", "وُسم خارج نطاق المقرر"],
  dismissed: ["Dismissed", "تم التجاهل"],
};

export function OutOfBoundReview() {
  const { t, num, date, assigned, data } = useOverview();
  const ago = useAgo();
  const [course, setCourse] = useParam("course");
  const [reason, setReason] = useParam("reason");
  const [view, setView] = useParam("status", "open");
  const [focus] = useParam("q", "");
  const [notice, setNotice] = useState("");
  const [answering, setAnswering] = useState<OobQuestion | null>(null);
  const [adding, setAdding] = useState<OobQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [reuse, setReuse] = useState(true);
  const [file, setFile] = useState("");
  const ids = new Set(assigned.map((c) => c.id));
  const mine = data.oob.filter((q) => ids.has(q.courseId));
  const counts = Object.fromEntries(assigned.map((c) => [c.id, mine.filter((q) => q.courseId === c.id && q.status === "open").length]));
  const shown = mine
    .filter((q) => (course === "all" || q.courseId === course) && (reason === "all" || q.reason === reason) && (view === "all" || (view === "open" ? q.status === "open" : q.status !== "open")))
    .sort((a, b) => b.at.localeCompare(a.at));
  const focused = useRef<HTMLDivElement | null>(null);
  useEffect(() => { focused.current?.scrollIntoView({ block: "center" }); }, [focus, shown.length]);
  const say = (en: string, ar: string) => setNotice(t(en, ar));
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <PageBack />
        <PageTitle eyebrow={t("TUTOR QUESTIONS", "أسئلة المساعد")} title={t("Out-of-bound questions.", "أسئلة خارج النطاق.")} description={t("Questions the AI tutor would not answer: off-topic, unsupported by your materials, needing outside sources, or uncertain. Decide how each should be handled.", "أسئلة امتنع المساعد الذكي عن الإجابة عنها: خارج الموضوع أو غير مدعومة بموادك أو تحتاج مصادر خارجية أو غير مؤكدة. قرّر كيفية التعامل مع كل منها.")} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t("Status", "الحالة")} className="inline-flex rounded-xl border bg-muted/50 p-1">
          {([["open", t("Unresolved", "غير محسومة")], ["done", t("Resolved", "محسومة")], ["all", t("All", "الكل")]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={cn("min-h-10 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", view === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground")}>{label}</button>)}
        </div>
        <NativeSelect aria-label={t("Reason", "السبب")} className="w-auto" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="all">{t("Any reason", "أي سبب")}</option>
          {(Object.keys(oobReasonLabel) as OobReason[]).map((r) => <option key={r} value={r}>{t(oobReasonLabel[r])}</option>)}
        </NativeSelect>
        <Button variant="outline" className="ms-auto" onClick={() => { const r = data.arrive(); say(r.created ? "Demo: a new out-of-bound question was detected. Check the bell." : "Demo: the same question came in again and was merged into the existing one. No new notification.", r.created ? "عرض: رُصد سؤال جديد خارج النطاق. تحقق من الجرس." : "عرض: ورد السؤال نفسه مجددًا ودُمج في السؤال الحالي. لا إشعار جديد."); }}><Radar aria-hidden="true" />{t("Demo: simulate a new question", "عرض: محاكاة سؤال جديد")}</Button>
      </div>
      <CourseFilter value={course} onChange={setCourse} counts={counts} />
      <div role="status" aria-live="polite" className="min-h-5">{notice && <Status message={notice} />}</div>
      <ul className="space-y-4">
        {shown.map((q) => {
          const c = assigned.find((x) => x.id === q.courseId)!;
          const isOpen = q.status === "open";
          return (
            <li key={q.id}>
              <div ref={focus === q.id ? focused : undefined}>
                <Card className={cn("p-5 sm:p-6", focus === q.id && "border-primary ring-2 ring-primary/30")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-2"><CourseTag course={c} /><Badge tone={q.reason === "uncertain" ? "warning" : q.reason === "unrelated" ? "neutral" : "progress"}>{t(oobReasonLabel[q.reason])}</Badge>{q.concept && <Badge tone="outline">{t("Concept: ", "المفهوم: ")}{t(q.concept)}</Badge>}</p>
                    <Badge tone={isOpen ? "warning" : "success"}>{t(statusText[q.status])}</Badge>
                  </div>
                  <blockquote className="mt-4 border-s-4 border-primary ps-4 text-lg font-medium leading-7">“{t(q.question)}”</blockquote>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(`Asked by ${q.students.join(", ")}`, `سأل: ${q.students.join("، ")}`)} · {t(`${num(q.students.length)} student(s)`, `${num(q.students.length)} طالب`)}{q.repeats > 1 && ` · ${t(`asked ${num(q.repeats)} times`, `سُئل ${num(q.repeats)} مرات`)}`} · {date(q.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} ({ago(q.at)})
                  </p>
                  <div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm"><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Tutor's response", "رد المساعد")}</p><p>{t(q.response)}</p></div>
                  {q.approvedAnswer && (
                    <div className="mt-3 rounded-xl border border-success/30 bg-success-soft p-4 text-sm"><p className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success-ink">{t("Approved answer", "الإجابة المعتمدة")}{q.reuse && <Badge tone="success">{t("Stored as a reviewed response", "محفوظة كرد مراجَع")}</Badge>}</p><p className="whitespace-pre-wrap">{q.approvedAnswer}</p>{q.reuse && <p className="mt-2 text-xs text-muted-foreground">{t("Future reuse follows the platform's knowledge and content management rules.", "يخضع إعادة الاستخدام مستقبلًا لقواعد المنصة لإدارة المعرفة والمحتوى.")}</p>}</div>
                  )}
                  {q.material && <p className="mt-3 text-sm"><Badge tone="brand">{t("Material added", "أُضيفت مادة")}</Badge> <span dir="ltr">{q.material}</span></p>}
                  <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                    {isOpen ? (
                      <>
                        <Button size="sm" onClick={() => { data.setOob(q.id, "reviewed"); say("Marked as reviewed.", "تم وسمه كمراجَع."); }}><Check aria-hidden="true" />{t("Mark reviewed", "تمت المراجعة")}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAnswering(q); setAnswer(""); setReuse(true); }}><MessageSquarePlus aria-hidden="true" />{t("Provide approved answer", "تقديم إجابة معتمدة")}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setAdding(q); setFile(""); }}><BookPlus aria-hidden="true" />{t("Add course material", "إضافة مادة للمقرر")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => { data.setOob(q.id, "out-of-scope"); say("Marked as outside the course scope.", "تم وسمه خارج نطاق المقرر."); }}>{t("Outside course scope", "خارج نطاق المقرر")}</Button>
                        <Button size="sm" variant="ghost" onClick={() => { data.setOob(q.id, "dismissed"); say("Dismissed.", "تم التجاهل."); }}><X aria-hidden="true" />{t("Dismiss", "تجاهل")}</Button>
                      </>
                    ) : <Button size="sm" variant="outline" onClick={() => { data.reopenOob(q.id); say("Reopened.", "أُعيد الفتح."); }}><Undo2 aria-hidden="true" />{t("Reopen", "إعادة الفتح")}</Button>}
                    <Button asChild size="sm" variant="ghost"><Link href={`/instructor/courses/${q.courseId}/progress`}>{t("Open course", "فتح المقرر")}</Link></Button>
                  </div>
                </Card>
              </div>
            </li>
          );
        })}
      </ul>
      {!shown.length && <EmptyState title={view === "open" ? t("No unresolved questions", "لا توجد أسئلة غير محسومة") : t("Nothing here", "لا شيء هنا")} description={t("Students' out-of-bound questions will appear here when the tutor cannot answer them.", "ستظهر هنا أسئلة الطلاب خارج النطاق عندما يتعذّر على المساعد الإجابة عنها.")} />}
      <span className="sr-only">{NOW}</span>
      <EditorDialog key={answering?.id ?? "a-closed"} open={!!answering} onOpenChange={(o) => !o && setAnswering(null)} title={t("Provide an approved answer", "تقديم إجابة معتمدة")} description={t(answering ? `For: “${answering.question[0]}”` : "", answering ? `عن: «${answering.question[1]}»` : "")} submitLabel={t("Save approved answer", "حفظ الإجابة المعتمدة")} onSubmit={() => { if (!answering || !answer.trim()) return; data.answerOob(answering.id, answer.trim(), reuse); say(reuse ? "Answer approved and stored as a reviewed response." : "Answer approved.", reuse ? "اعتُمدت الإجابة وحُفظت كرد مراجَع." : "اعتُمدت الإجابة."); setAnswering(null); }}>
        <Field label={t("Approved answer", "الإجابة المعتمدة")}>{({ id }) => <TextArea id={id} required rows={6} maxLength={2000} value={answer} onChange={(e) => setAnswer(e.target.value)} />}</Field>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={reuse} onChange={(e) => setReuse(e.target.checked)} /><span>{t("Store as a reviewed response for future use", "حفظها كرد مراجَع للاستخدام مستقبلًا")}<span className="block text-xs text-muted-foreground">{t("Subject to the platform's knowledge and content management rules. Demo only: nothing is published.", "تخضع لقواعد المنصة لإدارة المعرفة والمحتوى. للعرض فقط: لا يُنشر شيء.")}</span></span></label>
      </EditorDialog>
      <EditorDialog key={adding?.id ?? "m-closed"} open={!!adding} onOpenChange={(o) => !o && setAdding(null)} title={t("Add course material", "إضافة مادة للمقرر")} description={t("Attach a file that answers this question. Demo only: the file name is recorded, nothing is uploaded.", "أرفق ملفًا يجيب عن هذا السؤال. للعرض فقط: يُسجَّل اسم الملف دون رفعه.")} submitLabel={t("Add material", "إضافة المادة")} onSubmit={() => { if (!adding || !file) return; data.addMaterial(adding.id, file); say(`Material “${file}” added. The question is marked reviewed.`, `أُضيفت المادة «${file}». وُسم السؤال كمراجَع.`); setAdding(null); }}>
        <Field label={t("File (PDF, PPT, PPTX)", "الملف (PDF أو PPT أو PPTX)")}>{({ id }) => <input id={id} type="file" accept=".pdf,.ppt,.pptx" className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground" onChange={(e) => setFile(e.target.files?.[0]?.name.slice(0, 80) ?? "")} />}</Field>
        <p className="text-sm text-muted-foreground">{t("Or manage all materials in ", "أو أدر كل المواد في ")}<Link href="/instructor/semester" className="font-medium text-primary hover:underline">{t("Semester Preparation", "تحضير الفصل")}</Link>.</p>
      </EditorDialog>
    </div>
  );
}
