"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, NativeSelect, Status } from "@/features/instructor/portal/forms";
import { PageTitle } from "@/features/instructor/portal/ui";
import { issueLabel, type IssueKind } from "./data";
import { useOverview, useParam } from "./hooks";
import { CourseFilter, CourseTag, PageBack } from "./ui";

export function ContentIssues() {
  const { t, num, assigned, issues, data } = useOverview();
  const [course, setCourse] = useParam("course");
  const [kind, setKind] = useParam("kind");
  const [notice, setNotice] = useState("");
  const counts = Object.fromEntries(assigned.map((c) => [c.id, issues.filter((i) => i.courseId === c.id).length]));
  const shown = issues.filter((i) => (course === "all" || i.courseId === course) && (kind === "all" || i.kind === kind));
  return (
    <div className="space-y-6 animate-fade-in">
      <div><PageBack /><PageTitle eyebrow={t("COURSE CONTENT", "محتوى المقررات")} title={t("Materials that need fixing.", "مواد تحتاج إلى إصلاح.")} description={t("Failed files, unreadable slides, pending indexing and thin source coverage, by course.", "ملفات فاشلة وشرائح غير مقروءة وفهرسة معلّقة وتغطية مصادر ضعيفة، حسب المقرر.")} /></div>
      <div className="flex flex-wrap items-center gap-3"><NativeSelect aria-label={t("Issue type", "نوع المشكلة")} className="w-auto" value={kind} onChange={(e) => setKind(e.target.value)}><option value="all">{t("All issue types", "كل أنواع المشكلات")}</option>{(Object.keys(issueLabel) as IssueKind[]).map((k) => <option key={k} value={k}>{t(issueLabel[k])}</option>)}</NativeSelect></div>
      <CourseFilter value={course} onChange={setCourse} counts={counts} />
      <div role="status" aria-live="polite" className="min-h-5">{notice && <Status message={notice} />}</div>
      <div className="space-y-4">
        {shown.map((i) => {
          const c = assigned.find((x) => x.id === i.courseId)!;
          return (
            <Card key={i.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1 basis-64"><p className="flex flex-wrap items-center gap-2"><Badge tone={i.kind === "failed" ? "danger" : "warning"}>{t(issueLabel[i.kind])}</Badge><CourseTag course={c} /></p><p className="mt-2 font-medium" dir="auto">{t(i.title)}</p><p className="text-sm text-muted-foreground">{t(i.detail)}</p></div>
              <Button asChild variant="outline" size="sm"><Link href="/instructor/semester"><ExternalLink aria-hidden="true" />{t("Open materials", "فتح المواد")}</Link></Button>
              <Button size="sm" onClick={() => { data.resolveIssue(i.id); setNotice(t(`Marked resolved: ${i.title[0]}`, `تم وسمها كمعالَجة: ${i.title[1]}`)); }}><Check aria-hidden="true" />{t("Mark resolved", "وسم كمعالَج")}</Button>
            </Card>
          );
        })}
      </div>
      {!shown.length && <EmptyState title={t("No content issues", "لا توجد مشكلات محتوى")} description={t("Every uploaded material is processed and indexed.", "كل المواد المرفوعة معالَجة ومفهرسة.")} />}
      <span className="sr-only">{num(shown.length)}</span>
    </div>
  );
}
