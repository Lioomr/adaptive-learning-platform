"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, FlaskConical, Layers, Play, RefreshCw, Replace, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";
import { NativeSelect, Status, TextInput } from "@/features/instructor/portal/forms";
import { Metric, PageTitle, SectionTitle } from "@/features/instructor/portal/ui";
import { ACCEPTED, MAX_BYTES, semesters, type Lecture, type StoredFile } from "./data";
import { AllConcepts, NeedsApproval } from "./concepts";
import { ConceptModals, ProcessBadge, useConceptUi, useWs } from "./shared";

const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

function Dropzone({ id, title, hint, onFiles }: { id: string; title: string; hint: string; onFiles: (f: { name: string; size: number }[]) => void }) {
  const { t, num } = useInstructor();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  function take(list: FileList | null) {
    const ok: { name: string; size: number }[] = [];
    const bad: string[] = [];
    for (const f of Array.from(list ?? [])) {
      if (!ACCEPTED.test(f.name)) bad.push(t(`${f.name}: only PDF, PPT and PPTX files are supported.`, `${f.name}: يُدعم فقط PDF وPPT وPPTX.`));
      else if (f.size > MAX_BYTES) bad.push(t(`${f.name}: larger than 50 MB.`, `${f.name}: أكبر من 50 ميجابايت.`));
      else ok.push({ name: f.name, size: f.size });
    }
    setErrors(bad);
    if (ok.length) onFiles(ok);
    if (input.current) input.current.value = "";
  }
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
        className={cn("rounded-xl border-2 border-dashed p-6 text-center transition-colors", over ? "border-primary bg-secondary/60" : "bg-muted/30")}
      >
        <UploadCloud className="mx-auto mb-2 size-8 text-primary" aria-hidden="true" />
        <p className="font-medium">{title}</p>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">{hint}</p>
        <input ref={input} id={id} type="file" multiple accept=".pdf,.ppt,.pptx" className="sr-only" onChange={(e) => take(e.target.files)} />
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>{t("Choose files", "اختيار الملفات")}</Button>
        <p className="mt-2 text-xs text-muted-foreground">{t("PDF, PPT, PPTX · up to 50 MB each", "PDF وPPT وPPTX · حتى 50 ميجابايت للملف")}</p>
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 space-y-1 text-sm text-danger">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
      <span className="sr-only">{num(0)}</span>
    </div>
  );
}

function FileState({ file, onRetry }: { file: StoredFile; onRetry: () => void }) {
  const { t, num } = useInstructor();
  if (file.status === "uploading")
    return (
      <div className="flex items-center gap-2"><ProcessBadge state="uploading" /><Progress className="w-20" value={file.progress} aria-label={t("Upload progress", "تقدم الرفع")} /><span className="text-xs tabular-nums">{num(file.progress)}%</span></div>
    );
  if (file.status === "error")
    return (
      <div className="flex flex-wrap items-center gap-2"><ProcessBadge state="error" /><Button size="sm" variant="outline" onClick={onRetry}><RefreshCw aria-hidden="true" />{t("Retry", "إعادة المحاولة")}</Button></div>
    );
  return <Badge tone="success">{t("Uploaded", "تم الرفع")}</Badge>;
}

function Replacer({ label, onPick }: { label: string; onPick: (f: { name: string; size: number }) => void }) {
  const { t } = useInstructor();
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  return (
    <>
      <input ref={ref} type="file" accept=".pdf,.ppt,.pptx" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) {
          if (!ACCEPTED.test(f.name) || f.size > MAX_BYTES) setError(t("Unsupported or too large.", "غير مدعوم أو كبير جدًا."));
          else { setError(""); onPick({ name: f.name, size: f.size }); }
        }
        e.target.value = "";
      }} />
      <Button size="sm" variant="ghost" onClick={() => ref.current?.click()} aria-label={label}><Replace aria-hidden="true" />{t("Replace", "استبدال")}</Button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </>
  );
}

