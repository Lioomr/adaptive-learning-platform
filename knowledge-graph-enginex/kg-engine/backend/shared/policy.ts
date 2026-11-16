// Confidence policy and engine configuration.
// Tiers: auto-commit / queue / block, with thresholds stored in engine_config.

export type Tier = 'auto_commit' | 'queue' | 'block'

export type EngineConfig = {
  auto_commit_threshold: number
  block_threshold: number
  precision_threshold: number
  max_out_edges_per_node: number
}

export async function getConfig(): Promise<EngineConfig> {
  const { data } = await retoolDb.query<{ key: string; value: unknown }>(
    `SELECT key, value FROM engine_config`
  )
  const map = new Map<string, unknown>()
  for (const row of data) map.set(row.key, row.value)
  const num = (k: string, d: number): number => {
    const v = map.get(k)
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : d
  }
  return {
    auto_commit_threshold: num('auto_commit_threshold', 0.8),
    block_threshold: num('block_threshold', 0.5),
    precision_threshold: num('precision_threshold', 0.9),
    max_out_edges_per_node: num('max_out_edges_per_node', 6),
  }
}

/** Classify a candidate into a confidence tier from its score and flags. */
export function classifyTier(args: {
  confidence: number
  agreement: number | null
  hasSourceSegments: boolean
  checksPassed: boolean
  unreliableExtraction: boolean
  cfg: EngineConfig
}): Tier {
  if (!args.hasSourceSegments) return 'block'
  if (!args.checksPassed) return 'block'
  if (args.unreliableExtraction) return 'block'
  // second-pass disagreement always goes to human review, even at low confidence
  const disagreement = args.agreement !== null && args.agreement < 0.5
  if (disagreement) return 'queue'
  if (args.confidence < args.cfg.block_threshold) return 'block'
  if (args.confidence >= args.cfg.auto_commit_threshold && !disagreement) return 'auto_commit'
  return 'queue'
}

export interface CheckResult {
  check: string
  passed: boolean
  severity: 'hard' | 'soft'
  detail: string
}
