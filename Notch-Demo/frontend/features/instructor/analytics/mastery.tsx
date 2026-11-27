"use client";
import { useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState, NativeSelect } from "@/features/instructor/portal/forms";
import { SCALE, levelLabel, levelOf, type ConceptStat, type Level } from "./data";
import type { Analytics } from "./use-analytics";
import { Bars, DistBar, Legend, LevelBadge, Section, hatch, levelClass } from "./ui";

const diffTone = { hard: "danger", moderate: "warning", easy: "success", unknown: "neutral" } as const;
export function Difficulty({ d, t }: { d: ConceptStat["difficulty"]; t: Analytics["t"] }) {
  const label = { hard: t("Hard", "صعب"), moderate: t("Moderate", "متوسط"), easy: t("Easy", "سهل"), unknown: t("Not enough data", "بيانات غير كافية") }[d];
  return <Badge tone={diffTone[d]}>{label}</Badge>;
}

/* 3. Knowledge mastery heatmap */
export function Heatmap({ a }: { a: Analytics }) {
  const { t, num, model, filters } = a;
  const [sort, setSort] = useState("low");
  const q = filters.q.trim().toLowerCase();
  const rows = model.studentStats
    .filter((s) => !q || s.student.name.toLowerCase().includes(q))
    .sort((x, y) => {
      if (sort === "name") return x.student.name.localeCompare(y.student.name);
      if (x.avg === null || y.avg === null) return x.avg === null ? (y.avg === null ? 0 : 1) : -1;
      return sort === "low" ? x.avg - y.avg : y.avg - x.avg;
    });
  const cols = model.shown;
  const noEvidence = cols.length > 0 && model.students.every((s) => cols.every((n) => model.cell(s.id, n.key).level === "none"));
  return (
    <Section id="heatmap" title={t("Knowledge mastery overview", "نظرة عامة على إتقان المعرفة")} description={t("Estimated mastery per student and concept. Hatched cells mean too little practice to say anything — they are never counted as zero.", "الإتقان التقديري لكل طالب ومفهوم. الخلايا المخططة تعني أن التدريب غير كافٍ للحكم، ولا تُحتسب صفرًا أبدًا.")}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-56 items-center gap-2 rounded-lg border bg-card px-3"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><input className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label={t("Search students", "البحث عن طالب")} placeholder={t("Search students", "البحث عن طالب")} value={filters.q} onChange={(e) => a.setQ(e.target.value)} /></label>
        <NativeSelect aria-label={t("Filter by concept", "تصفية حسب المفهوم")} className="w-auto max-w-64" value={filters.concept} onChange={(e) => a.setConcept(e.target.value)}>
          <option value="all">{t("All concepts", "كل المفاهيم")}</option>
          {model.allNodes.map((n) => <option key={n.key} value={n.key}>{a.model.inScope.length > 1 ? `${n.course.code} · ` : ""}{t(n.title)}</option>)}
        </NativeSelect>
        <NativeSelect aria-label={t("Sort students", "ترتيب الطلاب")} className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="low">{t("Lowest mastery first", "الأقل إتقانًا أولًا")}</option><option value="high">{t("Highest mastery first", "الأعلى إتقانًا أولًا")}</option><option value="name">{t("Name (A–Z)", "الاسم (أ–ي)")}</option>
        </NativeSelect>
        {filters.concept !== "all" && <Button variant="ghost" size="sm" onClick={() => a.setConcept("all")}><X aria-hidden="true" />{t("Clear concept filter", "مسح تصفية المفهوم")}</Button>}
      </div>
      <Legend />
      {!rows.length ? <EmptyState title={t("No students match", "لا يوجد طلاب مطابقون")} description={t("Try another name or clear the search.", "جرّب اسمًا آخر أو امسح البحث.")} />
        : noEvidence ? <EmptyState title={t("Not enough learning evidence yet", "لا توجد أدلة تعلم كافية بعد")} description={t("Students need a few attempts on a concept before mastery can be estimated.", "يحتاج الطلاب إلى بعض المحاولات في المفهوم قبل تقدير الإتقان.")} />
        : (
          <Card className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <caption className="sr-only">{t("Knowledge mastery heatmap: students by concept", "خريطة حرارية للإتقان: الطلاب حسب المفهوم")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky start-0 z-10 min-w-40 border-b bg-card p-3 text-start font-medium text-muted-foreground">{t("Student", "الطالب")}</th>
                  <th scope="col" className="min-w-20 border-b p-3 text-center font-medium text-muted-foreground">{t("Average", "المتوسط")}</th>
                  {cols.map((n) => (
                    <th key={n.key} scope="col" className="min-w-24 border-b p-1.5 text-center align-bottom font-normal">
                      <button type="button" onClick={() => a.setFocus(n.key)} aria-label={t(`Open analytics for ${n.title[0]}`, `فتح تحليلات ${n.title[1]}`)} className="w-full rounded-md px-1 py-1.5 text-xs leading-tight outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">
                        {model.inScope.length > 1 && <span className="block text-[10px] text-muted-foreground">{n.course.code}</span>}{t(n.title)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student.id}>
                    <th scope="row" className="sticky start-0 z-10 border-b bg-card p-3 text-start font-medium"><button type="button" onClick={() => a.setStudent(r.student.id)} className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" aria-label={t(`Open learning profile: ${r.student.name}`, `فتح ملف التعلم: ${r.student.name}`)}>{r.student.name}</button></th>
                    <td className="border-b p-1.5 text-center"><LevelBadge level={levelOf(r.avg)} value={r.avg} /></td>
                    {cols.map((n) => {
                      const c = model.cell(r.student.id, n.key);
                      return <td key={n.key} className="border-b p-1"><div title={`${t(levelLabel[c.level])} · ${c.attempts} ${t("attempts", "محاولات")}`} aria-label={`${r.student.name}, ${t(n.title)}: ${c.mastery === null ? t("insufficient evidence", "أدلة غير كافية") : `${c.mastery}%`}`} className={cn("grid h-9 place-items-center rounded-md text-xs font-medium tabular-nums", levelClass[c.level])} style={c.level === "none" ? hatch : undefined}>{c.mastery === null ? "—" : num(c.mastery)}</div></td>
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row" className="sticky start-0 bg-card p-3 text-start text-xs font-medium text-muted-foreground">{t("Class average", "متوسط الصف")}</th><td />{cols.map((n) => { const cs = model.conceptStats.get(n.key)!; return <td key={n.key} className="p-1"><div className="flex justify-center"><LevelBadge level={levelOf(cs.avg)} value={cs.avg} /></div></td>; })}</tr>
              </tfoot>
            </table>
          </Card>
        )}
    </Section>
  );
}

/* 4. Concept-level analytics */
export function Concepts({ a }: { a: Analytics }) {
  const { t, num, model } = a;
  const [sort, setSort] = useState("avg");
  const list = model.shown.map((n) => model.conceptStats.get(n.key)!).sort((x, y) => sort === "struggling" ? y.struggling - x.struggling : sort === "attempts" ? y.attempts - x.attempts : (x.avg ?? 101) - (y.avg ?? 101));
  const focus = a.focus ? model.conceptStats.get(a.focus) : null;
  return (
    <Section id="concepts" title={t("Concept-level analytics", "تحليلات المفاهيم")} description={t("Find the concepts that need more explanation or teaching time. Select one for the full picture.", "اعثر على المفاهيم التي تحتاج إلى شرح أو وقت تدريس إضافي. اختر مفهومًا لعرض الصورة الكاملة.")}
      actions={<NativeSelect aria-label={t("Sort concepts", "ترتيب المفاهيم")} className="w-auto" value={sort} onChange={(e) => setSort(e.target.value)}><option value="avg">{t("Lowest mastery first", "الأقل إتقانًا أولًا")}</option><option value="struggling">{t("Most students struggling", "الأكثر تعثرًا")}</option><option value="attempts">{t("Most interactions", "الأكثر تفاعلًا")}</option></NativeSelect>}>
      {!list.length ? <EmptyState title={t("No concepts", "لا توجد مفاهيم")} description={t("There are no concepts for this selection.", "لا توجد مفاهيم لهذا التحديد.")} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-start text-sm">
            <caption className="sr-only">{t("Concepts", "المفاهيم")}</caption>
            <thead className="bg-muted/60"><tr>{[t("Concept", "المفهوم"), t("Course", "المقرر"), t("Average mastery", "متوسط الإتقان"), t("Students struggling", "طلاب متعثرون"), t("Interactions", "التفاعلات"), t("Prerequisites", "المتطلبات"), t("Difficulty", "الصعوبة")].map((h) => <th key={h} scope="col" className="p-3 text-start font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.node.key} aria-selected={a.focus === c.node.key} className={cn("border-t", a.focus === c.node.key && "bg-secondary/50")}>
                  <th scope="row" className="p-3 text-start font-medium"><button type="button" onClick={() => a.setFocus(a.focus === c.node.key ? null : c.node.key)} aria-expanded={a.focus === c.node.key} className="rounded text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">{t(c.node.title)}</button>{model.bottleneckKeys.has(c.node.key) && <Badge tone="warning" className="ms-2">{t("Bottleneck", "عائق")}</Badge>}</th>
                  <td className="p-3 whitespace-nowrap">{c.node.course.code}</td>
                  <td className="p-3"><LevelBadge level={levelOf(c.avg)} value={c.avg} /></td>
                  <td className="p-3 tabular-nums">{num(c.struggling)} <span className="text-muted-foreground">/ {num(c.evidence)}</span></td>
                  <td className="p-3 tabular-nums">{num(c.attempts)}</td>
                  <td className="p-3">{model.prereqNodes(c.node).length ? <span className="flex flex-wrap gap-1">{model.prereqNodes(c.node).map((p) => <button key={p.key} type="button" onClick={() => a.setFocus(p.key)} className="rounded-full border px-2 py-0.5 text-xs outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{t(p.title)}</button>)}</span> : <span className="text-muted-foreground">{t("None (foundation)", "لا يوجد (أساسي)")}</span>}</td>
                  <td className="p-3"><Difficulty d={c.difficulty} t={t} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {focus && <ConceptDetail a={a} c={focus} />}
    </Section>
  );
}

function ConceptDetail({ a, c }: { a: Analytics; c: ConceptStat }) {
  const { t, num, model } = a;
  const people = model.students.map((s) => ({ s, cell: model.cell(s.id, c.node.key) })).sort((x, y) => (x.cell.mastery ?? 101) - (y.cell.mastery ?? 101));
  const levels: Level[] = ["low", "developing", "high", "none"];
  return (
    <Card className="space-y-6 p-5 sm:p-6" aria-live="polite" id="concept-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">{c.node.course.code} · {t(c.node.course.title)}</p><h3 className="text-lg font-semibold">{t(c.node.title)}</h3><div className="mt-2 flex flex-wrap items-center gap-2"><LevelBadge level={levelOf(c.avg)} value={c.avg} /><Difficulty d={c.difficulty} t={t} /><span className="text-xs text-muted-foreground">{t(`${c.struggling} of ${c.evidence} students with evidence are struggling`, `${num(c.struggling)} من ${num(c.evidence)} طلاب لديهم أدلة متعثرون`)}</span></div></div>
        <Button variant="outline" size="sm" onClick={() => a.setFocus(null)}><X aria-hidden="true" />{t("Close", "إغلاق")}</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{t("Mastery distribution", "توزيع الإتقان")}</h4>
          <DistBar dist={c.dist} label={t("Mastery distribution", "توزيع الإتقان")} />
          <ul className="grid grid-cols-2 gap-2 text-sm">{levels.map((l) => <li key={l} className="flex items-center justify-between rounded-lg border px-3 py-2"><span className="flex items-center gap-2"><span className={cn("size-3 rounded-sm", levelClass[l])} style={l === "none" ? hatch : undefined} aria-hidden="true" />{t(levelLabel[l])}</span><strong className="tabular-nums">{num(c.dist[l])}</strong></li>)}</ul>
          <h4 className="pt-2 text-sm font-semibold">{t("Learning activity (last 6 weeks)", "نشاط التعلم (آخر 6 أسابيع)")}</h4>
          <Bars values={c.weekly} label={t("Weekly learning interactions", "التفاعلات التعليمية الأسبوعية")} />
          <p className="text-xs text-muted-foreground">{t(`${num(c.attempts)} interactions in total. Activity shows effort, not understanding.`, `${num(c.attempts)} تفاعلًا إجمالًا. النشاط يعكس الجهد وليس الفهم.`)}</p>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">{t("Frequently missed questions", "الأسئلة الأكثر إخفاقًا")}</h4>
          <ol className="space-y-2 text-sm">{c.missed.map((m, i) => <li key={i} className="rounded-lg border p-3"><p>{t(m.prompt)}</p><div className="mt-2 flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-danger" style={{ width: `${m.rate}%` }} /></span><span className="text-xs tabular-nums text-muted-foreground">{t(`${m.rate}% missed · ${m.seen} attempts`, `${num(m.rate)}٪ إخفاق · ${num(m.seen)} محاولة`)}</span></div></li>)}</ol>
          <h4 className="pt-2 text-sm font-semibold">{t("Prerequisites with low mastery", "متطلبات منخفضة الإتقان")}</h4>
          {c.lowPrereqs.length ? <ul className="space-y-2 text-sm">{c.lowPrereqs.map((p) => <li key={p.node.key} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span>{t(p.node.title)} <LevelBadge level={levelOf(p.avg)} value={p.avg} /></span><Button size="sm" variant="outline" onClick={() => a.setFocus(p.node.key)}>{t("Open prerequisite", "فتح المتطلب")}<ArrowRight className="rtl:rotate-180" aria-hidden="true" /></Button></li>)}</ul> : <p className="text-sm text-muted-foreground">{model.prereqNodes(c.node).length ? t(`Prerequisites are at or above ${SCALE.prereqLow}%.`, `المتطلبات عند ${num(SCALE.prereqLow)}٪ أو أعلى.`) : t("This is a foundation concept.", "هذا مفهوم أساسي.")}</p>}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">{t("Student performance", "أداء الطلاب")}</h4>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{people.map(({ s, cell }) => <li key={s.id}><button type="button" onClick={() => a.setStudent(s.id)} className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-sm outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring"><span>{s.name}</span><LevelBadge level={cell.level} value={cell.mastery} /></button></li>)}</ul>
      </div>
      <div className="rounded-xl bg-secondary/50 p-4">
        <h4 className="mb-2 text-sm font-semibold">{t("Suggested instructional actions", "إجراءات تدريسية مقترحة")}</h4>
        <ul className="list-disc space-y-1 ps-5 text-sm">{c.actions.map((x, i) => <li key={i}>{t(x)}</li>)}</ul>
      </div>
    </Card>
  );
}

/* 5. Prerequisite difficulty analysis */
const NODE_W = 156, NODE_H = 48, GAP_X = 64, GAP_Y = 18, PAD = 12;
export function Prerequisites({ a }: { a: Analytics }) {
  const { t, num, model } = a;
  const edgeBy = new Map(model.edges.map((e) => [`${e.from.key}>${e.to.key}`, e]));
  const nodeClass: Record<Level, string> = { low: "fill-danger-soft stroke-danger", developing: "fill-warning-soft stroke-warning", high: "fill-success-soft stroke-success", none: "fill-muted stroke-border" };
  const topEdges = [...model.edges].filter((e) => e.linked > 0).sort((x, y) => y.linked - x.linked || y.assoc - x.assoc).slice(0, 5);
  const despite = [...model.conceptStats.values()].filter((c) => c.despite > 0).sort((x, y) => y.despite - x.despite).slice(0, 5);
  const focus = a.focus ? model.conceptStats.get(a.focus) : null;
  const dependents = focus ? model.allNodes.filter((n) => n.course.id === focus.node.course.id && n.prereqs.includes(focus.node.id)) : [];
  return (
    <Section id="prerequisites" title={t("Prerequisite difficulty analysis", "تحليل صعوبة المتطلبات")} description={t("Arrows point from a prerequisite to the concept that builds on it. Red arrows mean at least half of the students struggling with the later concept are also weak in the earlier one.", "تشير الأسهم من المتطلب إلى المفهوم الذي يبني عليه. السهم الأحمر يعني أن نصف المتعثرين على الأقل في المفهوم اللاحق ضعفاء أيضًا في السابق.")}>
      <Legend />
      <Card className="space-y-6 p-4 sm:p-5">
        {model.inScope.map((course) => {
          const nodes = model.allNodes.filter((n) => n.course.id === course.id);
          const layers = Math.max(...nodes.map((n) => n.depth)) + 1;
          const rowIdx = new Map<string, number>();
          const perLayer: number[] = Array(layers).fill(0);
          nodes.forEach((n) => { rowIdx.set(n.key, perLayer[n.depth]++); });
          const pos = (n: (typeof nodes)[number]) => ({ x: PAD + n.depth * (NODE_W + GAP_X), y: PAD + rowIdx.get(n.key)! * (NODE_H + GAP_Y) });
          const W = PAD * 2 + layers * NODE_W + (layers - 1) * GAP_X;
          const H = PAD * 2 + Math.max(...perLayer) * NODE_H + (Math.max(...perLayer) - 1) * GAP_Y;
          return (
            <div key={course.id}>
              <h3 className="mb-2 text-sm font-semibold">{course.code} · {t(course.title)}</h3>
              <div className="overflow-x-auto rounded-xl border bg-background" dir="ltr">
                <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label={t(`Prerequisite graph for ${course.title[0]}`, `مخطط المتطلبات لمقرر ${course.title[1]}`)} className="block min-w-full">
                  <defs>
                    <marker id={`arrow-${course.id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" className="fill-muted-foreground" /></marker>
                    <marker id={`arrow-hot-${course.id}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" className="fill-danger" /></marker>
                  </defs>
                  {nodes.flatMap((to) => to.prereqs.map((p) => {
                    const from = nodes.find((n) => n.id === p);
                    const e = from && edgeBy.get(`${from.key}>${to.key}`);
                    if (!from || !e) return null;
                    const hot = e.linked >= 1 && e.assoc >= 0.5;
                    const a1 = pos(from), b1 = pos(to);
                    const x1 = a1.x + NODE_W, y1 = a1.y + NODE_H / 2, x2 = b1.x, y2 = b1.y + NODE_H / 2;
                    const mx = (x1 + x2) / 2;
                    return <path key={`${from.key}>${to.key}`} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`} fill="none" strokeWidth={hot ? 2 + Math.min(2.5, e.linked * 0.4) : 1.25} className={hot ? "stroke-danger" : "stroke-muted-foreground/50"} markerEnd={`url(#arrow-${hot ? "hot-" : ""}${course.id})`}><title>{`${from.title[0]} → ${to.title[0]}: ${e.linked}/${e.strugglingTo}`}</title></path>;
                  }))}
                  {nodes.map((n) => {
                    const p = pos(n), cs = model.conceptStats.get(n.key)!, sel = a.focus === n.key;
                    return (
                      <g key={n.key} role="button" tabIndex={0} aria-label={`${n.title[0]}: ${cs.avg ?? "no evidence"}`} aria-pressed={sel} className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-primary [&:focus-visible>rect]:stroke-[3]" onClick={() => a.setFocus(n.key)} onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); a.setFocus(n.key); } }}>
                        <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx="10" strokeWidth={sel ? 3 : 1.5} className={cn(nodeClass[levelOf(cs.avg)], sel && "stroke-primary")} />
                        <text x={p.x + 10} y={p.y + 20} className="fill-foreground text-[12px] font-semibold">{(a.language === "ar" ? n.title[1] : n.title[0]).slice(0, 20)}</text>
                        <text x={p.x + 10} y={p.y + 37} className="fill-muted-foreground text-[11px]">{cs.avg === null ? "—" : `${cs.avg}%`}{model.bottleneckKeys.has(n.key) ? (a.language === "ar" ? " · عائق" : " · bottleneck") : ""}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })}
      </Card>
      {focus && (
        <Card className="p-4 text-sm" aria-live="polite">
          <p className="mb-2 font-semibold">{t(`Navigate from ${focus.node.title[0]}`, `التنقل من ${focus.node.title[1]}`)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{t("Prerequisites:", "المتطلبات:")}</span>
            {model.prereqNodes(focus.node).length ? model.prereqNodes(focus.node).map((p) => <Button key={p.key} size="sm" variant="outline" onClick={() => a.setFocus(p.key)}>{t(p.title)} <LevelBadge level={levelOf(model.conceptStats.get(p.key)!.avg)} value={model.conceptStats.get(p.key)!.avg} /></Button>) : <span>{t("none — foundation concept", "لا يوجد — مفهوم أساسي")}</span>}
            <span className="ms-4 text-muted-foreground">{t("Builds into:", "يُبنى عليه:")}</span>
            {dependents.length ? dependents.map((d) => <Button key={d.key} size="sm" variant="ghost" onClick={() => a.setFocus(d.key)}>{t(d.title)}</Button>) : <span>{t("nothing further", "لا شيء لاحق")}</span>}
          </div>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold">{t("Major bottlenecks", "العوائق الرئيسية")}</h3>
          {model.bottlenecks.length ? <ul className="space-y-2 text-sm">{model.bottlenecks.slice(0, 5).map((b) => <li key={b.node.key}><button type="button" onClick={() => a.setFocus(b.node.key)} className="text-start outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><strong>{t(b.node.title)}</strong> <span className="text-muted-foreground">({b.avg}%)</span><br /><span className="text-xs text-muted-foreground">{t(`Holds back ${b.dependents.map((d) => d.title[0]).join(", ")}`, `يعيق ${b.dependents.map((d) => d.title[1]).join("، ")}`)}</span></button></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("No bottleneck detected in this selection.", "لا عوائق ظاهرة في هذا التحديد.")}</p>}</Card>
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold">{t("Prerequisites linked to struggling", "متطلبات مرتبطة بالتعثر")}</h3>
          {topEdges.length ? <ul className="space-y-2 text-sm">{topEdges.map((e) => <li key={`${e.from.key}${e.to.key}`}><button type="button" onClick={() => a.setFocus(e.from.key)} className="text-start outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring">{t(e.from.title)} → {t(e.to.title)}<br /><span className="text-xs text-muted-foreground">{t(`${e.linked} of ${e.strugglingTo} struggling students are weak in both`, `${num(e.linked)} من ${num(e.strugglingTo)} طلاب متعثرين ضعفاء في كليهما`)}</span></button></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("No link between weak prerequisites and struggling found.", "لا توجد صلة بين ضعف المتطلبات والتعثر.")}</p>}</Card>
        <Card className="p-4"><h3 className="mb-2 text-sm font-semibold">{t("Struggling despite prerequisites", "تعثر رغم إتقان المتطلبات")}</h3>
          {despite.length ? <ul className="space-y-2 text-sm">{despite.map((c) => <li key={c.node.key}><button type="button" onClick={() => a.setFocus(c.node.key)} className="text-start outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"><strong>{t(c.node.title)}</strong><br /><span className="text-xs text-muted-foreground">{t(`${c.despite} student(s) struggle although every prerequisite is at ${SCALE.prereqLow}%+`, `${num(c.despite)} طالب يتعثرون رغم أن كل المتطلبات عند ${num(SCALE.prereqLow)}٪+`)}</span></button></li>)}</ul> : <p className="text-sm text-muted-foreground">{t("None. Struggles trace back to earlier concepts.", "لا يوجد. التعثر يعود إلى مفاهيم سابقة.")}</p>}</Card>
      </div>
    </Section>
  );
}
