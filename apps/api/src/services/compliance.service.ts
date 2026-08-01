// Compliance status service — aggregates assessment data into a compliance posture.
// Used by the Analytics > Compliance Score dashboard.

import { query } from '../db/pool.js';

interface ComplianceStatusRow {
  status: string;
  overall_score: number | null;
  progress: number;
  type: string | null;
  scoring_summary: Record<string, unknown> | null;
}

export interface ComplianceStatusResult {
  compliant: number;
  partiallyCompliant: number;
  nonCompliant: number;
  notAssessed: number;
  total: number;
  overallScore: number | null;
  byStandard: { standard: string; compliant: number; partiallyCompliant: number; nonCompliant: number; notAssessed: number; averageScore: number | null }[];
}

function classify(score: number | null, progress: number): 'compliant' | 'partiallyCompliant' | 'nonCompliant' | 'notAssessed' {
  if (score === null || score === undefined || (progress === 0 && score === 0)) return 'notAssessed';
  if (score >= 80) return 'compliant';
  if (score >= 60) return 'partiallyCompliant';
  return 'nonCompliant';
}

export const complianceService = {
  async getStatus(organizationId: string): Promise<ComplianceStatusResult> {
    const { rows } = await query<ComplianceStatusRow>(
      `SELECT
         a.status,
         a.progress,
         a.type,
         a.scoring_summary,
         CAST(a.scoring_summary->>'overallScore' AS FLOAT) AS overall_score
       FROM assessments a
       WHERE a.organization_id = $1 AND a.status NOT IN ('cancelled', 'archived', 'draft')
       ORDER BY a.updated_at DESC`,
      [organizationId],
    );

    let compliant = 0;
    let partiallyCompliant = 0;
    let nonCompliant = 0;
    let notAssessed = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    const byStandardMap = new Map<
      string,
      { standard: string; compliant: number; partiallyCompliant: number; nonCompliant: number; notAssessed: number; scoreSum: number; scoreCount: number }
    >();

    for (const r of rows) {
      const score = r.overall_score !== null && r.overall_score !== undefined ? Math.round(r.overall_score) : null;
      const cls = classify(score, r.progress ?? 0);
      if (cls === 'compliant') compliant += 1;
      else if (cls === 'partiallyCompliant') partiallyCompliant += 1;
      else if (cls === 'nonCompliant') nonCompliant += 1;
      else notAssessed += 1;

      if (score !== null) {
        scoreSum += score;
        scoreCount += 1;
      }

      const standard = r.type ?? 'Uncategorized';
      const cur = byStandardMap.get(standard) ?? {
        standard,
        compliant: 0,
        partiallyCompliant: 0,
        nonCompliant: 0,
        notAssessed: 0,
        scoreSum: 0,
        scoreCount: 0,
      };
      if (cls === 'compliant') cur.compliant += 1;
      else if (cls === 'partiallyCompliant') cur.partiallyCompliant += 1;
      else if (cls === 'nonCompliant') cur.nonCompliant += 1;
      else cur.notAssessed += 1;
      if (score !== null) {
        cur.scoreSum += score;
        cur.scoreCount += 1;
      }
      byStandardMap.set(standard, cur);
    }

    const byStandard = Array.from(byStandardMap.values())
      .map((s) => ({
        standard: s.standard,
        compliant: s.compliant,
        partiallyCompliant: s.partiallyCompliant,
        nonCompliant: s.nonCompliant,
        notAssessed: s.notAssessed,
        averageScore: s.scoreCount ? Math.round(s.scoreSum / s.scoreCount) : null,
      }))
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));

    return {
      compliant,
      partiallyCompliant,
      nonCompliant,
      notAssessed,
      total: rows.length,
      overallScore: scoreCount ? Math.round(scoreSum / scoreCount) : null,
      byStandard,
    };
  },
};