export function SemesterPrep() {
  const { t, num, assigned, instructor } = useInstructor();
  const { course, semester, key, w, stats, actions } = useWs();
  const ui = useConceptUi();
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [final, setFinal] = useState(0);
  const sorted = [...w.lectures].sort((a, b) => a.number - b.number);
  const dup = new Set(sorted.filter((l, i) => sorted.findIndex((x) => x.number === l.number) !== i).map((l) => l.number));
  const uploading = w.lectures.some((l) => l.file?.status === "uploading") || w.references.some((r) => r.status === "uploading");
  const busy = w.phase === "processing";
  const pct = w.batch ? Math.round(((w.done + (busy ? w.stage / 4 : 0)) / w.batch) * 100) : 0;
  const processed = w.lectures.filter((l) => l.process === "processed").length;
  const stages = [t("Reading slides", "قراءة الشرائح"), t("Detecting concepts", "اكتشاف المفاهيم"), t("Scoring confidence", "تقدير الثقة"), t("Saving results", "حفظ النتائج")];
  const ready = w.lectures.filter((l) => l.file?.status === "uploaded");
  const toProcess = ready.filter((l) => l.process !== "processed").length;
  const errorText = {
    "no-lectures": t("Upload at least one lecture before starting extraction.", "ارفع محاضرة واحدة على الأقل قبل بدء الاستخراج."),
    uploading: t("Wait for uploads to finish, then try again.", "انتظر انتهاء الرفع ثم حاول مجددًا."),
    "nothing-new": t("Every uploaded lecture is already processed.", "كل المحاضرات المرفوعة تمت معالجتها بالفعل."),
  }[w.error as "no-lectures"];
  if (!course) return <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t("No courses are assigned to you yet.", "لا توجد مقررات مسندة إليك بعد.")}</p>;
  const reviewDone = w.phase === "complete" && stats.pending === 0;
  const lectureLabel = (l: Lecture) => t(`Lecture ${num(l.number)}`, `المحاضرة ${num(l.number)}`);
  return (
    <div className="space-y-8 animate-fade-in">
      <PageTitle
        eyebrow={t("SEMESTER PREPARATION", "تحضير الفصل الدراسي")}
        title={t("Prepare your semester.", "حضّر فصلك الدراسي.")}
        description={t(
          "Upload lectures and references, run a simulated concept extraction, then review what it found. Prerequisites come later, after concepts are approved.",
          "ارفع المحاضرات والمراجع وشغّل استخراج المفاهيم التجريبي ثم راجع النتائج. تأتي المتطلبات السابقة لاحقًا بعد اعتماد المفاهيم.",
        )}
      />
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t("Course", "المقرر")}
          <NativeSelect className="mt-1.5" value={course.id} onChange={(e) => actions.select(e.target.value as typeof course.id, semester)}>
            {assigned.map((c) => <option key={c.id} value={c.id}>{t(c.title)} · {c.code}</option>)}
          </NativeSelect>
        </label>
        <label className="block text-sm font-medium">
          {t("Semester", "الفصل الدراسي")}
          <NativeSelect className="mt-1.5" value={semester} onChange={(e) => actions.select(course.id, e.target.value)}>
            {semesters.map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
          </NativeSelect>
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2">{t(`Signed in as ${t(instructor.name)}. Only your assigned courses are listed.`, `مسجّل الدخول باسم ${t(instructor.name)}. تظهر فقط المقررات المسندة إليك.`)}</p>
      </Card>

      <section aria-labelledby="overview">
        <h2 id="overview" className="sr-only">{t("Overview", "نظرة عامة")}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <Metric label={t("Uploaded lectures", "المحاضرات المرفوعة")} value={num(w.lectures.length)} detail={t(`${num(processed)} processed`, `${num(processed)} معالجة`)} icon={FileText} />
          <Metric label={t("Reference files", "ملفات المراجع")} value={num(w.references.length)} detail={t("Textbooks and handbooks", "كتب وأدلة")} icon={Layers} />
          <Metric label={t("Extracted concepts", "المفاهيم المستخرجة")} value={num(stats.total)} detail={t("Simulated extraction", "استخراج تجريبي")} icon={FlaskConical} />
          <Metric label={t("Auto-approved", "معتمدة تلقائيًا")} value={num(stats.auto)} detail={t(`${num(stats.manual)} approved by you`, `${num(stats.manual)} اعتمدتها`)} icon={CheckCircle2} />
          <Metric label={t("Pending approval", "بانتظار الاعتماد")} value={num(stats.pending)} detail={t(`Below ${num(w.threshold)}%`, `أقل من ${num(w.threshold)}٪`)} icon={AlertTriangle} />
          <Metric label={t("Rejected", "المرفوضة")} value={num(stats.rejected)} detail={t("Excluded from the course", "مستبعدة من المقرر")} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label={t("Uploads", "الرفع")}>
        <Card className="p-5 sm:p-6">
          <SectionTitle title={t("Lecture Materials", "مواد المحاضرات")} description={t("What you will teach this semester, by lecture number and title.", "ما ستدرّسه هذا الفصل بحسب رقم المحاضرة وعنوانها.")} />
          <Dropzone id="lecture-files" title={t("Drop lecture files here", "أسقط ملفات المحاضرات هنا")} hint={t("Each file becomes a lecture. Edit its number and title below.", "يصبح كل ملف محاضرة. عدّل رقمها وعنوانها أدناه.")} onFiles={(f) => actions.addLectures(key, f)} />
          {!w.lectures.length && (
            <div className="mt-4 rounded-xl bg-secondary/40 p-4 text-sm">
              <p className="mb-2 text-muted-foreground">{t("No files yet. Want to try the flow quickly?", "لا توجد ملفات بعد. هل تريد تجربة المسار بسرعة؟")}</p>
              <Button size="sm" variant="secondary" onClick={() => actions.addSamples(key, course.id)}>{t("Add sample semester files", "إضافة ملفات فصل تجريبية")}</Button>
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {sorted.map((l) => (
              <li key={l.id} className="rounded-xl border p-3">
                <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                  <TextInput aria-label={t("Lecture number", "رقم المحاضرة")} aria-invalid={dup.has(l.number)} type="number" min={1} max={99} className="h-10 text-center" value={l.number} onChange={(e) => actions.editLecture(key, l.id, { number: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })} />
                  <TextInput aria-label={t("Lecture title", "عنوان المحاضرة")} className="h-10" maxLength={100} value={l.title} onChange={(e) => actions.editLecture(key, l.id, { title: e.target.value })} />
                </div>
                {dup.has(l.number) && <p role="alert" className="mt-1.5 text-xs text-danger">{t("Another lecture uses this number.", "محاضرة أخرى تستخدم هذا الرقم.")}</p>}
                {l.file && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate" dir="ltr">{l.file.name}</span><span className="shrink-0 text-xs">{mb(l.file.size)}</span></span>
                    <div className="flex flex-wrap items-center gap-1">
                      <FileState file={l.file} onRetry={() => actions.retryFile(key, "lecture", l.file!.id)} />
                      <Replacer label={t(`Replace file for ${lectureLabel(l)}`, `استبدال ملف ${lectureLabel(l)}`)} onPick={(f) => actions.replaceLecture(key, l.id, f)} />
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => actions.removeLecture(key, l.id)} aria-label={t(`Remove ${lectureLabel(l)}`, `حذف ${lectureLabel(l)}`)}><Trash2 aria-hidden="true" />{t("Remove", "حذف")}</Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionTitle title={t("Reference Materials", "المواد المرجعية")} description={t("Textbooks, reference PDFs and supplementary resources. Used as context, not taught as lectures.", "كتب وملفات مرجعية وموارد داعمة. تُستخدم سياقًا ولا تُدرَّس كمحاضرات.")} />
          <Dropzone id="reference-files" title={t("Drop reference files here", "أسقط الملفات المرجعية هنا")} hint={t("Kept separate from lecture materials.", "منفصلة عن مواد المحاضرات.")} onFiles={(f) => actions.addReferences(key, f)} />
          <ul className="mt-4 space-y-3">
            {w.references.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate" dir="ltr">{r.name}</span><span className="shrink-0 text-xs text-muted-foreground">{mb(r.size)}</span></span>
                <div className="flex flex-wrap items-center gap-1">
                  {r.status === "uploaded" ? <ProcessBadge state={r.indexed ? "processed" : r.processing ? "processing" : "not-processed"} /> : <FileState file={r} onRetry={() => actions.retryFile(key, "reference", r.id)} />}
                  <Replacer label={t(`Replace ${r.name}`, `استبدال ${r.name}`)} onPick={(f) => actions.replaceReference(key, r.id, f)} />
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => actions.removeReference(key, r.id)} aria-label={t(`Remove ${r.name}`, `حذف ${r.name}`)}><Trash2 aria-hidden="true" />{t("Remove", "حذف")}</Button>
                </div>
              </li>
            ))}
          </ul>
          {!w.references.length && <p className="mt-4 text-sm text-muted-foreground">{t("No reference files yet.", "لا توجد ملفات مرجعية بعد.")}</p>}
        </Card>
      </section>

      <Card className="p-5 sm:p-6" aria-live="polite">
        <SectionTitle title={t("Concept extraction", "استخراج المفاهيم")} description={t("A simulation with mock results. No real AI model reads your files.", "محاكاة بنتائج تجريبية. لا يقرأ أي نموذج ذكاء اصطناعي حقيقي ملفاتك.")}>
          <Button onClick={() => actions.startExtraction(key, course.id)} disabled={busy}>
            <Play aria-hidden="true" />
            {busy ? t("Extracting…", "جارٍ الاستخراج…") : w.phase === "complete" && toProcess ? t("Process new lectures", "معالجة المحاضرات الجديدة") : t("Start Concept Extraction", "بدء استخراج المفاهيم")}
          </Button>
        </SectionTitle>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                {w.phase === "idle" && <Badge tone="neutral">{t("Not processed", "لم تُعالج")}</Badge>}
                {busy && <Badge tone="progress">{t("Processing", "قيد المعالجة")}</Badge>}
                {w.phase === "complete" && <Badge tone="success">{t("Extraction complete", "اكتمل الاستخراج")}</Badge>}
                {w.phase === "error" && <Badge tone="danger">{t("Cannot start", "تعذّر البدء")}</Badge>}
                <span className="text-muted-foreground">
                  {busy ? `${stages[w.stage]} · ${w.lectures.find((l) => l.id === w.currentId)?.file?.name ?? ""}` : w.phase === "complete" ? t("All documents processed.", "تمت معالجة كل المستندات.") : t("Ready when your files are uploaded.", "جاهز عند اكتمال رفع الملفات.")}
                </span>
              </span>
              <strong className="tabular-nums">{num(pct)}%</strong>
            </div>
            <Progress value={busy || w.phase === "complete" ? pct : 0} tone={w.phase === "complete" ? "success" : "progress"} aria-label={t("Extraction progress", "تقدم الاستخراج")} />
            <p className="mt-3 text-sm text-muted-foreground">
              {t(`${num(processed)} of ${num(w.lectures.length)} documents processed · ${num(stats.total)} concepts extracted`, `تمت معالجة ${num(processed)} من ${num(w.lectures.length)} مستندات · ${num(stats.total)} مفهومًا مستخرجًا`)}
            </p>
            {w.phase === "error" && <p role="alert" className="mt-2 text-sm text-danger">{errorText}</p>}
            {uploading && !busy && <p className="mt-2 text-sm text-muted-foreground">{t("Uploads are still running.", "ما زال الرفع جاريًا.")}</p>}
          </div>
          <div>
            <label htmlFor="threshold" className="mb-1 flex items-center justify-between text-sm font-medium">
              {t("Auto-approval threshold", "حد الاعتماد التلقائي")}
              <span className="tabular-nums text-primary">{num(w.threshold)}%</span>
            </label>
            <input id="threshold" type="range" min={0} max={100} step={5} value={w.threshold} onChange={(e) => actions.setThreshold(key, Number(e.target.value))} className="w-full accent-[var(--color-primary)]" aria-describedby="threshold-hint" />
            <p id="threshold-hint" className="mt-1 text-xs text-muted-foreground">
              {t("Concepts at or above this extraction confidence are approved automatically; the rest wait for you. This is separate from prerequisite confidence, which is not part of this step.", "تُعتمد المفاهيم التي تبلغ هذه الثقة أو تتجاوزها تلقائيًا ويبقى الباقي بانتظارك. يختلف هذا عن ثقة المتطلبات السابقة التي ليست جزءًا من هذه الخطوة.")}
            </p>
          </div>
        </div>
      </Card>

      {reviewDone && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-success/30 bg-success-soft p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">{w.reviewed ? t("Concept review is complete", "اكتملت مراجعة المفاهيم") : t("Every concept has been decided", "تم البتّ في كل المفاهيم")}</h2>
              <p className="text-sm text-muted-foreground">{t(`${num(stats.auto + stats.manual)} approved, ${num(stats.rejected)} rejected. Prerequisites are the next, separate step.`, `${num(stats.auto + stats.manual)} معتمدة و${num(stats.rejected)} مرفوضة. المتطلبات السابقة هي الخطوة التالية المنفصلة.`)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setFinal((n) => n + 1); setTab("all"); }}>{t("Review final concepts", "مراجعة المفاهيم النهائية")}</Button>
            {!w.reviewed && <Button onClick={() => actions.finishReview(key)}>{t("Mark review complete", "تأكيد اكتمال المراجعة")}</Button>}
          </div>
        </div>
      )}

      <section aria-labelledby="lectures-h">
        <SectionTitle title={t("Lectures", "المحاضرات")} description={t("Open a lecture to read its slides and see where each concept came from.", "افتح محاضرة لقراءة شرائحها ومعرفة مصدر كل مفهوم.")} />
        <h2 id="lectures-h" className="sr-only">{t("Lectures", "المحاضرات")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((l) => {
            const mine = w.concepts.filter((c) => c.sources.some((s) => s.lectureId === l.id));
            const waiting = mine.filter((c) => c.decision === "none" && c.confidence < w.threshold).length;
            return (
              <Link key={l.id} href={`/instructor/semester/lectures/${l.id}`} className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full p-5 transition-colors group-hover:border-primary/50">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">{lectureLabel(l)}</span>
                    <ProcessBadge state={l.file?.status === "uploading" ? "uploading" : l.file?.status === "error" ? "error" : l.process} />
                  </div>
                  <h3 className="font-semibold group-hover:text-primary">{l.title}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{l.file?.name}</p>
                  <div className="mt-4 flex gap-6 border-t pt-3 text-sm">
                    <span><strong className="tabular-nums">{num(mine.length)}</strong> <span className="text-muted-foreground">{t("concepts", "مفاهيم")}</span></span>
                    <span><strong className={cn("tabular-nums", waiting && "text-warning")}>{num(waiting)}</strong> <span className="text-muted-foreground">{t("awaiting approval", "بانتظار الاعتماد")}</span></span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
        {!sorted.length && <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">{t("Uploaded lectures appear here as clickable cards.", "تظهر المحاضرات المرفوعة هنا كبطاقات قابلة للنقر.")}</p>}
      </section>

      <section aria-labelledby="concepts-h">
        <SectionTitle title={t("Concept extraction results", "نتائج استخراج المفاهيم")} />
        <h2 id="concepts-h" className="sr-only">{t("Concepts", "المفاهيم")}</h2>
        <div role="tablist" aria-label={t("Concept views", "عروض المفاهيم")} className="mb-5 inline-flex rounded-xl border bg-muted/50 p-1">
          {([["all", t("All Extracted Concepts", "كل المفاهيم المستخرجة"), stats.total, "neutral"], ["pending", t("Needs Approval", "بانتظار الاعتماد"), stats.pending, "warning"]] as const).map(([id, label, n, tone]) => (
            <button key={id} role="tab" id={`tab-${id}`} type="button" aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === id ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground")}>
              {label}<Badge tone={tone}>{num(n)}</Badge>
            </button>
          ))}
        </div>
        {tab === "all" ? <AllConcepts key={final} ui={ui} initialStatus={final ? "approved" : "all"} /> : <NeedsApproval ui={ui} onReview={() => { setFinal((n) => n + 1); setTab("all"); }} />}
      </section>
      <ConceptModals ui={ui} />
      <Status message="" />
    </div>
  );
}
