import { query } from '../db/pool.js';
import type { CalculationHistory } from '../types/carbon.js';

function mapCalculationHistory(row: any): CalculationHistory {
  return {
    id: row.id,
    organizationId: row.organization_id,
    emissionRecordId: row.emission_record_id,
    calculationType: row.calculation_type,
    inputData: row.input_data ?? {},
    emissionFactorId: row.emission_factor_id,
    resultCo2e: parseFloat(row.result_co2e),
    resultBreakdown: row.result_breakdown ?? {},
    methodology: row.methodology,
    calculatedBy: row.calculated_by,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
  };
}

export interface CalculationHistoryFilter {
  emissionRecordId?: string;
  calculationType?: string;
}

export const calculationHistoryRepo = {
  async create(input: {
    organizationId: string;
    emissionRecordId?: string;
    calculationType: string;
    inputData?: Record<string, unknown>;
    emissionFactorId?: string;
    resultCo2e: number;
    resultBreakdown?: Record<string, unknown>;
    methodology: string;
    calculatedBy?: string;
  }): Promise<CalculationHistory> {
    const { rows } = await query<CalculationHistory>(
      `INSERT INTO calculation_history (organization_id, emission_record_id, calculation_type, input_data, emission_factor_id, result_co2e, result_breakdown, methodology, calculated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.emissionRecordId ?? null,
        input.calculationType,
        input.inputData ?? {},
        input.emissionFactorId ?? null,
        input.resultCo2e,
        input.resultBreakdown ?? {},
        input.methodology,
        input.calculatedBy ?? null,
      ],
    );
    return mapCalculationHistory(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<CalculationHistory | null> {
    const { rows } = await query<CalculationHistory>(
      `SELECT * FROM calculation_history WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapCalculationHistory(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: CalculationHistoryFilter = {}): Promise<CalculationHistory[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.emissionRecordId) {
      where.push(`emission_record_id = $${i++}`);
      params.push(filter.emissionRecordId);
    }
    if (filter.calculationType) {
      where.push(`calculation_type = $${i++}`);
      params.push(filter.calculationType);
    }
    const { rows } = await query<CalculationHistory>(
      `SELECT * FROM calculation_history WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapCalculationHistory);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<CalculationHistory, 'emissionRecordId' | 'calculationType' | 'inputData' | 'emissionFactorId' | 'resultCo2e' | 'resultBreakdown' | 'methodology' | 'calculatedBy'>>): Promise<CalculationHistory | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.emissionRecordId !== undefined) set('emission_record_id', patch.emissionRecordId);
    if (patch.calculationType !== undefined) set('calculation_type', patch.calculationType);
    if (patch.inputData !== undefined) set('input_data', patch.inputData);
    if (patch.emissionFactorId !== undefined) set('emission_factor_id', patch.emissionFactorId);
    if (patch.resultCo2e !== undefined) set('result_co2e', patch.resultCo2e);
    if (patch.resultBreakdown !== undefined) set('result_breakdown', patch.resultBreakdown);
    if (patch.methodology !== undefined) set('methodology', patch.methodology);
    if (patch.calculatedBy !== undefined) set('calculated_by', patch.calculatedBy);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<CalculationHistory>(
      `UPDATE calculation_history SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapCalculationHistory(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE calculation_history SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
