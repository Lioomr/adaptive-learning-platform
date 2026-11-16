import type { NodePayload, EdgePayload } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId?: string; includeResolved?: boolean }

export default async function (req: { params: Params }) {
  const conditions: string[] = []
  const params: unknown[] = []
  if (req.params.bundleId) {
    const { data } = await retoolDb.query<{ id: number }>(`SELECT id FROM bundles WHERE bundle_id = $1`, [req.params.bundleId])
    if (data.length === 0) return { ok: false, error: 'bundle not found' }
    conditions.push(`q.bundle_pk = $1`)
    params.push(data[0].id)
  }
  if (!req.params.includeResolved) conditions.push(`q.status = 'pending'`)

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const { data } = await retoolDb.query<{
    id: string
    run_id: string | null
    bundle_pk: number
    bundle_id: string
    item_kind: string
    ref_id: string
    question: string
    evidence: string
    confidence: number
    status: string
    decided_by: string | null
    decided_at: string | null
    answer: string | null
    cand_payload: string | null
    cand_status: string | null
  }>(
    `SELECT q.id, q.run_id, q.bundle_pk, b.bundle_id, q.item_kind, q.ref_id, q.question, q.evidence, q.confidence,
            q.status, q.decided_by, q.decided_at, q.answer,
            c.payload AS cand_payload, c.status AS cand_status
     FROM review_queue q
     JOIN bundles b ON b.id = q.bundle_pk
     LEFT JOIN candidates c ON c.id = q.ref_id
     ${where}
     ORDER BY q.confidence ASC, q.id
     LIMIT 200`,
    params
  )

  return {
    ok: true,
    items: data.map((q) => {
      let summary: Record<string, unknown> = {}
      if (q.cand_payload) {
        const p = parseMaybeJson<NodePayload | EdgePayload>(q.cand_payload, {} as NodePayload)
        if (q.item_kind === 'node') {
          const np = p as NodePayload
          summary = { name_en: np.name_en, name_ar: np.name_ar, definition: np.definition, scope: np.scope, source_segment_ids: np.source_segment_ids, aliases: np.aliases }
        } else {
          const ep = p as EdgePayload
          summary = { source: ep.source_node_id, target: ep.target_node_id, edge_type: ep.edge_type, cross_graph: ep.cross_graph }
        }
      }
      return {
        id: q.id,
        runId: q.run_id,
        bundleId: q.bundle_id,
        kind: q.item_kind,
        question: q.question,
        confidence: q.confidence,
        status: q.status,
        decidedBy: q.decided_by,
        decidedAt: q.decided_at,
        answer: q.answer,
        candidateStatus: q.cand_status,
        evidence: parseMaybeJson<Record<string, unknown>>(q.evidence, {}),
        summary,
      }
    }),
  }
}
