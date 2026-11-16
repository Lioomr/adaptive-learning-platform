type Params = { bundleId: string }

export default async function (req: { params: Params }) {
  const { data: bundles } = await retoolDb.query<{ id: number }>(`SELECT id FROM bundles WHERE bundle_id = $1`, [req.params.bundleId])
  if (bundles.length === 0) return { ok: false, error: 'bundle not found' }
  const { data } = await retoolDb.query<{
    id: string
    version_no: number
    committed_at: string
    parent_version_id: string | null
    approver: string
    commit_reason: string
    node_count: number
    edge_count: number
    is_live: boolean
    metrics: Record<string, unknown>
  }>(`SELECT id, version_no, committed_at, parent_version_id, approver, commit_reason, node_count, edge_count, is_live, metrics FROM graph_versions WHERE bundle_pk = $1 ORDER BY version_no DESC`, [bundles[0].id])
  return { ok: true, versions: data }
}
