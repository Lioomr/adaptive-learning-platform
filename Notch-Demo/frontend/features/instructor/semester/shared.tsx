"use client";
import Link from "next/link";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Check, ExternalLink, Pencil, Split, Merge, Undo2, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useInstructor } from "@/features/instructor/portal/context";
import {
  EditorDialog,
  Field,
  NativeSelect,
  TextArea,
  TextInput,
  editCopy,
} from "@/features/instructor/portal/forms";
import {
  counts,
  isAuto,
  sourceHref,
  statusOf,
  type Concept,
  type EffectiveStatus,
  type ProcessState,
  type Source,
  type Workspace,
} from "./data";
import { EMPTY, useSemester, workspaceKey } from "./store";

/** Current course, semester and workspace, with course access limited to the instructor's own. */
export function useWs() {
  const { assigned } = useInstructor();
  const selected = useSemester((s) => s.courseId);
  const semester = useSemester((s) => s.semester);
  const course = assigned.find((c) => c.id === selected) ?? assigned[0];
  const key = course ? workspaceKey(course.id, semester) : "";
  const stored = useSemester((s) => s.workspaces[key]);
  const w: Workspace = stored ?? EMPTY;
  return { course, semester, key, w, stats: counts(w), actions: useSemester.getState() };
}

export function ConceptStatus({ concept, w }: { concept: Concept; w: Workspace }) {
  const { t } = useInstructor();
  const status: EffectiveStatus = statusOf(concept, w.threshold);
  const label = {
    approved: isAuto(concept, w.threshold) ? t("Auto-approved", "معتمد تلقائيًا") : t("Approved", "معتمد"),
    pending: t("Needs approval", "بانتظار الاعتماد"),
    rejected: t("Rejected", "مرفوض"),
  }[status];
  return <Badge tone={{ approved: "success", pending: "warning", rejected: "danger" }[status] as "success"}>{label}</Badge>;
}
export function ProcessBadge({ state }: { state: ProcessState | "uploading" | "error" }) {
  const { t } = useInstructor();
  const map = {
    "not-processed": ["neutral", t("Not processed", "لم تُعالج")],
    processing: ["progress", t("Processing", "قيد المعالجة")],
    processed: ["success", t("Processed", "تمت المعالجة")],
    uploading: ["progress", t("Uploading", "جارٍ الرفع")],
    error: ["danger", t("Upload failed", "فشل الرفع")],
  } as const;
  const [tone, label] = map[state];
  return <Badge tone={tone}>{label}</Badge>;
}
export function Confidence({ value, threshold }: { value: number; threshold: number }) {
  const { num } = useInstructor();
  return (
    <div className="flex min-w-28 items-center gap-2">
      <Progress className="w-16" value={value} tone={value >= threshold ? "success" : "warning"} aria-label={`${value}%`} />
      <span className="text-sm font-semibold tabular-nums">{num(value)}%</span>
    </div>
  );
}

