import { audit } from '../shared/audit'
import { embed, cosine } from '../shared/embedding'
import { normalizeForMatch } from '../shared/arabic'
import { queueItemId } from '../shared/ids'
import { classifyTier, getConfig, type CheckResult } from '../shared/policy'
import { ensureRun, markStage, finishRun } from '../shared/runs'
import type { NodePayload, EdgePayload } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string; runId?: string }

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const cfg = await getConfig()
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string; course_id: string }>(
    `SELECT id, bundle_id, course_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  let runId = req.params.runId
  if (!runId) {
    const { data: runRows } = await retoolDb.query<{ run_id: string }>(
      `SELECT run_id FROM candidates WHERE bundle_pk = $1 AND status = 'normalized' ORDER BY created_at DESC LIMIT 1`,
      [bundle.id]
    )
    if (runRows.length === 0) return { ok: false, error: 'no normalized candidates to validate — run the earlier stages first' }
    runId = runRows[0].run_id
  }

  const { data: nodeCands } = await retoolDb.query<{
    id: string
    confidence: number
    agreement: number | null
    payload: string
    provenance: string
  }>(
    `SELECT id, confidence, agreement, payload, provenance FROM candidates
     WHERE bundle_pk = $1 AND run_id = $2 AND kind = 'node' AND status = 'normalized'`,
    [bundle.id, runId]
  )
  const { data: edgeCands } = await retoolDb.query<{
    id: string
    confidence: number
    agreement: number | null
    payload: string
    provenance: string
    check_results: string
  }>(
    `SELECT id, confidence, agreement, payload, provenance, check_results FROM candidates
     WHERE bundle_pk = $1 AND run_id = $2 AND kind = 'edge' AND status = 'pending'`,
    [bundle.id, runId]
  )
  if (nodeCands.length === 0) return { ok: false, error: 'no normalized nodes on this run' }

  // ---------- node checks ----------
  const nodeResults = nodeCands
    .map((c) => {
      const p = parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload)
      if (!p) return null
      const prov = parseMaybeJson<Record<string, unknown>>(c.provenance, {})
    const checks: CheckResult[] = [
      { check: 'has_source_segments', passed: p.source_segment_ids.length > 0, severity: 'hard', detail: p.source_segment_ids.length > 0 ? `${p.source_segment_ids.length} supporting segments` : 'candidate cites no source segment' },
      { check: 'has_provenance', passed: Object.keys(prov).length > 0, severity: 'hard', detail: 'extraction + normalization provenance recorded' },
    ]
    const checksPassed = checks.every((k) => k.passed || k.severity !== 'hard')
    const unreliable = (p.support || []).length === 0 && p.source_segment_ids.length > 0
    const tier = classifyTier({
      confidence: c.confidence,
      agreement: c.agreement,
      hasSourceSegments: p.source_segment_ids.length > 0,
      checksPassed,
      unreliableExtraction: unreliable,
      cfg,
    })
    return { cand: c, payload: p, checks, tier }
  }).filter((x): x is NonNullable<typeof x> => !!x)

  const nodePayloads = nodeResults.map((nr) => nr.payload)
  const nodeById = new Map(nodePayloads.map((p) => [p.id, p]))

  // ---------- edge checks ----------
  const edgeResults = edgeCands
    .map((c) => {
      const p = parseMaybeJson<EdgePayload>(c.payload, null as unknown as EdgePayload)
      if (!p) return null
      const stored = parseMaybeJson<CheckResult[]>(c.check_results, [])
      const prov = parseMaybeJson<Record<string, unknown>>(c.provenance, {})
    const checks: CheckResult[] = [
      ...stored,
      { check: 'endpoints_exist', passed: nodeById.has(p.source_node_id) && nodeById.has(p.target_node_id), severity: 'hard', detail: 'both endpoints are nodes of this run' },
      { check: 'no_self_loop', passed: p.source_node_id !== p.target_node_id, severity: 'hard', detail: 'source != target' },
      { check: 'has_evidence', passed: !!p.evidence && p.evidence.length > 10 && !p.evidence.startsWith('(no justification'), severity: 'soft', detail: p.evidence },
      { check: 'has_provenance', passed: Object.keys(prov).length > 0, severity: 'hard', detail: 'linking provenance recorded' },
    ]
    const checksPassed = checks.every((k) => k.passed || k.severity !== 'hard')
    const tier = classifyTier({
      confidence: c.confidence,
      agreement: null,
      hasSourceSegments: true,
      checksPassed,
      unreliableExtraction: false,
      cfg,
    })
    return { cand: c, payload: p, checks, tier }
  }).filter((x): x is NonNullable<typeof x> => !!x)

  // ---------- global cycle check across accepted edges (re-verified here) ----------
  const adj = new Map<string, string[]>()
  for (const e of edgeResults) {
    if (e.tier === 'block') continue
    const list = adj.get(e.payload.source_node_id) || []
    list.push(e.payload.target_node_id)
    adj.set(e.payload.source_node_id, list)
  }
  const { hasCycle } = await import('../shared/embedding')
  if (hasCycle(nodePayloads.map((p) => p.id), adj)) {
    // demote edges by lowest confidence until acyclic
    const sortedEdges = [...edgeResults].sort((a, b) => a.cand.confidence - b.cand.confidence)
    for (const e of sortedEdges) {
      if (e.tier === 'block') continue
      const list = adj.get(e.payload.source_node_id) || []
      adj.set(e.payload.source_node_id, list.filter((t) => t !== e.payload.target_node_id))
      e.tier = 'queue'
      e.checks.push({ check: 'cycle_revalidation', passed: false, severity: 'soft', detail: 'edge removed to break a cycle — confirm the prerequisite direction' })
      if (!hasCycle(nodePayloads.map((p) => p.id), adj)) break
    }
  }

  // ---------- orphan detection (nodes with no incident edges) ----------
  const incident = new Set<string>()
  for (const e of edgeResults) {
    if (e.tier === 'block') continue
    incident.add(e.payload.source_node_id)
    incident.add(e.payload.target_node_id)
  }

  // ---------- gold-subset measurement + self-demotion ----------
  const { data: goldRows } = await retoolDb.query<{ id: string; name_en: string; name_ar: string | null; aliases: string[] }>(
    `SELECT id, name_en, name_ar, aliases FROM gold_topics WHERE course_id = $1`,
    [bundle.course_id]
  )
  let precision: number | null = null
  let recall: number | null = null
  let goldEvaluated = 0
  let goldCorrect = 0
  let demoted = 0
  const preDemotionAuto = nodeResults.filter((n) => n.tier === 'auto_commit').length + edgeResults.filter((e) => e.tier === 'auto_commit').length
  if (goldRows.length > 0) {
    for (const g of goldRows) {
      const goldNames = [g.name_en, g.name_ar || '', ...((g.aliases as string[]) || [])].filter(Boolean)
      let best: { id: string; sim: number; tier: string } | null = null
      for (const nr of nodeResults) {
        const nodeNames = [nr.payload.name_en, nr.payload.name_ar || '', ...(nr.payload.aliases || [])].filter(Boolean) as string[]
        let sim = 0
        for (const gn of goldNames) {
          for (const nn of nodeNames) {
            if (normalizeForMatch(gn) === normalizeForMatch(nn)) sim = 1
            else sim = Math.max(sim, cosine(embed(gn), embed(nn)))
          }
        }
        if (!best || sim > best.sim) best = { id: nr.payload.id, sim, tier: nr.tier }
      }
      if (best && best.sim >= 0.62) {
        goldEvaluated++
        if (best.tier === 'auto_commit') goldCorrect++
      }
    }
    if (goldEvaluated > 0 && preDemotionAuto > 0) {
      // precision is only meaningful when the engine actually made auto-commit decisions
      precision = goldCorrect / goldEvaluated
      recall = goldEvaluated / goldRows.length
      if (precision < cfg.precision_threshold) {
        // self-demotion: autonomy is bounded by the measured quality gate
        for (const nr of nodeResults) if (nr.tier === 'auto_commit') { nr.tier = 'queue'; demoted++ }
        for (const er of edgeResults) if (er.tier === 'auto_commit') { er.tier = 'queue'; demoted++ }
      }
    }
  }

  // ---------- churn vs current live version ----------
  const { data: liveVersions } = await retoolDb.query<{ id: string; node_count: number; edge_count: number }>(
    `SELECT id, node_count, edge_count FROM graph_versions WHERE bundle_pk = $1 AND is_live = true`,
    [bundle.id]
  )
  let churn: number | null = null
  let churnDetail: Record<string, number> | null = null
  const acceptedIds = nodeResults.filter((n) => n.tier !== 'block').map((n) => n.payload.id)
  if (liveVersions.length > 0) {
    const live = liveVersions[0]
    const { data: liveNodes } = await retoolDb.query<{ id: string }>(`SELECT id FROM nodes WHERE version_id = $1`, [live.id])
    const liveIds = new Set(liveNodes.map((n) => n.id))
    const acceptedSet = new Set(acceptedIds)
    let added = 0
    let removed = 0
    for (const id of acceptedSet) if (!liveIds.has(id)) added++
    for (const id of liveIds) if (!acceptedSet.has(id)) removed++
    const union = new Set([...acceptedSet, ...liveIds]).size
    churn = union > 0 ? (added + removed) / union : 0
    churnDetail = { added, removed, union }
  }

  // ---------- apply statuses + build review queue ----------
  // Pending queue items from earlier runs are superseded by this run's re-extraction.
  await retoolDb.query(
    `UPDATE review_queue SET status = 'superseded' WHERE bundle_pk = $1 AND status = 'pending' AND (run_id IS NULL OR run_id != $2)`,
    [bundle.id, runId]
  )
  const statusUpdates: { id: string; status: string; checks: CheckResult[] }[] = []
  for (const nr of nodeResults) {
    let tier = nr.tier
    if (tier === 'auto_commit' && incident.size > 0 && nodeResults.length > 1 && !incident.has(nr.payload.id)) {
      tier = 'queue'
      nr.checks.push({ check: 'orphan_node', passed: false, severity: 'soft', detail: 'node has no prerequisite links — confirm it is standalone' })
    }
    statusUpdates.push({ id: nr.cand.id, status: tier === 'auto_commit' ? 'auto_committed' : tier === 'block' ? 'blocked' : tier, checks: nr.checks })
  }
  for (const er of edgeResults) {
    statusUpdates.push({ id: er.cand.id, status: er.tier === 'auto_commit' ? 'auto_committed' : er.tier === 'block' ? 'blocked' : er.tier, checks: er.checks })
  }
  for (const u of statusUpdates) {
    await retoolDb.updateBy({
      tableName: 'candidates',
      filterBy: [{ key: 'id', operation: '=', value: u.id }],
      changeset: { status: u.status, check_results: JSON.stringify(u.checks) },
    })
  }

  // review queue items: sorted by uncertainty (confidence ascending)
  const queueRows: Record<string, unknown>[] = []
  const queued = [
    ...nodeResults.filter((n) => statusUpdates.find((u) => u.id === n.cand.id)?.status === 'queue').map((n) => ({ kind: 'node' as const, item: n })),
    ...edgeResults.filter((e) => statusUpdates.find((u) => u.id === e.cand.id)?.status === 'queue').map((e) => ({ kind: 'edge' as const, item: e })),
  ]
  for (const q of queued) {
    const p = q.item.payload
    const isNode = q.kind === 'node'
    const failed = q.item.checks.filter((c) => !c.passed)
    const disagreement = isNode && q.item.cand.agreement !== null && q.item.cand.agreement < 0.5
    let question: string
    if (isNode) {
      const np = p as NodePayload
      question = failed.some((f) => f.check === 'orphan_node')
        ? `The topic "${np.name_en}" has no prerequisite links. Should it link to another topic, or is it standalone?`
        : disagreement
          ? `The two extraction passes disagreed about "${np.name_en}". Is it a real topic in this material?`
          : `Confirm the topic "${np.name_en}" — is the definition "${(p as NodePayload).definition}" accurate and correctly scoped?`
    } else {
      const ep = p as EdgePayload
      const srcName = nodeById.get(ep.source_node_id)?.name_en || ep.source_node_id
      const tgtName = nodeById.get(ep.target_node_id)?.name_en || ep.target_node_id
      question = failed.some((f) => f.check === 'creates_cycle' || f.check === 'cycle_revalidation')
        ? `This edge would create (or complete) a cycle. Should "${srcName}" really depend on "${tgtName}"?`
        : failed.some((f) => f.check === 'out_degree_cap')
          ? `Too many outgoing edges from this topic. Keep the link "${srcName}" → "${tgtName}"?`
          : `Should "${srcName}" depend on "${tgtName}"?`
    }
    const nodeP = p as NodePayload
    const edgeP = p as EdgePayload
    const evidence = isNode
      ? { support: nodeP.support || [], definition: nodeP.definition, agreement: q.item.cand.agreement }
      : { justification: edgeP.evidence, signals: edgeP.signals, segments: edgeP.evidence_segments, names: { source: nodeById.get(edgeP.source_node_id)?.name_en || edgeP.source_node_id, target: nodeById.get(edgeP.target_node_id)?.name_en || edgeP.target_node_id } }
    queueRows.push({
      id: queueItemId(runId, q.item.cand.id),
      run_id: runId,
      bundle_pk: bundle.id,
      item_kind: q.kind,
      ref_id: q.item.cand.id,
      question,
      evidence: JSON.stringify(evidence),
      confidence: q.item.cand.confidence,
      status: 'pending',
    })
  }
  for (let i = 0; i < queueRows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'review_queue', records: queueRows.slice(i, i + 100) })
  }

  // ---------- metrics ----------
  const total = nodeResults.length + edgeResults.length
  const autoCount = statusUpdates.filter((u) => u.status === 'auto_committed').length
  const blockedCount = statusUpdates.filter((u) => u.status === 'blocked').length
  const agreementVals = nodeCands.map((c) => c.agreement).filter((a): a is number => a !== null)
  const agreementRate = agreementVals.length ? agreementVals.reduce((a, b) => a + b, 0) / agreementVals.length : null
  const metrics: Record<string, unknown> = {
    auto_commit_rate: total > 0 ? Number((autoCount / total).toFixed(3)) : 0,
    queue_size: queueRows.length,
    blocked: blockedCount,
    gold_evaluated: goldEvaluated,
    gold_precision: precision === null ? null : Number(precision.toFixed(3)),
    gold_recall: recall === null ? null : Number(recall.toFixed(3)),
    self_demoted: demoted,
    agreement_rate: agreementRate === null ? null : Number(agreementRate.toFixed(3)),
    churn: churn === null ? null : Number(churn.toFixed(3)),
    churn_detail: churnDetail,
    gold_coverage: goldRows.length,
  }
  await markStage(runId, 'validate', metrics)
  await finishRun(runId, 'complete')
  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'validated' },
  })
  await audit({
    actor,
    action: 'validate_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { run_id: runId, ...metrics, ...(demoted > 0 ? { self_demotion: `precision ${precision?.toFixed(2)} < ${cfg.precision_threshold}` } : {}) },
  })

  return { ok: true, runId, ...metrics, reviewQueueCreated: queueRows.length }
}

// ensureRun unused here but validate always operates on an existing run
export const _ensureRun = ensureRun
