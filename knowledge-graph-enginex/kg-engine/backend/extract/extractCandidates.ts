import { audit } from '../shared/audit'
import { similarity } from '../shared/embedding'
import { candidateId, nodeId, nameKey } from '../shared/ids'
import { llmJson, PASS1_MODEL, PASS2_MODEL } from '../shared/llm'
import { ensureRun, markStage, finishRun } from '../shared/runs'
import { stageProvenance, type NodePayload, type SupportRef } from '../shared/types'

type Params = { bundleId: string; batchSize?: number }

interface RawCandidate {
  name_en: string
  name_ar: string | null
  definition: string
  layer_hint: string
  scope_hint: string
  source_segment_ids: string[]
  difficulty_tier: string
  confidence: { name: number; definition: number; grounding: number }
}

const EXTRACTION_SYSTEM =
  'You are a precise topic-extraction engine for an adaptive learning platform. You extract candidate topics ONLY from the provided source text. Never invent topics. Every candidate MUST cite the source segment IDs that support it. Definitions must be one line, grounded in (a quote or close paraphrase of) the provided text. Respond with JSON only, no commentary.'

function buildInstruction(segs: { id: string; text: string; language: string; seg_type: string }[]): string {
  const segText = segs
    .map((s) => `### SEGMENT ${s.id} (lang=${s.language}, type=${s.seg_type})\n${s.text}`)
    .join('\n\n')
  return `Extract candidate topics from the following course segments. Output JSON: {"candidates":[{"name_en": "...", "name_ar": "..." or null, "definition": "one line grounded in the source text", "layer_hint": "prerequisite|core_concept|application|tool|fact", "scope_hint": "core|extended", "source_segment_ids": ["seg_..."], "difficulty_tier": "intro|intermediate|advanced", "confidence": {"name": 0-1, "definition": 0-1, "grounding": 0-1}}]}

Rules:
- Each candidate must cite at least one source_segment_id from the segments below. If no segment supports it, do not output it.
- The definition must be supported by the cited segment text.
- Merge trivial wording variants of the same topic within these segments into one candidate.
- Keep topics at concept granularity, not chapter-level and not single-sentence detail.

${segText}`
}

function meanConf(c: RawCandidate): number {
  const conf = c.confidence as unknown
  if (typeof conf === 'number') return clamp01(conf)
  const vals = [c.confidence?.name ?? 0.5, c.confidence?.definition ?? 0.5, c.confidence?.grounding ?? 0.5]
  return vals.reduce((a, b) => a + b, 0) / 3
}

function meanPayloadConf(p: NodePayload): number {
  const f = p.field_confidence
  return ((f?.name ?? 0.5) + (f?.definition ?? 0.5) + (f?.grounding ?? 0.5)) / 3
}

function sanitize(raw: RawCandidate, validSegIds: Set<string>): NodePayload | null {
  if (!raw || typeof raw.name_en !== 'string' || !raw.name_en.trim()) return null
  const segIds = (raw.source_segment_ids || []).filter((s) => validSegIds.has(s))
  if (segIds.length === 0) return null // cannot cite a source segment -> rejected
  const support: SupportRef[] = []
  return {
    id: '',
    node_class: 'course_topic', // set by caller
    name_en: raw.name_en.trim(),
    name_ar: raw.name_ar && typeof raw.name_ar === 'string' && raw.name_ar.trim() ? raw.name_ar.trim() : null,
    aliases: [],
    definition: typeof raw.definition === 'string' ? raw.definition.trim() : '',
    layer_hint: ['prerequisite', 'core_concept', 'application', 'tool', 'fact'].includes(raw.layer_hint)
      ? raw.layer_hint
      : 'core_concept',
    scope: raw.scope_hint === 'extended' ? 'extended' : 'core',
    source_segment_ids: segIds,
    difficulty_tier: ['intro', 'intermediate', 'advanced'].includes(raw.difficulty_tier)
      ? raw.difficulty_tier
      : 'intermediate',
    field_confidence: normalizeFieldConfidence(raw.confidence),
    support,
  }
}

