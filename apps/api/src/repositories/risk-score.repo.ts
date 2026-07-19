import { query } from '../db/pool.js';

/** @type {any} */
const mapRiskScore = (row) => ({
  id: row.id,
  caseId: row.case_id,
  overallScore: row.overall_score,
  factors: row.factors,
  calculatedBy: row.calculated_by,
  calculationMethod: row.calculation_method,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const riskScoreRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO risk_scores (case_id, overall_score, factors, calculated_by, calculation_method)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        input.caseId,
        input.overallScore ?? 0,
        JSON.stringify(input.factors ?? {}),
        input.calculatedBy ?? null,
        input.calculationMethod ?? 'automated',
      ],
    );
    return mapRiskScore(rows[0]);
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM risk_scores WHERE case_id = $1`, [caseId]);
    return rows[0] ? mapRiskScore(rows[0]) : null;
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM risk_scores WHERE id = $1`, [id]);
    return rows[0] ? mapRiskScore(rows[0]) : null;
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.overallScore !== undefined) set('overall_score', patch.overallScore);
    if (patch.factors !== undefined) set('factors', JSON.stringify(patch.factors));
    if (patch.calculatedBy !== undefined) set('calculated_by', patch.calculatedBy);
    if (patch.calculationMethod !== undefined) set('calculation_method', patch.calculationMethod);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE risk_scores SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapRiskScore(rows[0]) : null;
  },
};
