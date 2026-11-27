"use client";
import { useState } from "react";
import { ExternalLink, FileText, Link2, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/features/student/portal/data";
import type { Material, MaterialKind } from "./data";
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

const icons = { document: FileText, file: Paperclip, link: Link2 };

export function Materials({ course }: { course: Course }) {
  const { t, pick, date, content, language } = useInstructor();
  const upsert = useInstructorPortal((s) => s.upsert);
  const remove = useInstructorPortal((s) => s.remove);
  const [draft, setDraft] = useState<Material | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleting, setDeleting] = useState<Material | null>(null);
  const [message, setMessage] = useState("");
  const [urlError, setUrlError] = useState("");
  const list = content.materials
    .filter((m) => m.courseId === course.id)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  const kindLabel: Record<MaterialKind, string> = {
    document: t("Document", "مستند"),
    file: t("File", "ملف"),
    link: t("External link", "رابط خارجي"),
  };
  const open = (m?: Material) => {
    setIsNew(!m);
    setUrlError("");
    setDraft(
      m ?? {
        id: newId("mat"),
        courseId: course.id,
        kind: "document",
        title: ["", ""],
        description: ["", ""],
        addedAt: new Date().toISOString(),
      },
    );
  };
  function submit() {
    if (!draft || !pick(draft.title).trim()) return;
    if (draft.kind === "link") {
      let ok = false;
      try {
        ok = /^https?:$/.test(new URL(draft.url ?? "").protocol);
      } catch {
        /* invalid */
      }
      if (!ok) {
        setUrlError(t("Enter a full web address starting with https://", "أدخل عنوانًا كاملًا يبدأ بـ https://"));
        return;
      }
    }
    upsert("materials", draft);
    setMessage(isNew ? t("Material added.", "تمت إضافة المادة.") : t("Material updated.", "تم تحديث المادة."));
    setDraft(null);
  }
  return (
    <section>
      <SectionTitle
        title={t("Extra materials", "مواد إضافية")}
        description={t(
          "Supplementary documents, files and links that students can open any time.",
          "مستندات وملفات وروابط إضافية يمكن للطلاب فتحها في أي وقت.",
        )}
      >
        <Button onClick={() => open()}>
          <Plus aria-hidden="true" />
          {t("Add material", "إضافة مادة")}
        </Button>
      </SectionTitle>
      <Status message={message} />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {list.map((m) => {
          const Icon = icons[m.kind];
          return (
            <Card key={m.id} className="flex flex-col p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <Badge tone="outline">{kindLabel[m.kind]}</Badge>
              </div>
              <h3 className="font-semibold">{pick(m.title)}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{pick(m.description)}</p>
              <p className="mt-3 truncate text-xs text-muted-foreground" dir="ltr">
                {m.kind === "link" ? m.url : m.fileName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("Added", "أُضيفت")} {date(m.addedAt, { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.kind === "link" && m.url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink aria-hidden="true" />
                      {t("Open link", "فتح الرابط")}
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => open(m)} aria-label={t(`Edit ${pick(m.title)}`, `تعديل ${pick(m.title)}`)}>
                  <Pencil aria-hidden="true" />
                  {t("Edit", "تعديل")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(m)} aria-label={t(`Delete ${pick(m.title)}`, `حذف ${pick(m.title)}`)}>
                  <Trash2 aria-hidden="true" />
                  {t("Delete", "حذف")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      {!list.length && (
        <EmptyState
          title={t("No extra materials yet", "لا توجد مواد إضافية بعد")}
          description={t("Add readings, worked examples, or helpful links.", "أضف قراءات وأمثلة محلولة أو روابط مفيدة.")}
          action={<Button onClick={() => open()}><Plus aria-hidden="true" />{t("Add material", "إضافة مادة")}</Button>}
        />
      )}
      <EditorDialog
        key={draft?.id ?? "closed"}
        open={!!draft}
        onOpenChange={(o) => !o && setDraft(null)}
        title={isNew ? t("Add material", "إضافة مادة") : t("Edit material", "تعديل المادة")}
        description={t("Students in this course can open it from their Extra Materials tab.", "يمكن لطلاب هذا المقرر فتحها من تبويب المواد الإضافية.")}
        submitLabel={isNew ? t("Add material", "إضافة مادة") : t("Save changes", "حفظ التعديلات")}
        onSubmit={submit}
      >
        {draft && (
          <>
            <Field label={t("Type", "النوع")}>
              {({ id }) => (
                <NativeSelect id={id} value={draft.kind} onChange={(e) => { setUrlError(""); setDraft({ ...draft, kind: e.target.value as MaterialKind }); }}>
                  {(["document", "file", "link"] as MaterialKind[]).map((k) => <option key={k} value={k}>{kindLabel[k]}</option>)}
                </NativeSelect>
              )}
            </Field>
            <Field label={t("Title", "العنوان")}>
              {({ id }) => <TextInput id={id} required maxLength={120} value={pick(draft.title)} onChange={(e) => setDraft({ ...draft, title: editCopy(draft.title, language, e.target.value) })} />}
            </Field>
            <Field label={t("Description", "الوصف")}>
              {({ id }) => <TextArea id={id} rows={3} maxLength={500} value={pick(draft.description)} onChange={(e) => setDraft({ ...draft, description: editCopy(draft.description, language, e.target.value) })} />}
            </Field>
            {draft.kind === "link" ? (
              <Field label={t("Web address", "عنوان الرابط")} error={urlError}>
                {({ id, describedBy }) => <TextInput id={id} aria-describedby={describedBy} aria-invalid={!!urlError} dir="ltr" type="url" required placeholder="https://" value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />}
              </Field>
            ) : (
              <Field label={t("File", "الملف")} hint={t("Demo only: the file name is recorded, nothing is uploaded.", "للعرض فقط: يُسجَّل اسم الملف دون رفعه.")}>
                {({ id, describedBy }) => (
                  <div className="space-y-2">
                    <input id={id} aria-describedby={describedBy} type="file" className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, fileName: f.name.slice(0, 80) }); }} />
                    {draft.fileName && <p className="text-sm text-muted-foreground" dir="ltr">{draft.fileName}</p>}
                  </div>
                )}
              </Field>
            )}
          </>
        )}
      </EditorDialog>
      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("Delete this material?", "حذف هذه المادة؟")}
        description={t("Students will no longer be able to open it. This cannot be undone.", "لن يتمكن الطلاب من فتحها بعد الآن. لا يمكن التراجع عن ذلك.")}
        onConfirm={() => {
          if (deleting) remove("materials", deleting.id);
          setDeleting(null);
          setMessage(t("Material deleted.", "تم حذف المادة."));
        }}
      />
    </section>
  );
}
