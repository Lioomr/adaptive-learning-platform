"use client";
import { useState } from "react";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/features/student/portal/data";
import type { Announcement } from "./data";
import { useInstructor } from "./context";
import { useInstructorPortal } from "./store";
import { SectionTitle } from "./ui";
import {
  ConfirmDelete,
  EditorDialog,
  EmptyState,
  Field,
  Status,
  TextArea,
  TextInput,
  editCopy,
  newId,
} from "./forms";

export function CourseAnnouncements({ course }: { course: Course }) {
  const { t, pick, date, content, language } = useInstructor();
  const upsert = useInstructorPortal((s) => s.upsert);
  const remove = useInstructorPortal((s) => s.remove);
  const [draft, setDraft] = useState<Announcement | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [message, setMessage] = useState("");
  const list = content.announcements
    .filter((a) => a.courseId === course.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const open = (a?: Announcement) => {
    setIsNew(!a);
    setDraft(
      a ?? {
        id: newId("an"),
        courseId: course.id,
        title: ["", ""],
        body: ["", ""],
        date: new Date().toISOString(),
        important: false,
      },
    );
  };
  const valid = !!draft && !!pick(draft.title).trim() && !!pick(draft.body).trim();
  return (
    <section>
      <SectionTitle
        title={t("Announcements", "الإعلانات")}
        description={t(
          "Posts appear to every student enrolled in this course.",
          "تظهر المنشورات لكل طالب مسجّل في هذا المقرر.",
        )}
      >
        <Button onClick={() => open()}>
          <Plus aria-hidden="true" />
          {t("New announcement", "إعلان جديد")}
        </Button>
      </SectionTitle>
      <Status message={message} />
      <div className="mt-3 space-y-4">
        {list.map((a) => (
          <Card key={a.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{pick(a.title)}</h2>
                  {a.important && <Badge tone="warning">{t("Important", "مهم")}</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {date(a.date, { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                  {t(course.title)}
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
            <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-muted-foreground">
              {pick(a.body)}
            </p>
          </Card>
        ))}
      </div>
      {!list.length && (
        <EmptyState
          title={t("No announcements yet", "لا توجد إعلانات بعد")}
          description={t(
            "Share a reminder, a deadline change, or a note of encouragement.",
            "شارك تذكيرًا أو تغييرًا في موعد أو كلمة تشجيع.",
          )}
          action={
            <Button onClick={() => open()}>
              <Megaphone aria-hidden="true" />
              {t("Write the first one", "اكتب أول إعلان")}
            </Button>
          }
        />
      )}
      <EditorDialog
        key={draft?.id ?? "closed"}
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={isNew ? t("New announcement", "إعلان جديد") : t("Edit announcement", "تعديل الإعلان")}
        description={t("Students in this course will see this immediately.", "سيراه طلاب هذا المقرر فورًا.")}
        submitLabel={isNew ? t("Post announcement", "نشر الإعلان") : t("Save changes", "حفظ التعديلات")}
        onSubmit={() => {
          if (!draft || !valid) return;
          upsert("announcements", draft);
          setMessage(isNew ? t("Announcement posted.", "تم نشر الإعلان.") : t("Announcement updated.", "تم تحديث الإعلان."));
          setDraft(null);
        }}
      >
        {draft && (
          <>
            <Field label={t("Title", "العنوان")}>
              {({ id }) => (
                <TextInput id={id} required maxLength={120} value={pick(draft.title)}
                  onChange={(e) => setDraft({ ...draft, title: editCopy(draft.title, language, e.target.value) })} />
              )}
            </Field>
            <Field label={t("Message", "الرسالة")}>
              {({ id }) => (
                <TextArea id={id} required rows={5} maxLength={2000} value={pick(draft.body)}
                  onChange={(e) => setDraft({ ...draft, body: editCopy(draft.body, language, e.target.value) })} />
              )}
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={draft.important}
                onChange={(e) => setDraft({ ...draft, important: e.target.checked })} />
              {t("Mark as important", "تمييز كإعلان مهم")}
            </label>
          </>
        )}
      </EditorDialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete this announcement?", "حذف هذا الإعلان؟")}
        description={t(
          "Students will no longer see it. This cannot be undone.",
          "لن يراه الطلاب بعد الآن. لا يمكن التراجع عن ذلك.",
        )}
        onConfirm={() => {
          if (deleting) remove("announcements", deleting.id);
          setDeleting(null);
          setMessage(t("Announcement deleted.", "تم حذف الإعلان."));
        }}
      />
    </section>
  );
}
