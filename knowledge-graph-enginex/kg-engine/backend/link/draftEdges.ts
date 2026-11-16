import { audit } from '../shared/audit'
import { embed, cosine, hasCycle } from '../shared/embedding'
import { edgeId, candidateId } from '../shared/ids'
import { llmJson, JUDGE_MODEL } from '../shared/llm'
import { ensureRun, markStage, finishRun } from '../shared/runs'
import { getConfig } from '../shared/policy'
import { stageProvenance, type NodePayload, type EdgePayload } from '../shared/types'
import { parseMaybeJson } from '../shared/json'

type Params = { bundleId: string; runId?: string }

const CUES_EN = ['recall that', 'builds on', 'as covered in', 'prerequisite', 'assumes', 'you learned', 'previously', 'relies on', 'as we saw']
const CUES_AR = ['تذكير', 'كما درسنا', 'يعتمد على', 'يبنى على', 'افترضنا', 'سبق أن', 'بافتراض']

interface NodeItem {
  candId: string
  payload: NodePayload
  confidence: number
  agreement: number | null
  emb: Float64Array
  earliest: { file: string; page: number; seq: number }
}

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const cfg = await getConfig()
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string }>(
    `SELECT id, bundle_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  let runId = req.params.runId
  if (!runId) {
    const { data: runRows } = await retoolDb.query<{ run_id: string }>(
      `SELECT run_id FROM candidates WHERE bundle_pk = $1 AND kind = 'node' AND status = 'normalized' ORDER BY created_at DESC LIMIT 1`,
      [bundle.id]
    )
    if (runRows.length === 0) return { ok: false, error: 'no normalized node candidates — run Extract + Normalize first' }
    runId = runRows[0].run_id
  }

  const { data: nodeCands } = await retoolDb.query<{
    id: string
    confidence: number
    agreement: number | null
    payload: string
  }>(
    `SELECT id, confidence, agreement, payload FROM candidates
     WHERE bundle_pk = $1 AND run_id = $2 AND kind = 'node' AND status = 'normalized' ORDER BY created_at`,
    [bundle.id, runId]
  )
  if (nodeCands.length === 0) return { ok: false, error: 'no normalized node candidates on this run' }

  // segment lookup for ordering + cue-phrase scan
  const { data: segRows } = await retoolDb.query<{ id: string; file_name: string; page: number; seq: number; text: string }>(
    `SELECT id, file_name, page, seq, text FROM segments WHERE bundle_pk = $1`,
    [bundle.id]
  )
  const segMap = new Map(segRows.map((s) => [s.id, s]))

  const nodes: NodeItem[] = nodeCands
    .map((c) => {
      const payload = parseMaybeJson<NodePayload>(c.payload, null as unknown as NodePayload)
      if (!payload) return null
    let earliest = { file: 'zzzz', page: 999999, seq: 999999 }
    for (const sid of payload.source_segment_ids) {
      const s = segMap.get(sid)
      if (s) {
        const key = { file: s.file_name, page: s.page, seq: s.seq }
        if (key.file < earliest.file || (key.file === earliest.file && (key.page < earliest.page || (key.page === earliest.page && key.seq < earliest.seq)))) {
          earliest = key
        }
      }
    }
    const defText = [payload.name_en, payload.name_ar || '', payload.definition].join(' ')
    return { candId: c.id, payload, confidence: c.confidence, agreement: c.agreement, emb: embed(defText), earliest }
    })
    .filter((x): x is NodeItem => !!x)

  // --- Signal 1: LLM judgment with required justification (chunked) ---
  interface LlmEdge { source: string; target: string; justification: string; confidence: number }
  const llmEdges: LlmEdge[] = []
  const CHUNK = 25
  for (let i = 0; i < nodes.length; i += CHUNK) {
    const chunk = nodes.slice(i, i + CHUNK)
    const listing = chunk
      .map((n, k) => {
        const pos = nodes.findIndex((x) => x.candId === n.candId)
        return `${k}. id=${n.payload.id} | ${n.payload.name_en}${n.payload.name_ar ? ' / ' + n.payload.name_ar : ''} | order=${pos} | ${n.payload.definition}`
      })
      .join('\n')
    const res = await llmJson<{ edges: LlmEdge[] }>({
      instruction: `Below are topics extracted from course material, in source order. For each pair where topic A requires understanding topic B first (A has B as a prerequisite), output an edge with source=A, target=B, a one-line justification that quotes or closely paraphrases the supporting text, and your confidence (0-1). Only output edges the material actually supports. Output JSON: {"edges":[{"source":"node_...","target":"node_...","justification":"...","confidence":0.8}]}\n\n${listing}`,
      systemMessage: 'You map prerequisite relationships between topics. Every edge REQUIRES a one-line justification grounded in the material. Do not invent relationships. Respond with JSON only.',
      model: JUDGE_MODEL,
      temperature: 0.1,
    })
    for (const e of res?.edges || []) {
      if (e && typeof e.source === 'string' && typeof e.target === 'string' && e.source !== e.target) {
        llmEdges.push(e)
      }
    }
  }
  const idToItem = new Map(nodes.map((n) => [n.payload.id, n]))
  // The judge model may echo topic names instead of the exact node ids — resolve either way.
  const resolveRef = (ref: string): NodeItem | null => {
    const byId = idToItem.get(ref)
    if (byId) return byId
    const target = ref.toLowerCase().trim()
    let best: NodeItem | null = null
    let bestSim = 0
    for (const n of nodes) {
      const names = [n.payload.name_en, n.payload.name_ar || '', ...(n.payload.aliases || [])]
      for (const nm of names) {
        const lower = nm.toLowerCase()
        if (lower === target) return n
        const sim = similarity(lower, target)
        if (sim > bestSim) {
          bestSim = sim
          best = n
        }
      }
    }
    return bestSim >= 0.6 ? best : null
  }

  // --- Combine signals into candidate edges ---
  interface DraftEdge {
    src: string
    tgt: string
    score: number
    signals: { llm?: number; cue?: number; order?: number; sim?: number }
    justification: string
  }
  const drafts = new Map<string, DraftEdge>()
  const addDraft = (src: string, tgt: string, patch: Partial<DraftEdge>) => {
    if (src === tgt) return
    const key = `${src}->${tgt}`
    const existing = drafts.get(key)
    if (existing) {
      Object.assign(existing.signals, patch.signals || {})
      if (patch.justification && !existing.justification) existing.justification = patch.justification
      existing.score = combine(existing.signals)
      return
    }
    const signals = { ...(patch.signals || {}) }
    drafts.set(key, { src, tgt, score: combine(signals), signals, justification: patch.justification || '' })
  }
  const combine = (s: { llm?: number; cue?: number; order?: number; sim?: number }): number => {
    const llm = s.llm
    if (llm !== undefined) {
      // LLM judgment with justification is the primary signal; weak signals nudge it.
      return Math.max(0, Math.min(1, llm + 0.1 * (s.cue ?? 0) + 0.05 * (s.order ?? 0)))
    }
    // weak signals alone: cue-phrase evidence can reach the queue band, bare order/sim cannot
    const cap = (s.cue ?? 0) > 0 ? 0.6 : 0.45
    return Math.min(cap, 0.25 * (s.cue ?? 0) + 0.2 * (s.order ?? 0) + 0.15 * (s.sim ?? 0))
  }

  for (const e of llmEdges) {
    const s = resolveRef(e.source)
    const t = resolveRef(e.target)
    if (!s || !t) continue
    // normalize mixed-class direction: course topic is always the dependent (source)
    let src = e.source
    let tgt = e.target
    let just = e.justification || ''
    let conf = Math.max(0, Math.min(1, Number(e.confidence) || 0.5))
    if (s.payload.node_class !== t.payload.node_class) {
      if (s.payload.node_class === 'background_topic') {
        ;[src, tgt] = [tgt, src]
        just = just ? `[direction normalized to course→background] ${just}` : 'course topic depends on background topic'
        conf *= 0.9
      }
    }
    addDraft(src, tgt, { signals: { llm: conf }, justification: just })
  }

  // cue phrases + order + definition similarity
  for (const a of nodes) {
    for (const b of nodes) {
      if (a.payload.id === b.payload.id) continue
      // cue: B's supporting segments mention A's name near a cue phrase
      let cue = 0
      for (const sid of b.payload.source_segment_ids) {
        const seg = segMap.get(sid)
        if (!seg) continue
        const names = [a.payload.name_en, a.payload.name_ar, ...(a.payload.aliases || [])].filter(Boolean) as string[]
        for (const name of names) {
          const idx = seg.text.toLowerCase().indexOf(name.toLowerCase())
          if (idx === -1) continue
          const window = seg.text.slice(Math.max(0, idx - 60), idx + name.length + 60).toLowerCase()
          if (CUES_EN.some((c) => window.includes(c)) || CUES_AR.some((c) => window.includes(c))) {
            cue = Math.max(cue, 0.8)
          }
        }
      }
      if (cue > 0) addDraft(a.payload.id, b.payload.id, { signals: { cue } })

      // order: A appears strictly before B in source order
      const before =
        a.earliest.file < b.earliest.file ||
        (a.earliest.file === b.earliest.file &&
          (a.earliest.page < b.earliest.page ||
            (a.earliest.page === b.earliest.page && a.earliest.seq < b.earliest.seq)))
      const sim = cosine(a.emb, b.emb)
      if (before && sim > 0.3) {
        addDraft(a.payload.id, b.payload.id, { signals: { order: 0.5, sim } })
      }
    }
  }

  // --- Cycle prevention (greedy by score) + out-degree cap ---
  const sorted = [...drafts.values()].sort((x, y) => y.score - x.score)
  const adj = new Map<string, string[]>()
  const nodeIds = nodes.map((n) => n.payload.id)
  const outCount = new Map<string, number>()
  const rows: Record<string, unknown>[] = []
  let blockedCycle = 0
  let cappedEdges = 0
  let eIdx = 0

  for (const d of sorted) {
    const srcItem = resolveRef(d.src)
    const tgtItem = resolveRef(d.tgt)
    if (!srcItem || !tgtItem) continue
    const edgeType =
      srcItem.payload.node_class === 'course_topic' && tgtItem.payload.node_class === 'course_topic'
        ? 'course_course_prereq'
        : srcItem.payload.node_class === 'background_topic' && tgtItem.payload.node_class === 'background_topic'
          ? 'background_background_prereq'
          : 'course_background_prereq'

    const checks: { check: string; passed: boolean; severity: string; detail: string }[] = []
    const list = adj.get(d.src) || []
    const trial = new Map(adj)
    trial.set(d.src, [...list, d.tgt])
    if (hasCycle(nodeIds, trial)) {
      checks.push({ check: 'creates_cycle', passed: false, severity: 'hard', detail: 'adding this edge would create a prerequisite cycle' })
      blockedCycle++
    } else {
      adj.set(d.src, [...list, d.tgt])
    }
    const out = (outCount.get(d.src) || 0) + 1
    outCount.set(d.src, out)
    if (out > cfg.max_out_edges_per_node) {
      checks.push({ check: 'out_degree_cap', passed: false, severity: 'soft', detail: `node exceeds ${cfg.max_out_edges_per_node} outgoing edges — models tend to over-connect` })
      cappedEdges++
    }
    if (!d.justification.trim()) {
      checks.push({ check: 'justification_required', passed: false, severity: 'soft', detail: 'no one-line evidence statement provided' })
    }

    const evidenceSegments: { graph: string; segmentId: string; snippet: string }[] = []
    for (const sid of tgtItem.payload.source_segment_ids.slice(0, 2)) {
      const seg = segMap.get(sid)
      if (seg) evidenceSegments.push({ graph: bundle.bundle_id, segmentId: sid, snippet: seg.text.slice(0, 240) })
    }

    const payload: EdgePayload = {
      id: edgeId(bundle.bundle_id, d.src, d.tgt, edgeType),
      source_node_id: d.src,
      target_node_id: d.tgt,
      edge_type: edgeType as EdgePayload['edge_type'],
      evidence: d.justification.trim() || '(no justification — needs review)',
      signals: d.signals,
      cross_graph: false,
      evidence_segments: evidenceSegments,
    }

    rows.push({
      id: candidateId(runId, 'edge', eIdx++),
      run_id: runId,
      bundle_pk: bundle.id,
      kind: 'edge',
      status: 'pending',
      confidence: d.score,
      agreement: null,
      payload: JSON.stringify(payload),
      provenance: JSON.stringify(stageProvenance(runId, 'link', JUDGE_MODEL)),
      check_results: JSON.stringify(checks),
    })
  }

  for (let i = 0; i < rows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'candidates', records: rows.slice(i, i + 100) })
  }

  await markStage(runId, 'link', {
    llm_edges: llmEdges.length,
    candidate_edges: rows.length,
    blocked_cycles: blockedCycle,
    over_cap_edges: cappedEdges,
  })
  await finishRun(runId, 'complete')
  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'linked' },
  })
  await audit({
    actor,
    action: 'link_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { run_id: runId, edges: rows.length },
  })

  return {
    ok: true,
    runId,
    candidateEdges: rows.length,
    blockedCycles: blockedCycle,
    overCapEdges: cappedEdges,
  }
}
