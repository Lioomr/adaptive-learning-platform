import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string; versionId?: string }

export default async function (req: { params: Params }) {
  const { data: bundles } = await retoolDb.query<{ id: number; bundle_id: string }>(
    `SELECT id, bundle_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundles.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundles[0]

  let version: { id: string; version_no: number; committed_at: string; parent_version_id: string | null; approver: string; commit_reason: string; node_count: number; edge_count: number; is_live: boolean }
  if (req.params.versionId) {
    const { data } = await retoolDb.query<typeof version>(`SELECT id, version_no, committed_at, parent_version_id, approver, commit_reason, node_count, edge_count, is_live FROM graph_versions WHERE id = $1 AND bundle_pk = $2`, [req.params.versionId, bundle.id])
    if (data.length === 0) return { ok: false, error: 'version not found' }
    version = data[0]
  } else {
    const { data } = await retoolDb.query<typeof version>(`SELECT id, version_no, committed_at, parent_version_id, approver, commit_reason, node_count, edge_count, is_live FROM graph_versions WHERE bundle_pk = $1 AND is_live = true`, [bundle.id])
    if (data.length === 0) return { ok: false, error: 'no committed (live) version for this bundle yet' }
    version = data[0]
  }

  const { data: nodes } = await retoolDb.query<{
    id: string
    node_class: string
    name_en: string
    name_ar: string | null
    aliases: string
    definition: string
    layer_hint: string
    scope: string
    source_segment_ids: string
    difficulty_tier: string
    confidence: number
    review_status: string
    provenance: string
  }>(`SELECT * FROM nodes WHERE version_id = $1 ORDER BY name_en`, [version.id])

  const { data: edges } = await retoolDb.query<{
    id: string
    source_node_id: string
    target_node_id: string
    edge_type: string
    evidence: string
    confidence: number
    review_status: string
    provenance: string
    cross_graph: boolean
    target_version_id: string | null
  }>(`SELECT * FROM edges WHERE version_id = $1 ORDER BY edge_type, source_node_id`, [version.id])

  // segment text lookup so the UI can show the exact supporting text for any node
  const { data: segs } = await retoolDb.query<{ id: string; file_name: string; page: number; text: string }>(
    `SELECT id, file_name, page, LEFT(text, 400) AS text FROM segments WHERE bundle_pk = $1`,
    [bundle.id]
  )
  const segMap = new Map(segs.map((s) => [s.id, s]))

  const parsedNodes = nodes.map((n) => {
    const segIds = parseMaybeJson<string[]>(n.source_segment_ids, [])
    return {
      ...n,
      aliases: parseMaybeJson<string[]>(n.aliases, []),
      provenance: parseMaybeJson<Record<string, unknown>>(n.provenance, {}),
      source_segments: segIds
        .map((id) => {
          const s = segMap.get(id)
          return s ? { id, file: s.file_name, page: s.page, snippet: s.text } : { id, file: '(unavailable)', page: 0, snippet: '(segment no longer present)' }
        })
    }
  })

  return {
    ok: true,
    version,
    nodes: parsedNodes,
    edges: edges.map((e) => ({ ...e, provenance: parseMaybeJson<Record<string, unknown>>(e.provenance, {}) })),
  }
}
