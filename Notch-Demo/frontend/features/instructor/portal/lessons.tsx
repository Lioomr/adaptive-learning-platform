"use client";
import { useState } from "react";
import { FlaskConical, Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/features/student/portal/data";
import type { CourseLesson, LessonKind, Status as Publish } from "./data";
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

/** One manager for both Lectures and Labs; `kind` switches the copy and icon. */
export function LessonManager({
  course,
  kind,
}: {
  course: Course;
  kind: LessonKind;
}) {
  const { t, pick, num, content, language } = useInstructor();
  const upsert = useInstructorPortal((s) => s.upsert);
  const remove = useInstructorPortal((s) => s.remove);
  const lab = kind === "lab";
  const [draft, setDraft] = useState<CourseLesson | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<CourseLesson | null>(null);
  const [message, setMessage] = useState("");
  const list = content.lessons.filter(
    (l) => l.courseId === course.id && l.kind === kind,
  );
  const noun = lab ? t("lab", "معمل") : t("lecture", "محاضرة");
  const open = (l?: CourseLesson) => {
    setIsNew(!l);
    setDraft(
      l ?? {
        id: newId(kind),
        courseId: course.id,
        kind,
        title: ["", ""],
        description: ["", ""],
        content: ["", ""],
        exercise: ["", ""],
        minutes: 30,
        status: "draft",
      },
    );
  };
  const Icon = lab ? FlaskConical : Presentation;
  return (
    <section>
      <SectionTitle
        title={lab ? t("Labs", "المعامل") : t("Lectures", "المحاضرات")}
        description={
          lab
            ? t("Hands-on challenges. Students see published labs only.", "تحديات عملية. يرى الطلاب المعامل المنشورة فقط.")
            : t("Short lessons and their content. Students see published lectures only.", "دروس قصيرة ومحتواها. يرى الطلاب المحاضرات المنشورة فقط.")
        }
      >
        <Button onClick={() => open()}>
          <Plus aria-hidden="true" />
          {lab ? t("Add lab", "إضافة معمل") : t("Add lecture", "إضافة محاضرة")}
        </Button>
      </SectionTitle>
      <Status message={message} />
      <div className="mt-3 space-y-4">
        {list.map((l, i) => (
          <Card key={l.id} className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-xs font-medium text-muted-foreground">
                {lab ? t("Lab", "معمل") : t("Lecture", "محاضرة")} {num(i + 1)} · {num(l.minutes)} {t("min", "دقيقة")}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{pick(l.title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pick(l.description)}</p>
            </div>
            <Badge tone={l.status === "published" ? "success" : "neutral"}>
              {l.status === "published" ? t("Published", "منشور") : t("Draft", "مسودة")}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => open(l)} aria-label={t(`Edit ${pick(l.title)}`, `تعديل ${pick(l.title)}`)}>
                <Pencil aria-hidden="true" />
                {t("Edit", "تعديل")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(l)} aria-label={t(`Delete ${pick(l.title)}`, `حذف ${pick(l.title)}`)}>
                <Trash2 aria-hidden="true" />
                {t("Delete", "حذف")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!list.length && (
        <EmptyState
          title={lab ? t("No labs yet", "لا توجد معامل بعد") : t("No lectures yet", "لا توجد محاضرات بعد")}
          description={t("Add the first one to start building this course.", "أضف أولها لتبدأ بناء المقرر.")}
          action={<Button onClick={() => open()}><Plus aria-hidden="true" />{lab ? t("Add lab", "إضافة معمل") : t("Add lecture", "إضافة محاضرة")}</Button>}
        />
      )}
      <EditorDialog
        key={draft?.id ?? "closed"}
        wide
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={isNew ? t(`Add ${lab ? "lab" : "lecture"}`, lab ? "إضافة معمل" : "إضافة محاضرة") : t(`Edit ${lab ? "lab" : "lecture"}`, lab ? "تعديل المعمل" : "تعديل المحاضرة")}
        description={t(`Content students will study in this ${lab ? "lab" : "lecture"}.`, `المحتوى الذي سيدرسه الطلاب في هذا ${noun}.`)}
        submitLabel={isNew ? t("Add", "إضافة") : t("Save changes", "حفظ التعديلات")}
        onSubmit={() => {
          if (!draft || !pick(draft.title).trim() || !pick(draft.content).trim()) return;
          upsert("lessons", draft);
          setMessage(isNew ? t("Added.", "تمت الإضافة.") : t("Changes saved.", "تم حفظ التعديلات."));
          setDraft(null);
        }}
      >
        {draft && (
          <>
            <Field label={t("Title", "العنوان")}>
              {({ id }) => <TextInput id={id} required maxLength={120} value={pick(draft.title)} onChange={(e) => setDraft({ ...draft, title: editCopy(draft.title, language, e.target.value) })} />}
            </Field>
            <Field label={t("Short description", "وصف مختصر")}>
              {({ id }) => <TextInput id={id} maxLength={200} value={pick(draft.description)} onChange={(e) => setDraft({ ...draft, description: editCopy(draft.description, language, e.target.value) })} />}
            </Field>
            <Field label={t("Lesson content", "محتوى الدرس")}>
              {({ id }) => <TextArea id={id} required rows={5} maxLength={4000} value={pick(draft.content)} onChange={(e) => setDraft({ ...draft, content: editCopy(draft.content, language, e.target.value) })} />}
            </Field>
            <Field label={t("Practice exercise", "تمرين تطبيقي")}>
              {({ id }) => <TextArea id={id} rows={3} maxLength={2000} value={pick(draft.exercise)} onChange={(e) => setDraft({ ...draft, exercise: editCopy(draft.exercise, language, e.target.value) })} />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("Duration (minutes)", "المدة (بالدقائق)")}>
                {({ id }) => <TextInput id={id} type="number" min={5} max={240} required value={draft.minutes} onChange={(e) => setDraft({ ...draft, minutes: Math.min(240, Math.max(5, Number(e.target.value) || 5)) })} />}
              </Field>
              <Field label={t("Visibility", "الظهور")}>
                {({ id }) => (
                  <NativeSelect id={id} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Publish })}>
                    <option value="draft">{t("Draft (hidden from students)", "مسودة (مخفية عن الطلاب)")}</option>
                    <option value="published">{t("Published", "منشور")}</option>
                  </NativeSelect>
                )}
              </Field>
            </div>
          </>
        )}
      </EditorDialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t(`Delete this ${lab ? "lab" : "lecture"}?`, `حذف هذا ${noun}؟`)}
        description={t("Its content will be removed for students. This cannot be undone.", "ستُزال محتوياته عن الطلاب. لا يمكن التراجع عن ذلك.")}
        onConfirm={() => {
          if (deleting) remove("lessons", deleting.id);
          setDeleting(null);
          setMessage(t("Deleted.", "تم الحذف."));
        }}
      />
    </section>
  );
}
