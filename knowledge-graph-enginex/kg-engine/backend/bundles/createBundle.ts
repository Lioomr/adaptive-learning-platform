import { audit } from '../shared/audit'
import type { ManifestInput } from '../shared/types'

type Params = { manifest: ManifestInput }

export default async function (req: { params: Params; user: { email?: string; id?: string } }) {
  const m = req.params.manifest
  const errors: string[] = []
  if (!m.bundleId) errors.push('bundleId is required')
  if (!m.courseId) errors.push('courseId is required')
  if (!m.files || m.files.length === 0) errors.push('at least one file is required')
  if (m.role !== 'course_material' && m.role !== 'background_resource') {
    errors.push("role must be 'course_material' or 'background_resource'")
  }
  if (errors.length) return { ok: false, errors }

  const existing = await retoolDb.query(`SELECT id FROM bundles WHERE bundle_id = $1`, [m.bundleId])
  if (existing.data.length > 0) {
    return { ok: false, errors: [`bundleId '${m.bundleId}' already exists — IDs are never reused`] }
  }

  const actor = req.user?.email || req.user?.id || 'system'
  await retoolDb.insert({
    tableName: 'bundles',
    changeset: {
      bundle_id: m.bundleId,
      course_id: m.courseId,
      role: m.role,
      version: m.version || '1',
      instructor_id: m.instructorId || actor,
      status: 'draft',
      is_held_out: !!m.isHeldOut,
      notes: m.notes || null,
    },
  })
  const { data: created } = await retoolDb.query<{ id: number }>(`SELECT id FROM bundles WHERE bundle_id = $1`, [m.bundleId])
  const bundlePk = created[0]?.id
  if (!bundlePk) return { ok: false, errors: ['bundle row could not be read back after insert'] }

  await retoolDb.bulkInsert({
    tableName: 'bundle_files',
    records: m.files.map((f) => ({
      bundle_pk: bundlePk,
      name: f.name,
      file_type: f.fileType,
      language_hint: f.languageHint || 'auto',
      content: f.content || '',
    })),
  })

  await audit({
    actor,
    action: 'bundle_created',
    entityType: 'bundle',
    entityId: m.bundleId,
    details: { course_id: m.courseId, role: m.role, files: m.files.length, held_out: !!m.isHeldOut },
  })

  return { ok: true, bundlePk, bundleId: m.bundleId, files: m.files.length }
}
