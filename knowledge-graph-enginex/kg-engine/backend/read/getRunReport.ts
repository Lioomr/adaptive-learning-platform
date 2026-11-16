import { getConfig } from '../shared/policy'

type Params = { bundleId?: string }

export default async function (req: { params: Params }) {
  const cfg = await getConfig()

  let runsSql: string
  const params: unknown[] = []
  if (req.params.bundleId) {
    const { data } = await retoolDb.query<{ id: number }>(`SELECT id FROM bundles WHERE bundle_id = $1`, [req.params.bundleId])
    if (data.length === 0) return { ok: false, error: 'bundle not found' }
    params.push(data[0].id)
    runsSql = `SELECT r.id, r.started_at, r.finished_at, r.stages_done, r.status, r.metrics, r.error, b.bundle_id, b.is_held_out, b.course_id
               FROM runs r JOIN bundles b ON b.id = r.bundle_pk WHERE r.bundle_pk = $1 ORDER BY r.started_at DESC LIMIT 50`
  } else {
    runsSql = `SELECT r.id, r.started_at, r.finished_at, r.stages_done, r.status, r.metrics, r.error, b.bundle_id, b.is_held_out, b.course_id
               FROM runs r JOIN bundles b ON b.id = r.bundle_pk ORDER BY r.started_at DESC LIMIT 100`
  }
  const { data: runs } = await retoolDb.query<{
    id: string
    started_at: string
    finished_at: string | null
    stages_done: string[]
    status: string
    metrics: Record<string, unknown>
    error: string | null
    bundle_id: string
    is_held_out: boolean
    course_id: string
  }>(runsSql, params)

  // aggregate the quality report across runs (each run's validate metrics)
  const validated = runs.filter((r) => r.metrics && typeof r.metrics.auto_commit_rate === 'number')
  const avg = (key: string): number | null => {
    const vals = validated.map((r) => Number(r.metrics[key])).filter((v) => Number.isFinite(v))
    return vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)) : null
  }

  const { data: queueStats } = await retoolDb.query<{ status: string; n: string }>(
    `SELECT status, COUNT(*)::text AS n FROM review_queue GROUP BY status`
  )
  const queue = Object.fromEntries(queueStats.map((q) => [q.status, Number(q.n)]))

  const { data: goldCount } = await retoolDb.query<{ course_id: string; n: string }>(
    `SELECT course_id, COUNT(*)::text AS n FROM gold_topics GROUP BY course_id`
  )

  return {
    ok: true,
    config: cfg,
    engineReport: {
      auto_commit_rate_avg: avg('auto_commit_rate'),
      agreement_rate_avg: avg('agreement_rate'),
      gold_precision_avg: avg('gold_precision'),
      gold_recall_avg: avg('gold_recall'),
      churn_avg: avg('churn'),
      queue: queue,
      gold_subsets: goldCount.map((g) => ({ course_id: g.course_id, topics: Number(g.n) })),
      runs_measured: validated.length,
    },
    runs: runs.map((r) => ({
      ...r,
      heldOut: r.is_held_out,
      validateMetrics: r.metrics && typeof r.metrics.auto_commit_rate === 'number' ? r.metrics : null,
    })),
  }
}
