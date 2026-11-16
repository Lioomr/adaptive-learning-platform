import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGetBundleDetail } from '../hooks/backend/read'
import { useIngestBundle } from '../hooks/backend/bundles'
import { useExtractCandidates } from '../hooks/backend/extract'
import { useNormalizeCandidates } from '../hooks/backend/normalize'
import { useDraftEdges } from '../hooks/backend/link'
import { useValidateGraph } from '../hooks/backend/validate'
import { useCommitVersion } from '../hooks/backend/commit'
import { useLinkCrossGraph } from '../hooks/backend/crosslink'
import { StatusBadge, ConfidenceBar } from '../components/ui-bits'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../lib/shadcn/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { ArrowLeft, Play, Loader2, GitCommitHorizontal, Link2 } from 'lucide-react'
import type { BundleDetail as Detail } from '../types'

const STAGES = [
  { key: 'ingest', label: 'Ingest', desc: 'Parse files, chunk segments, detect language, normalize Arabic, flag OCR' },
  { key: 'extract', label: 'Extract', desc: 'Two independent LLM passes with agreement scoring' },
  { key: 'normalize', label: 'Normalize', desc: 'Embedding clustering, cross-language merge, granularity rules' },
  { key: 'link', label: 'Link', desc: 'Typed edges from LLM judgment, cues, order, similarity' },
  { key: 'validate', label: 'Validate', desc: 'Checks, confidence routing, gold precision, churn' },
  { key: 'commit', label: 'Commit', desc: 'Write an immutable graph version' },
] as const

