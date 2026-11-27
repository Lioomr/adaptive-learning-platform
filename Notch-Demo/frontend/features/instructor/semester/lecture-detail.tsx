"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Check, XCircle, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useInstructor } from "@/features/instructor/portal/context";
import { EmptyState, Status } from "@/features/instructor/portal/forms";
import { statusOf, slideContent } from "./data";
import { ConceptModals, ConceptName, ConceptStatus, Confidence, ProcessBadge, SourceLink, useConceptUi, useWs } from "./shared";

const zooms = [75, 100, 125, 150];

export function LectureDetail({ lectureId }: { lectureId: string }) {
  const { t, num } = useInstructor();
  const { w, key, actions } = useWs();
  const router = useRouter();
  const params = useSearchParams();
  const ui = useConceptUi();
  const [zoom, setZoom] = useState(100);
  const lecture = w.lectures.find((l) => l.id === lectureId);
  if (!lecture)
    return (
      <EmptyState
        title={t("Lecture not found", "المحاضرة غير موجودة")}
        description={t("This lecture is not in the selected course and semester, or the session was reset.", "هذه المحاضرة ليست ضمن المقرر والفصل المحددين، أو أُعيدت الجلسة.")}
        action={<Button asChild><Link href="/instructor/semester">{t("Back to Semester Preparation", "العودة إلى تحضير الفصل")}</Link></Button>}
      />
    );
  const slide = Math.min(lecture.slides, Math.max(1, Number(params.get("slide")) || 1));
  const focus = params.get("concept") ?? undefined;
  const go = (n: number) => {
    const next = Math.min(lecture.slides, Math.max(1, n));
    router.replace(`?slide=${next}${focus ? `&concept=${encodeURIComponent(focus)}` : ""}`, { scroll: false });
  };
  const mine = w.concepts.filter((c) => c.sources.some((s) => s.lectureId === lecture.id));
  const content = slideContent(lecture, slide, w.concepts);
  const evidenceSlides = new Set(mine.flatMap((c) => c.sources.filter((s) => s.lectureId === lecture.id).map((s) => s.slide)));
  const waiting = mine.filter((c) => statusOf(c, w.threshold) === "pending").length;
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/instructor/semester" className="inline-block text-sm font-medium text-muted-foreground hover:text-primary">
        {t("Semester Preparation", "تحضير الفصل")} / <span className="text-foreground">{t(`Lecture ${num(lecture.number)}`, `المحاضرة ${num(lecture.number)}`)}</span>
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t(`Lecture ${num(lecture.number)}`, `المحاضرة ${num(lecture.number)}`)}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{lecture.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{lecture.file?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProcessBadge state={lecture.process} />
          <Badge tone="outline">{num(mine.length)} {t("concepts", "مفاهيم")}</Badge>
          {waiting > 0 && <Badge tone="warning">{num(waiting)} {t("awaiting approval", "بانتظار الاعتماد")}</Badge>}
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-3">
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="outline" onClick={() => go(slide - 1)} disabled={slide <= 1} aria-label={t("Previous slide", "الشريحة السابقة")}><ChevronLeft className="rtl:-scale-x-100" /></Button>
              <span className="min-w-28 text-center text-sm font-medium tabular-nums" aria-live="polite">{t(`Slide ${num(slide)} of ${num(lecture.slides)}`, `الشريحة ${num(slide)} من ${num(lecture.slides)}`)}</span>
              <Button size="icon-sm" variant="outline" onClick={() => go(slide + 1)} disabled={slide >= lecture.slides} aria-label={t("Next slide", "الشريحة التالية")}><ChevronRight className="rtl:-scale-x-100" /></Button>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="outline" onClick={() => setZoom(zooms[Math.max(0, zooms.indexOf(zoom) - 1)])} disabled={zoom === zooms[0]} aria-label={t("Zoom out", "تصغير")}><ZoomOut /></Button>
              <span className="w-12 text-center text-sm tabular-nums">{num(zoom)}%</span>
              <Button size="icon-sm" variant="outline" onClick={() => setZoom(zooms[Math.min(zooms.length - 1, zooms.indexOf(zoom) + 1)])} disabled={zoom === zooms[zooms.length - 1]} aria-label={t("Zoom in", "تكبير")}><ZoomIn /></Button>
            </div>
          </div>
          <div className="max-h-[70vh] overflow-auto bg-muted/30 p-4">
            <div style={{ width: `${zoom}%` }} className="mx-auto min-w-[16rem]">
              <article aria-label={t(`Slide ${slide}`, `الشريحة ${slide}`)} className="aspect-video overflow-hidden rounded-lg border bg-white text-slate-900 shadow-sm [container-type:inline-size]" dir="ltr">
                <div className="flex h-full flex-col p-[4cqw]">
                  <div className="flex items-center justify-between text-[1.8cqw] text-slate-500">
                    <span>{lecture.title}</span><span>{slide} / {lecture.slides}</span>
                  </div>
                  <h2 className="mt-[2cqw] text-[3.6cqw] font-semibold leading-tight text-blue-700">{content.heading}</h2>
                  <div className="mt-[2cqw] flex-1 space-y-[1.4cqw] overflow-hidden">
                    {content.evidence.map(({ concept, snippet }, i) => (
                      <div key={i} className={cn("rounded-[0.8cqw] border-2 p-[1.4cqw] text-[2.2cqw] leading-snug", focus === concept.id ? "border-blue-600 bg-blue-50" : "border-amber-400 bg-amber-50")} data-evidence={concept.id}>
                        <span className="mb-[0.6cqw] block text-[1.5cqw] font-semibold uppercase tracking-wider text-slate-600">{t("Evidence", "الدليل")} · {concept.en}</span>
                        {snippet}
                      </div>
                    ))}
                    {content.bullets.map((b) => <p key={b} className="text-[2.1cqw] text-slate-600 before:me-[1cqw] before:content-['•']">{b}</p>)}
                    {slide === 1 && <p className="text-[2.4cqw] text-slate-500">{t("Course introduction and lecture outline", "مقدمة المقرر ومخطط المحاضرة")}</p>}
                  </div>
                  <p className="text-[1.5cqw] text-slate-400">{t("Representative mock slide for the demo", "شريحة تمثيلية تجريبية للعرض")}</p>
                </div>
              </article>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto border-t p-3" role="group" aria-label={t("Slides", "الشرائح")}>
            {Array.from({ length: lecture.slides }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => go(n)} aria-label={t(`Go to slide ${n}`, `انتقل إلى الشريحة ${n}`)} aria-current={n === slide ? "true" : undefined}
                className={cn("relative grid size-9 shrink-0 place-items-center rounded-md border text-xs tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring", n === slide ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                {n}
                {evidenceSlides.has(n) && <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-warning" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </Card>

        <section aria-labelledby="lec-concepts" className="space-y-3">
          <h2 id="lec-concepts" className="text-lg font-semibold">{t("Extracted concepts", "المفاهيم المستخرجة")}</h2>
          <Status message={ui.notice} />
          {mine.map((c) => {
            const status = statusOf(c, w.threshold);
            return (
              <Card key={c.id} className={cn("p-4", focus === c.id && "border-primary ring-1 ring-primary")}>
                <div className="flex items-start justify-between gap-2"><ConceptName c={c} /><ConceptStatus concept={c} w={w} /></div>
                <div className="mt-2"><Confidence value={c.confidence} threshold={w.threshold} /></div>
                <div className="mt-2 flex flex-wrap gap-x-4">
                  {c.sources.map((s, i) => <SourceLink key={i} source={s} concept={c} w={w} />)}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => ui.setDetail(c.id)}>{t("Details", "التفاصيل")}</Button>
                  {status === "pending" && <Button size="sm" onClick={() => { actions.approve(key, c.id); ui.setNotice(t(`Approved “${c.en}”.`, `تم اعتماد «${c.ar}».`)); }}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button>}
                  {status === "rejected" ? (
                    <Button size="sm" variant="ghost" onClick={() => { actions.restore(key, c.id); ui.setNotice(t(`Restored “${c.en}”.`, `تمت استعادة «${c.ar}».`)); }}><Undo2 aria-hidden="true" />{t("Restore", "استعادة")}</Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-danger" onClick={() => { actions.reject(key, c.id); ui.setNotice(t(`Rejected “${c.en}”.`, `تم رفض «${c.ar}».`)); }}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button>
                  )}
                </div>
              </Card>
            );
          })}
          {!mine.length && (
            <EmptyState
              title={lecture.process === "processed" ? t("No concepts found", "لم يُعثر على مفاهيم") : t("Not processed yet", "لم تُعالج بعد")}
              description={t("Run the simulated extraction on the Semester Preparation page to see concepts here.", "شغّل الاستخراج التجريبي في صفحة تحضير الفصل لتظهر المفاهيم هنا.")}
            />
          )}
        </section>
      </div>
      <ConceptModals ui={ui} />
    </div>
  );
}
