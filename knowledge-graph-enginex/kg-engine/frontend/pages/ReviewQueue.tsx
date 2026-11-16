import { useEffect, useState } from 'react'
import { useGetQueue } from '../hooks/backend/read'
import { useDecideQueueItem } from '../hooks/backend/queue'
import { useListBundles } from '../hooks/backend/read'
import { ConfidenceBar } from '../components/ui-bits'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Card, CardContent } from '../lib/shadcn/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Check, X, Inbox } from 'lucide-react'
import type { BundleListItem, QueueItem } from '../types'

export default function ReviewQueue() {
  const bundles = useListBundles({ cachePolicy: 'stale-while-revalidate' })
  const queue = useGetQueue()
  const decide = useDecideQueueItem()
  const [bundleFilter, setBundleFilter] = useState('all')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = (params?: Record<string, unknown>) => queue.trigger(params || { includeResolved: false })

  useEffect(() => {
    bundles.trigger()
    load()
  }, [])

  const items = ((queue.data as { items?: QueueItem[] } | null)?.items || []).filter(
    (q) => bundleFilter === 'all' || q.bundleId === bundleFilter
  )
  const pending = items.filter((q) => q.status === 'pending')
  const resolved = items.filter((q) => q.status !== 'pending')

  const act = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id)
    try {
      await decide.trigger({ queueItemId: id, decision, answer: answers[id] || undefined })
      await load({ includeResolved: true })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Review queue</h1>
          <p className="text-sm text-muted-foreground">
            Sorted by uncertainty (lowest confidence first). Each item is a single question with its evidence attached.
          </p>
        </div>
        <div className="ml-auto w-64">
          <Select value={bundleFilter} onValueChange={setBundleFilter}>
            <SelectTrigger><SelectValue placeholder="All bundles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All bundles</SelectItem>
              {(bundles.data as BundleListItem[] | null)?.map((b) => (
                <SelectItem key={b.id} value={b.bundle_id}>{b.bundle_id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
            <Inbox className="h-5 w-5" /> The queue is empty — everything validated has been decided.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((q) => (
            <QueueCard
              key={q.id}
              q={q}
              busy={busyId === q.id}
              answer={answers[q.id] || ''}
              onAnswer={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
              onApprove={() => act(q.id, 'approve')}
              onReject={() => act(q.id, 'reject')}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Recently decided</h2>
          <div className="space-y-2">
            {resolved.slice(0, 10).map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>
                  {q.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{q.question}</span>
                <span className="text-xs text-muted-foreground">{q.decidedBy}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function QueueCard(args: {
  q: QueueItem
  busy: boolean
  answer: string
  onAnswer: (v: string) => void
  onApprove: () => void
  onReject: () => void
}) {
  const { q } = args
  const ev = q.evidence || {}
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{q.kind}</span>
              <span>{q.bundleId}</span>
              {q.summary['name_en'] ? <span className="font-medium text-foreground">{String(q.summary['name_en'])}</span> : null}
              {ev.names ? (
                <span className="font-medium text-foreground">
                  {ev.names.source} → {ev.names.target}
                </span>
              ) : null}
            </div>
            <p className="text-sm font-medium text-foreground">{q.question}</p>
          </div>
          <ConfidenceBar value={q.confidence} />
        </div>

        <Evidence q={q} />

        <div className="flex items-center gap-2">
          <Input
            value={args.answer}
            onChange={(e) => args.onAnswer(e.target.value)}
            placeholder="Optional note recorded in the audit log…"
            className="h-8 flex-1 text-sm"
          />
          <Button size="sm" disabled={args.busy} onClick={args.onApprove}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" disabled={args.busy} onClick={args.onReject}>
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Evidence({ q }: { q: QueueItem }) {
  const ev = q.evidence || {}
  return (
    <div className="space-y-2 rounded-md bg-muted/50 p-3 text-xs">
      {ev.definition ? (
        <p className="text-foreground"><span className="font-medium">Definition:</span> {ev.definition}</p>
      ) : null}
      {ev.justification ? (
        <p className="text-foreground"><span className="font-medium">Evidence statement:</span> {ev.justification}</p>
      ) : null}
      {ev.agreement !== undefined ? (
        <p className="text-muted-foreground">Pass agreement: {typeof ev.agreement === 'number' ? ev.agreement.toFixed(2) : '—'}</p>
      ) : null}
      {ev.signals ? (
        <p className="text-muted-foreground">Signals: {Object.entries(ev.signals).map(([k, v]) => `${k} ${Number(v).toFixed(2)}`).join(' · ')}</p>
      ) : null}
      {(ev.support || []).map((s) => (
        <div key={s.segmentId} className="rounded border bg-background p-2">
          <div className="text-[10px] text-muted-foreground">segment <span className="font-mono">{s.segmentId}</span></div>
          <p className="mt-1 line-clamp-3 text-foreground" dir="auto">{s.snippet}</p>
        </div>
      ))}
      {(ev.segments || []).map((s, i) => (
        <div key={i} className="rounded border bg-background p-2">
          <div className="text-[10px] text-muted-foreground">graph {s.graph} · segment <span className="font-mono">{s.segmentId}</span></div>
          <p className="mt-1 text-foreground" dir="auto">{s.snippet}</p>
        </div>
      ))}
    </div>
  )
}
