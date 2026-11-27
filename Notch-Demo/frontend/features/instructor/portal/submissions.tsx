"use client";
import { useState } from "react";
import { FileText, Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/features/student/portal/data";
import {
  assignmentKindLabels,
  type AssignmentKind,
  type CourseAssignment,
  type StudentSubmission,
  type SubmissionStatus,
} from "./data";
import { useInstructor } from "./context";
import { useInstructorPortal } from "./store";
import { SectionTitle } from "./ui";
import {
  ConfirmDelete,
  EditorDialog,
  EmptyState,
  Field,
  NativeSelect,
  Status,
  TextArea,
  TextInput,
  editCopy,
  newId,
} from "./forms";

type Area = "assignments" | "submissions";

export function Submissions({ course }: { course: Course }) {
  const { t, num, content } = useInstructor();
  const [area, setArea] = useState<Area>("assignments");
  const waiting = content.submissions.filter(
    (s) => s.courseId === course.id && s.status === "submitted",
  ).length;
  const tabs: [Area, string, number | null][] = [
    ["assignments", t("Assignments", "الواجبات"), null],
    ["submissions", t("Student submissions", "تسليمات الطلاب"), waiting],
  ];
  return (
    <section>
      <div
        role="tablist"
        aria-label={t("Submissions areas", "أقسام التسليمات")}
        className="mb-6 inline-flex rounded-xl border bg-muted/50 p-1"
      >
        {tabs.map(([id, label, badge]) => (
          <button
            key={id}
            role="tab"
            type="button"
            id={`sub-tab-${id}`}
            aria-selected={area === id}
            aria-controls={`sub-panel-${id}`}
            onClick={() => setArea(id)}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${area === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
            {badge ? <Badge tone="warning">{num(badge)}</Badge> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`sub-panel-${area}`} aria-labelledby={`sub-tab-${area}`}>
        {area === "assignments" ? (
          <AssignmentManager course={course} />
        ) : (
          <SubmissionReview course={course} />
        )}
      </div>
    </section>
  );
}

const toInput = (iso: string) => iso.slice(0, 16);
const fromInput = (value: string) => `${value}:00+02:00`;

function AssignmentManager({ course }: { course: Course }) {
  const { t, pick, date, num, content, language } = useInstructor();
  const upsert = useInstructorPortal((s) => s.upsert);
  const remove = useInstructorPortal((s) => s.remove);
  const [draft, setDraft] = useState<CourseAssignment | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<CourseAssignment | null>(null);
  const [message, setMessage] = useState("");
  const list = content.assignments
    .filter((a) => a.courseId === course.id)
    .sort((a, b) => b.due.localeCompare(a.due));
  const open = (a?: CourseAssignment) => {
    setIsNew(!a);
    setDraft(
      a ?? {
        id: newId("as"),
        courseId: course.id,
        kind: "assignment",
        title: ["", ""],
        instructions: ["", ""],
        due: "2026-12-06T18:00:00+02:00",
        maxGrade: 100,
        weight: 10,
        attachments: [],
        status: "draft",
      },
    );
  };
  return (
    <div id="assignments">
      <SectionTitle
        title={t("Assignments", "الواجبات")}
        description={t(
          "Create work, set deadlines and maximum grades. Students see published items only.",
          "أنشئ الأعمال وحدد المواعيد والدرجات القصوى. يرى الطلاب العناصر المنشورة فقط.",
        )}
      >
        <Button onClick={() => open()}>
          <Plus aria-hidden="true" />
          {t("New assignment", "واجب جديد")}
        </Button>
      </SectionTitle>
      <Status message={message} />
      <div className="mt-3 space-y-4">
        {list.map((a) => {
          const subs = content.submissions.filter((s) => s.assignmentId === a.id);
          const turnedIn = subs.filter((s) => s.status !== "missing").length;
          const graded = subs.filter((s) => s.status === "graded").length;
          return (
            <Card key={a.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{pick(a.title)}</h3>
                    <Badge tone="outline">{t(assignmentKindLabels[a.kind])}</Badge>
                    <Badge tone={a.status === "published" ? "success" : "neutral"}>
                      {a.status === "published" ? t("Published", "منشور") : t("Draft", "مسودة")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Due", "الموعد")}{" "}
                    {date(a.due, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}{" "}
                    · {t("max", "الحد الأقصى")} {num(a.maxGrade)} · {num(a.weight)}% {t("of course grade", "من درجة المقرر")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => open(a)} aria-label={t(`Edit ${pick(a.title)}`, `تعديل ${pick(a.title)}`)}>
                    <Pencil aria-hidden="true" />
                    {t("Edit", "تعديل")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(a)} aria-label={t(`Delete ${pick(a.title)}`, `حذف ${pick(a.title)}`)}>
                    <Trash2 aria-hidden="true" />
                    {t("Delete", "حذف")}
                  </Button>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{pick(a.instructions)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm">
                <span className="text-muted-foreground">
                  {t("Turned in", "المسلّم")}: <strong className="text-foreground">{num(turnedIn)}/{num(subs.length)}</strong>
                </span>
                <span className="text-muted-foreground">
                  {t("Graded", "المقيَّم")}: <strong className="text-foreground">{num(graded)}</strong>
                </span>
                {a.attachments.map((f) => (
                  <span key={f.name} className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Paperclip className="size-3.5" aria-hidden="true" />
                    <span dir="ltr">{f.name}</span> · {f.size}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {!list.length && (
        <EmptyState
          title={t("No assignments yet", "لا توجد واجبات بعد")}
          description={t("Create your first assignment to start collecting work.", "أنشئ أول واجب لتبدأ في جمع الأعمال.")}
          action={<Button onClick={() => open()}><Plus aria-hidden="true" />{t("New assignment", "واجب جديد")}</Button>}
        />
      )}
      <EditorDialog
        key={draft?.id ?? "closed"}
        wide
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={isNew ? t("New assignment", "واجب جديد") : t("Edit assignment", "تعديل الواجب")}
        description={t("Instructions, deadline, attachments and grading.", "التعليمات والموعد والمرفقات والتقييم.")}
        submitLabel={isNew ? t("Create assignment", "إنشاء الواجب") : t("Save changes", "حفظ التعديلات")}
        onSubmit={() => {
          if (!draft || !pick(draft.title).trim() || !pick(draft.instructions).trim()) return;
          upsert("assignments", draft);
          setMessage(isNew ? t("Assignment created.", "تم إنشاء الواجب.") : t("Assignment updated.", "تم تحديث الواجب."));
          setDraft(null);
        }}
      >
        {draft && (
          <>
            <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
              <Field label={t("Title", "العنوان")}>
                {({ id }) => <TextInput id={id} required maxLength={120} value={pick(draft.title)} onChange={(e) => setDraft({ ...draft, title: editCopy(draft.title, language, e.target.value) })} />}
              </Field>
              <Field label={t("Type", "النوع")}>
                {({ id }) => (
                  <NativeSelect id={id} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as AssignmentKind })}>
                    {(Object.keys(assignmentKindLabels) as AssignmentKind[]).map((k) => (
                      <option key={k} value={k}>{t(assignmentKindLabels[k])}</option>
                    ))}
                  </NativeSelect>
                )}
              </Field>
            </div>
            <Field label={t("Instructions", "التعليمات")}>
              {({ id }) => <TextArea id={id} required rows={5} maxLength={4000} value={pick(draft.instructions)} onChange={(e) => setDraft({ ...draft, instructions: editCopy(draft.instructions, language, e.target.value) })} />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label={t("Deadline (Cairo time)", "الموعد (بتوقيت القاهرة)")}>
                {({ id }) => <TextInput id={id} type="datetime-local" required value={toInput(draft.due)} onChange={(e) => e.target.value && setDraft({ ...draft, due: fromInput(e.target.value) })} />}
              </Field>
              <Field label={t("Maximum grade", "الدرجة القصوى")}>
                {({ id }) => <TextInput id={id} type="number" min={1} max={1000} required value={draft.maxGrade} onChange={(e) => setDraft({ ...draft, maxGrade: Math.min(1000, Math.max(1, Number(e.target.value) || 1)) })} />}
              </Field>
              <Field label={t("Weight (%)", "الوزن (٪)")}>
                {({ id }) => <TextInput id={id} type="number" min={0} max={100} required value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />}
              </Field>
            </div>
            <Field
              label={t("Attachments", "المرفقات")}
              hint={t("Demo only: file names are recorded, nothing is uploaded.", "للعرض فقط: تُسجَّل أسماء الملفات دون رفعها.")}
            >
              {({ id, describedBy }) => (
                <div className="space-y-2">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="file"
                    multiple
                    className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
                    onChange={(e) => {
                      const added = Array.from(e.target.files ?? []).map((f) => ({
                        name: f.name.slice(0, 80),
                        size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
                      }));
                      setDraft({ ...draft, attachments: [...draft.attachments, ...added].slice(0, 8) });
                      e.target.value = "";
                    }}
                  />
                  <ul className="space-y-1">
                    {draft.attachments.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate" dir="ltr">{f.name}</span><span className="text-xs text-muted-foreground">{f.size}</span></span>
                        <Button variant="ghost" size="icon-sm" aria-label={t(`Remove ${f.name}`, `إزالة ${f.name}`)} onClick={() => setDraft({ ...draft, attachments: draft.attachments.filter((_, j) => j !== i) })}><X /></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Field>
            <Field label={t("Visibility", "الظهور")}>
              {({ id }) => (
                <NativeSelect id={id} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "draft" | "published" })}>
                  <option value="draft">{t("Draft (hidden from students)", "مسودة (مخفية عن الطلاب)")}</option>
                  <option value="published">{t("Published", "منشور")}</option>
                </NativeSelect>
              )}
            </Field>
          </>
        )}
      </EditorDialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete this assignment?", "حذف هذا الواجب؟")}
        description={t("Student submissions and grades for it will be removed too. This cannot be undone.", "ستُحذف أيضًا تسليمات الطلاب ودرجاتهم له. لا يمكن التراجع عن ذلك.")}
        onConfirm={() => {
          if (deleting) remove("assignments", deleting.id);
          setDeleting(null);
          setMessage(t("Assignment deleted.", "تم حذف الواجب."));
        }}
      />
    </div>
  );
}

const statusTone: Record<SubmissionStatus, "warning" | "success" | "neutral"> = {
  submitted: "warning",
  graded: "success",
  missing: "neutral",
};

function SubmissionReview({ course }: { course: Course }) {
  const { t, pick, date, num, content, students } = useInstructor();
  const review = useInstructorPortal((s) => s.review);
  const [assignmentId, setAssignmentId] = useState("all");
  const [status, setStatus] = useState<SubmissionStatus | "all">("submitted");
  const [open, setOpen] = useState<StudentSubmission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");
  const assignments = content.assignments.filter((a) => a.courseId === course.id);
  const rows = content.submissions
    .filter(
      (s) =>
        s.courseId === course.id &&
        assignments.some((a) => a.id === s.assignmentId) &&
        (assignmentId === "all" || s.assignmentId === assignmentId) &&
        (status === "all" || s.status === status),
    )
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const assignmentOf = (id: string) => assignments.find((a) => a.id === id);
  const current = open && assignmentOf(open.assignmentId);
  const statusLabel: Record<SubmissionStatus, string> = {
    submitted: t("Needs grading", "بانتظار التقييم"),
    graded: t("Graded", "تم التقييم"),
    missing: t("Not submitted", "لم يُسلَّم"),
  };
  const parsed = grade.trim() === "" ? undefined : Number(grade);
  const invalid = current && parsed !== undefined && (Number.isNaN(parsed) || parsed < 0 || parsed > current.maxGrade);
  return (
    <div id="student-submissions">
      <SectionTitle
        title={t("Student submissions", "تسليمات الطلاب")}
        description={t("Open a submission to read the work, give feedback and assign a grade.", "افتح تسليمًا لقراءة العمل وكتابة الملاحظات ورصد الدرجة.")}
      />
      <Status message={message} />
      <div className="my-3 flex flex-wrap gap-3">
        <NativeSelect aria-label={t("Filter by assignment", "تصفية حسب الواجب")} className="w-full sm:w-72" value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="all">{t("All assignments", "كل الواجبات")}</option>
          {assignments.map((a) => <option key={a.id} value={a.id}>{pick(a.title)}</option>)}
        </NativeSelect>
        <NativeSelect aria-label={t("Filter by status", "تصفية حسب الحالة")} className="w-full sm:w-52" value={status} onChange={(e) => setStatus(e.target.value as SubmissionStatus | "all")}>
          <option value="all">{t("All statuses", "كل الحالات")}</option>
          <option value="submitted">{statusLabel.submitted}</option>
          <option value="graded">{statusLabel.graded}</option>
          <option value="missing">{statusLabel.missing}</option>
        </NativeSelect>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-start text-sm">
          <caption className="sr-only">{t("Student submissions", "تسليمات الطلاب")}</caption>
          <thead className="bg-muted/60">
            <tr>
              {[t("Student", "الطالب"), t("Assignment", "الواجب"), t("Submitted", "وقت التسليم"), t("Status", "الحالة"), t("Grade", "الدرجة"), ""].map((h, i) => (
                <th key={i} scope="col" className="p-4 text-start font-medium text-muted-foreground">{h || <span className="sr-only">{t("Actions", "إجراءات")}</span>}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const a = assignmentOf(s.assignmentId)!;
              return (
                <tr key={s.id} className="border-t">
                  <th scope="row" className="p-4 text-start font-medium">{nameOf(s.studentId)}</th>
                  <td className="p-4">{pick(a.title)}</td>
                  <td className="p-4 text-muted-foreground">{s.submittedAt ? date(s.submittedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="p-4"><Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge></td>
                  <td className="p-4 tabular-nums">{s.grade === undefined ? "—" : `${num(s.grade)}/${num(a.maxGrade)}`}</td>
                  <td className="p-4 text-end">
                    {s.status !== "missing" && (
                      <Button
                        size="sm"
                        variant={s.status === "submitted" ? "default" : "outline"}
                        aria-label={t(`${s.status === "submitted" ? "Review" : "View"} ${nameOf(s.studentId)}'s work`, `${s.status === "submitted" ? "مراجعة" : "عرض"} عمل ${nameOf(s.studentId)}`)}
                        onClick={() => {
                          setOpen(s);
                          setGrade(s.grade === undefined ? "" : String(s.grade));
                          setFeedback(s.feedback ? pick(s.feedback) : "");
                        }}
                      >
                        {s.status === "submitted" ? t("Review", "مراجعة") : t("View", "عرض")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-8 text-center text-muted-foreground">
            {status === "submitted" && assignmentId === "all"
              ? t("Nothing is waiting for you. Great work!", "لا شيء بانتظارك. عمل رائع!")
              : t("No submissions match these filters.", "لا توجد تسليمات مطابقة للتصفية.")}
          </p>
        )}
      </Card>
      <EditorDialog
        key={open?.id ?? "closed"}
        wide
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open && current ? `${nameOf(open.studentId)} · ${pick(current.title)}` : ""}
        description={t("Read the work, then save feedback and a grade. Leave the grade empty to keep it ungraded.", "اقرأ العمل ثم احفظ الملاحظات والدرجة. اترك الدرجة فارغة لإبقائه بدون تقييم.")}
        submitLabel={t("Save review", "حفظ المراجعة")}
        onSubmit={() => {
          if (!open || invalid) return;
          review(open.id, {
            grade: parsed,
            feedback: feedback.trim() ? [feedback.trim(), feedback.trim()] : undefined,
          });
          setMessage(t(`Review saved for ${nameOf(open.studentId)}.`, `تم حفظ مراجعة ${nameOf(open.studentId)}.`));
          setOpen(null);
        }}
      >
        {open && current && (
          <>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Student's work", "عمل الطالب")}</p>
              <p className="whitespace-pre-wrap text-sm leading-7">{pick(open.text) || t("No text was submitted.", "لم يُسلَّم نص.")}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
              <Field label={t(`Grade (out of ${current.maxGrade})`, `الدرجة (من ${num(current.maxGrade)})`)} error={invalid ? t(`Enter a number from 0 to ${current.maxGrade}.`, `أدخل رقمًا من 0 إلى ${num(current.maxGrade)}.`) : undefined}>
                {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} aria-invalid={!!invalid} inputMode="decimal" value={grade} onChange={(e) => setGrade(e.target.value)} />}
              </Field>
              <Field label={t("Feedback to the student", "ملاحظات للطالب")}>
                {({ id }) => <TextArea id={id} rows={4} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />}
              </Field>
            </div>
          </>
        )}
      </EditorDialog>
    </div>
  );
}
