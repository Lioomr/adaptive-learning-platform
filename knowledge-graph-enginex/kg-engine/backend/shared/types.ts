// Shared types for the knowledge engine pipeline.

export interface BundleRow {
  id: number
  bundle_id: string
  course_id: string
  role: string
  version: string
  instructor_id: string
  status: string
  is_held_out: boolean
  notes: string | null
}

export interface FileInput {
  name: string
  fileType: 'pdf' | 'pptx' | 'docx' | 'text' | 'html' | 'url'
  languageHint: 'auto' | 'ar' | 'en'
  /** Extracted text content; for URLs the URL itself. Empty for image-only files. */
  content: string
  /** Number of image-only pages that require OCR (no text could be extracted). */
  ocrPages?: number
}

export interface ManifestInput {
  bundleId: string
  courseId: string
  role: 'course_material' | 'background_resource'
  version: string
  instructorId: string
  isHeldOut?: boolean
  notes?: string
  files: FileInput[]
}

export interface SupportRef {
  segmentId: string
  file: string
  page: number
  snippet: string
}

export interface NodePayload {
  id: string
  node_class: 'course_topic' | 'background_topic'
  name_en: string
  name_ar: string | null
  aliases: string[]
  definition: string
  layer_hint: string
  scope: 'core' | 'extended'
  source_segment_ids: string[]
  difficulty_tier: string
  field_confidence: { name: number; definition: number; grounding: number }
  support: SupportRef[]
}

export interface EdgeSignals {
  llm?: number
  cue?: number
  order?: number
  sim?: number
}

export interface EdgePayload {
  id: string
  source_node_id: string
  target_node_id: string
  edge_type: 'course_course_prereq' | 'course_background_prereq' | 'background_background_prereq'
  evidence: string
  signals: EdgeSignals
  cross_graph: boolean
  target_bundle_id?: string
  target_version_id?: string
  evidence_segments: { graph: string; segmentId: string; snippet: string }[]
}

export interface Provenance {
  stage: string
  model: string
  run_id: string
  extra?: Record<string, unknown>
}

export function stageProvenance(runId: string, stage: string, model: string): Provenance {
  return { stage, model, run_id: runId }
}

export function isNodePayload(p: unknown): p is NodePayload {
  const o = p as NodePayload
  return !!o && typeof o.id === 'string' && typeof o.name_en === 'string' && Array.isArray(o.source_segment_ids)
}

export function isEdgePayload(p: unknown): p is EdgePayload {
  const o = p as EdgePayload
  return !!o && typeof o.source_node_id === 'string' && typeof o.target_node_id === 'string'
}
