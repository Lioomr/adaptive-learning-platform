import { audit } from '../shared/audit'
import { goldId } from '../shared/ids'
import { parseMaybeJson } from '../shared/json'

type Params = { action: 'list' | 'add' | 'delete'; courseId?: string; nameEn?: string; nameAr?: string; aliases?: string[] }

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const actor = req.user?.email || req.user?.id || 'system'

  if (req.params.action === 'list' || !req.params.action) {
    const sql = req.params.courseId
      ? `SELECT * FROM gold_topics WHERE course_id = $1 ORDER BY name_en`
      : `SELECT * FROM gold_topics ORDER BY course_id, name_en`
    const { data } = await retoolDb.query<{
      id: string
      course_id: string
      name_en: string
      name_ar: string | null
      aliases: string
      added_by: string
    }>(sql, req.params.courseId ? [req.params.courseId] : [])
    return { ok: true, topics: data.map((t) => ({ ...t, aliases: parseMaybeJson<string[]>(t.aliases, []) })) }
  }

  if (req.params.action === 'add') {
    if (!req.params.courseId || !req.params.nameEn) {
      return { ok: false, error: 'courseId and nameEn are required to add a gold topic' }
    }
    const id = goldId(`${req.params.courseId}|${req.params.nameEn}`)
    await retoolDb.query(
      `INSERT INTO gold_topics (id, course_id, name_en, name_ar, aliases, added_by) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name_ar = EXCLUDED.name_ar, aliases = EXCLUDED.aliases, added_by = EXCLUDED.added_by`,
      [id, req.params.courseId, req.params.nameEn, req.params.nameAr || null, JSON.stringify(req.params.aliases || []), actor]
    )
    await audit({ actor, action: 'gold_topic_added', entityType: 'gold_topic', entityId: id, details: { course_id: req.params.courseId, name_en: req.params.nameEn } })
    return { ok: true, id }
  }

  if (req.params.action === 'delete') {
    if (!req.params.nameEn) return { ok: false, error: 'nameEn is required to delete a gold topic' }
    const id = goldId(`${req.params.courseId || ''}|${req.params.nameEn}`)
    await retoolDb.query(`DELETE FROM gold_topics WHERE id = $1`, [id])
    await audit({ actor, action: 'gold_topic_deleted', entityType: 'gold_topic', entityId: id, details: { name_en: req.params.nameEn } })
    return { ok: true }
  }

  return { ok: false, error: 'unknown action' }
}
