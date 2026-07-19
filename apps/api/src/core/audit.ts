import { query } from '../db/pool.js';

export interface AuditInput {
  organizationId?: string | null;
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append an audit entry. Failures are logged but never break the request.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (organization_id, actor_id, action, entity, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.organizationId ?? null,
        input.actorId ?? null,
        input.action,
        input.entity ?? null,
        input.entityId ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  } catch (err) {
    console.error('[audit] failed', err);
  }
}