function clamp01(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return 0.5
  return Math.max(0, Math.min(1, v))
}

function normalizeFieldConfidence(conf: unknown): { name: number; definition: number; grounding: number } {
  if (typeof conf === 'number') {
    const v = clamp01(conf)
    return { name: v, definition: v, grounding: v }
  }
  const o = (conf || {}) as { name?: unknown; definition?: unknown; grounding?: unknown }
  return { name: clamp01(o.name), definition: clamp01(o.definition), grounding: clamp01(o.grounding) }
}

/**
 * Latency note: retrieval is a single SELECT of the bundle's segments (a few ms).
 * Nearly all runtime is LLM generation: two calls per batch (gpt-4.1-mini + gpt-4o-mini,
 * run in parallel via Promise.all, batches sequential). Segment volume is bounded by
 * ingest chunking (~1.2 KB per segment), so there is no retrieval to trim or cache.
 */
export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const { data: bundleRows } = await retoolDb.query<{ id: number; bundle_id: string; role: string; status: string }>(
    `SELECT id, bundle_id, role, status FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]
  if (bundle.status === 'draft') {
    return { ok: false, error: 'bundle not ingested yet — run Ingest first' }
  }

  const { data: segs } = await retoolDb.query<{
    id: string
    text: string
    language: string
    seg_type: string
    needs_ocr: boolean
    file_name: string
    page: number
  }>(`SELECT id, text, language, seg_type, needs_ocr, file_name, page FROM segments WHERE bundle_pk = $1 ORDER BY file_name, seq`, [
    bundle.id,
  ])
  const usable = segs.filter((s) => !s.needs_ocr)
  const ocrBlocked = segs.length - usable.length
  if (usable.length === 0) {
    return { ok: false, error: 'no usable segments — all segments are image-only and require OCR' }
  }

  const run = await ensureRun(bundle.id)
  const batchSize = req.params.batchSize || 10
  const nodeClass = bundle.role === 'course_material' ? 'course_topic' : 'background_topic'
  const validSegIds = new Set(usable.map((s) => s.id))

  let raw1 = 0
  let raw2 = 0
  let rejectedNoSource = 0
  const agreements: number[] = []
  const candRows: Record<string, unknown>[] = []
  let n = 0

  for (let i = 0; i < usable.length; i += batchSize) {
    const batch = usable.slice(i, i + batchSize)
    const instruction = buildInstruction(batch)

    const [p1, p2] = await Promise.all([
      llmJson<{ candidates: RawCandidate[] }>({ instruction, systemMessage: EXTRACTION_SYSTEM, model: PASS1_MODEL, temperature: 0.2 }),
      llmJson<{ candidates: RawCandidate[] }>({ instruction, systemMessage: EXTRACTION_SYSTEM, model: PASS2_MODEL, temperature: 0.6 }),
    ])
    const list1 = (p1?.candidates || []).map((c) => sanitize(c, validSegIds)).filter((c): c is NodePayload => !!c)
    const list2 = (p2?.candidates || []).map((c) => sanitize(c, validSegIds)).filter((c): c is NodePayload => !!c)
    raw1 += p1?.candidates?.length || 0
    raw2 += p2?.candidates?.length || 0
    rejectedNoSource += (p1?.candidates?.length || 0) - list1.length + (p2?.candidates?.length || 0) - list2.length

    // Match pass-2 candidates to pass-1 by normalized-name similarity.
    const used2 = new Set<number>()
    const nameSim = (a: NodePayload, b: NodePayload): number => {
      const aNames = [a.name_en, a.name_ar || '', ...(a.aliases || [])].filter(Boolean) as string[]
      const bNames = [b.name_en, b.name_ar || '', ...(b.aliases || [])].filter(Boolean) as string[]
      let best = 0
      for (const x of aNames) for (const y of bNames) best = Math.max(best, similarity(x, y))
      return best
    }
    for (const c1 of list1) {
      let best: NodePayload | null = null
      let bestSim = 0
      for (let j = 0; j < list2.length; j++) {
        const c2 = list2[j]
        if (used2.has(j) || !c2) continue
        const sim = nameSim(c1, c2)
        if (sim > bestSim) {
          bestSim = sim
          best = c2
        }
      }
      if (best && bestSim >= 0.75) used2.add(list2.indexOf(best))
      agreements.push(bestSim)
      const fieldAvg = (meanPayloadConf(c1) + (best ? meanPayloadConf(best) : meanPayloadConf(c1))) / (best ? 2 : 1)
      // strong agreement (near-identical names) counts as full agreement for confidence
      const agreementSignal = bestSim >= 0.9 ? 1 : bestSim
      const confidence = Math.min(0.99, 0.55 * fieldAvg + 0.45 * agreementSignal)
      const segMap = new Map(batch.map((s) => [s.id, s]))
      const payload: NodePayload = {
        ...c1,
        id: nodeId(bundle.bundle_id, nameKey(c1.name_en)),
        node_class: nodeClass,
        aliases: best && bestSim >= 0.75 ? dedupeNames(c1, best) : [],
        support: c1.source_segment_ids
          .map((id) => {
            const s = segMap.get(id)
            return s ? { segmentId: id, file: s.file_name, page: s.page, snippet: s.text.slice(0, 240) } : null
          })
          .filter((x): x is SupportRef => !!x),
      }
      candRows.push({
        id: candidateId(run, 'node', n++),
        run_id: run,
        bundle_pk: bundle.id,
        kind: 'node',
        status: 'pending',
        confidence,
        agreement: bestSim,
        payload: JSON.stringify(payload),
        provenance: JSON.stringify({
          stage: 'extract',
          model: `${PASS1_MODEL}+${PASS2_MODEL}`,
          run_id: run,
          pass1: PASS1_MODEL,
          pass2: PASS2_MODEL,
          pass2_matched: !!best && bestSim >= 0.75,
        }),
        check_results: JSON.stringify([]),
      })
    }
    // pass-2-only candidates (pass 1 missed them) — low agreement by definition
    for (let j = 0; j < list2.length; j++) {
      const c2 = list2[j]
      if (!c2 || used2.has(j)) continue
      agreements.push(0)
      const confidence = Math.min(0.99, 0.5 * meanPayloadConf(c2) + 0.5 * 0)
      candRows.push({
        id: candidateId(run, 'node', n++),
        run_id: run,
        bundle_pk: bundle.id,
        kind: 'node',
        status: 'pending',
        confidence,
        agreement: 0,
        payload: JSON.stringify({ ...c2, id: nodeId(bundle.bundle_id, nameKey(c2.name_en)), node_class: nodeClass }),
        provenance: JSON.stringify({ stage: 'extract', model: PASS2_MODEL, run_id: run, pass2_only: true }),
        check_results: JSON.stringify([]),
      })
    }
  }

  for (let i = 0; i < candRows.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'candidates', records: candRows.slice(i, i + 100) })
  }

  const agreementRate = agreements.length ? agreements.reduce((a, b) => a + b, 0) / agreements.length : 0
  await markStage(run, 'extract', {
    segments_used: usable.length,
    ocr_segments_excluded: ocrBlocked,
    raw_candidates_pass1: raw1,
    raw_candidates_pass2: raw2,
    rejected_no_source_segment: rejectedNoSource,
    candidates: candRows.length,
    agreement_rate: Number(agreementRate.toFixed(3)),
  })
  await finishRun(run, 'complete')
  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'extracted' },
  })
  await audit({
    actor,
    action: 'extract_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { run_id: run, candidates: candRows.length, agreement_rate: Number(agreementRate.toFixed(3)) },
  })

  return {
    ok: true,
    runId: run,
    candidates: candRows.length,
    agreementRate: Number(agreementRate.toFixed(3)),
    rejectedNoSourceSegment: rejectedNoSource,
    ocrSegmentsExcluded: ocrBlocked,
  }
}

function dedupeNames(a: NodePayload, b: NodePayload): string[] {
  const out = new Set<string>()
  for (const n of [b.name_en, b.name_ar, ...(b.aliases || [])]) {
    if (n && n !== a.name_en && n !== a.name_ar) out.add(n)
  }
  return [...out]
}
