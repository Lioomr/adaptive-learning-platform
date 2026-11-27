"use client";
import { useMemo } from "react";
import { Archive, ChevronLeft, ChevronRight, Copy as CopyIcon, Eye, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, NativeSelect, TextInput } from "@/features/instructor/portal/forms";
import { bloomLabel, blooms, concepts, diffs, diffLabel, langLabel, lectures, qtypes, typeLabel, type Bank, type Question } from "./data";
import { useQb } from "./store";
import { DiffBadge, StatusBadge, useQ } from "./shared";
import { useUi } from "./detail";

const PAGE = 8;
const diffRank = { easy: 0, medium: 1, hard: 2 };

export function filterQuestions(all: Question[], bank: Bank, f: ReturnType<typeof useQb.getState>["filters"][Bank], text: (c: Question["text"]) => string) {
  const q = f.q.trim().toLowerCase();
  const rows = all.filter((x) =>
    x.bank === bank &&
    (f.status === "archived" ? x.status === "archived" : f.status === "all" ? x.status !== "archived" : x.status === f.status) &&
    (!q || `${x.id} ${x.text[0]} ${x.text[1]}`.toLowerCase().includes(q)) &&
    (f.concept === "all" || x.conceptIds.includes(f.concept)) &&
    (f.lecture === "all" || x.source.lectureId === f.lecture) &&
    (f.type === "all" || x.type === f.type) &&
    (f.difficulty === "all" || x.difficulty === f.difficulty) &&
    (f.bloom === "all" || x.bloom === f.bloom) &&
    (f.lang === "all" || x.lang === f.lang) &&
    x.marks >= f.marksMin && x.marks <= f.marksMax,
  );
  const by: Record<string, (a: Question, b: Question) => number> = {
    recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
    marksDesc: (a, b) => b.marks - a.marks,
    marksAsc: (a, b) => a.marks - b.marks,
    difficulty: (a, b) => diffRank[a.difficulty] - diffRank[b.difficulty],
    type: (a, b) => a.type.localeCompare(b.type),
    text: (a, b) => text(a.text).localeCompare(text(b.text)),
  };
  return rows.sort(by[f.sort] ?? by.recent);
}

