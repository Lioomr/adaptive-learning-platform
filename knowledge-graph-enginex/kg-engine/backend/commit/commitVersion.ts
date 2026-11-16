import { audit } from '../shared/audit'
import { versionId } from '../shared/ids'
import { stageProvenance, type NodePayload, type EdgePayload } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string; approver?: string; commitReason?: string }

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.params.approver || req.user?.email || req.user?.id || 'system'
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string; status: string }>(
    `SELECT id, bundle_id, status FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  const { data: committable } = await retoolDb.query<{
    id: string
    run_id: string
    kind: string
    status: string
    confidence: number
    payload: string
    provenance: string
  }>(
    `SELECT id, run_id, kind, status, confidence, payload, provenance FROM candidates
     WHERE bundle_pk = $1 AND status IN ('auto_committed', 'approved') ORDER BY created_at`,
    [bundle.id]
  )
  const nodeRowsRaw = committable.filter((c) => c.kind === 'node')
  const edgeRowsRaw = committable.filter((c) => c.kind === 'edge')
  // Several runs may have produced candidates for the same stable id — keep the latest.
  const nodeRows: typeof nodeRowsRaw = []
  const seenNodes = new Set<string>()
  for (const c of [...nodeRowsRaw].reverse()) {
    const key = String((parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload) || { id: c.id }).id)
    if (!seenNodes.has(key)) {
      seenNodes.add(key)
      nodeRows.push(c)
    }
  }
  const edgeRows: typeof edgeRowsRaw = []
  const seenEdges = new Set<string>()
  for (const c of [...edgeRowsRaw].reverse()) {
    const key = String((parseMaybeJson<EdgePayload>(c.payload, null as unknown as EdgePayload) || { id: c.id }).id)
    if (!seenEdges.has(key)) {
      seenEdges.add(key)
      edgeRows.push(c)
    }
  }
  if (nodeRows.length === 0 && edgeRows.length === 0) {
    return { ok: false, error: 'nothing to commit — no auto-committed or human-approved candidates' }
  }

  const { data: prevLive } = await retoolDb.query<{ id: string; version_no: number }>(
    `SELECT id, version_no FROM graph_versions WHERE bundle_pk = $1 AND is_live = true`,
    [bundle.id]
  )
  const { data: maxRow } = await retoolDb.query<{ version_no: number }>(
    `SELECT COALESCE(MAX(version_no), 0) AS version_no FROM graph_versions WHERE bundle_pk = $1`,
    [bundle.id]
  )
  const versionNo = (maxRow[0]?.version_no || 0) + 1
  const gvId = versionId(bundle.bundle_id, versionNo)
  const committedAt = new Date().toISOString()

  const { data: pendingCount } = await retoolDb.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM review_queue WHERE bundle_pk = $1 AND status = 'pending'`,
    [bundle.id]
  )

  const reason = req.params.commitReason || 'pipeline run validated'
  await retoolDb.insert({
    tableName: 'graph_versions',
    changeset: {
      id: gvId,
      bundle_pk: bundle.id,
      version_no: versionNo,
      parent_version_id: prevLive[0]?.id || null,
      approver: actor,
      commit_reason: reason,
      is_live: false,
      metrics: JSON.stringify({ pending_queue_items: Number(pendingCount[0]?.n || '0') }),
    },
  })

  const nodeRecords = nodeRows.map((c) => {
    const p = parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload)
    if (!p) return null
    return {
      id: p.id,
      version_id: gvId,
      node_class: p.node_class,
      name_en: p.name_en,
      name_ar: p.name_ar,
      aliases: JSON.stringify(p.aliases || []),
      definition: p.definition,
      layer_hint: p.layer_hint,
      scope: p.scope,
      source_segment_ids: JSON.stringify(p.source_segment_ids),
      difficulty_tier: p.difficulty_tier,
      confidence: c.confidence,
      review_status: c.status === 'approved' ? 'human_approved' : 'auto_approved',
      provenance: JSON.stringify({ ...parseMaybeJson<Record<string, unknown>>(c.provenance, {}), committed_at: committedAt, version: gvId }),
    }
  }).filter((x): x is NonNullable<typeof x> => !!x)
  const candidateNodeIds = new Set(nodeRecords.map((n) => n.id))

  // Carry forward the previous live snapshot so every version is a complete graph;
  // candidate rows override carried rows when they share a stable node id.
  if (prevLive[0]) {
    const { data: liveNodes } = await retoolDb.query<Record<string, unknown>>(
      `SELECT * FROM nodes WHERE version_id = $1`,
      [prevLive[0].id]
    )
    for (const ln of liveNodes) {
      if (candidateNodeIds.has(String(ln.id))) continue
      nodeRecords.push({ ...serializeJsonbRow(ln), version_id: gvId })
    }
  }
  const nodeIdSet = new Set(nodeRecords.map((n) => n.id))

  const edgeRecords = edgeRows
    .filter((c) => {
      const p = parseMaybeJson<EdgePayload>(c.payload, null as unknown as EdgePayload)
      if (!p) return false
      // only commit edges whose endpoints are part of this version (cross-graph edges keep external targets)
      return nodeIdSet.has(p.source_node_id) && (p.cross_graph || nodeIdSet.has(p.target_node_id))
    })
    .map((c) => {
      const p = parseMaybeJson<EdgePayload>(c.payload, null as unknown as EdgePayload)
      if (!p) return null
      return {
        id: p.id,
        version_id: gvId,
        source_node_id: p.source_node_id,
        target_node_id: p.target_node_id,
        edge_type: p.edge_type,
        evidence: p.evidence,
        confidence: c.confidence,
        review_status: c.status === 'approved' ? 'human_approved' : 'auto_approved',
        provenance: JSON.stringify({ ...parseMaybeJson<Record<string, unknown>>(c.provenance, {}), committed_at: committedAt, version: gvId }),
        cross_graph: p.cross_graph,
        target_version_id: p.target_version_id || null,
      }
    }).filter((x): x is NonNullable<typeof x> => !!x)
  const candidateEdgeIds = new Set(edgeRecords.map((e) => e.id))

  if (prevLive[0]) {
    const { data: liveEdges } = await retoolDb.query<Record<string, unknown>>(
      `SELECT * FROM edges WHERE version_id = $1`,
      [prevLive[0].id]
    )
    for (const le of liveEdges) {
      if (candidateEdgeIds.has(String(le.id))) continue
      edgeRecords.push({ ...serializeJsonbRow(le), version_id: gvId })
    }
  }

  for (let i = 0; i < nodeRecords.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'nodes', records: nodeRecords.slice(i, i + 100) })
  }
  for (let i = 0; i < edgeRecords.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'edges', records: edgeRecords.slice(i, i + 100) })
  }

  await retoolDb.updateBy({
    tableName: 'graph_versions',
    filterBy: [{ key: 'id', operation: '=', value: gvId }],
    changeset: {
      node_count: nodeRecords.length,
      edge_count: edgeRecords.length,
      is_live: true,
    },
  })
  if (prevLive[0]) {
    await retoolDb.updateBy({
      tableName: 'graph_versions',
      filterBy: [{ key: 'id', operation: '=', value: prevLive[0].id }],
      changeset: { is_live: false },
    })
  }

  await retoolDb.query(
    `UPDATE candidates SET status = 'committed' WHERE bundle_pk = $1 AND status IN ('auto_committed', 'approved')`,
    [bundle.id]
  )
  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'committed' },
  })

  const autoIds = nodeRows.filter((c) => c.status === 'auto_committed').map((c) => (parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload)).id).filter(Boolean)
  await audit({
    actor,
    action: 'version_committed',
    entityType: 'graph_version',
    entityId: gvId,
    details: {
      bundle_id: bundle.bundle_id,
      version_no: versionNo,
      parent_version_id: prevLive[0]?.id || null,
      nodes: nodeRecords.length,
      edges: edgeRecords.length,
      auto_approved: autoIds,
      human_approved_count: nodeRows.filter((c) => c.status === 'approved').length + edgeRows.filter((c) => c.status === 'approved').length,
      pending_queue_items: Number(pendingCount[0]?.n || '0'),
    },
  })

  return {
    ok: true,
    versionId: gvId,
    versionNo,
    parentVersionId: prevLive[0]?.id || null,
    nodesCommitted: nodeRecords.length,
    edgesCommitted: edgeRecords.length,
    pendingQueueItems: Number(pendingCount[0]?.n || '0'),
    note: 'A re-run creates a new candidate version; the live version only changes through an explicit commit.',
  }
}

export const _stageProvenance = stageProvenance

/** jsonb columns come back parsed; re-stringify them for insert into a jsonb column. */
function serializeJsonbRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    out[k] = v !== null && typeof v === 'object' ? JSON.stringify(v) : v
  }
  return out
}
