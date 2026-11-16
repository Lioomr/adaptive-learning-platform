import { useEffect, useState } from 'react'
import { useGetRunReport } from '../hooks/backend/read'
import { useManageGold } from '../hooks/backend/gold'
import { MetricCard } from '../components/ui-bits'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Label } from '../lib/shadcn/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../lib/shadcn/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { Trash2, Plus } from 'lucide-react'
import type { RunReport, GoldTopic } from '../types'

export default function Quality() {
  const report = useGetRunReport({ cachePolicy: 'stale-while-revalidate' })
  const gold = useManageGold()
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [aliases, setAliases] = useState('')
  const [courseId, setCourseId] = useState('CS201')

  const load = () => {
    report.trigger({})
    gold.trigger({ action: 'list' })
  }

  useEffect(() => {
    load()
  }, [])

  const r = report.data as RunReport | null
  const topics = ((gold.data as { topics?: GoldTopic[] } | null)?.topics || []) as GoldTopic[]

  const addGold = async () => {
    if (!nameEn) return
    await gold.trigger({
      action: 'add',
      courseId,
      nameEn,
      ...(nameAr ? { nameAr } : {}),
      aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
    })
    setNameEn('')
    setNameAr('')
    setAliases('')
    load()
  }

  const removeGold = async (t: GoldTopic) => {
    await gold.trigger({ action: 'delete', courseId: t.course_id, nameEn: t.name_en })
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Quality & measurement</h1>
        <p className="text-sm text-muted-foreground">
          The engine's autonomy is bounded by measured precision against the hand-built gold subset — not by assumption.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Auto-commit rate" value={pct(r?.engineReport.auto_commit_rate_avg)} hint="avg over measured runs" />
        <MetricCard label="Gold precision" value={opt(r?.engineReport.gold_precision_avg)} hint={`threshold ${r?.config.precision_threshold ?? '—'}`} />
        <MetricCard label="Gold recall" value={opt(r?.engineReport.gold_recall_avg)} />
        <MetricCard label="Pass agreement" value={pct(r?.engineReport.agreement_rate_avg)} />
        <MetricCard label="Churn" value={pct(r?.engineReport.churn_avg)} hint="graph change between runs" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confidence policy</CardTitle>
          <CardDescription>Live thresholds used to route candidates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-2.5 py-1">auto-commit ≥ {r?.config.auto_commit_threshold}</span>
          <span className="rounded-full border px-2.5 py-1">queue ≥ {r?.config.block_threshold}</span>
          <span className="rounded-full border px-2.5 py-1">block &lt; {r?.config.block_threshold}</span>
          <span className="rounded-full border px-2.5 py-1">self-demotion threshold {r?.config.precision_threshold}</span>
          <span className="rounded-full border px-2.5 py-1">max out-edges/node {r?.config.max_out_edges_per_node}</span>
          <span className="rounded-full border px-2.5 py-1">queue: {Object.entries(r?.engineReport.queue || {}).map(([k, v]) => `${k} ${v}`).join(', ') || 'empty'}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run history</CardTitle>
          <CardDescription>
            Every run reports auto-commit rate, queue size, gold precision/recall, agreement, and churn. Held-out runs
            prove the mechanism generalizes beyond hand-tuned courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Auto-commit</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Blocked</TableHead>
                <TableHead>Precision</TableHead>
                <TableHead>Agreement</TableHead>
                <TableHead>Churn</TableHead>
                <TableHead>Demoted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(r?.runs || [])
                .filter((run) => run.validateMetrics)
                .map((run) => {
                  const m = run.validateMetrics as Record<string, unknown>
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs">{run.id.slice(4, 16)}</TableCell>
                      <TableCell className="text-xs">
                        {run.bundle_id}
                        {run.heldOut ? <span className="ml-1 rounded bg-violet-100 px-1 text-[10px] text-violet-800 dark:bg-violet-950 dark:text-violet-200">held-out</span> : null}
                      </TableCell>
                      <TableCell className="tabular-nums">{pct(m['auto_commit_rate'] as number)}</TableCell>
                      <TableCell className="tabular-nums">{String(m['queue_size'])}</TableCell>
                      <TableCell className="tabular-nums">{String(m['blocked'])}</TableCell>
                      <TableCell className="tabular-nums">{opt(m['gold_precision'] as number | null)}</TableCell>
                      <TableCell className="tabular-nums">{opt(m['agreement_rate'] as number | null)}</TableCell>
                      <TableCell className="tabular-nums">{opt(m['churn'] as number | null)}</TableCell>
                      <TableCell>
                        <span className="tabular-nums">{String(m['self_demoted'] ?? 0)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gold subset (hand-built reference topics)</CardTitle>
          <CardDescription>
            Reference topics per course. After every pipeline change the engine measures auto-commit precision against
            them; below threshold it demotes candidates from auto-commit to the queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[110px_1fr_1fr_1fr_auto] items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Input value={courseId} onChange={(e) => setCourseId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">English name</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Breadth-First Search" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Arabic name</Label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" placeholder="البحث أولا بالعرض" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aliases (comma-sep)</Label>
              <Input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="BFS" />
            </div>
            <Button size="sm" onClick={addGold} disabled={!nameEn}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Arabic</TableHead>
                <TableHead>Aliases</TableHead>
                <TableHead>Added by</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{t.course_id}</TableCell>
                  <TableCell className="font-medium">{t.name_en}</TableCell>
                  <TableCell dir="rtl" className="text-muted-foreground">{t.name_ar || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.aliases.join(', ') || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.added_by}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label="Delete gold topic" onClick={() => removeGold(t)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function pct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`
}

function opt(v: number | null | undefined): string {
  return v === null || v === undefined ? 'unmeasured' : v.toFixed(2)
}
