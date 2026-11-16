export default async function () {
  const { data } = await retoolDb.query<{
    id: number
    bundle_id: string
    course_id: string
    role: string
    version: string
    instructor_id: string
    status: string
    is_held_out: boolean
    created_at: string
    segment_count: string
    live_version: string | null
    live_nodes: number | null
    live_edges: number | null
    pending_queue: string
  }>(`
    SELECT b.id, b.bundle_id, b.course_id, b.role, b.version, b.instructor_id, b.status, b.is_held_out, b.created_at,
      (SELECT COUNT(*)::text FROM segments s WHERE s.bundle_pk = b.id) AS segment_count,
      lv.id AS live_version, lv.node_count AS live_nodes, lv.edge_count AS live_edges,
      (SELECT COUNT(*)::text FROM review_queue q WHERE q.bundle_pk = b.id AND q.status = 'pending') AS pending_queue
    FROM bundles b
    LEFT JOIN graph_versions lv ON lv.bundle_pk = b.id AND lv.is_live = true
    ORDER BY b.created_at DESC
  `)
  return data.map((b) => ({
    ...b,
    segment_count: Number(b.segment_count),
    pending_queue: Number(b.pending_queue),
  }))
}
