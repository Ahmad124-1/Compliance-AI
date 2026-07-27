import { query } from '../db/pool.js';
import type { EsgMetric } from '../types/esg.js';

function mapMetric(row: any): EsgMetric {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkId: row.framework_id,
    name: row.name,
    description: row.description,
    metricCode: row.metric_code,
    category: row.category,
    pillar: row.pillar,
    unit: row.unit,
    dataType: row.data_type,
    reportingFrequency: row.reporting_frequency,
    applicableFacilities: row.applicable_facilities ?? [],
    applicableDepartments: row.applicable_departments ?? [],
    calculationMethod: row.calculation_method,
    thresholdWarning: row.threshold_warning,
    thresholdCritical: row.threshold_critical,
    targetValue: row.target_value,
    baselineValue: row.baseline_value,
    evidenceRequired: row.evidence_required,
    verificationRequired: row.verification_required,
    isMandatory: row.is_mandatory,
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MetricFilter {
  search?: string;
  frameworkId?: string;
  pillar?: string;
  category?: string;
  reportingFrequency?: string;
  isMandatory?: boolean;
}

export const esgMetricRepo = {
  async create(input: {
    organizationId: string;
    frameworkId?: string;
    name: string;
    description?: string;
    metricCode: string;
    category: string;
    pillar: string;
    unit?: string;
    dataType: string;
    reportingFrequency: string;
    applicableFacilities?: string[];
    applicableDepartments?: string[];
    calculationMethod?: string;
    thresholdWarning?: number;
    thresholdCritical?: number;
    targetValue?: number;
    baselineValue?: number;
    evidenceRequired?: boolean;
    verificationRequired?: boolean;
    isMandatory?: boolean;
  }): Promise<EsgMetric> {
    const { rows } = await query<EsgMetric>(
      `INSERT INTO esg_metrics (organization_id, framework_id, name, description, metric_code, category, pillar, unit, data_type, reporting_frequency, applicable_facilities, applicable_departments, calculation_method, threshold_warning, threshold_critical, target_value, baseline_value, evidence_required, verification_required, is_mandatory)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [
        input.organizationId,
        input.frameworkId ?? null,
        input.name,
        input.description ?? null,
        input.metricCode,
        input.category,
        input.pillar,
        input.unit ?? null,
        input.dataType,
        input.reportingFrequency,
        input.applicableFacilities ?? [],
        input.applicableDepartments ?? [],
        input.calculationMethod ?? null,
        input.thresholdWarning ?? null,
        input.thresholdCritical ?? null,
        input.targetValue ?? null,
        input.baselineValue ?? null,
        input.evidenceRequired ?? false,
        input.verificationRequired ?? false,
        input.isMandatory ?? true,
      ],
    );
    return mapMetric(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgMetric | null> {
    const { rows } = await query<EsgMetric>(
      `SELECT * FROM esg_metrics WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapMetric(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: MetricFilter = {}): Promise<EsgMetric[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`(name ILIKE $${i} OR metric_code ILIKE $${i} OR description ILIKE $${i})`);
      params.push(`%${filter.search}%`);
      i++;
    }
    if (filter.frameworkId) {
      where.push(`framework_id = $${i++}`);
      params.push(filter.frameworkId);
    }
    if (filter.pillar) {
      where.push(`pillar = $${i++}`);
      params.push(filter.pillar);
    }
    if (filter.category) {
      where.push(`category = $${i++}`);
      params.push(filter.category);
    }
    if (filter.reportingFrequency) {
      where.push(`reporting_frequency = $${i++}`);
      params.push(filter.reportingFrequency);
    }
    if (filter.isMandatory !== undefined) {
      where.push(`is_mandatory = $${i++}`);
      params.push(filter.isMandatory);
    }
    const { rows } = await query<EsgMetric>(
      `SELECT * FROM esg_metrics WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapMetric);
  },

  async listByFramework(frameworkId: string, orgId: string): Promise<EsgMetric[]> {
    const { rows } = await query<EsgMetric>(
      `SELECT * FROM esg_metrics WHERE framework_id = $1 AND organization_id = $2 AND is_deleted = FALSE ORDER BY category, name`,
      [frameworkId, orgId],
    );
    return rows.map(mapMetric);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgMetric, 'name' | 'description' | 'unit' | 'thresholdWarning' | 'thresholdCritical' | 'targetValue' | 'baselineValue' | 'evidenceRequired' | 'verificationRequired' | 'isMandatory' | 'isActive'>>): Promise<EsgMetric | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.thresholdWarning !== undefined) set('threshold_warning', patch.thresholdWarning);
    if (patch.thresholdCritical !== undefined) set('threshold_critical', patch.thresholdCritical);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.baselineValue !== undefined) set('baseline_value', patch.baselineValue);
    if (patch.evidenceRequired !== undefined) set('evidence_required', patch.evidenceRequired);
    if (patch.verificationRequired !== undefined) set('verification_required', patch.verificationRequired);
    if (patch.isMandatory !== undefined) set('is_mandatory', patch.isMandatory);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgMetric>(
      `UPDATE esg_metrics SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapMetric(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_metrics SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
