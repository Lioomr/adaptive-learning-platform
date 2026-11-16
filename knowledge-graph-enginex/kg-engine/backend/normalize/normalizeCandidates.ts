import { audit } from '../shared/audit'
import { embed, cosine, UnionFind, similarity } from '../shared/embedding'
import { candidateId } from '../shared/ids'
import { llmJson, JUDGE_MODEL } from '../shared/llm'
import { ensureRun, markStage, finishRun } from '../shared/runs'
import { stageProvenance, type NodePayload } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string; runId?: string }

const BROAD_PATTERN =
  /^(chapter|unit|module|section|course|introduction to the course|course overview|review of|midterm|final|الفصل|الوحدة|مراجعة|مقدمة في المقرر)/i

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string }>(
    `SELECT id, bundle_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  let runId = req.params.runId
  if (!runId) {
    const { data: runRows } = await retoolDb.query<{ run_id: string }>(
      `SELECT run_id FROM candidates WHERE bundle_pk = $1 AND kind = 'node' AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
      [bundle.id]
    )
    if (runRows.length === 0) return { ok: false, error: 'no pending node candidates to normalize' }
    runId = runRows[0].run_id
  }

  const { data: cands } = await retoolDb.query<{
    id: string
    confidence: number
    agreement: number | null
    payload: string
    provenance: string
  }>(
    `SELECT id, confidence, agreement, payload, provenance FROM candidates
     WHERE bundle_pk = $1 AND run_id = $2 AND kind = 'node' AND status = 'pending' ORDER BY created_at`,
    [bundle.id, runId]
  )
  if (cands.length === 0) return { ok: false, error: 'no pending node candidates on this run' }

  interface Item {
    idx: number
    candId: string
    payload: NodePayload
    confidence: number
    agreement: number | null
    prov: Record<string, unknown>
    emb: Float64Array
  }
  const items: Item[] = cands
    .map((c, idx) => {
      const payload = parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload)
      if (!payload) return null
      const nameText = [payload.name_en, payload.name_ar || '', ...(payload.aliases || [])].join(' ')
      return {
        idx,
        candId: c.id,
        payload,
        confidence: c.confidence,
        agreement: c.agreement,
        prov: parseMaybeJson<Record<string, unknown>>(c.provenance, {}),
        emb: embed(nameText),
      }
    })
    .filter((x): x is Item => !!x)

  const THRESH = 0.8
  const BORDER = 0.35
  const uf = new UnionFind()
  const borderlinePairs: [number, number][] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (!a || !b) continue
      const sim = cosine(a.emb, b.emb)
      if (sim >= THRESH) uf.union(i, j)
      else if (sim >= BORDER) borderlinePairs.push([i, j])
    }
  }

  if (borderlinePairs.length > 0) {
    const capped = borderlinePairs.slice(0, 20)
    const listing = capped
      .map(([i, j], k) => `${k}: "${items[i]?.payload.name_en}" / "${items[i]?.payload.name_ar || '-'}"  vs  "${items[j]?.payload.name_en}" / "${items[j]?.payload.name_ar || '-'}"`)
      .join('\n')
    const res = await llmJson<{ pairs: { index: number; same_topic: boolean }[] }>({
      instruction: `For each numbered pair of topic names below, decide whether both names refer to the SAME educational topic (possibly across Arabic and English). Output JSON: {"pairs":[{"index":0,"same_topic":true}]}\n\n${listing}`,
      systemMessage: 'You are judging whether two topic names refer to the same concept. Be conservative: only say true when a student would treat them as the same topic. Respond with JSON only.',
      model: JUDGE_MODEL,
      temperature: 0,
    })
    for (const p of res?.pairs || []) {
      const pair = capped[p.index]
      if (pair && p.same_topic) uf.union(pair[0], pair[1])
    }
  }

  const clusters = new Map<number, number[]>()
  for (const it of items) {
    const root = uf.find(it.idx)
    const arr = clusters.get(root) || []
    arr.push(it.idx)
    clusters.set(root, arr)
  }

  const outRows: Record<string, unknown>[] = []
  let mergedCount = 0
  let blockedBroad = 0
  let blockedNarrow = 0
  let m = 0

  for (const members of clusters.values()) {
    const group = members.map((i) => items[i]).filter((x): x is Item => !!x)
    const first = group[0]
    if (!first) continue
    const canonical = group.reduce((best, cur) => (cur.confidence > best.confidence ? cur : best), first)

    const aliases = new Set<string>()
    for (const g of group) {
      if (g.candId !== canonical.candId) {
        aliases.add(g.payload.name_en)
        if (g.payload.name_ar) aliases.add(g.payload.name_ar)
      }
      for (const al of g.payload.aliases || []) aliases.add(al)
    }
    aliases.delete(canonical.payload.name_en)
    if (canonical.payload.name_ar) aliases.delete(canonical.payload.name_ar)

    const segIds = new Set<string>()
    const support = new Map<string, { segmentId: string; file: string; page: number; snippet: string }>()
    for (const g of group) {
      for (const s of g.payload.source_segment_ids) segIds.add(s)
      for (const s of g.payload.support || []) support.set(s.segmentId, s)
    }

    const confidences = group.map((g) => g.confidence)
    const mergedConfidence = 0.5 * Math.max(...confidences) + 0.5 * Math.min(...confidences)
    const agreements = group.map((g) => (g.agreement === null ? 0 : g.agreement))
    const mergedAgreement = Math.min(...agreements)

    const checks: { check: string; passed: boolean; severity: string; detail: string }[] = []
    const tooBroad = BROAD_PATTERN.test(canonical.payload.name_en) || segIds.size > 12
    checks.push({
      check: 'granularity_broad',
      passed: !tooBroad,
      severity: 'hard',
      detail: tooBroad ? 'candidate is chapter/unit-level or spreads over too many segments' : 'ok',
    })
    const tooNarrow = segIds.size === 1 && canonical.payload.definition.length < 40
    checks.push({
      check: 'granularity_narrow',
      passed: !tooNarrow,
      severity: 'hard',
      detail: tooNarrow ? 'candidate rests on a single short segment — likely single-sentence detail' : 'ok',
    })
    const blocked = tooBroad || tooNarrow
    if (tooBroad) blockedBroad++
    if (tooNarrow) blockedNarrow++

    const payload: NodePayload = {
      ...canonical.payload,
      aliases: [...aliases],
      source_segment_ids: [...segIds],
      support: [...support.values()],
    }
    const prov = stageProvenance(runId, 'normalize', 'local-clustering+' + JUDGE_MODEL)
    ;(prov as unknown as { extra: Record<string, unknown> }).extra = {
      merged_from: group.map((g) => g.candId),
      extract_models: group.map((g) => String(g.prov.model || '')),
    }

    outRows.push({
      id: candidateId(runId, 'norm', m++),
      run_id: runId,
      bundle_pk: bundle.id,
      kind: 'node',
      status: blocked ? 'blocked' : 'normalized',
      confidence: mergedConfidence,
      agreement: mergedAgreement,
      payload: JSON.stringify(payload),
      provenance: JSON.stringify(prov),
      check_results: JSON.stringify(checks),
    })
    if (group.length > 1) mergedCount++
  }

  await retoolDb.query(
    `UPDATE candidates SET status = 'merged' WHERE bundle_pk = $1 AND run_id = $2 AND kind = 'node' AND status = 'pending'`,
    [bundle.id, runId]
  )

  for (let i = 0; i < outRows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'candidates', records: outRows.slice(i, i + 100) })
  }

  await markStage(runId, 'normalize', {
    input_candidates: items.length,
    output_nodes: outRows.length,
    clusters_merged: mergedCount,
    blocked_too_broad: blockedBroad,
    blocked_too_narrow: blockedNarrow,
  })
  await finishRun(runId, 'complete')
  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'normalized' },
  })
  await audit({
    actor,
    action: 'normalize_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { run_id: runId, nodes: outRows.length, merged: mergedCount },
  })

  return {
    ok: true,
    runId,
    inputCandidates: items.length,
    outputNodes: outRows.length,
    clustersMerged: mergedCount,
    blockedTooBroad: blockedBroad,
    blockedTooNarrow: blockedNarrow,
  }
}
