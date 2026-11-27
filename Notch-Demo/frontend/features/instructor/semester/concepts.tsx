"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, ExternalLink, Pencil, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInstructor } from "@/features/instructor/portal/context";
import { EmptyState, NativeSelect, Status } from "@/features/instructor/portal/forms";
import { sourceHref, statusOf, type EffectiveStatus } from "./data";
import { Confidence, ConceptName, ConceptStatus, RowActions, SourceLink, useWs, type ConceptUi } from "./shared";

type StatusFilter = EffectiveStatus | "all";
type Band = "all" | "90" | "80" | "70" | "low";
const inBand = (c: number, b: Band) =>
  b === "all" || (b === "90" && c >= 90) || (b === "80" && c >= 80 && c < 90) || (b === "70" && c >= 70 && c < 80) || (b === "low" && c < 70);

export function AllConcepts({ ui, initialStatus = "all" }: { ui: ConceptUi; initialStatus?: StatusFilter }) {
  const { t, num } = useInstructor();
  const { w } = useWs();
  const [query, setQuery] = useState("");
  const [lecture, setLecture] = useState("all");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [band, setBand] = useState<Band>("all");
  const [sort, setSort] = useState<"desc" | "asc" | "name">("desc");
  const q = query.trim().toLowerCase();
  const rows = w.concepts
    .filter(
      (c) =>
        (!q || c.en.toLowerCase().includes(q) || c.ar.includes(query.trim())) &&
        (lecture === "all" || c.sources.some((s) => s.lectureId === lecture)) &&
        (status === "all" || statusOf(c, w.threshold) === status) &&
        inBand(c.confidence, band),
    )
    .sort((a, b) => (sort === "name" ? a.en.localeCompare(b.en) : sort === "asc" ? a.confidence - b.confidence : b.confidence - a.confidence));
  const clear = () => { setQuery(""); setLecture("all"); setStatus("all"); setBand("all"); };
  const sortedLectures = [...w.lectures].sort((a, b) => a.number - b.number);
  return (
    <div role="tabpanel" id="panel-all" aria-labelledby="tab-all">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <label className="flex items-center gap-2 rounded-lg border bg-card px-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search concepts by name", "البحث عن مفهوم بالاسم")} placeholder={t("Search concepts", "ابحث عن مفهوم")} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <NativeSelect aria-label={t("Filter by lecture", "تصفية حسب المحاضرة")} value={lecture} onChange={(e) => setLecture(e.target.value)}>
          <option value="all">{t("All lectures", "كل المحاضرات")}</option>
          {sortedLectures.map((l) => <option key={l.id} value={l.id}>{t(`Lecture ${l.number}`, `المحاضرة ${num(l.number)}`)} · {l.title}</option>)}
        </NativeSelect>
        <NativeSelect aria-label={t("Filter by status", "تصفية حسب الحالة")} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">{t("All statuses", "كل الحالات")}</option>
          <option value="approved">{t("Approved", "معتمد")}</option>
          <option value="pending">{t("Needs approval", "بانتظار الاعتماد")}</option>
          <option value="rejected">{t("Rejected", "مرفوض")}</option>
        </NativeSelect>
        <NativeSelect aria-label={t("Filter by confidence", "تصفية حسب الثقة")} value={band} onChange={(e) => setBand(e.target.value as Band)}>
          <option value="all">{t("Any confidence", "أي ثقة")}</option>
          <option value="90">90% +</option>
          <option value="80">80–89%</option>
          <option value="70">70–79%</option>
          <option value="low">{t("Below 70%", "أقل من 70%")}</option>
        </NativeSelect>
        <NativeSelect aria-label={t("Sort", "الترتيب")} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="desc">{t("Confidence: high to low", "الثقة: من الأعلى إلى الأدنى")}</option>
          <option value="asc">{t("Confidence: low to high", "الثقة: من الأدنى إلى الأعلى")}</option>
          <option value="name">{t("Name (A–Z)", "الاسم (أ–ي)")}</option>
        </NativeSelect>
      </div>
      <Status message={ui.notice} />
      <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
        {t(`Showing ${num(rows.length)} of ${num(w.concepts.length)} concepts`, `عرض ${num(rows.length)} من ${num(w.concepts.length)} مفهوم`)}
      </p>
      {rows.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-start text-sm">
            <caption className="sr-only">{t("All extracted concepts", "كل المفاهيم المستخرجة")}</caption>
            <thead className="bg-muted/60">
              <tr>
                {[t("Concept", "المفهوم"), t("Lecture", "المحاضرة"), t("Slide", "الشريحة"), t("Confidence", "الثقة"), t("Status", "الحالة"), t("Actions", "الإجراءات")].map((h) => (
                  <th key={h} scope="col" className="p-4 text-start font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const lectureOf = (id: string) => w.lectures.find((l) => l.id === id);
                return (
                  <tr key={c.id} className="border-t align-top">
                    <th scope="row" className="p-4 text-start font-normal"><ConceptName c={c} /></th>
                    <td className="p-4">
                      {c.sources.map((s, i) => <p key={i} className="whitespace-nowrap">{t(`Lecture ${lectureOf(s.lectureId)?.number}`, `المحاضرة ${num(lectureOf(s.lectureId)?.number ?? 0)}`)}</p>)}
                    </td>
                    <td className="p-4">{c.sources.map((s, i) => <p key={i}><SourceLink source={s} concept={c} w={w} /></p>)}</td>
                    <td className="p-4"><Confidence value={c.confidence} threshold={w.threshold} /></td>
                    <td className="p-4"><ConceptStatus concept={c} w={w} />{c.edited && <Badge tone="outline" className="ms-1.5">{t("Edited", "معدّل")}</Badge>}</td>
                    <td className="p-4"><RowActions c={c} ui={ui} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {!rows.length && (
        w.concepts.length ? (
          <EmptyState title={t("No concepts match these filters", "لا توجد مفاهيم مطابقة للتصفية")} description={t("Try a different search or clear the filters.", "جرّب بحثًا مختلفًا أو امسح التصفية.")} action={<Button variant="outline" onClick={clear}>{t("Clear filters", "مسح التصفية")}</Button>} />
        ) : (
          <EmptyState title={t("No concepts yet", "لا توجد مفاهيم بعد")} description={t("Upload lectures and start the simulated extraction to see concepts here.", "ارفع المحاضرات وابدأ الاستخراج التجريبي لتظهر المفاهيم هنا.")} />
        )
      )}
    </div>
  );
}

export function NeedsApproval({ ui, onReview }: { ui: ConceptUi; onReview: () => void }) {
  const { t, pick, num } = useInstructor();
  const { w, key, actions, stats } = useWs();
  const queue = w.concepts.filter((c) => statusOf(c, w.threshold) === "pending").sort((a, b) => a.confidence - b.confidence);
  return (
    <div role="tabpanel" id="panel-pending" aria-labelledby="tab-pending">
      <p className="mb-4 text-sm text-muted-foreground">
        {t(`Concepts below the ${num(w.threshold)}% threshold wait here for your decision.`, `المفاهيم الأقل من حد ${num(w.threshold)}٪ تنتظر قرارك هنا.`)}
      </p>
      <Status message={ui.notice} />
      <div className="space-y-4">
        {queue.map((c) => (
          <Card key={c.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <ConceptName c={c} />
              <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{t("Confidence", "الثقة")}</span><Confidence value={c.confidence} threshold={w.threshold} /></div>
            </div>
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{pick(c.definition)}</p>
            <div className="mt-3 space-y-2">
              {c.sources.map((s, i) => (
                <div key={i} className="rounded-xl border bg-muted/40 p-3">
                  <SourceLink source={s} concept={c} w={w} />
                  <p className="mt-1 border-s-2 border-primary ps-3 text-sm italic text-muted-foreground">“{s.snippet}”</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={() => { actions.approve(key, c.id); ui.setNotice(t(`Approved “${c.en}”.`, `تم اعتماد «${c.ar}».`)); }}><Check aria-hidden="true" />{t("Approve", "اعتماد")}</Button>
              <Button variant="outline" onClick={() => ui.setEdit({ id: c.id, approve: true })}><Pencil aria-hidden="true" />{t("Edit and approve", "تعديل واعتماد")}</Button>
              <Button variant="outline" className="text-danger" onClick={() => { actions.reject(key, c.id); ui.setNotice(t(`Rejected “${c.en}”.`, `تم رفض «${c.ar}».`)); }}><XCircle aria-hidden="true" />{t("Reject", "رفض")}</Button>
              <Button asChild variant="ghost"><Link href={sourceHref(c.sources[0], c.id)}><ExternalLink aria-hidden="true" />{t("View source", "عرض المصدر")}</Link></Button>
            </div>
          </Card>
        ))}
      </div>
      {!queue.length && (
        w.phase === "complete" ? (
          <div className="rounded-xl border border-success/30 bg-success-soft p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-8 text-success" aria-hidden="true" />
            <h3 className="text-lg font-semibold">{t("Concept review is finished", "اكتملت مراجعة المفاهيم")}</h3>
            <p className="mx-auto mb-4 mt-2 max-w-md text-sm text-muted-foreground">
              {t(`${num(stats.auto + stats.manual)} concepts are approved and ${num(stats.rejected)} rejected. Nothing is waiting for you.`, `${num(stats.auto + stats.manual)} مفهومًا معتمدًا و${num(stats.rejected)} مرفوضًا. لا شيء بانتظارك.`)}
            </p>
            <Button onClick={onReview}>{t("Review final approved concepts", "مراجعة المفاهيم المعتمدة النهائية")}</Button>
          </div>
        ) : (
          <EmptyState title={t("Nothing needs approval", "لا شيء بانتظار الاعتماد")} description={w.concepts.length ? t("Every extracted concept is already decided.", "تم البتّ في كل المفاهيم المستخرجة.") : t("Start the simulated extraction to fill this queue.", "ابدأ الاستخراج التجريبي لتمتلئ هذه القائمة.")} />
        )
      )}
    </div>
  );
}
