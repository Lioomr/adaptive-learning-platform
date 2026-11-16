// jsonb columns may come back from the driver either as parsed objects or as
// JSON strings depending on the query path — parse defensively.

export function parseMaybeJson<T>(v: unknown, fallback: T): T {
  if (v === null || v === undefined) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  return v as T
}
