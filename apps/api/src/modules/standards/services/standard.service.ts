import { ConflictError, NotFoundError } from '../../../core/errors.js';
import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import { standardRepo, type StandardFilter } from '../repositories/standard.repo.js';
import { frameworkRepo } from '../repositories/framework.repo.js';
import type { Standard } from '../types.js';

/**
 * Standards catalogue service: browse, create, update, search, dashboard.
 */
export const standardsService = {
  async list(filter: StandardFilter = {}) {
    return standardRepo.list(filter);
  },

  async get(id: string) {
    const std = await standardRepo.findById(id);
    if (!std) throw new NotFoundError('Standard not found');
    return std;
  },

  async create(input: Omit<Standard, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltin'>): Promise<Standard> {
    const existing = await standardRepo.findByCode(input.code);
    if (existing) throw new ConflictError('Standard code already exists');
    const created = await standardRepo.create(input);
    await audit({ action: 'standard.create', entity: 'standard', entityId: created.id });
    return created;
  },

  async update(id: string, patch: Parameters<typeof standardRepo.update>[1]) {
    const updated = await standardRepo.update(id, patch);
    if (!updated) throw new NotFoundError('Standard not found');
    return updated;
  },

  async setActive(id: string, isActive: boolean) {
    return this.update(id, { isActive });
  },

  async frameworksFor(standardId: string) {
    return frameworkRepo.listByStandard(standardId);
  },

  /**
   * Dashboard metrics across the org's enabled frameworks.
   */
  async dashboard(organizationId: string): Promise<{
    totalStandards: number;
    enabledStandards: number;
    compliancePct: number;
    pendingRequirements: number;
    completedRequirements: number;
    recentlyUpdated: { id: string; name: string; code: string; updatedAt: string }[];
  }> {
    const { rows } = await query<any>(
      `SELECT s.id, s.name, s.code, s.updated_at, of.id AS of_id, of.enabled
       FROM standards s
       LEFT JOIN frameworks f ON f.standard_id = s.id
       LEFT JOIN organization_frameworks of ON of.framework_id = f.id AND of.organization_id = $1`,
      [organizationId],
    );

    const totalStandards = rows.length;
    const enabled = rows.filter((r) => r.of_id && r.enabled);
    const enabledStandards = enabled.length;

    let pending = 0;
    let completed = 0;
    let applicableTotal = 0;
    for (const r of enabled) {
      const { rows: comp } = await query<any>(
        `SELECT COALESCE(ap.applicable, TRUE) AS applicable, COALESCE(cs.status, 'pending') AS status
         FROM requirements rq
         LEFT JOIN requirement_applicability ap ON ap.organization_framework_id = $1 AND ap.requirement_id = rq.id
         LEFT JOIN compliance_status cs ON cs.organization_framework_id = $1 AND cs.requirement_id = rq.id
         WHERE rq.framework_id = (SELECT framework_id FROM organization_frameworks WHERE id = $1)`,
        [r.of_id],
      );
      for (const c of comp) {
        if (c.applicable === false) continue;
        applicableTotal++;
        if (c.status === 'compliant') completed++;
        else pending++;
      }
    }

    const recentlyUpdated = rows
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map((r) => ({ id: r.id, name: r.name, code: r.code, updatedAt: r.updated_at.toISOString() }));

    return {
      totalStandards,
      enabledStandards,
      compliancePct: applicableTotal ? Math.round((completed / applicableTotal) * 100) : 0,
      pendingRequirements: pending,
      completedRequirements: completed,
      recentlyUpdated,
    };
  },
};

