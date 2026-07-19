import { query } from '../../../db/pool.js';
import type {
  AssignmentScope,
  ComplianceState,
  ComplianceStatus,
  ControlStatus,
  ControlStatusState,
  FrameworkAssignment,
  FrameworkProgress,
  OrganizationFramework,
} from '../types.js';

function mapOrgFramework(row: any): OrganizationFramework {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkId: row.framework_id,
    enabled: row.enabled,
    settings: row.settings,
    adoptedAt: row.adopted_at,
    adoptedBy: row.adopted_by,
  };
}

function mapAssignment(row: any): FrameworkAssignment {
  return {
    id: row.id,
    organizationFrameworkId: row.organization_framework_id,
    scope: row.scope,
    siteId: row.site_id,
    departmentId: row.department_id,
    createdAt: row.created_at,
  };
}

export const orgFrameworkRepo = {
  async create(organizationId: string, frameworkId: string, adoptedBy?: string | null, enabled = true): Promise<OrganizationFramework> {
    const { rows } = await query<OrganizationFramework>(
      `INSERT INTO organization_frameworks (organization_id, framework_id, enabled, adopted_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, framework_id) DO UPDATE SET enabled = EXCLUDED.enabled, adopted_at = now()
       RETURNING *`,
      [organizationId, frameworkId, enabled, adoptedBy ?? null],
    );
    return mapOrgFramework(rows[0]);
  },

  async findByOrgAndFramework(organizationId: string, frameworkId: string): Promise<OrganizationFramework | null> {
    const { rows } = await query(
      `SELECT * FROM organization_frameworks WHERE organization_id = $1 AND framework_id = $2`,
      [organizationId, frameworkId],
    );
    return rows[0] ? mapOrgFramework(rows[0]) : null;
  },

  async listByOrganization(organizationId: string): Promise<OrganizationFramework[]> {
    const { rows } = await query(
      `SELECT * FROM organization_frameworks WHERE organization_id = $1 ORDER BY adopted_at DESC`,
      [organizationId],
    );
    return rows.map(mapOrgFramework);
  },

  async setEnabled(id: string, enabled: boolean): Promise<OrganizationFramework | null> {
    const { rows } = await query(
      `UPDATE organization_frameworks SET enabled = $2 WHERE id = $1 RETURNING *`,
      [id, enabled],
    );
    return rows[0] ? mapOrgFramework(rows[0]) : null;
  },

  async updateSettings(id: string, settings: Record<string, unknown>): Promise<OrganizationFramework | null> {
    const { rows } = await query(
      `UPDATE organization_frameworks SET settings = $2 WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(settings)],
    );
    return rows[0] ? mapOrgFramework(rows[0]) : null;
  },

  async remove(id: string): Promise<void> {
    await query(`DELETE FROM organization_frameworks WHERE id = $1`, [id]);
  },
};

export const assignmentRepo = {
  async add(orgFrameworkId: string, scope: AssignmentScope, siteId?: string | null, departmentId?: string | null): Promise<FrameworkAssignment> {
    const { rows } = await query<FrameworkAssignment>(
      `INSERT INTO framework_assignments (organization_framework_id, scope, site_id, department_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_framework_id, scope, site_id, department_id) DO NOTHING
       RETURNING *`,
      [orgFrameworkId, scope, siteId ?? null, departmentId ?? null],
    );
    return rows[0] ? mapAssignment(rows[0]) : (await this.list(orgFrameworkId))[0];
  },
  async list(orgFrameworkId: string): Promise<FrameworkAssignment[]> {
    const { rows } = await query(
      `SELECT * FROM framework_assignments WHERE organization_framework_id = $1 ORDER BY scope`,
      [orgFrameworkId],
    );
    return rows.map(mapAssignment);
  },
  async remove(id: string): Promise<void> {
    await query(`DELETE FROM framework_assignments WHERE id = $1`, [id]);
  },
};

export const applicabilityRepo = {
  async set(orgFrameworkId: string, requirementId: string, applicable: boolean, notes?: string | null): Promise<void> {
    await query(
      `INSERT INTO requirement_applicability (organization_framework_id, requirement_id, applicable, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_framework_id, requirement_id) DO UPDATE SET applicable = EXCLUDED.applicable, notes = EXCLUDED.notes`,
      [orgFrameworkId, requirementId, applicable, notes ?? null],
    );
  },
  async isApplicable(orgFrameworkId: string, requirementId: string): Promise<boolean> {
    const { rows } = await query(
      `SELECT applicable FROM requirement_applicability WHERE organization_framework_id = $1 AND requirement_id = $2`,
      [orgFrameworkId, requirementId],
    );
    return rows.length ? rows[0].applicable : true;
  },
};

export const controlStatusRepo = {
  async set(orgFrameworkId: string, controlId: string, status: ControlStatusState, ownerId?: string | null, notes?: string | null): Promise<void> {
    await query(
      `INSERT INTO control_status (organization_framework_id, control_id, status, owner_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_framework_id, control_id) DO UPDATE SET status = EXCLUDED.status, owner_id = EXCLUDED.owner_id, notes = EXCLUDED.notes, updated_at = now()`,
      [orgFrameworkId, controlId, status, ownerId ?? null, notes ?? null],
    );
  },
  async listByOrgFramework(orgFrameworkId: string): Promise<ControlStatus[]> {
    const { rows } = await query(`SELECT * FROM control_status WHERE organization_framework_id = $1`, [orgFrameworkId]);
    return rows.map((r: any) => ({
      id: r.id,
      organizationFrameworkId: r.organization_framework_id,
      controlId: r.control_id,
      status: r.status,
      ownerId: r.owner_id,
      notes: r.notes,
      updatedAt: r.updated_at,
    }));
  },
};

export const complianceStatusRepo = {
  async set(orgFrameworkId: string, requirementId: string, status: ComplianceState, progress: number): Promise<void> {
    await query(
      `INSERT INTO compliance_status (organization_framework_id, requirement_id, status, progress)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_framework_id, requirement_id) DO UPDATE SET status = EXCLUDED.status, progress = EXCLUDED.progress, updated_at = now()`,
      [orgFrameworkId, requirementId, status, progress],
    );
  },

  /**
   * Compute progress: counts requirement compliance + compliance % for an org framework.
   * Considers applicability overrides. Compliance % = compliant / applicable * 100.
   */
  async computeProgress(orgFrameworkId: string): Promise<FrameworkProgress> {
    const { rows } = await query<any>(
      `SELECT
         r.id AS requirement_id,
         r.category_id,
         c.name AS category_name,
         COALESCE(ap.applicable, TRUE) AS applicable,
         COALESCE(cs.status, 'pending') AS status
       FROM requirements r
       LEFT JOIN framework_categories c ON c.id = r.category_id
       LEFT JOIN requirement_applicability ap
         ON ap.organization_framework_id = $1 AND ap.requirement_id = r.id
       LEFT JOIN compliance_status cs
         ON cs.organization_framework_id = $1 AND cs.requirement_id = r.id
       WHERE r.framework_id = (SELECT framework_id FROM organization_frameworks WHERE id = $1)`,
      [orgFrameworkId],
    );

    const total = rows.length;
    let applicable = 0;
    let compliant = 0;
    let inProgress = 0;
    let pending = 0;
    let notApplicable = 0;
    const catMap = new Map<string, { categoryId: string | null; name: string | null; progress: number; total: number; compliant: number }>();

    for (const r of rows) {
      if (r.applicable === false) {
        notApplicable++;
        continue;
      }
      applicable++;
      if (r.status === 'compliant') compliant++;
      else if (r.status === 'in_progress') inProgress++;
      else pending++;

      const key = r.category_id ?? 'uncategorized';
      if (!catMap.has(key)) catMap.set(key, { categoryId: r.category_id, name: r.category_name, progress: 0, total: 0, compliant: 0 });
      const c = catMap.get(key)!;
      c.total++;
      if (r.status === 'compliant') c.compliant++;
    }

    const byCategory = [...catMap.values()].map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      total: c.total,
      compliant: c.compliant,
      progress: c.total ? Math.round((c.compliant / c.total) * 100) : 0,
    }));

    return {
      totalRequirements: total,
      applicableRequirements: applicable,
      compliantRequirements: compliant,
      inProgressRequirements: inProgress,
      pendingRequirements: pending,
      notApplicableRequirements: notApplicable,
      progress: applicable ? Math.round((compliant / applicable) * 100) : 0,
      byCategory,
    };
  },

  async listByOrgFramework(orgFrameworkId: string): Promise<ComplianceStatus[]> {
    const { rows } = await query(`SELECT * FROM compliance_status WHERE organization_framework_id = $1`, [orgFrameworkId]);
    return rows.map((r: any) => ({
      id: r.id,
      organizationFrameworkId: r.organization_framework_id,
      requirementId: r.requirement_id,
      status: r.status,
      progress: r.progress,
      updatedAt: r.updated_at,
    }));
  },
};

