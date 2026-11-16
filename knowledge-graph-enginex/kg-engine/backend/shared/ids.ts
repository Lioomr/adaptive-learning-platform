// Stable ID generation. IDs are content-derived where possible so that the same
// logical entity keeps the same ID across pipeline re-runs, and IDs are never reused
// for different content.

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193

/** FNV-1a 32-bit hash, returned as 8-char hex. Deterministic across runs. */
export function fnv1a(input: string): string {
  let h = FNV_OFFSET >>> 0
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

/** Two rolling hashes combined into a 16-char hex digest (collision-resistant enough for IDs). */
export function digest(input: string): string {
  let h2 = 0x9dc5811c >>> 0
  for (let i = input.length - 1; i >= 0; i--) {
    h2 ^= input.charCodeAt(i)
    h2 = Math.imul(h2, 0x01930011) >>> 0
  }
  return fnv1a(input) + h2.toString(16).padStart(8, '0')
}

export function segmentId(bundleId: string, fileName: string, page: number, seq: number): string {
  return `seg_${digest(`${bundleId}|${fileName}|${page}|${seq}`)}`
}

/** Topic node IDs are stable per (bundle, canonical name key) so re-runs reuse them. */
export function nodeId(bundleId: string, nameKey: string): string {
  return `node_${digest(`${bundleId}|${nameKey}`)}`
}

/** Edge IDs are stable per (bundle, src, tgt, type). */
export function edgeId(bundleId: string, src: string, tgt: string, type: string): string {
  return `edge_${digest(`${bundleId}|${src}|${tgt}|${type}`)}`
}

export function runId(): string {
  return `run_${Date.now().toString(36)}_${digest(String(Math.random())).slice(0, 8)}`
}

export function candidateId(run: string, kind: string, n: number): string {
  return `cand_${digest(`${run}|${kind}|${n}`)}`
}

export function queueItemId(run: string, refId: string): string {
  return `q_${digest(`${run}|${refId}`)}`
}

export function goldId(nameEn: string): string {
  return `gold_${digest(nameEn.toLowerCase())}`
}

export function versionId(bundleId: string, versionNo: number): string {
  return `gv_${digest(`${bundleId}|v${versionNo}`)}`
}

/** Normalize a topic name into a canonical merge key (lowercase, alnum + arabic letters only). */
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}
