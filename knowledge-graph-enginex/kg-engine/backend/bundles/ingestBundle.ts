import { audit } from '../shared/audit'
import { detectLanguage, normalizeArabic, type Lang } from '../shared/arabic'
import { segmentId } from '../shared/ids'
import type { Lang as Lang2 } from '../shared/arabic'

type Params = { bundleId: string; force?: boolean }

interface SegOut {
  id: string
  bundle_pk: number
  file_name: string
  page: number
  seq: number
  text: string
  language: string
  seg_type: string
  extraction_confidence: number
  needs_ocr: boolean
  normalized_ar: boolean
}

const MAX_SEG = 1200
const MIN_SEG = 80

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|table|section)>/gi, '\n\n')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function detectSegType(text: string): string {
  if (/```|^\s{4,}(function|def |class |import |const |for\s*\()/m.test(text)) return 'code'
  if (/(\$[^$]+\$)|\\frac|\\int|\\sum|[∀∃∑∫]/.test(text)) return 'equation'
  if (/^\s*\|.+\|\s*$/m.test(text) || /\t.*\t/.test(text)) return 'table'
  if (/^(figure|fig\.|شكل)\s*\d+/im.test(text)) return 'figure'
  return 'prose'
}

function baseConfidence(segType: string, needsOcr: boolean): number {
  if (needsOcr) return 0.4
  switch (segType) {
    case 'code':
      return 0.9
    case 'table':
      return 0.85
    case 'equation':
      return 0.7
    case 'figure':
      return 0.75
    default:
      return 0.95
  }
}

/** Split raw text into pages, honoring form feeds and "Page N"/"Slide N" markers. */
function splitPages(text: string): { page: number; text: string }[] {
  const parts = text.split(/\f/)
  if (parts.length > 1) {
    return parts.map((p, i) => ({ page: i + 1, text: p.trim() })).filter((p) => p.text.length > 0)
  }
  const marker = /\n(?=(?:Page|Slide|صفحة)\s*\d+\b)/g
  const chunks = text.split(marker)
  const pages: { page: number; text: string }[] = []
  let page = 1
  for (const c of chunks) {
    const m = c.match(/^(?:Page|Slide|صفحة)\s*(\d+)/i)
    if (m && m[1]) page = parseInt(m[1], 10)
    if (c.trim()) pages.push({ page, text: c.trim() })
    page++
  }
  return pages.length ? pages : [{ page: 1, text: text.trim() }].filter((p) => p.text)
}

/** Chunk page text into paragraph-sized segments. */
function chunkParagraphs(pageText: string): string[] {
  const paras = pageText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const out: string[] = []
  let buf = ''
  for (const p of paras) {
    if (p.length > MAX_SEG) {
      if (buf) {
        out.push(buf)
        buf = ''
      }
      // split long paragraph on sentence boundaries
      const sentences = p.split(/(?<=[.!?؟۔])\s+/)
      let sbuf = ''
      for (const s of sentences) {
        if ((sbuf + ' ' + s).length > MAX_SEG) {
          if (sbuf) out.push(sbuf)
          sbuf = s
        } else {
          sbuf = sbuf ? sbuf + ' ' + s : s
        }
      }
      if (sbuf) out.push(sbuf)
      continue
    }
    if ((buf + '\n\n' + p).length > MAX_SEG && buf.length >= MIN_SEG) {
      out.push(buf)
      buf = p
    } else {
      buf = buf ? buf + '\n\n' + p : p
    }
  }
  if (buf) out.push(buf)
  return out
}

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'
  const { data: bundleRows } = await retoolDb.query<{ id: number; status: string; bundle_id: string }>(
    `SELECT id, status, bundle_id FROM bundles WHERE bundle_id = $1`,
    [req.params.bundleId]
  )
  if (bundleRows.length === 0) return { ok: false, error: 'bundle not found' }
  const bundle = bundleRows[0]

  const runCount = await retoolDb.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM runs WHERE bundle_pk = $1`,
    [bundle.id]
  )
  const hasRuns = Number(runCount.data[0]?.n || '0') > 0
  if (hasRuns && !req.params.force) {
    return {
      ok: false,
      error:
        'This bundle already has pipeline runs. Re-ingesting would invalidate their provenance. Pass force:true to replace segments (old runs keep dangling references and this is logged).',
    }
  }

  if (req.params.force) {
    await retoolDb.query(`DELETE FROM segments WHERE bundle_pk = $1`, [bundle.id])
  }

  const { data: files } = await retoolDb.query<{
    name: string
    file_type: string
    language_hint: string
    content: string | null
  }>(`SELECT name, file_type, language_hint, content FROM bundle_files WHERE bundle_pk = $1 ORDER BY id`, [
    bundle.id,
  ])

  const segs: SegOut[] = []
  const warnings: string[] = []

  for (const f of files) {
    let content = f.content || ''
    let fetchWarning: string | null = null

    if (f.file_type === 'url') {
      const url = content.trim()
      if (/^https?:\/\//.test(url)) {
        try {
          const ext = await webSearch.extract({ urls: [url] })
          const first = ext.results[0]
          if (first && first.raw_content) {
            content = first.raw_content
          } else {
            const failed = ext.failed_results[0]
            fetchWarning = failed ? failed.error : 'no content extracted'
          }
        } catch (e) {
          fetchWarning = e instanceof Error ? e.message : String(e)
        }
      } else {
        fetchWarning = 'content is not a valid URL'
      }
      if (fetchWarning) warnings.push(`${f.name}: URL fetch failed (${fetchWarning})`)
    }

    if (!content.trim()) {
      // Image-only file: no text could be extracted without OCR. Flag, never guess.
      const pageCount = 1
      for (let p = 1; p <= pageCount; p++) {
        segs.push({
          id: segmentId(bundle.bundle_id, f.name, p, 1),
          bundle_pk: bundle.id,
          file_name: f.name,
          page: p,
          seq: 1,
          text: '[image-only page: no extractable text; OCR required before this segment can support topics]',
          language: f.language_hint === 'auto' ? 'en' : f.language_hint,
          seg_type: 'ocr',
          extraction_confidence: 0.4,
          needs_ocr: true,
          normalized_ar: false,
        })
      }
      warnings.push(`${f.name}: no text content — flagged as image-only, OCR required`)
      continue
    }

    if (f.file_type === 'html') content = stripHtml(content)

    const pages = splitPages(content)
    let seq = 0
    for (const pg of pages) {
      const chunks = chunkParagraphs(pg.text)
      for (const chunk of chunks) {
        seq++
        const lang: Lang2 = f.language_hint !== 'auto' ? (f.language_hint as Lang) : detectLanguage(chunk)
        const needsArabic = lang === 'ar' || lang === 'mixed'
        const finalText = needsArabic ? normalizeArabic(chunk) : chunk
        const segType = detectSegType(finalText)
        segs.push({
          id: segmentId(bundle.bundle_id, f.name, pg.page, seq),
          bundle_pk: bundle.id,
          file_name: f.name,
          page: pg.page,
          seq,
          text: finalText,
          language: lang,
          seg_type: segType,
          extraction_confidence: baseConfidence(segType, false),
          needs_ocr: false,
          normalized_ar: needsArabic && finalText !== chunk,
        })
      }
    }
  }

  // bulk insert in chunks
  for (let i = 0; i < segs.length; i += 100) {
    await retoolDb.bulkInsert({ tableName: 'segments', records: segs.slice(i, i + 100) })
  }

  const langCounts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}
  let lowConf = 0
  for (const s of segs) {
    langCounts[s.language] = (langCounts[s.language] || 0) + 1
    typeCounts[s.seg_type] = (typeCounts[s.seg_type] || 0) + 1
    if (s.extraction_confidence < 0.6) lowConf++
  }

  await retoolDb.updateBy({
    tableName: 'bundles',
    filterBy: [{ key: 'id', operation: '=', value: bundle.id }],
    changeset: { status: 'ingested' },
  })

  await audit({
    actor,
    action: 'ingest_complete',
    entityType: 'bundle',
    entityId: bundle.bundle_id,
    details: { segments: segs.length, low_confidence: lowConf, warnings },
  })

  return {
    ok: true,
    bundleId: bundle.bundle_id,
    segments: segs.length,
    languages: langCounts,
    types: typeCounts,
    lowConfidenceSegments: lowConf,
    warnings,
  }
}