export function QuestionTable({ bank }: { bank: Bank }) {
  const { t, num, text, conceptName, lectureName } = useQ();
  const ui = useUi();
  const questions = useQb((s) => s.questions);
  const f = useQb((s) => s.filters[bank]);
  const selected = useQb((s) => s.selected[bank]);
  const { setFilters, resetFilters, toggle, setSelected, duplicate, notify } = useQb.getState();
  const rows = useMemo(() => filterQuestions(questions, bank, f, text), [questions, bank, f, text]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const page = Math.min(f.page, pages);
  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const allOnPage = shown.length > 0 && shown.every((r) => selected.includes(r.id));
  const set = (p: Partial<typeof f>) => setFilters(bank, p);
  const sel = (label: string, key: keyof typeof f, options: [string, string][]) => (
    <NativeSelect aria-label={label} value={String(f[key])} onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)}>
      <option value="all">{label}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </NativeSelect>
  );
  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex items-center gap-2 rounded-lg border bg-card px-3 sm:col-span-2">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search questions", "البحث في الأسئلة")} placeholder={t("Search question text or ID", "ابحث في نص السؤال أو رقمه")} value={f.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
        {sel(t("All concepts", "كل المفاهيم"), "concept", concepts.filter((c) => c.approved).map((c) => [c.id, conceptName(c.id)]))}
        {sel(t("All lectures", "كل المحاضرات"), "lecture", lectures.map((l) => [l.id, lectureName(l.id)]))}
        {sel(t("All types", "كل الأنواع"), "type", qtypes.map((k) => [k, t(typeLabel[k])]))}
        {sel(t("All difficulties", "كل مستويات الصعوبة"), "difficulty", diffs.map((d) => [d, t(diffLabel[d])]))}
        {sel(t("All cognitive levels", "كل المستويات المعرفية"), "bloom", blooms.map((b) => [b, t(bloomLabel[b])]))}
        {sel(t("All languages", "كل اللغات"), "lang", (["en", "ar", "both"] as const).map((l) => [l, t(langLabel[l])]))}
        {sel(t("All statuses", "كل الحالات"), "status", [["approved", t("Approved", "معتمد")], ["pending", t("Needs review", "بانتظار المراجعة")], ["rejected", t("Rejected", "مرفوض")], ["archived", t("Archived", "مؤرشف")]])}
        <label className="flex items-center gap-2 text-sm">{t("Marks", "الدرجات")}
          <TextInput aria-label={t("Minimum marks", "الحد الأدنى للدرجات")} type="number" min={0} className="h-11 w-20" value={f.marksMin} onChange={(e) => set({ marksMin: Math.max(0, Number(e.target.value) || 0) })} />–
          <TextInput aria-label={t("Maximum marks", "الحد الأقصى للدرجات")} type="number" min={0} className="h-11 w-20" value={f.marksMax} onChange={(e) => set({ marksMax: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <NativeSelect aria-label={t("Sort", "الترتيب")} value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
          <option value="recent">{t("Newest first", "الأحدث أولًا")}</option><option value="marksDesc">{t("Marks: high to low", "الدرجات: من الأعلى")}</option><option value="marksAsc">{t("Marks: low to high", "الدرجات: من الأدنى")}</option><option value="difficulty">{t("Difficulty", "الصعوبة")}</option><option value="type">{t("Type", "النوع")}</option><option value="text">{t("Question text", "نص السؤال")}</option>
        </NativeSelect>
        <Button variant="outline" onClick={() => resetFilters(bank)}>{t("Clear filters", "مسح التصفية")}</Button>
      </div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite">
        <span>{t(`${num(rows.length)} questions`, `${num(rows.length)} سؤالًا`)}</span>
        {selected.length > 0 && (
          <span className="flex items-center gap-2 text-foreground">{t(`${num(selected.length)} selected`, `${num(selected.length)} محدد`)}
            <Button size="sm" variant="outline" onClick={() => ui.archive(selected)}><Archive aria-hidden="true" />{t("Archive selected", "أرشفة المحدد")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(bank, [])}>{t("Clear selection", "مسح التحديد")}</Button>
          </span>
        )}
      </div>
      {shown.length > 0 ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-start text-sm">
            <caption className="sr-only">{t("Question repository", "مستودع الأسئلة")}</caption>
            <thead className="bg-muted/60"><tr>
              <th scope="col" className="w-10 p-3"><input type="checkbox" className="size-4" aria-label={t("Select all on this page", "تحديد كل أسئلة الصفحة")} checked={allOnPage} onChange={(e) => setSelected(bank, e.target.checked ? [...new Set([...selected, ...shown.map((r) => r.id)])] : selected.filter((id) => !shown.some((r) => r.id === id)))} /></th>
              {[t("Question", "السؤال"), t("Type", "النوع"), t("Concept", "المفهوم"), t("Difficulty", "الصعوبة"), t("Cognitive level", "المستوى المعرفي"), t("Marks", "الدرجات"), t("Language", "اللغة"), t("Source", "المصدر"), t("Status", "الحالة"), t("Actions", "الإجراءات")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {shown.map((q) => (
                <tr key={q.id} className="border-t align-top">
                  <td className="p-3"><input type="checkbox" className="size-4" aria-label={t(`Select ${q.id}`, `تحديد ${q.id}`)} checked={selected.includes(q.id)} onChange={() => toggle(bank, q.id)} /></td>
                  <th scope="row" className="max-w-xs p-3 text-start font-normal"><span className="font-mono text-xs text-muted-foreground" dir="ltr">{q.id}</span><p className="line-clamp-2">{text(q.text)}</p></th>
                  <td className="p-3 whitespace-nowrap">{t(typeLabel[q.type])}</td>
                  <td className="p-3">{q.conceptIds.map(conceptName).join("، ")}</td>
                  <td className="p-3"><DiffBadge q={q} /></td>
                  <td className="p-3 whitespace-nowrap">{t(bloomLabel[q.bloom])}</td>
                  <td className="p-3 tabular-nums">{num(q.marks)}</td>
                  <td className="p-3 whitespace-nowrap">{t(langLabel[q.lang])}</td>
                  <td className="p-3 whitespace-nowrap">{lectureName(q.source.lectureId)} · {t(`S${num(q.source.slide)}`, `ش${num(q.source.slide)}`)}</td>
                  <td className="p-3"><StatusBadge status={q.status} /></td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => ui.open(q.id)} aria-label={t(`View ${q.id}`, `عرض ${q.id}`)}><Eye aria-hidden="true" />{t("View", "عرض")}</Button>
                    {q.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => ui.open(q.id, true)} aria-label={t(`Edit ${q.id}`, `تعديل ${q.id}`)}><Pencil aria-hidden="true" />{t("Edit", "تعديل")}</Button>}
                    <Button size="sm" variant="ghost" onClick={() => { const id = duplicate(q.id); if (id) notify(t(`Duplicated as ${id} (needs review).`, `تم النسخ باسم ${id} (يحتاج مراجعة).`)); }} aria-label={t(`Duplicate ${q.id}`, `نسخ ${q.id}`)}><CopyIcon aria-hidden="true" />{t("Duplicate", "نسخ")}</Button>
                    {q.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => ui.archive([q.id])} aria-label={t(`Archive ${q.id}`, `أرشفة ${q.id}`)}><Archive aria-hidden="true" />{t("Archive", "أرشفة")}</Button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title={questions.some((q) => q.bank === bank) ? t("No questions match these filters", "لا توجد أسئلة مطابقة للتصفية") : t("This bank is empty", "هذا البنك فارغ")} description={t("Clear the filters or generate new questions.", "امسح التصفية أو ولّد أسئلة جديدة.")} action={<Button variant="outline" onClick={() => resetFilters(bank)}>{t("Clear filters", "مسح التصفية")}</Button>} />
      )}
      {rows.length > PAGE && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => set({ page: page - 1 })} aria-label={t("Previous page", "الصفحة السابقة")}><ChevronLeft className="rtl:-scale-x-100" /></Button>
          <span className="tabular-nums">{t(`Page ${num(page)} of ${num(pages)}`, `الصفحة ${num(page)} من ${num(pages)}`)}</span>
          <Button size="icon-sm" variant="outline" disabled={page >= pages} onClick={() => set({ page: page + 1 })} aria-label={t("Next page", "الصفحة التالية")}><ChevronRight className="rtl:-scale-x-100" /></Button>
        </div>
      )}
    </div>
  );
}
