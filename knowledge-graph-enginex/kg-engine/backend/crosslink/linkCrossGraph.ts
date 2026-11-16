import { audit } from '../shared/audit'
import { embed, cosine, hasCycle } from '../shared/embedding'
import { edgeId, candidateId, queueItemId } from '../shared/ids'
import { llmJson, JUDGE_MODEL } from '../shared/llm'
import { ensureRun, markStage, finishRun } from '../shared/runs'
import { getConfig } from '../shared/policy'
import { stageProvenance, type NodePayload, type EdgePayload, type SupportRef } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string }

interface GraphNode {
  nodeId: string
  bundleId: string
  bundleRole: string
  versionId: string
  payload: NodePayload
  emb: Float64Array
}

const MAX_PAIRS = 30

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const cfg = await getConfig()
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string; course_id: string }>(
    `SELECT id, bundle_id, course_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  const { data: myLive } = await retoolDb.query<{ id: string }>(
    `SELECT id FROM graph_versions WHERE bundle_pk = $1 AND is_live = true`,
    [bundle.id]
  )
  if (myLive.length === 0) {
    return { ok: false, error: 'this bundle has no committed (live) version yet — commit its graph first' }
  }
  const myVersionId = myLive[0].id

  const { data: otherLive } = await retoolDb.query<{ id: string; bundle_pk: number; bundle_id: string; role: string }>(
    `SELECT gv.id, gv.bundle_pk, b.bundle_id, b.role
     FROM graph_versions gv JOIN bundles b ON b.id = gv.bundle_pk
     WHERE gv.is_live = true AND gv.bundle_pk != $1`,
    [bundle.id]
  )
  if (otherLive.length === 0) {
    return { ok: false, error: 'no other bundles with live graphs to link against' }
  }

  // load live nodes of this bundle and of the other bundles
  const loadNodes = async (versionIdVal: string, bundleIdVal: string, role: string): Promise<GraphNode[]> => {
    const { data } = await retoolDb.query<{
      id: string
      node_class: string
      name_en: string
      name_ar: string | null
      aliases: string
      definition: string
      source_segment_ids: string
    }>(`SELECT id, node_class, name_en, name_ar, aliases, definition, source_segment_ids FROM nodes WHERE version_id = $1`, [versionIdVal])
    return data.map((r) => {
      const payload: NodePayload = {
        id: r.id,
        node_class: r.node_class as NodePayload['node_class'],
        name_en: r.name_en,
        name_ar: r.name_ar,
        aliases: parseMaybeJson<string[]>(r.aliases, []),
        definition: r.definition,
        layer_hint: '',
        scope: 'core',
        source_segment_ids: parseMaybeJson<string[]>(r.source_segment_ids, []),
        difficulty_tier: '',
        field_confidence: { name: 0, definition: 0, grounding: 0 },
        support: [],
      }
      const emb = embed([r.name_en, r.name_ar || '', r.definition].join(' '))
      return { nodeId: r.id, bundleId: bundleIdVal, bundleRole: role, versionId: versionIdVal, payload, emb }
    })
  }

  const myNodes = await loadNodes(myVersionId, bundle.bundle_id, 'self')
  const otherNodes: GraphNode[] = []
  for (const ov of otherLive) {
    otherNodes.push(...(await loadNodes(ov.id, ov.bundle_id, ov.role)))
  }

  // segment text lookup across both graphs so evidence can quote the real supporting text
  const allBundlePks = [...new Set(otherLive.map((o) => o.bundle_pk).concat([bundle.id]))]
  const segText = new Map<string, string>()
  for (const pk of allBundlePks) {
    const { data: segRows } = await retoolDb.query<{ id: string; text: string }>(
      `SELECT id, LEFT(text, 240) AS text FROM segments WHERE bundle_pk = $1`,
      [pk]
    )
    for (const s of segRows) segText.set(s.id, s.text)
  }

  // candidate pairs by embedding similarity (course→background and background→background across graphs)
  interface Pair { a: GraphNode; b: GraphNode; sim: number }
  const pairs: Pair[] = []
  for (const a of myNodes) {
    for (const b of otherNodes) {
      if (a.bundleId === b.bundleId) continue
      const sim = cosine(a.emb, b.emb)
      if (sim >= 0.55) pairs.push({ a, b, sim })
    }
  }
  pairs.sort((x, y) => y.sim - x.sim)
  const capped = pairs.slice(0, MAX_PAIRS)
  if (capped.length === 0) {
    return { ok: true, runId: null, candidateEdges: 0, note: 'no similar cross-graph topic pairs found above the 0.55 similarity floor' }
  }

  // LLM confirmation with required justification grounded in BOTH graphs
  const listing = capped
    .map((p, k) => `${k}. A(id=${p.a.nodeId}, bundle=${p.a.bundleId}, class=${p.a.payload.node_class}, segments=[${p.a.payload.source_segment_ids.slice(0, 3).join(',')}]) "${p.a.payload.name_en}" — ${p.a.payload.definition}\n   B(id=${p.b.nodeId}, bundle=${p.b.bundleId}, class=${p.b.payload.node_class}, segments=[${p.b.payload.source_segment_ids.slice(0, 3).join(',')}]) "${p.b.payload.name_en}" — ${p.b.payload.definition}`)
    .join('\n')
  const res = await llmJson<{ edges: { a_index: number; direction: 'a_requires_b' | 'b_requires_a'; justification: string; confidence: number }[] }>({
    instruction: `Below are pairs of topics from DIFFERENT course bundles. For each pair where one topic genuinely requires the other as a prerequisite, output an edge. The justification must reference the source segments of the dependent topic (why it needs the prerequisite). Output JSON: {"edges":[{"a_index":0,"direction":"a_requires_b","justification":"...","confidence":0.8}]}\n\n${listing}`,
    systemMessage: 'You judge prerequisite relationships across course graphs. Only output edges the material clearly supports; every edge REQUIRES a one-line justification. Respond with JSON only.',
    model: JUDGE_MODEL,
    temperature: 0,
  })

  const run = await ensureRun(bundle.id, 'cross_link')
  const rows: Record<string, unknown>[] = []
  const queueRows: Record<string, unknown>[] = []
  let eIdx = 0
  let blockedCycle = 0

  // live graph edges for cycle checking
  const { data: liveEdges } = await retoolDb.query<{ source_node_id: string; target_node_id: string }>(
    `SELECT source_node_id, target_node_id FROM edges WHERE version_id = $1`,
    [myVersionId]
  )
  const adj = new Map<string, string[]>()
  for (const le of liveEdges) {
    const list = adj.get(le.source_node_id) || []
    list.push(le.target_node_id)
    adj.set(le.source_node_id, list)
  }

  for (const e of res?.edges || []) {
    const pair = capped[e.a_index]
    if (!pair) continue
    let src = pair.a
    let tgt = pair.b
    if (e.direction === 'b_requires_a') {
      src = pair.b
      tgt = pair.a
    }
    const conf = Math.max(0, Math.min(1, Number(e.confidence) || 0.5))
    const edgeType =
      src.payload.node_class === 'course_topic' && tgt.payload.node_class === 'course_topic'
        ? 'course_course_prereq'
        : src.payload.node_class === 'background_topic' && tgt.payload.node_class === 'background_topic'
          ? 'background_background_prereq'
          : 'course_background_prereq'

    const checks: { check: string; passed: boolean; severity: string; detail: string }[] = []
    const list = adj.get(src.nodeId) || []
    const trial = new Map(adj)
    trial.set(src.nodeId, [...list, tgt.nodeId])
    const allNodes = [...new Set([...myNodes.map((n) => n.nodeId), ...otherNodes.map((n) => n.nodeId)])]
    if (hasCycle(allNodes, trial)) {
      checks.push({ check: 'creates_cycle', passed: false, severity: 'hard', detail: 'cross-graph edge would create a cycle across bundles' })
      blockedCycle++
    } else {
      adj.set(src.nodeId, [...list, tgt.nodeId])
    }
    const justificationOk = typeof e.justification === 'string' && e.justification.trim().length > 10
    if (!justificationOk) {
      checks.push({ check: 'justification_required', passed: false, severity: 'hard', detail: 'cross-graph edges require an evidence statement' })
    }
    // provenance must exist on BOTH sides: source-node segments + target-node segments
    const evidenceSegments: { graph: string; segmentId: string; snippet: string }[] = []
    for (const sid of src.payload.source_segment_ids.slice(0, 2)) {
      evidenceSegments.push({ graph: src.bundleId, segmentId: sid, snippet: segText.get(sid) || `(segment in ${src.bundleId})` })
    }
    for (const sid of tgt.payload.source_segment_ids.slice(0, 2)) {
      evidenceSegments.push({ graph: tgt.bundleId, segmentId: sid, snippet: segText.get(sid) || `(segment in ${tgt.bundleId})` })
    }
    if (evidenceSegments.length < 2) {
      checks.push({ check: 'provenance_both_graphs', passed: false, severity: 'hard', detail: 'cross-graph edges need provenance in both graphs' })
    }

    const payload: EdgePayload = {
      id: edgeId(bundle.bundle_id, src.nodeId, tgt.nodeId, edgeType),
      source_node_id: src.nodeId,
      target_node_id: tgt.nodeId,
      edge_type: edgeType as EdgePayload['edge_type'],
      evidence: justificationOk ? e.justification.trim() : '(missing justification — blocked)',
      signals: { llm: conf, sim: Number(pair.sim.toFixed(3)) },
      cross_graph: true,
      target_bundle_id: tgt.bundleId,
      target_version_id: tgt.versionId,
      evidence_segments: evidenceSegments,
    }

    const hardFail = checks.some((c) => !c.passed && c.severity === 'hard')
    const status = hardFail ? 'blocked' : conf >= cfg.auto_commit_threshold ? 'auto_committed' : 'queue'
    const candIdVal = candidateId(run, 'xedge', eIdx++)
    rows.push({
      id: candIdVal,
      run_id: run,
      bundle_pk: bundle.id,
      kind: 'edge',
      status,
      confidence: conf,
      agreement: null,
      payload: JSON.stringify(payload),
      provenance: JSON.stringify({ ...stageProvenance(run, 'cross_link', JUDGE_MODEL), source_graph: src.bundleId, target_graph: tgt.bundleId, source_version: src.versionId, target_version: tgt.versionId }),
      check_results: JSON.stringify(checks),
    })
    if (status === 'queue') {
      queueRows.push({
        id: queueItemId(run, candIdVal),
        run_id: run,
        bundle_pk: bundle.id,
        item_kind: 'edge',
        ref_id: candIdVal,
        question: `Cross-graph link: should "${src.payload.name_en}" (${src.bundleId}) depend on "${tgt.payload.name_en}" (${tgt.bundleId})?`,
        evidence: JSON.stringify({ justification: payload.evidence, signals: payload.signals, segments: evidenceSegments }),
        confidence: conf,
        status: 'pending',
      })
    }
  }

  for (let i = 0; i < rows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'candidates', records: rows.slice(i, i + 100) })
  }
  for (let i = 0; i < queueRows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'review_queue', records: queueRows.slice(i, i + 100) })
  }

  await markStage(run, 'cross_link', {
    pairs_considered: capped.length,
    candidate_edges: rows.length,
    blocked: rows.filter((r) => r.status === 'blocked').length,
    queued: queueRows.length,
    auto_committed: rows.filter((r) => r.status === 'auto_committed').length,
  })
  await finishRun(run, 'complete')
  await audit({
    actor,
    action: 'cross_link_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { run_id: run, candidates: rows.length, graphs_linked: otherLive.length },
  })

  return {
    ok: true,
    runId: run,
    pairsConsidered: capped.length,
    candidateEdges: rows.length,
    autoCommitted: rows.filter((r) => r.status === 'auto_committed').length,
    queued: queueRows.length,
    blockedCycles: blockedCycle,
    note: 'Cross-graph edge candidates follow the same commit path — run Commit to publish them as a new version.',
  }
}

export const _support = null as unknown as SupportRef