/** Clickable evidence reference such as “Lecture 3 → Slide 17”. */
export function SourceLink({ source, concept, w, className }: { source: Source; concept?: Concept; w: Workspace; className?: string }) {
  const { t, num } = useInstructor();
  const lecture = w.lectures.find((l) => l.id === source.lectureId);
  if (!lecture) return null;
  return (
    <Link
      href={sourceHref(source, concept?.id)}
      className={`inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
    >
      {t(`Lecture ${lecture.number} → Slide ${source.slide}`, `المحاضرة ${num(lecture.number)} ← الشريحة ${num(source.slide)}`)}
    </Link>
  );
}

/** Row action buttons shared by the table and the review queue. */
export function ConceptName({ c }: { c: Concept }) {
  return (
    <div className="min-w-0">
      <p className="font-medium">{c.en}</p>
      <p dir="rtl" lang="ar" className="text-sm text-muted-foreground">{c.ar}</p>
    </div>
  );
}

export type ConceptUi = ReturnType<typeof useConceptUi>;
export function useConceptUi() {
  const [detail, setDetail] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ id: string; approve: boolean } | null>(null);
  const [merge, setMerge] = useState<string | null>(null);
  const [split, setSplit] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  return { detail, setDetail, edit, setEdit, merge, setMerge, split, setSplit, notice, setNotice };
}

/** Drawer plus the edit, merge and split dialogs. Mount once per page. */
export function ConceptModals({ ui }: { ui: ConceptUi }) {
  const { w } = useWs();
  const find = (id: string | null) => w.concepts.find((c) => c.id === id);
  return (
    <>
      <Drawer ui={ui} concept={find(ui.detail)} />
      <EditDialog ui={ui} concept={find(ui.edit?.id ?? null)} approve={!!ui.edit?.approve} />
      <MergeDialog ui={ui} concept={find(ui.merge)} />
      <SplitDialog ui={ui} concept={find(ui.split)} />
    </>
  );
}

export function RowActions({ c, ui, compact = false }: { c: Concept; ui: ConceptUi; compact?: boolean }) {
  const { t } = useInstructor();
  const { w, key, actions } = useWs();
  const status = statusOf(c, w.threshold);
  const first = c.sources[0];
  const name = c.en;
  const btn = "gap-1.5";
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="outline" className={btn} onClick={() => ui.setDetail(c.id)} aria-label={t(`View details for ${name}`, `عرض تفاصيل ${c.ar}`)}>{t("Details", "التفاصيل")}</Button>
      {status === "pending" && !compact && (
        <Button size="sm" className={btn} onClick={() => { actions.approve(key, c.id); ui.setNotice(t(`Approved “${name}”.`, `تم اعتماد «${c.ar}».`)); }} aria-label={t(`Approve ${name}`, `اعتماد ${c.ar}`)}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button>
      )}
      <Button size="sm" variant="ghost" className={btn} onClick={() => ui.setEdit({ id: c.id, approve: false })} aria-label={t(`Edit ${name}`, `تعديل ${c.ar}`)}><Pencil aria-hidden="true" />{t("Edit", "تعديل")}</Button>
      <Button size="sm" variant="ghost" className={btn} onClick={() => ui.setMerge(c.id)} aria-label={t(`Merge ${name}`, `دمج ${c.ar}`)}><Merge aria-hidden="true" />{t("Merge", "دمج")}</Button>
      <Button size="sm" variant="ghost" className={btn} onClick={() => ui.setSplit(c.id)} aria-label={t(`Split ${name}`, `تقسيم ${c.ar}`)}><Split aria-hidden="true" />{t("Split", "تقسيم")}</Button>
      {status === "rejected" ? (
        <Button size="sm" variant="ghost" className={btn} onClick={() => { actions.restore(key, c.id); ui.setNotice(t(`Restored “${name}”.`, `تمت استعادة «${c.ar}».`)); }} aria-label={t(`Restore ${name}`, `استعادة ${c.ar}`)}><Undo2 aria-hidden="true" />{t("Restore", "استعادة")}</Button>
      ) : (
        <Button size="sm" variant="ghost" className={`${btn} text-danger`} onClick={() => { actions.reject(key, c.id); ui.setNotice(t(`Rejected “${name}”.`, `تم رفض «${c.ar}».`)); }} aria-label={t(`Reject ${name}`, `رفض ${c.ar}`)}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button>
      )}
      {first && (
        <Button asChild size="sm" variant="ghost" className={btn}>
          <Link href={sourceHref(first, c.id)} aria-label={t(`View source of ${name}`, `عرض مصدر ${c.ar}`)}><ExternalLink aria-hidden="true" />{t("Source", "المصدر")}</Link>
        </Button>
      )}
    </div>
  );
}

function Drawer({ ui, concept }: { ui: ConceptUi; concept?: Concept }) {
  const { t, pick, language, num } = useInstructor();
  const { w, key, actions } = useWs();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Pick<Concept, "en" | "ar" | "definition"> | null>(null);
  const close = () => { ui.setDetail(null); setEditing(false); };
  return (
    <Dialog.Root open={!!concept} onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          dir={language === "ar" ? "rtl" : "ltr"}
          aria-describedby={undefined}
          className="fixed inset-y-0 end-0 z-50 w-full max-w-lg overflow-y-auto border-s bg-card p-6 shadow-raised sm:p-8"
        >
          {concept && (
            <>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={t("Close", "إغلاق")}><X /></Button>
              </Dialog.Close>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Concept details", "تفاصيل المفهوم")}</p>
              {editing && draft ? (
                <form
                  className="mt-4 space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.en.trim() || !draft.ar.trim() || !pick(draft.definition).trim()) return;
                    actions.editConcept(key, concept.id, { en: draft.en.trim(), ar: draft.ar.trim(), definition: draft.definition });
                    ui.setNotice(t("Concept saved.", "تم حفظ المفهوم."));
                    setEditing(false);
                  }}
                >
                  <Dialog.Title className="text-xl font-semibold">{t("Edit concept", "تعديل المفهوم")}</Dialog.Title>
                  <Field label={t("English name", "الاسم بالإنجليزية")}>{({ id }) => <TextInput id={id} required maxLength={80} value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} />}</Field>
                  <Field label={t("Arabic name", "الاسم بالعربية")}>{({ id }) => <TextInput id={id} dir="rtl" lang="ar" required maxLength={80} value={draft.ar} onChange={(e) => setDraft({ ...draft, ar: e.target.value })} />}</Field>
                  <Field label={t("Definition", "التعريف")}>{({ id }) => <TextArea id={id} required rows={5} maxLength={600} value={pick(draft.definition)} onChange={(e) => setDraft({ ...draft, definition: editCopy(draft.definition, language, e.target.value) })} />}</Field>
                  <div className="flex gap-2">
                    <Button type="submit">{t("Save", "حفظ")}</Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t("Cancel", "إلغاء")}</Button>
                  </div>
                </form>
              ) : (
                <>
                  <Dialog.Title className="mt-2 text-2xl font-semibold tracking-tight">{concept.en}</Dialog.Title>
                  <p dir="rtl" lang="ar" className="mt-1 text-lg text-muted-foreground">{concept.ar}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <ConceptStatus concept={concept} w={w} />
                    <span className="text-sm text-muted-foreground">{t("Extraction confidence", "ثقة الاستخراج")}</span>
                    <Confidence value={concept.confidence} threshold={w.threshold} />
                  </div>
                  <h3 className="mb-1 mt-6 text-sm font-semibold">{t("Definition", "التعريف")}</h3>
                  <p className="leading-7 text-muted-foreground">{pick(concept.definition)}</p>
                  <h3 className="mb-2 mt-6 text-sm font-semibold">{t("Supporting evidence", "الأدلة الداعمة")}</h3>
                  <ul className="space-y-3">
                    {concept.sources.map((s, i) => (
                      <li key={i} className="rounded-xl border bg-muted/40 p-3">
                        <SourceLink source={s} concept={concept} w={w} />
                        <p className="mt-1.5 border-s-2 border-primary ps-3 text-sm italic text-muted-foreground">“{s.snippet}”</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t(`Appears in ${num(concept.sources.length)} place(s). Mock extraction: simulated, not real AI.`, `يظهر في ${num(concept.sources.length)} موضع. استخراج تجريبي: محاكاة وليس ذكاءً اصطناعيًا حقيقيًا.`)}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
                    <Button variant="outline" onClick={() => { setDraft({ en: concept.en, ar: concept.ar, definition: concept.definition }); setEditing(true); }}><Pencil aria-hidden="true" />{t("Edit", "تعديل")}</Button>
                    {statusOf(concept, w.threshold) !== "approved" && <Button onClick={() => { actions.approve(key, concept.id); ui.setNotice(t("Concept approved.", "تم اعتماد المفهوم.")); }}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button>}
                    {statusOf(concept, w.threshold) !== "rejected" && <Button variant="ghost" className="text-danger" onClick={() => { actions.reject(key, concept.id); ui.setNotice(t("Concept rejected.", "تم رفض المفهوم.")); }}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button>}
                  </div>
                </>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditDialog({ ui, concept, approve }: { ui: ConceptUi; concept?: Concept; approve: boolean }) {
  const { t, pick, language } = useInstructor();
  const { key, actions } = useWs();
  const [draft, setDraft] = useState<Pick<Concept, "en" | "ar" | "definition"> | null>(null);
  return (
    <EditorDialog
      key={concept?.id ?? "closed"}
      wide
      open={!!concept}
      onOpenChange={(o) => !o && ui.setEdit(null)}
      title={approve ? t("Edit and approve", "تعديل واعتماد") : t("Edit concept", "تعديل المفهوم")}
      description={t("Changes apply to the concept everywhere in this semester.", "تُطبَّق التعديلات على المفهوم في كل مكان في هذا الفصل.")}
      submitLabel={approve ? t("Save and approve", "حفظ واعتماد") : t("Save", "حفظ")}
      onSubmit={() => {
        if (!concept) return;
        const d = draft ?? { en: concept.en, ar: concept.ar, definition: concept.definition };
        if (!d.en.trim() || !d.ar.trim() || !pick(d.definition).trim()) return;
        actions.editConcept(key, concept.id, { en: d.en.trim(), ar: d.ar.trim(), definition: d.definition }, approve);
        ui.setNotice(approve ? t("Concept edited and approved.", "تم تعديل المفهوم واعتماده.") : t("Concept saved.", "تم حفظ المفهوم."));
        ui.setEdit(null);
        setDraft(null);
      }}
    >
      {concept && (() => {
        const d = draft ?? { en: concept.en, ar: concept.ar, definition: concept.definition };
        return (
          <>
            <Field label={t("English name", "الاسم بالإنجليزية")}>{({ id }) => <TextInput id={id} required maxLength={80} value={d.en} onChange={(e) => setDraft({ ...d, en: e.target.value })} />}</Field>
            <Field label={t("Arabic name", "الاسم بالعربية")}>{({ id }) => <TextInput id={id} dir="rtl" lang="ar" required maxLength={80} value={d.ar} onChange={(e) => setDraft({ ...d, ar: e.target.value })} />}</Field>
            <Field label={t("Definition", "التعريف")}>{({ id }) => <TextArea id={id} required rows={5} maxLength={600} value={pick(d.definition)} onChange={(e) => setDraft({ ...d, definition: editCopy(d.definition, language, e.target.value) })} />}</Field>
          </>
        );
      })()}
    </EditorDialog>
  );
}

function MergeDialog({ ui, concept }: { ui: ConceptUi; concept?: Concept }) {
  const { t } = useInstructor();
  const { w, key, actions } = useWs();
  const [target, setTarget] = useState("");
  const options = w.concepts.filter((c) => c.id !== concept?.id && statusOf(c, w.threshold) !== "rejected");
  return (
    <EditorDialog
      key={concept?.id ?? "closed"}
      open={!!concept}
      onOpenChange={(o) => !o && ui.setMerge(null)}
      title={t("Merge concept", "دمج المفهوم")}
      description={t("The concept below is removed and its evidence moves to the one you choose.", "يُحذف المفهوم أدناه وتنتقل أدلته إلى المفهوم الذي تختاره.")}
      submitLabel={t("Merge", "دمج")}
      onSubmit={() => {
        const to = target || options[0]?.id;
        if (!concept || !to) return;
        actions.merge(key, concept.id, to);
        ui.setNotice(t(`Merged “${concept.en}” into “${w.concepts.find((c) => c.id === to)?.en}”.`, `تم دمج «${concept.ar}» في «${w.concepts.find((c) => c.id === to)?.ar}».`));
        ui.setMerge(null);
        setTarget("");
      }}
    >
      {concept && (
        <>
          <p className="rounded-lg bg-muted/50 p-3 text-sm"><strong>{concept.en}</strong> · <span dir="rtl" lang="ar">{concept.ar}</span></p>
          {options.length ? (
            <Field label={t("Merge into", "دمج في")}>
              {({ id }) => (
                <NativeSelect id={id} value={target || options[0].id} onChange={(e) => setTarget(e.target.value)}>
                  {options.map((c) => <option key={c.id} value={c.id}>{c.en} — {c.ar}</option>)}
                </NativeSelect>
              )}
            </Field>
          ) : (
            <p role="alert" className="text-sm text-danger">{t("There is no other concept to merge into.", "لا يوجد مفهوم آخر للدمج فيه.")}</p>
          )}
        </>
      )}
    </EditorDialog>
  );
}

function SplitDialog({ ui, concept }: { ui: ConceptUi; concept?: Concept }) {
  const { t, pick } = useInstructor();
  const { w, key, actions } = useWs();
  const [en, setEn] = useState("");
  const [ar, setAr] = useState("");
  const [picked, setPicked] = useState<number[]>([0]);
  return (
    <EditorDialog
      key={concept?.id ?? "closed"}
      open={!!concept}
      onOpenChange={(o) => !o && ui.setSplit(null)}
      title={t("Split concept", "تقسيم المفهوم")}
      description={t("Create a second concept from selected evidence. The original keeps the rest.", "أنشئ مفهومًا ثانيًا من الأدلة المحددة. يحتفظ الأصلي بالباقي.")}
      submitLabel={t("Split", "تقسيم")}
      onSubmit={() => {
        if (!concept || !en.trim() || !ar.trim() || !picked.length) return;
        actions.split(key, concept.id, { en: en.trim(), ar: ar.trim() }, picked);
        ui.setNotice(t(`Created “${en.trim()}” from “${concept.en}”.`, `تم إنشاء «${ar.trim()}» من «${concept.ar}».`));
        ui.setSplit(null);
        setEn(""); setAr(""); setPicked([0]);
      }}
    >
      {concept && (
        <>
          <Field label={t("New concept (English)", "المفهوم الجديد (بالإنجليزية)")}>{({ id }) => <TextInput id={id} required maxLength={80} value={en} onChange={(e) => setEn(e.target.value)} />}</Field>
          <Field label={t("New concept (Arabic)", "المفهوم الجديد (بالعربية)")}>{({ id }) => <TextInput id={id} dir="rtl" lang="ar" required maxLength={80} value={ar} onChange={(e) => setAr(e.target.value)} />}</Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("Evidence for the new concept", "الأدلة الخاصة بالمفهوم الجديد")}</legend>
            <ul className="space-y-2">
              {concept.sources.map((s, i) => {
                const lecture = w.lectures.find((l) => l.id === s.lectureId);
                return (
                  <li key={i}>
                    <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                      <input type="checkbox" className="mt-1 size-4" checked={picked.includes(i)} onChange={(e) => setPicked(e.target.checked ? [...picked, i] : picked.filter((x) => x !== i))} />
                      <span><strong>{t(`Lecture ${lecture?.number} → Slide ${s.slide}`, `المحاضرة ${lecture?.number} ← الشريحة ${s.slide}`)}</strong><br /><span className="text-muted-foreground">{s.snippet}</span></span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {!picked.length && <p role="alert" className="mt-2 text-sm text-danger">{t("Select at least one piece of evidence.", "اختر دليلًا واحدًا على الأقل.")}</p>}
          </fieldset>
          <p className="text-xs text-muted-foreground">{pick([`Definition is copied and can be edited afterwards.`, `يُنسخ التعريف ويمكن تعديله لاحقًا.`])}</p>
        </>
      )}
    </EditorDialog>
  );
}
