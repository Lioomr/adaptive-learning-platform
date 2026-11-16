import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useListBundles, useGetRunReport } from '../hooks/backend/read'
import { StatusBadge, MetricCard } from '../components/ui-bits'
import type { BundleListItem, RunReport } from '../types'
import { Button } from '../lib/shadcn/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { Plus, Database, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const bundles = useListBundles({ cachePolicy: 'stale-while-revalidate' })
  const report = useGetRunReport({ cachePolicy: 'stale-while-revalidate' })

  useEffect(() => {
    bundles.trigger()
    report.trigger({})
  }, [])

  const r = report.data as RunReport | null
  const list = (bundles.data as BundleListItem[] | null) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Knowledge Engine</h1>
          <p className="text-sm text-muted-foreground">
            Ingest educational material bundles, build provenance-tracked topic graphs, and route uncertain
            items to human review.
          </p>
        </div>
        <Button asChild>
          <Link to="/bundles/new">
            <Plus className="h-4 w-4" /> New bundle
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Auto-commit rate"
          value={r ? fmtPct(r.engineReport.auto_commit_rate_avg) : '—'}
          hint="average across measured runs"
        />
        <MetricCard
          label="Gold precision"
          value={r ? (r.engineReport.gold_precision_avg === null ? 'unmeasured' : r.engineReport.gold_precision_avg.toFixed(2)) : '—'}
          hint={r ? `threshold ${r.config.precision_threshold}` : ''}
        />
        <MetricCard
          label="Queue"
          value={String(r?.engineReport.queue['pending'] || 0)}
          hint="pending review items"
        />
        <MetricCard
          label="Pass agreement"
          value={r ? fmtPct(r.engineReport.agreement_rate_avg) : '—'}
          hint="between the two extraction passes"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Bundles</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bundle</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Segments</TableHead>
              <TableHead>Live graph</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No bundles yet — create one to start the pipeline.
                </TableCell>
              </TableRow>
            ) : (
              list.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link to={`/bundles/${b.bundle_id}`} className="font-medium text-foreground hover:underline">
                      {b.bundle_id}
                    </Link>
                    {b.is_held_out ? (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                        held-out
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.course_id}</TableCell>
                  <TableCell className="text-muted-foreground">{b.role.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{b.segment_count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.live_version ? `${b.live_nodes} nodes · ${b.live_edges} edges` : '—'}
                  </TableCell>
                  <TableCell>
                    {b.pending_queue > 0 ? (
                      <Link to="/queue" className="text-amber-600 hover:underline dark:text-amber-400">
                        {b.pending_queue} pending
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/bundles/${b.bundle_id}`}>
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function fmtPct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`
}
