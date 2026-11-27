"use client";
import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState, Status } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { categories, categoryLabel, queueHref, type Category } from "./data";
import { useOverview, useParam } from "./hooks";
import { CourseFilter, CourseTag, PageBack } from "./ui";
import { useState } from "react";

export function PendingApprovals() {
  const { t, num, assigned, pending, data } = useOverview();
  const [course, setCourse] = useParam("course");
  const [category, setCategory] = useParam("category");
  const [showResolved, setShowResolved] = useState(false);
  const [notice, setNotice] = useState("");
  const inCourse = (id: string) => course === "all" || id === course;
  const counts = Object.fromEntries(assigned.map((c) => [c.id, pending.filter((p) => p.courseId === c.id).length]));
  const catCount = (k: Category) => pending.filter((p) => p.category === k && inCourse(p.courseId)).length;
  const resolved = data.approvals.filter((a) => a.status !== "pending" && assigned.some((c) => c.id === a.courseId) && inCourse(a.courseId));
  const visibleCats = categories.filter((k) => category === "all" || category === k);
  const act = (item: { id: string; category: Category; title: [string, string] | readonly [string, string] }, ok: boolean) => {
    if (item.category === "tutor") data.setOob(item.id, ok ? "reviewed" : "dismissed");
    else data.decide(item.id, ok ? "approved" : "rejected");
    setNotice(t(`${ok ? "Approved" : "Rejected"}: ${item.title[0]}`, `${ok ? "تم اعتماد" : "تم رفض"}: ${item.title[1]}`));
  };
  const shown = pending.filter((p) => inCourse(p.courseId) && (category === "all" || p.category === category));
  return (
    <div className="space-y-6 animate-fade-in">
      <div><PageBack /><PageTitle eyebrow={t("PENDING APPROVALS", "الاعتمادات المعلّقة")} title={t("Everything waiting for your decision.", "كل ما ينتظر قرارك.")} description={t("Grouped by course and category. Decisions update the dashboard counts right away.", "مجمّعة حسب المقرر والفئة. تحدّث القرارات أعداد لوحة المعلومات فورًا.")} /></div>
      <div role="group" aria-label={t("Approval categories", "فئات الاعتماد")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((k) => (
          <button key={k} type="button" aria-pressed={category === k} onClick={() => setCategory(category === k ? "all" : k)} className={cn("rounded-xl border bg-card p-4 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", category === k ? "border-primary bg-secondary/40" : "hover:border-primary/40")}>
            <span className="text-sm text-muted-foreground">{t(categoryLabel[k])}</span>
            <span className="mt-1 block text-3xl font-semibold tabular-nums">{num(catCount(k))}</span>
          </button>
        ))}
      </div>
      <CourseFilter value={course} onChange={setCourse} counts={counts} />
      <div role="status" aria-live="polite" className="min-h-5">{notice && <Status message={notice} />}</div>
      <div className="space-y-6">
        {assigned.filter((c) => inCourse(c.id)).map((c) => {
          const items = shown.filter((p) => p.courseId === c.id);
          if (!items.length) return null;
          return (
            <Card key={c.id} className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{t(c.title)}</h2><CourseTag course={c} count={items.length} /></div>
              {visibleCats.map((k) => {
                const list = items.filter((p) => p.category === k);
                if (!list.length) return null;
                return (
                  <section key={k} className="mb-5 last:mb-0" aria-label={t(categoryLabel[k])}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{t(categoryLabel[k])} <Badge tone="warning">{num(list.length)}</Badge></h3><Button asChild size="sm" variant="ghost"><Link href={queueHref[k]}><ExternalLink aria-hidden="true" />{t("Open full review tool", "فتح أداة المراجعة الكاملة")}</Link></Button></div>
                    <ul className="divide-y rounded-xl border">
                      {list.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                          <div className="min-w-0 flex-1 basis-60"><p className="font-medium">{t(p.title)}</p><p className="text-muted-foreground">{t(p.detail)} · {t(`waiting ${p.ageDays} days`, `ينتظر منذ ${num(p.ageDays)} أيام`)}</p></div>
                          <Button size="sm" onClick={() => act(p, true)} aria-label={t(`${k === "tutor" ? "Mark reviewed" : "Approve"}: ${p.title[0]}`, `${k === "tutor" ? "تمت المراجعة" : "اعتماد"}: ${p.title[1]}`)}><Check aria-hidden="true" />{k === "tutor" ? t("Mark reviewed", "تمت المراجعة") : t("Approve", "اعتماد")}</Button>
                          <Button size="sm" variant="outline" className="text-danger" onClick={() => act(p, false)} aria-label={t(`${k === "tutor" ? "Dismiss" : "Reject"}: ${p.title[0]}`, `${k === "tutor" ? "تجاهل" : "رفض"}: ${p.title[1]}`)}><X aria-hidden="true" />{k === "tutor" ? t("Dismiss", "تجاهل") : t("Reject", "رفض")}</Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </Card>
          );
        })}
      </div>
      {!shown.length && <EmptyState title={t("You're all caught up", "لقد أنجزت كل شيء")} description={t("Nothing is waiting in this selection.", "لا شيء معلّق في هذا التحديد.")} action={<Button asChild variant="outline"><Link href="/instructor">{t("Back to dashboard", "العودة إلى لوحة المعلومات")}</Link></Button>} />}
      {resolved.length > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShowResolved(!showResolved)} aria-expanded={showResolved}>{showResolved ? t("Hide decided items", "إخفاء العناصر المحسومة") : t(`Show ${num(resolved.length)} decided items`, `عرض ${num(resolved.length)} عنصرًا محسومًا`)}</Button>
          {showResolved && <ul className="mt-2 divide-y rounded-xl border bg-card text-sm">{resolved.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 p-3"><span>{t(a.title)}</span><Badge tone={a.status === "approved" ? "success" : "danger"}>{a.status === "approved" ? t("Approved", "معتمد") : t("Rejected", "مرفوض")}</Badge></li>)}</ul>}
        </div>
      )}
    </div>
  );
}
