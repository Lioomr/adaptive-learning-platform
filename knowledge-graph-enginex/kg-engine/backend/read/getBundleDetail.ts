type Params = { bundleId: string }

export default async function (req: { params: Params }) {
  const { data: bundles } = await retoolDb.query<{
    id: number
    bundle_id: string
    course_id: string
    role: string
    version: string
    instructor_id: string
    status: string
    is_held_out: boolean
    notes: string | null
    created_at: string
  }>(`SELECT * FROM bundles WHERE bundle_id = $1`, [req.params.bundleId])
  if (bundles.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundles[0]

  const { data: files } = await retoolDb.query<{
    id: number
    name: string
    file_type: string
    language_hint: string
    content_length: string | null
  }>(`SELECT id, name, file_type, language_hint, LENGTH(content)::text AS content_length FROM bundle_files WHERE bundle_pk = $1 ORDER BY id`, [bundle.id])

  const { data: segStats } = await retoolDb.query<{ language: string; seg_type: string; needs_ocr: boolean; n: string; avg_conf: string }>(
    `SELECT language, seg_type, needs_ocr, COUNT(*)::text AS n, ROUND(AVG(extraction_confidence)::numeric, 2)::text AS avg_conf
     FROM segments WHERE bundle_pk = $1 GROUP BY language, seg_type, needs_ocr`,
    [bundle.id]
  )

  const { data: sampleSegments } = await retoolDb.query<{
    id: string
    file_name: string
    page: number
    language: string
    seg_type: string
    extraction_confidence: number
    needs_ocr: boolean
    text: string
  }>(`SELECT id, file_name, page, language, seg_type, extraction_confidence, needs_ocr, LEFT(text, 300) AS text FROM segments WHERE bundle_pk = $1 ORDER BY file_name, seq LIMIT 40`, [bundle.id])

  const { data: runs } = await retoolDb.query<{
    id: string
    started_at: string
    finished_at: string | null
    stages_done: string[]
    status: string
    metrics: Record<string, unknown>
    error: string | null
  }>(`SELECT id, started_at, finished_at, stages_done, status, metrics, error FROM runs WHERE bundle_pk = $1 ORDER BY started_at DESC LIMIT 8`, [bundle.id])

  const { data: candStats } = await retoolDb.query<{ kind: string; status: string; n: string; avg_conf: string }>(
    `SELECT kind, status, COUNT(*)::text AS n, ROUND(AVG(confidence)::numeric, 2)::text AS avg_conf
     FROM candidates WHERE bundle_pk = $1 GROUP BY kind, status`,
    [bundle.id]
  )

  const { data: pendingQueue } = await retoolDb.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM review_queue WHERE bundle_pk = $1 AND status = 'pending'`,
    [bundle.id]
  )

  return {
    ok: true,
    bundle,
    files,
    segmentStats: segStats,
    sampleSegments,
    runs,
    candidateStats: candStats.map((c) => ({ ...c, n: Number(c.n) })),
    pendingQueue: Number(pendingQueue[0]?.n || '0'),
  }
}
