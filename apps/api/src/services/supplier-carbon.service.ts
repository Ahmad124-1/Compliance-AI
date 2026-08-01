import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';

export interface SupplierCarbonRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  category: string | null;
  emissionValue: number | null;
  unit: string;
  energyConsumption: number | null;
  energyUnit: string;
  renewableEnergy: boolean;
  renewablePercentage: number;
  wasteGenerated: number | null;
  wasteUnit: string;
  waterConsumption: number | null;
  waterUnit: string;
  reductionProject: string | null;
  targetValue: number | null;
  targetYear: number | null;
  baselineValue: number | null;
  emissionDate: string | null;
  reportingPeriod: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCarbonTarget {
  id: string;
  organizationId: string;
  supplierId: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  targetValue: number;
  baselineValue: number;
  unit: string;
  targetYear: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed';
  createdAt: string;
  updatedAt: string;
}

function mapRecord<T>(row: Record<string, any>): T {
  return row as T;
}

export const supplierCarbonService = {
  // ---- Carbon Records ----
  async createRecord(
    organizationId: string,
    input: Partial<SupplierCarbonRecord> & { supplierId: string; scope: SupplierCarbonRecord['scope'] },
    actorId?: string | null,
  ): Promise<SupplierCarbonRecord> {
    const now = new Date().toISOString();
    const record: SupplierCarbonRecord = {
      id: randomUUID(),
      organizationId,
      supplierId: input.supplierId,
      scope: input.scope,
      category: input.category ?? null,
      emissionValue: input.emissionValue ?? null,
      unit: input.unit ?? 'tCO2e',
      energyConsumption: input.energyConsumption ?? null,
      energyUnit: input.energyUnit ?? 'kWh',
      renewableEnergy: input.renewableEnergy ?? false,
      renewablePercentage: input.renewablePercentage ?? 0,
      wasteGenerated: input.wasteGenerated ?? null,
      wasteUnit: input.wasteUnit ?? 'tonnes',
      waterConsumption: input.waterConsumption ?? null,
      waterUnit: input.waterUnit ?? 'm3',
      reductionProject: input.reductionProject ?? null,
      targetValue: input.targetValue ?? null,
      targetYear: input.targetYear ?? null,
      baselineValue: input.baselineValue ?? null,
      emissionDate: input.emissionDate ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      source: input.source ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await query(
      `INSERT INTO supplier_carbon_records (
        id, organization_id, supplier_id, scope, category, emission_value, unit,
        energy_consumption, energy_unit, renewable_energy, renewable_percentage,
        waste_generated, waste_unit, water_consumption, water_unit, reduction_project,
        target_value, target_year, baseline_value, emission_date, reporting_period,
        source, notes, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [
        record.id, record.organizationId, record.supplierId, record.scope, record.category,
        record.emissionValue, record.unit, record.energyConsumption, record.energyUnit,
        record.renewableEnergy, record.renewablePercentage, record.wasteGenerated,
        record.wasteUnit, record.waterConsumption, record.waterUnit, record.reductionProject,
        record.targetValue, record.targetYear, record.baselineValue, record.emissionDate,
        record.reportingPeriod, record.source, record.notes, record.createdAt, record.updatedAt,
      ],
    );
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon.create', entity: 'supplier_carbon_record', entityId: record.id });
    return record;
  },

  async listRecords(
    organizationId: string,
    filters?: { supplierId?: string; scope?: string; category?: string; reportingPeriod?: string; search?: string; limit?: number; offset?: number },
  ): Promise<{ records: SupplierCarbonRecord[]; total: number }> {
    let sql = `SELECT * FROM supplier_carbon_records WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    let idx = 2;
    if (filters?.supplierId) { sql += ` AND supplier_id = $${idx++}`; params.push(filters.supplierId); }
    if (filters?.scope) { sql += ` AND scope = $${idx++}`; params.push(filters.scope); }
    if (filters?.category) { sql += ` AND category ILIKE $${idx++}`; params.push(`%${filters.category}%`); }
    if (filters?.reportingPeriod) { sql += ` AND reporting_period = $${idx++}`; params.push(filters.reportingPeriod); }
    if (filters?.search) {
      sql += ` AND (category ILIKE $${idx++} OR reduction_project ILIKE $${idx++} OR notes ILIKE $${idx++} OR source ILIKE $${idx++})`;
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    sql += ` ORDER BY emission_date DESC NULLS LAST, created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    const total = rows.length;
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;
    return { records: rows.slice(offset, offset + limit).map(mapRecord<SupplierCarbonRecord>), total };
  },

  async getRecord(id: string, organizationId: string): Promise<SupplierCarbonRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_carbon_records WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Supplier carbon record not found');
    return mapRecord<SupplierCarbonRecord>(rows[0]);
  },

  async updateRecord(id: string, organizationId: string, input: Partial<SupplierCarbonRecord>, actorId?: string | null): Promise<SupplierCarbonRecord> {
    const existing = await this.getRecord(id, organizationId);
    const updated: SupplierCarbonRecord = { ...existing, ...input, id, organizationId, updatedAt: new Date().toISOString() };
    await query(
      `UPDATE supplier_carbon_records SET
        supplier_id=$2, scope=$3, category=$4, emission_value=$5, unit=$6,
        energy_consumption=$7, energy_unit=$8, renewable_energy=$9, renewable_percentage=$10,
        waste_generated=$11, waste_unit=$12, water_consumption=$13, water_unit=$14,
        reduction_project=$15, target_value=$16, target_year=$17, baseline_value=$18,
        emission_date=$19, reporting_period=$20, source=$21, notes=$22, updated_at=NOW()
       WHERE id=$1 AND organization_id=$23`,
      [
        id, updated.supplierId, updated.scope, updated.category, updated.emissionValue,
        updated.unit, updated.energyConsumption, updated.energyUnit, updated.renewableEnergy,
        updated.renewablePercentage, updated.wasteGenerated, updated.wasteUnit,
        updated.waterConsumption, updated.waterUnit, updated.reductionProject,
        updated.targetValue, updated.targetYear, updated.baselineValue, updated.emissionDate,
        updated.reportingPeriod, updated.source, updated.notes, organizationId,
      ],
    );
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon.update', entity: 'supplier_carbon_record', entityId: id });
    return this.getRecord(id, organizationId);
  },

  async deleteRecord(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_carbon_records SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon.delete', entity: 'supplier_carbon_record', entityId: id });
  },

  // ---- Targets ----
  async createTarget(organizationId: string, input: Partial<SupplierCarbonTarget> & { supplierId: string; scope: SupplierCarbonTarget['scope']; targetValue: number; baselineValue: number; targetYear: number }, actorId?: string | null): Promise<SupplierCarbonTarget> {
    const now = new Date().toISOString();
    const target: SupplierCarbonTarget = {
      id: randomUUID(),
      organizationId,
      supplierId: input.supplierId,
      scope: input.scope,
      targetValue: input.targetValue,
      baselineValue: input.baselineValue,
      unit: input.unit ?? 'tCO2e',
      targetYear: input.targetYear,
      status: input.status ?? 'not_started',
      createdAt: now,
      updatedAt: now,
    };
    await query(
      `INSERT INTO supplier_carbon_targets (id, organization_id, supplier_id, scope, target_value, baseline_value, unit, target_year, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [target.id, target.organizationId, target.supplierId, target.scope, target.targetValue, target.baselineValue, target.unit, target.targetYear, target.status, target.createdAt, target.updatedAt],
    );
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon_target.create', entity: 'supplier_carbon_target', entityId: target.id });
    return target;
  },

  async listTargets(organizationId: string, supplierId?: string): Promise<{ targets: SupplierCarbonTarget[]; total: number }> {
    let sql = `SELECT * FROM supplier_carbon_targets WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    if (supplierId) { sql += ` AND supplier_id = $2`; params.push(supplierId); }
    sql += ` ORDER BY target_year ASC, created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return { targets: rows.map(mapRecord<SupplierCarbonTarget>), total: rows.length };
  },

  async updateTarget(id: string, organizationId: string, input: Partial<SupplierCarbonTarget>, actorId?: string | null): Promise<SupplierCarbonTarget> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_carbon_targets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Supplier carbon target not found');
    const existing = mapRecord<SupplierCarbonTarget>(rows[0]);
    const updated: SupplierCarbonTarget = { ...existing, ...input, id, organizationId, updatedAt: new Date().toISOString() };
    await query(
      `UPDATE supplier_carbon_targets SET scope=$2, target_value=$3, baseline_value=$4, unit=$5, target_year=$6, status=$7, updated_at=NOW() WHERE id=$1 AND organization_id=$8`,
      [id, updated.scope, updated.targetValue, updated.baselineValue, updated.unit, updated.targetYear, updated.status, organizationId],
    );
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon_target.update', entity: 'supplier_carbon_target', entityId: id });
    return this.getTarget(id, organizationId);
  },

  async getTarget(id: string, organizationId: string): Promise<SupplierCarbonTarget> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_carbon_targets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Supplier carbon target not found');
    return mapRecord<SupplierCarbonTarget>(rows[0]);
  },

  async deleteTarget(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_carbon_targets SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_carbon_target.delete', entity: 'supplier_carbon_target', entityId: id });
  },

  // ---- Dashboard ----
  async getDashboard(organizationId: string): Promise<Record<string, unknown>> {
    const { rows: recordRows } = await query<Record<string, any>>(
      `SELECT * FROM supplier_carbon_records WHERE organization_id = $1 AND is_deleted = FALSE`,
      [organizationId],
    );
    const { rows: targetRows } = await query<Record<string, any>>(
      `SELECT * FROM supplier_carbon_targets WHERE organization_id = $1 AND is_deleted = FALSE`,
      [organizationId],
    );
    const { rows: supplierRows } = await query<Record<string, any>>(
      `SELECT id, name, code, carbon_score FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE`,
      [organizationId],
    );

    const records = recordRows.map(mapRecord<SupplierCarbonRecord>);
    const targets = targetRows.map(mapRecord<SupplierCarbonTarget>);
    const suppliers = supplierRows as { id: string; name: string; code: string | null; carbon_score: number | null }[];

    let scope1 = 0, scope2 = 0, scope3 = 0;
    for (const r of records) {
      const v = Number(r.emissionValue ?? 0);
      if (r.scope === 'scope_1') scope1 += v;
      else if (r.scope === 'scope_2') scope2 += v;
      else scope3 += v;
    }
    const total = scope1 + scope2 + scope3;

    // Per-supplier aggregation
    const bySupplier = new Map<string, { supplierId: string; supplierName: string; total: number; scope1: number; scope2: number; scope3: number }>();
    for (const s of suppliers) {
      bySupplier.set(s.id, { supplierId: s.id, supplierName: s.name, total: 0, scope1: 0, scope2: 0, scope3: 0 });
    }
    for (const r of records) {
      const cur = bySupplier.get(r.supplierId) ?? { supplierId: r.supplierId, supplierName: r.supplierId, total: 0, scope1: 0, scope2: 0, scope3: 0 };
      const v = Number(r.emissionValue ?? 0);
      cur.total += v;
      if (r.scope === 'scope_1') cur.scope1 += v;
      else if (r.scope === 'scope_2') cur.scope2 += v;
      else cur.scope3 += v;
      bySupplier.set(r.supplierId, cur);
    }
    const supplierEmissions = Array.from(bySupplier.values())
      .map((s) => ({ ...s, total: parseFloat(s.total.toFixed(2)), scope1: parseFloat(s.scope1.toFixed(2)), scope2: parseFloat(s.scope2.toFixed(2)), scope3: parseFloat(s.scope3.toFixed(2)) }))
      .sort((a, b) => b.total - a.total);

    // Scope distribution
    const scopeDistribution = [
      { scope: 'Scope 1', value: parseFloat(scope1.toFixed(2)), percentage: total > 0 ? parseFloat(((scope1 / total) * 100).toFixed(1)) : 0 },
      { scope: 'Scope 2', value: parseFloat(scope2.toFixed(2)), percentage: total > 0 ? parseFloat(((scope2 / total) * 100).toFixed(1)) : 0 },
      { scope: 'Scope 3', value: parseFloat(scope3.toFixed(2)), percentage: total > 0 ? parseFloat(((scope3 / total) * 100).toFixed(1)) : 0 },
    ];

    // Renewable energy
    const renewableCount = records.filter((r) => r.renewableEnergy).length;
    const renewablePercentage = records.length > 0 ? parseFloat(((renewableCount / records.length) * 100).toFixed(1)) : 0;

    // Target progress
    const targetProgress = targets.map((t) => {
      const reduction = Number(t.baselineValue) - Number(t.targetValue);
      const current = Number(t.baselineValue) * 0.8; // placeholder progress based on status
      const progressPct = t.status === 'achieved' ? 100 : t.status === 'in_progress' ? 60 : t.status === 'missed' ? 0 : 20;
      return { ...t, reduction, progressPct };
    });

    // Reporting periods
    const periods = Array.from(new Set(records.map((r) => r.reportingPeriod).filter(Boolean)));

    return {
      totalRecords: records.length,
      totalSuppliers: suppliers.length,
      totalEmissions: parseFloat(total.toFixed(2)),
      scope1Emissions: parseFloat(scope1.toFixed(2)),
      scope2Emissions: parseFloat(scope2.toFixed(2)),
      scope3Emissions: parseFloat(scope3.toFixed(2)),
      scopeDistribution,
      supplierEmissions,
      targetCount: targets.length,
      targetsAchieved: targets.filter((t) => t.status === 'achieved').length,
      targetsInProgress: targets.filter((t) => t.status === 'in_progress').length,
      targetProgress,
      renewablePercentage,
      reportingPeriods: periods,
    };
  },

  // ---- Projects (reduction projects aggregate) ----
  async getProjects(organizationId: string): Promise<Record<string, unknown>[]> {
    const { rows } = await query<Record<string, any>>(
      `SELECT reduction_project, COUNT(*) as record_count, SUM(emission_value) as total_emissions
       FROM supplier_carbon_records
       WHERE organization_id = $1 AND is_deleted = FALSE AND reduction_project IS NOT NULL AND reduction_project != ''
       GROUP BY reduction_project ORDER BY total_emissions DESC`,
      [organizationId],
    );
    return rows.map((r) => ({
      name: r.reduction_project,
      recordCount: r.record_count,
      totalEmissions: parseFloat(r.total_emissions ?? 0),
    }));
  },
};

