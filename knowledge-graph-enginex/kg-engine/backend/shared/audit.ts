// Audit log helper: every engine action and human decision is recorded here.

export async function audit(args: {
  actor: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}): Promise<void> {
  await retoolDb.insert({
    tableName: 'audit_log',
    changeset: {
      actor: args.actor,
      action: args.action,
      entity_type: args.entityType,
      entity_id: args.entityId,
      details: JSON.stringify(args.details || {}),
    },
  })
}
