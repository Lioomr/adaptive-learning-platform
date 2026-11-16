type Params = { limit?: number; entityType?: string }

export default async function (req: { params: Params }) {
  const limit = Math.min(req.params.limit || 100, 500)
  const { data } = await retoolDb.query<{
    id: number
    ts: string
    actor: string
    action: string
    entity_type: string
    entity_id: string
    details: Record<string, unknown>
  }>(
    req.params.entityType
      ? `SELECT id, ts, actor, action, entity_type, entity_id, details FROM audit_log WHERE entity_type = $1 ORDER BY id DESC LIMIT $2`
      : `SELECT id, ts, actor, action, entity_type, entity_id, details FROM audit_log ORDER BY id DESC LIMIT $1`,
    req.params.entityType ? [req.params.entityType, limit] : [limit]
  )
  return { ok: true, entries: data }
}
