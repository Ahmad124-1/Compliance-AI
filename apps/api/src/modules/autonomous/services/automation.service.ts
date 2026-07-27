import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import type { AutomationRule, WorkflowDefinition, WorkflowCategory } from '../types.js';

interface AutomationRuleRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_conditions: Record<string, unknown>;
  actions: Record<string, unknown>[];
  is_active: boolean;
  requires_approval: boolean;
  approval_roles: string[];
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowDefinitionRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string;
  steps: Record<string, unknown>[];
  variables: Record<string, unknown>;
  is_active: boolean;
  is_system: boolean;
  version: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

function mapAutomationRule(row: AutomationRuleRow): AutomationRule {
  return {
    id: row.id, organizationId: row.organization_id, name: row.name, description: row.description ?? undefined,
    triggerType: row.trigger_type, triggerConditions: row.trigger_conditions ?? {}, actions: row.actions ?? [],
    isActive: row.is_active, requiresApproval: row.requires_approval, approvalRoles: row.approval_roles ?? [],
    metadata: row.metadata ?? {}, createdBy: row.created_by ?? undefined, updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapWorkflowDefinition(row: WorkflowDefinitionRow): WorkflowDefinition {
  return {
    id: row.id, organizationId: row.organization_id, name: row.name, description: row.description ?? undefined,
    category: row.category as WorkflowCategory, steps: row.steps ?? [], variables: row.variables ?? {},
    isActive: row.is_active, isSystem: row.is_system, version: row.version,
    metadata: row.metadata ?? {}, createdBy: row.created_by ?? undefined, updatedBy: row.updated_by ?? undefined,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export const automationService = {
  async createAutomationRule(input: {
    organizationId: string;
    name: string;
    description?: string;
    triggerType: string;
    triggerConditions: Record<string, unknown>;
    actions: Record<string, unknown>[];
    requiresApproval?: boolean;
    approvalRoles?: string[];
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<AutomationRule> {
    const id = randomUUID();
    const { rows } = await query<AutomationRuleRow>(
      `INSERT INTO automation_rules (id, organization_id, name, description, trigger_type, trigger_conditions, actions, requires_approval, approval_roles, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now()) RETURNING *`,
      [id, input.organizationId, input.name, input.description ?? null, input.triggerType, JSON.stringify(input.triggerConditions), JSON.stringify(input.actions), input.requiresApproval ?? true, JSON.stringify(input.approvalRoles ?? []), JSON.stringify(input.metadata ?? {}), input.createdBy ?? null, input.createdBy ?? null],
    );
    await audit({ organizationId: input.organizationId, actorId: input.createdBy ?? null, action: 'automation.rule.create', entity: 'automation_rule', entityId: id, metadata: { name: input.name, triggerType: input.triggerType } });
    return mapAutomationRule(rows[0]);
  },

  async listAutomationRules(organizationId: string, filters: { triggerType?: string; isActive?: boolean } = {}): Promise<AutomationRule[]> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.triggerType) { conditions.push(`trigger_type = $${i++}`); params.push(filters.triggerType); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query<AutomationRuleRow>(`SELECT * FROM automation_rules ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapAutomationRule);
  },

  async getAutomationRule(id: string): Promise<AutomationRule | null> {
    const { rows } = await query<AutomationRuleRow>(`SELECT * FROM automation_rules WHERE id = $1`, [id]);
    return rows[0] ? mapAutomationRule(rows[0]) : null;
  },

  async updateAutomationRule(id: string, input: {
    organizationId: string;
    name?: string;
    description?: string;
    triggerConditions?: Record<string, unknown>;
    actions?: Record<string, unknown>[];
    isActive?: boolean;
    requiresApproval?: boolean;
    approvalRoles?: string[];
    metadata?: Record<string, unknown>;
    updatedBy?: string;
  }): Promise<AutomationRule | null> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let i = 2;
    if (input.name !== undefined) { updates.push(`name = $${i++}`); params.push(input.name); }
    if (input.description !== undefined) { updates.push(`description = $${i++}`); params.push(input.description); }
    if (input.triggerConditions !== undefined) { updates.push(`trigger_conditions = $${i++}`); params.push(JSON.stringify(input.triggerConditions)); }
    if (input.actions !== undefined) { updates.push(`actions = $${i++}`); params.push(JSON.stringify(input.actions)); }
    if (input.isActive !== undefined) { updates.push(`is_active = $${i++}`); params.push(input.isActive); }
    if (input.requiresApproval !== undefined) { updates.push(`requires_approval = $${i++}`); params.push(input.requiresApproval); }
    if (input.approvalRoles !== undefined) { updates.push(`approval_roles = $${i++}`); params.push(JSON.stringify(input.approvalRoles)); }
    if (input.metadata !== undefined) { updates.push(`metadata = $${i++}`); params.push(JSON.stringify(input.metadata)); }
    updates.push(`updated_by = $${i++}`); params.push(input.updatedBy ?? null);
    updates.push(`updated_at = now()`);
    const { rows } = await query<AutomationRuleRow>(`UPDATE automation_rules SET ${updates.join(', ')} WHERE id = $1 RETURNING *`, params);
    if (!rows[0]) return null;
    await audit({ organizationId: input.organizationId, actorId: input.updatedBy ?? null, action: 'automation.rule.update', entity: 'automation_rule', entityId: id });
    return mapAutomationRule(rows[0]);
  },

  async deleteAutomationRule(id: string, organizationId: string, deletedBy?: string): Promise<boolean> {
    const { rows } = await query<AutomationRuleRow>(`DELETE FROM automation_rules WHERE id = $1 AND organization_id = $2 RETURNING id`, [id, organizationId]);
    if (!rows[0]) return false;
    await audit({ organizationId, actorId: deletedBy ?? null, action: 'automation.rule.delete', entity: 'automation_rule', entityId: id });
    return true;
  },

  async createWorkflowDefinition(input: {
    organizationId: string;
    name: string;
    description?: string;
    category: WorkflowCategory;
    steps: Record<string, unknown>[];
    variables: Record<string, unknown>;
    isSystem?: boolean;
    version?: string;
    metadata?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<WorkflowDefinition> {
    const id = randomUUID();
    const { rows } = await query<WorkflowDefinitionRow>(
      `INSERT INTO workflow_definitions (id, organization_id, name, description, category, steps, variables, is_system, version, metadata, created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now()) RETURNING *`,
      [id, input.organizationId, input.name, input.description ?? null, input.category, JSON.stringify(input.steps), JSON.stringify(input.variables), input.isSystem ?? false, input.version ?? '1.0', JSON.stringify(input.metadata ?? {}), input.createdBy ?? null, input.createdBy ?? null],
    );
    await audit({ organizationId: input.organizationId, actorId: input.createdBy ?? null, action: 'workflow.create', entity: 'workflow_definition', entityId: id, metadata: { name: input.name, category: input.category } });
    return mapWorkflowDefinition(rows[0]);
  },

  async listWorkflowDefinitions(organizationId: string, filters: { category?: WorkflowCategory; isActive?: boolean } = {}): Promise<WorkflowDefinition[]> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.category) { conditions.push(`category = $${i++}`); params.push(filters.category); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query<WorkflowDefinitionRow>(`SELECT * FROM workflow_definitions ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapWorkflowDefinition);
  },

  async getWorkflowDefinition(id: string): Promise<WorkflowDefinition | null> {
    const { rows } = await query<WorkflowDefinitionRow>(`SELECT * FROM workflow_definitions WHERE id = $1`, [id]);
    return rows[0] ? mapWorkflowDefinition(rows[0]) : null;
  },

  async updateWorkflowDefinition(id: string, input: {
    organizationId: string;
    name?: string;
    description?: string;
    steps?: Record<string, unknown>[];
    variables?: Record<string, unknown>;
    isActive?: boolean;
    version?: string;
    metadata?: Record<string, unknown>;
    updatedBy?: string;
  }): Promise<WorkflowDefinition | null> {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let i = 2;
    if (input.name !== undefined) { updates.push(`name = $${i++}`); params.push(input.name); }
    if (input.description !== undefined) { updates.push(`description = $${i++}`); params.push(input.description); }
    if (input.steps !== undefined) { updates.push(`steps = $${i++}`); params.push(JSON.stringify(input.steps)); }
    if (input.variables !== undefined) { updates.push(`variables = $${i++}`); params.push(JSON.stringify(input.variables)); }
    if (input.isActive !== undefined) { updates.push(`is_active = $${i++}`); params.push(input.isActive); }
    if (input.version !== undefined) { updates.push(`version = $${i++}`); params.push(input.version); }
    if (input.metadata !== undefined) { updates.push(`metadata = $${i++}`); params.push(JSON.stringify(input.metadata)); }
    updates.push(`updated_by = $${i++}`); params.push(input.updatedBy ?? null);
    updates.push(`updated_at = now()`);
    const { rows } = await query<WorkflowDefinitionRow>(`UPDATE workflow_definitions SET ${updates.join(', ')} WHERE id = $1 RETURNING *`, params);
    if (!rows[0]) return null;
    await audit({ organizationId: input.organizationId, actorId: input.updatedBy ?? null, action: 'workflow.update', entity: 'workflow_definition', entityId: id });
    return mapWorkflowDefinition(rows[0]);
  },

  async deleteWorkflowDefinition(id: string, organizationId: string, deletedBy?: string): Promise<boolean> {
    const { rows } = await query<WorkflowDefinitionRow>(`DELETE FROM workflow_definitions WHERE id = $1 AND organization_id = $2 RETURNING id`, [id, organizationId]);
    if (!rows[0]) return false;
    await audit({ organizationId, actorId: deletedBy ?? null, action: 'workflow.delete', entity: 'workflow_definition', entityId: id });
    return true;
  },
};
