// Lightweight local embeddings for clustering and similarity.
// Hashed character-trigram + word-unigram vectors (dim 256), L2-normalized.
// Deterministic, no external calls; used for near-duplicate clustering (Normalize)
// and as one weak signal in Link.

const DIM = 256

function hashToken(tok: string, salt: number): number {
  let h = (0x811c9dc5 ^ salt) >>> 0
  for (let i = 0; i < tok.length; i++) {
    h ^= tok.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h % DIM
}

function tokens(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')
  const words = clean.split(/\s+/).filter(Boolean)
  const out: string[] = [...words]
  for (const w of words) {
    if (w.length < 3) continue
    const padded = ` ${w} `
    for (let i = 0; i + 3 <= padded.length; i++) out.push(`#${padded.slice(i, i + 3)}`)
  }
  return out
}

export function embed(text: string): Float64Array {
  const vec = new Float64Array(DIM)
  const toks = tokens(text)
  if (toks.length === 0) return vec
  for (let k = 0; k < toks.length; k++) {
    // word tokens weighted higher than char trigrams
    const weight = toks[k].startsWith('#') ? 1 : 2
    vec[hashToken(toks[k], 1)] += weight
    vec[hashToken(toks[k], 2)] += weight * 0.5
  }
  let norm = 0
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm)
  if (norm > 0) for (let i = 0; i < DIM; i++) vec[i] /= norm
  return vec
}

export function cosine(a: Float64Array, b: Float64Array): number {
  let dot = 0
  for (let i = 0; i < DIM; i++) dot += a[i] * b[i]
  return dot
}

export function similarity(a: string, b: string): number {
  return cosine(embed(a), embed(b))
}

/** Simple union-find for clustering. */
export class UnionFind {
  private parent: number[] = []
  find(i: number): number {
    if (this.parent[i] === undefined) this.parent[i] = i
    while (this.parent[i] !== i) {
      this.parent[i] = this.parent[this.parent[i]]
      i = this.parent[i]
    }
    return i
  }
  union(a: number, b: number): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }
}

/** Detect directed cycles in a graph given an adjacency list. Returns true if a cycle exists. */
export function hasCycle(nodes: string[], adj: Map<string, string[]>): boolean {
  const state = new Map<string, 0 | 1 | 2>()
  for (const n of nodes) state.set(n, 0)
  const visit = (u: string): boolean => {
    const s = state.get(u)
    if (s === 1) return true
    if (s === 2) return false
    state.set(u, 1)
    for (const v of adj.get(u) || []) {
      if (state.has(v) && visit(v)) return true
    }
    state.set(u, 2)
    return false
  }
  for (const n of nodes) {
    if (state.get(n) === 0 && visit(n)) return true
  }
  return false
}
