// Run lifecycle helpers: one pipeline run per bundle execution, tracking stages and metrics.

export async function ensureRun(bundlePk: number, kind = 'pipeline'): Promise<string> {
  const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  await retoolDb.insert({
    tableName: 'runs',
    changeset: { id, bundle_pk: bundlePk, status: 'running', stages_done: JSON.stringify([]), metrics: JSON.stringify({ kind }) },
  })
  return id
}

export async function markStage(runId: string, stage: string, metrics: Record<string, unknown>): Promise<void> {
  const { data } = await retoolDb.query<{ stages_done: string[]; metrics: Record<string, unknown> }>(
    `SELECT stages_done, metrics FROM runs WHERE id = $1`,
    [runId]
  )
  const row = data[0]
  const stages = Array.isArray(row?.stages_done) ? row.stages_done : []
  if (!stages.includes(stage)) stages.push(stage)
  const merged = { ...(row?.metrics || {}), ...metrics }
  await retoolDb.updateBy({
    tableName: 'runs',
    filterBy: [{ key: 'id', operation: '=', value: runId }],
    changeset: { stages_done: JSON.stringify(stages), metrics: JSON.stringify(merged) },
  })
}

export async function finishRun(runId: string, status: string, error?: string): Promise<void> {
  const changeset: Record<string, unknown> = {
    status,
    finished_at: new Date().toISOString(),
  }
  if (error) changeset.error = error
  await retoolDb.updateBy({
    tableName: 'runs',
    filterBy: [{ key: 'id', operation: '=', value: runId }],
    changeset,
  })
}
