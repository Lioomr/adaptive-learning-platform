import { audit } from '../shared/audit'

type Params = { queueItemId: string; decision: 'approve' | 'reject'; answer?: string }

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  if (req.params.decision !== 'approve' && req.params.decision !== 'reject') {
    return { ok: false, error: "decision must be 'approve' or 'reject'" }
  }
  const { data: items } = await retoolDb.query<{ id: string; ref_id: string; item_kind: string; status: string; question: string; bundle_pk: number }>(
    `SELECT id, ref_id, item_kind, status, question, bundle_pk FROM review_queue WHERE id = $1`,
    [req.params.queueItemId]
  )
  if (items.length === 0) return { ok: false, error: 'queue item not found' }
  const item = items[0]
  if (item.status !== 'pending') return { ok: false, error: `queue item already ${item.status}` }

  const newStatus = req.params.decision === 'approve' ? 'approved' : 'rejected'
  await retoolDb.updateBy({
    tableName: 'review_queue',
    filterBy: [{ key: 'id', operation: '=', value: item.id }],
    changeset: {
      status: newStatus,
      decided_by: actor,
      decided_at: new Date().toISOString(),
      answer: req.params.answer || null,
    },
  })
  await retoolDb.updateBy({
    tableName: 'candidates',
    filterBy: [{ key: 'id', operation: '=', value: item.ref_id }],
    changeset: { status: newStatus },
  })

  await audit({
    actor,
    action: `queue_${newStatus}`,
    entityType: 'queue_item',
    entityId: item.id,
    details: { candidate: item.ref_id, kind: item.item_kind, question: item.question, answer: req.params.answer || null },
  })

  return { ok: true, queueItemId: item.id, decision: newStatus, candidateId: item.ref_id }
}
