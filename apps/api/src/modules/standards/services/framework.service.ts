import { NotFoundError } from '../../../core/errors.js';
import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import {
  frameworkRepo,
  frameworkCategoryRepo,
  clauseRepo,
  requirementRepo,
  controlRepo,
} from '../repositories/framework.repo.js';
import {
  orgFrameworkRepo,
  assignmentRepo,
  applicabilityRepo,
  controlStatusRepo,
  complianceStatusRepo,
} from '../repositories/assignment.repo.js';
import { frameworkImport } from '../import/framework.import.js';
import type {
  AssignmentScope,
  ComplianceState,
  ControlStatusState,
  FrameworkProgress,
} from '../types.js';

/**
 * Framework adoption + implementation tracking service.
 */
export const frameworkService = {
  // ---- Catalogue ----
  async listFrameworks() {
    return frameworkRepo.listActive();
  },

  async getFramework(id: string) {
    const fw = await frameworkRepo.findById(id);
    if (!fw) throw new NotFoundError('Framework not found');
    return fw;
  },

  async clauseTree(frameworkId: string) {
    return clauseRepo.findByFrameworkTree(frameworkId);
  },

  async categories(frameworkId: string) {
    return frameworkCategoryRepo.listByFramework(frameworkId);
  },

  async requirements(frameworkId: string, filter: { search?: string; categoryId?: string | null; clauseId?: string | null; mandatory?: boolean } = {}) {
    return requirementRepo.listByFramework(frameworkId, filter);
  },

  async controlsForRequirement(requirementId: string) {
    return controlRepo.listByRequirement(requirementId);
  },

  // ---- Adoption ----
  async enable(organizationId: string, frameworkId: string, actorId?: string | null) {
    const fw = await frameworkRepo.findById(frameworkId);
    if (!fw) throw new NotFoundError('Framework not found');
    const of = await orgFrameworkRepo.create(organizationId, frameworkId, actorId, true);
    await this.seedComplianceStatus(of.id);
    await audit({ organizationId, actorId: actorId ?? null, action: 'framework.enable', entity: 'organization_framework', entityId: of.id });
    return of;
  },

  async disable(organizationId: string, frameworkId: string, actorId?: string | null) {
    const of = await orgFrameworkRepo.findByOrgAndFramework(organizationId, frameworkId);
    if (!of) throw new NotFoundError('Framework not adopted');
    const updated = await orgFrameworkRepo.setEnabled(of.id, false);
    await audit({ organizationId, actorId: actorId ?? null, action: 'framework.disable', entity: 'organization_framework', entityId: of.id });
    return updated;
  },

  async listAdopted(organizationId: string) {
    return orgFrameworkRepo.listByOrganization(organizationId);
  },

  async settings(organizationId: string, frameworkId: string, settings: Record<string, unknown>) {
    const of = await orgFrameworkRepo.findByOrgAndFramework(organizationId, frameworkId);
    if (!of) throw new NotFoundError('Framework not adopted');
    return orgFrameworkRepo.updateSettings(of.id, settings);
  },

  async removeAdoption(organizationId: string, frameworkId: string) {
    const of = await orgFrameworkRepo.findByOrgAndFramework(organizationId, frameworkId);
    if (!of) throw new NotFoundError('Framework not adopted');
    await orgFrameworkRepo.remove(of.id);
  },

  // ---- Assignment ----
  async assignScope(orgFrameworkId: string, scope: AssignmentScope, siteId?: string | null, departmentId?: string | null) {
    return assignmentRepo.add(orgFrameworkId, scope, siteId, departmentId);
  },
  async listAssignments(orgFrameworkId: string) {
    return assignmentRepo.list(orgFrameworkId);
  },
  async removeAssignment(id: string) {
    return assignmentRepo.remove(id);
  },

  // ---- Applicability ----
  async setApplicability(orgFrameworkId: string, requirementId: string, applicable: boolean, notes?: string | null) {
    await applicabilityRepo.set(orgFrameworkId, requirementId, applicable, notes);
  },

  // ---- Status ----
  async setControlStatus(orgFrameworkId: string, controlId: string, status: ControlStatusState, ownerId?: string | null, notes?: string | null) {
    await controlStatusRepo.set(orgFrameworkId, controlId, status, ownerId, notes);
    await this.recomputeStatus(orgFrameworkId, controlId);
  },

  async controlStatuses(orgFrameworkId: string) {
    return controlStatusRepo.listByOrgFramework(orgFrameworkId);
  },

  async seedComplianceStatus(orgFrameworkId: string) {
    const { rows } = await queryRequirements(orgFrameworkId);
    for (const r of rows) {
      await complianceStatusRepo.set(orgFrameworkId, r.id, 'pending', 0);
    }
  },

  /**
   * Recompute a requirement's compliance state from its controls:
   * - any control not_applicable -> requirement not_applicable
   * - all implemented -> compliant
   * - some in_progress -> in_progress
   * - else pending
   * progress = implemented / total.
   */
  async recomputeStatus(orgFrameworkId: string, controlId: string) {
    await queryRequirements(orgFrameworkId);
    const target = await getRequirementIdForControl(controlId);
    if (!target) return;
    const requirementId = target;
    const { rows: controls } = await query<any>(
      `SELECT cs.status FROM controls c
       LEFT JOIN control_status cs ON cs.control_id = c.id AND cs.organization_framework_id = $1
       WHERE c.requirement_id = $2`,
      [orgFrameworkId, requirementId],
    );
    const total = controls.length;
    const implemented = controls.filter((c: any) => c.status === 'implemented').length;
    const inProg = controls.filter((c: any) => c.status === 'in_progress').length;
    const notAppl = controls.filter((c: any) => c.status === 'not_applicable').length;

    let status: ComplianceState = 'pending';
    let progress = 0;
    if (total > 0) {
      if (notAppl === total) status = 'not_applicable';
      else if (implemented === total) status = 'compliant';
      else if (implemented > 0 || inProg > 0) status = 'in_progress';
      progress = Math.round((implemented / total) * 100);
    }
    await complianceStatusRepo.set(orgFrameworkId, requirementId, status, progress);
  },

  async progress(orgFrameworkId: string): Promise<FrameworkProgress> {
    return complianceStatusRepo.computeProgress(orgFrameworkId);
  },

  async complianceStatuses(orgFrameworkId: string) {
    return complianceStatusRepo.listByOrgFramework(orgFrameworkId);
  },

  // ---- Import ----
  async importFramework(payload: Parameters<typeof frameworkImport>[0], actorId?: string | null) {
    const of = await frameworkImport(payload);
    if (actorId) await audit({ action: 'framework.import', entity: 'framework', entityId: of.id });
    return of;
  },
  // ---- Search ----
  async search(organizationId: string, term: string) {
    const t = `%${term}%`;
    const frameworks = await query<any>(
      `SELECT f.id, f.title, f.version, s.name AS standard_name, s.code AS standard_code
       FROM frameworks f
       JOIN standards s ON s.id = f.standard_id
       WHERE f.title ILIKE $1 OR s.name ILIKE $1 OR s.code ILIKE $1 OR f.version ILIKE $1
       ORDER BY s.name, f.version
       LIMIT 20`,
      [t],
    );
    const requirements = term
      ? await query<any>(
          `SELECT r.id, r.code, r.title, f.id AS framework_id, f.title AS framework_title
           FROM requirements r
           JOIN frameworks f ON f.id = r.framework_id
           WHERE r.title ILIKE $1 OR r.code ILIKE $1 OR r.description ILIKE $1
           ORDER BY r.code
           LIMIT 20`,
          [t],
        )
      : { rows: [] };
    const clauses = term
      ? await query<any>(
          `SELECT c.id, c.code, c.title, f.id AS framework_id, f.title AS framework_title
           FROM clauses c
           JOIN frameworks f ON f.id = c.framework_id
           WHERE c.title ILIKE $1 OR c.code ILIKE $1
           ORDER BY c.code
           LIMIT 20`,
          [t],
        )
      : { rows: [] };
    return {
      frameworks: frameworks.rows,
      requirements: requirements.rows,
      clauses: clauses.rows,
    };
  },
};

async function queryRequirements(orgFrameworkId: string): Promise<{ rows: { id: string }[] }> {
  const res = await query<{ id: string }>(
    `SELECT r.id FROM requirements r
     WHERE r.framework_id = (SELECT framework_id FROM organization_frameworks WHERE id = $1)`,
    [orgFrameworkId],
  );
  return res;
}

async function getRequirementIdForControl(controlId: string): Promise<string | null> {
  const { rows } = await query<{ requirement_id: string }>(`SELECT requirement_id FROM controls WHERE id = $1`, [controlId]);
  return rows[0]?.requirement_id ?? null;
}