export default function BundleDetail() {
  const { bundleId = '' } = useParams()
  const detail = useGetBundleDetail({ cachePolicy: 'stale-while-revalidate' })
  const [busy, setBusy] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ stage: string; ok: boolean; text: string } | null>(null)

  const ingest = useIngestBundle()
  const extract = useExtractCandidates()
  const normalize = useNormalizeCandidates()
  const link = useDraftEdges()
  const validate = useValidateGraph()
  const commit = useCommitVersion()
  const crosslink = useLinkCrossGraph()

  const load = () => detail.trigger({ bundleId })

  useEffect(() => {
    load()
  }, [bundleId])

  const d = detail.data as Detail | null
  const hasRuns = (d?.runs.length || 0) > 0

  const runStage = async (key: string) => {
    setBusy(key)
    setLastResult(null)
    try {
      let res: Record<string, unknown> | null = null
      let text = ''
      if (key === 'ingest') {
        res = await ingest.trigger({ bundleId, ...(hasRuns ? { force: true } : {}) })
        text = res && res['ok'] ? `${num(res, 'segments')} segments extracted (${arrLen(res, 'warnings')} warnings)` : ''
      } else if (key === 'extract') {
        res = await extract.trigger({ bundleId })
        text = res && res['ok'] ? `${num(res, 'candidates')} candidates, agreement ${num(res, 'agreementRate').toFixed(2)}` : ''
      } else if (key === 'normalize') {
        res = await normalize.trigger({ bundleId })
        text = res && res['ok'] ? `${num(res, 'outputNodes')} nodes (${num(res, 'clustersMerged')} merges, ${num(res, 'blockedTooBroad') + num(res, 'blockedTooNarrow')} granularity blocks)` : ''
      } else if (key === 'link') {
        res = await link.trigger({ bundleId })
        text = res && res['ok'] ? `${num(res, 'candidateEdges')} candidate edges (${num(res, 'blockedCycles')} cycles prevented, ${num(res, 'overCapEdges')} over cap)` : ''
      } else if (key === 'validate') {
        res = await validate.trigger({ bundleId })
        text = res && res['ok']
          ? `auto-commit ${(100 * num(res, 'auto_commit_rate')).toFixed(0)}% · queue ${num(res, 'queue_size')} · blocked ${num(res, 'blocked')} · gold precision ${fmtOpt(res, 'gold_precision')}${num(res, 'self_demoted') ? ` · self-demoted ${num(res, 'self_demoted')}` : ''}${res['churn'] !== null && res['churn'] !== undefined ? ` · churn ${num(res, 'churn')}` : ''} · ${num(res, 'reviewQueueCreated')} queue items`
          : ''
      } else if (key === 'commit') {
        res = await commit.trigger({ bundleId })
        text = res && res['ok'] ? `version ${num(res, 'versionNo')} committed: ${num(res, 'nodesCommitted')} nodes, ${num(res, 'edgesCommitted')} edges` : ''
      } else if (key === 'crosslink') {
        res = await crosslink.trigger({ bundleId })
        text = res && res['ok'] ? `${num(res, 'candidateEdges')} cross-graph edges drafted` : ''
      }
      if (res && res['ok'] === false) {
        setLastResult({ stage: key, ok: false, text: String(res['error'] || 'failed') })
      } else {
        setLastResult({ stage: key, ok: true, text })
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (detail.loading && !d) return <div className="text-sm text-muted-foreground">Loading bundle…</div>
  if (!d?.ok) return <div className="text-sm text-rose-600 dark:text-rose-400">{d?.error || 'Bundle not found'}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Back to dashboard">
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            {d.bundle.bundle_id}
            <StatusBadge status={d.bundle.status} />
            {d.bundle.is_held_out ? (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-200">held-out</span>
            ) : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            Course {d.bundle.course_id} · {d.bundle.role.replace(/_/g, ' ')} · v{d.bundle.version} · {d.bundle.instructor_id}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
          <CardDescription>Run stages in order. Each stage records provenance and its own quality gate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <Button
                key={s.key}
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => runStage(s.key)}
                title={s.desc}
              >
                {busy === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {s.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => runStage('crosslink')} title="Link this graph to nodes in other bundles' live graphs">
              {busy === 'crosslink' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Cross-graph link
            </Button>
            <Button size="sm" disabled={busy !== null} onClick={() => runStage('commit')}>
              {busy === 'commit' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCommitHorizontal className="h-3.5 w-3.5" />}
              Commit version
            </Button>
          </div>
          {lastResult ? (
            <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${lastResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'}`}>
              <span className="font-medium capitalize">{lastResult.stage}</span>: {lastResult.text}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segments by language & type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {d.segmentStats.map((s, i) => (
                <span key={i} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  {s.language} · {s.seg_type}
                  {s.needs_ocr === true ? ' · OCR' : ''} · {s.n} (conf {s.avg_conf})
                </span>
              ))}
              {d.segmentStats.length === 0 ? <span className="text-sm text-muted-foreground">Not ingested yet.</span> : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidates by status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {d.candidateStats.map((s, i) => (
                <span key={i} className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  <StatusBadge status={s.status} /> {s.kind} × {s.n} (conf {s.avg_conf})
                </span>
              ))}
              {d.candidateStats.length === 0 ? <span className="text-sm text-muted-foreground">No runs yet.</span> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Language hint</TableHead>
                <TableHead>Content size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.files.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell className="uppercase text-muted-foreground">{f.file_type}</TableCell>
                  <TableCell className="text-muted-foreground">{f.language_hint}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.content_length || 0} chars</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run history</CardTitle>
          <CardDescription>
            Every run records its stage metrics. A re-run never silently changes the live version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Stages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Key metrics</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{(r.stages_done || []).join(' → ') || '—'}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="max-w-md text-xs text-muted-foreground">
                    {r.error ? <span className="text-rose-600 dark:text-rose-400">{r.error}</span> : summarizeMetrics(r.metrics)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample segments</CardTitle>
          <CardDescription>Extraction confidence is recorded per segment; image-only pages are flagged for OCR.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {d.sampleSegments.slice(0, 10).map((s) => (
            <div key={s.id} className="rounded-md border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{s.id.slice(0, 16)}…</span>
                <span>{s.file_name} · p{s.page}</span>
                <span className="rounded bg-muted px-1.5">{s.language}</span>
                <span className="rounded bg-muted px-1.5">{s.seg_type}</span>
                {s.needs_ocr ? <span className="rounded bg-rose-100 px-1.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300">needs OCR</span> : null}
                <span className="ml-auto"><ConfidenceBar value={s.extraction_confidence} /></span>
              </div>
              <p className="line-clamp-2 text-sm text-foreground" dir="auto">{s.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function summarizeMetrics(m: Record<string, unknown>): string {
  const parts: string[] = []
  const pairs: [string, unknown][] = Object.entries(m)
  for (const [k, v] of pairs) {
    if (k === 'kind' || k === 'churn_detail') continue
    if (typeof v === 'number') parts.push(`${k.replace(/_/g, ' ')} ${v}`)
    else if (typeof v === 'string' && k === 'kind') parts.push(`kind ${v}`)
  }
  return parts.slice(0, 8).join(' · ') || '—'
}

function num(res: Record<string, unknown>, key: string): number {
  const v = res[key]
  return typeof v === 'number' ? v : 0
}

function arrLen(res: Record<string, unknown>, key: string): number {
  const v = res[key]
  return Array.isArray(v) ? v.length : 0
}

function fmtOpt(res: Record<string, unknown>, key: string): string {
  const v = res[key]
  return v === null || v === undefined ? 'unmeasured' : String(v)
}
