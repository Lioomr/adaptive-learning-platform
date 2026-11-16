// Shared frontend types mirroring the backend function returns.

export interface BundleListItem {
  id: number
  bundle_id: string
  course_id: string
  role: string
  version: string
  instructor_id: string
  status: string
  is_held_out: boolean
  created_at: string
  segment_count: number
  live_version: string | null
  live_nodes: number | null
  live_edges: number | null
  pending_queue: number
}

export interface BundleRecord {
  id: number
  bundle_id: string
  course_id: string
  role: string
  version: string
  instructor_id: string
  status: string
  is_held_out: boolean
  notes: string | null
  created_at: string
}

export interface BundleFile {
  id: number
  name: string
  file_type: string
  language_hint: string
  content_length: string | null
}

export interface SegmentStat {
  language: string
  seg_type: string
  needs_ocr: boolean
  n: string
  avg_conf: string
}

export interface SampleSegment {
  id: string
  file_name: string
  page: number
  language: string
  seg_type: string
  extraction_confidence: number
  needs_ocr: boolean
  text: string
}

export interface RunRecord {
  id: string
  started_at: string
  finished_at: string | null
  stages_done: string[]
  status: string
  metrics: Record<string, unknown>
  error: string | null
}

export interface CandidateStat {
  kind: string
  status: string
  n: number
  avg_conf: string
}

export interface BundleDetail {
  ok: boolean
  error?: string
  bundle: BundleRecord
  files: BundleFile[]
  segmentStats: SegmentStat[]
  sampleSegments: SampleSegment[]
  runs: RunRecord[]
  candidateStats: CandidateStat[]
  pendingQueue: number
}

export interface SourceSegmentRef {
  id: string
  file: string
  page: number
  snippet: string
}

export interface GraphNode {
  id: string
  node_class: string
  name_en: string
  name_ar: string | null
  aliases: string[]
  definition: string
  layer_hint: string | null
  scope: string
  source_segment_ids: string[]
  difficulty_tier: string | null
  confidence: number
  review_status: string
  provenance: Record<string, unknown>
  source_segments: SourceSegmentRef[]
}

export interface GraphEdge {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: string
  evidence: string
  confidence: number
  review_status: string
  provenance: Record<string, unknown>
  cross_graph: boolean
  target_version_id: string | null
}

export interface GraphVersion {
  id: string
  version_no: number
  committed_at: string
  parent_version_id: string | null
  approver: string
  commit_reason: string
  node_count: number
  edge_count: number
  is_live: boolean
  metrics?: Record<string, unknown>
}

export interface GraphData {
  ok: boolean
  error?: string
  version: GraphVersion
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface QueueItem {
  id: string
  runId: string | null
  bundleId: string
  kind: 'node' | 'edge'
  question: string
  confidence: number
  status: string
  decidedBy: string | null
  decidedAt: string | null
  answer: string | null
  candidateStatus: string | null
  evidence: {
    support?: { segmentId: string; file: string; page: number; snippet: string }[]
    definition?: string
    agreement?: number
    justification?: string
    signals?: Record<string, number>
    segments?: { graph: string; segmentId: string; snippet: string }[]
    names?: { source: string; target: string }
  }
  summary: Record<string, unknown>
}

export interface EngineConfig {
  auto_commit_threshold: number
  block_threshold: number
  precision_threshold: number
  max_out_edges_per_node: number
}

export interface RunReport {
  ok: boolean
  config: EngineConfig
  engineReport: {
    auto_commit_rate_avg: number | null
    agreement_rate_avg: number | null
    gold_precision_avg: number | null
    gold_recall_avg: number | null
    churn_avg: number | null
    queue: Record<string, number>
    gold_subsets: { course_id: string; topics: number }[]
    runs_measured: number
  }
  runs: (RunRecord & { bundle_id: string; heldOut: boolean; course_id: string; validateMetrics: Record<string, unknown> | null })[]
}

export interface VersionRow extends GraphVersion {
  metrics: Record<string, unknown>
}

export interface AuditEntry {
  id: number
  ts: string
  actor: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
}

export interface GoldTopic {
  id: string
  course_id: string
  name_en: string
  name_ar: string | null
  aliases: string[]
  added_by: string
}
