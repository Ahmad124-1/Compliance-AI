import { query } from '../../../db/pool.js';
import { predictionService } from './prediction.service.js';
import type { PredictionRecord } from '../types.js';

function buildPredictionRecord(input: {
  organizationId: string;
  type: PredictionRecord['type'];
  category: PredictionRecord['category'];
  entityType: string;
  entityId?: string;
  title: string;
  description: string;
  probability: number;
  confidenceScore: number;
  reasoning: string;
  suggestedActions: string[];
  riskLevel: PredictionRecord['riskLevel'];
  timeframe?: string;
  metadata: Record<string, unknown>;
}): PredictionRecord {
  return {
    id: '', organizationId: input.organizationId, type: input.type as PredictionRecord['type'], category: input.category as PredictionRecord['category'],
    entityType: input.entityType, entityId: input.entityId, title: input.title, description: input.description,
    probability: input.probability, confidenceScore: input.confidenceScore, reasoning: input.reasoning,
    suggestedActions: input.suggestedActions, riskLevel: input.riskLevel as PredictionRecord['riskLevel'],
    timeframe: input.timeframe, metadata: input.metadata, createdAt: '', updatedAt: '',
  };
}

export const riskEngineService = {
  async forecastRisks(organizationId: string, timeframe = '30d'): Promise<PredictionRecord[]> {
    const [caseRows, grievanceRows, capaRows] = await Promise.all([
      query<{ factory_id: string | null; department_id: string | null; total: number; avg_risk: string | null }>(
        `SELECT factory_id, department_id, COUNT(*)::int as total, COALESCE(AVG(risk_score),0) as avg_risk FROM cases WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY factory_id, department_id`,
        [organizationId],
      ),
      query<{ factory_id: string | null; department_id: string | null; total: number }>(
        `SELECT factory_id, department_id, COUNT(*)::int as total FROM grievances WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY factory_id, department_id`,
        [organizationId],
      ),
      query<{ team_id: string; total: number; at_risk: number }>(
        `SELECT team_id, COUNT(*)::int as total, SUM(CASE WHEN status IN ('overdue','reopened') THEN 1 ELSE 0 END)::int as at_risk FROM capas WHERE organization_id = $1 GROUP BY team_id`,
        [organizationId],
      ),
    ]);

    const predictions: PredictionRecord[] = [];

    for (const r of caseRows.rows) {
      const riskScore = parseFloat(r.avg_risk ?? '0');
      const probability = Math.min(95, Math.round(riskScore + (r.total > 10 ? 15 : 0)));
      const confidence = Math.max(60, Math.min(95, 85 - (r.total < 5 ? 15 : 0)));
      const riskLevel = probability > 75 ? 'critical' : probability > 50 ? 'high' : 'medium';
      predictions.push(buildPredictionRecord({
        organizationId, type: 'risk_forecast', category: r.factory_id ? 'factory' : 'department',
        entityType: r.factory_id ? 'factory' : 'department', entityId: r.factory_id ?? r.department_id ?? undefined,
        title: `High-risk ${r.factory_id ? 'factory' : 'department'}`, description: `${r.total} cases with average risk score ${riskScore.toFixed(1)}`,
        probability, confidenceScore: confidence, reasoning: `Historical case volume and risk scores indicate elevated non-conformity probability in this location.`,
        suggestedActions: ['Schedule preventive audit', 'Increase worker interviews', 'Review supplier documentation'],
        riskLevel, timeframe, metadata: { source: 'case_history', caseCount: r.total, avgRisk: riskScore },
      }));
    }

    for (const r of grievanceRows.rows) {
      if (r.total > 5) {
        const probability = Math.min(90, 50 + r.total * 3);
        predictions.push(buildPredictionRecord({
          organizationId, type: 'worker_intelligence', category: 'worker',
          entityType: r.factory_id ? 'factory' : 'department', entityId: r.factory_id ?? r.department_id ?? undefined,
          title: `Worker grievance hotspot`, description: `${r.total} grievances detected`,
          probability, confidenceScore: 72, riskLevel: probability > 70 ? 'high' : 'medium',
          reasoning: `Recurring grievance patterns suggest worker satisfaction issues that may escalate.`,
          suggestedActions: ['Conduct worker satisfaction survey', 'Schedule management review', 'Increase anonymous reporting channels'],
          timeframe, metadata: { source: 'grievance_history', grievanceCount: r.total },
        }));
      }
    }

    for (const r of capaRows.rows) {
      if (r.at_risk > 0) {
        const probability = Math.min(85, 40 + r.at_risk * 10);
        predictions.push(buildPredictionRecord({
          organizationId, type: 'capa_prediction', category: 'department', entityType: 'department', entityId: r.team_id,
          title: `CAPA overdue risk`, description: `${r.at_risk} CAPAs at risk of becoming overdue`,
          probability, confidenceScore: 68, riskLevel: probability > 60 ? 'high' : 'medium',
          reasoning: `CAPA backlog and overdue trends indicate process control weaknesses.`,
          suggestedActions: ['Reassign CAPA owners', 'Increase management review frequency', 'Perform root cause analysis'],
          timeframe, metadata: { source: 'capa_history', atRiskCount: r.at_risk },
        }));
      }
    }

    for (const p of predictions) {
      if (p.entityId) {
        await predictionService.create({
          organizationId: p.organizationId, type: p.type, category: p.category, entityType: p.entityType,
          entityId: p.entityId, title: p.title, description: p.description, probability: p.probability,
          confidenceScore: p.confidenceScore, reasoning: p.reasoning, suggestedActions: p.suggestedActions,
          riskLevel: p.riskLevel, timeframe: p.timeframe, metadata: p.metadata,
        });
      }
    }

    return predictions;
  },

  async predictAuditFailure(organizationId: string, _auditId?: string, _departmentId?: string): Promise<{
    likelihood: { pass: number; fail: number };
    failedClauses: string[];
    evidenceGaps: string[];
    riskyDepartments: string[];
    overdueCAPAs: number;
    readinessScore: number;
  }> {
    const [overdueResult, riskyDeptResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*)::int as count FROM capas WHERE organization_id = $1 AND status IN ('open','in_progress') AND due_date < now()`,
        [organizationId],
      ),
      query<{ department_id: string }>(
        `SELECT DISTINCT department_id FROM cases WHERE organization_id = $1 AND is_deleted = FALSE AND risk_score > 60 LIMIT 5`,
        [organizationId],
      ),
    ]);
    const overdueCount = parseInt(overdueResult.rows[0]?.count ?? '0', 10);
    const riskyDeptCount = riskyDeptResult.rows.length;
    const baseFail = 20 + overdueCount * 5 + riskyDeptCount * 8;
    const likelihood = { pass: Math.max(10, 100 - baseFail), fail: Math.min(90, baseFail) };
    const readinessScore = Math.max(0, 100 - baseFail);
    return {
      likelihood,
      failedClauses: ['Clause 4.2: Management Responsibility', 'Clause 8.7: Non-conforming Output'],
      evidenceGaps: ['Training records for production staff', 'Supplier audit reports'],
      riskyDepartments: riskyDeptResult.rows.map((r) => r.department_id),
      overdueCAPAs: overdueCount,
      readinessScore,
    };
  },

  async predictCAPAs(organizationId: string): Promise<PredictionRecord[]> {
    const { rows } = await query<{ team_id: string; open_count: number; overdue_count: number }>(
      `SELECT team_id, COUNT(*) FILTER (WHERE status IN ('open','in_progress'))::int as open_count, COUNT(*) FILTER (WHERE status IN ('overdue','reopened'))::int as overdue_count FROM capas WHERE organization_id = $1 GROUP BY team_id`,
      [organizationId],
    );
    const predictions: PredictionRecord[] = rows.map((r): PredictionRecord => {
      const probability = Math.min(90, 30 + r.overdue_count * 12 + (r.open_count > 5 ? 15 : 0));
      const confidence = Math.max(55, Math.min(90, 70 - (r.open_count < 3 ? 10 : 0)));
      const riskLevel = probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low';
      return {
        id: '', organizationId, type: 'capa_prediction', category: 'department',
        entityType: 'department', entityId: r.team_id,
        title: `CAPA repeat risk`, description: `${r.overdue_count} overdue / ${r.open_count} open CAPAs`,
        probability, confidenceScore: confidence, riskLevel,
        reasoning: `Department has ${r.open_count} open CAPAs with ${r.overdue_count} already overdue.`,
        suggestedActions: ['Reassign owners', 'Increase management review', 'Perform root cause analysis'],
        timeframe: '30d', metadata: { source: 'capa_history', openCount: r.open_count, overdueCount: r.overdue_count },
        createdAt: '', updatedAt: '',
      };
    });
    for (const p of predictions) {
      if (p.entityId) {
        await predictionService.create({
          organizationId: p.organizationId, type: p.type, category: p.category, entityType: p.entityType,
          entityId: p.entityId, title: p.title, description: p.description, probability: p.probability,
          confidenceScore: p.confidenceScore, reasoning: p.reasoning, suggestedActions: p.suggestedActions,
          riskLevel: p.riskLevel, timeframe: p.timeframe, metadata: p.metadata,
        });
      }
    }
    return predictions;
  },

  async predictWorkerIntelligence(organizationId: string): Promise<PredictionRecord[]> {
    const [grievanceRows, severityRows, themeRows] = await Promise.all([
      query<{ factory: string | null; department: string | null; total: number }>(
        `SELECT factory, department, COUNT(*)::int as total FROM grievances WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY factory, department`,
        [organizationId],
      ),
      query<{ total: number }>(
        `SELECT COUNT(*)::int as total FROM grievances WHERE organization_id = $1 AND severity IN ('high','critical') AND created_at > now() - interval '30 days'`,
        [organizationId],
      ),
      query<{ category: string; total: number }>(
        `SELECT category, COUNT(*)::int as total FROM grievances WHERE organization_id = $1 AND created_at > now() - interval '90 days' GROUP BY category ORDER BY total DESC LIMIT 5`,
        [organizationId],
      ),
    ]);

    const predictions: PredictionRecord[] = [];
    for (const r of grievanceRows.rows) {
      if (r.total > 5) {
        const probability = Math.min(88, 45 + r.total * 2);
        predictions.push({
          id: '', entityType: r.factory ? 'factory' : 'department', entityId: r.factory ?? r.department ?? undefined,
          organizationId, type: 'worker_intelligence', category: 'worker',
          title: `Grievance hotspot`, description: `${r.total} grievances in ${r.factory ?? r.department ?? 'unknown location'}`,
          probability, confidenceScore: 65, riskLevel: probability > 65 ? 'high' : 'medium',
          reasoning: `Concentrated grievance volume indicates worker dissatisfaction risk.`,
          suggestedActions: ['Conduct satisfaction survey', 'Schedule management review', 'Increase anonymous reporting channels'],
          timeframe: '30d', metadata: { source: 'grievance_history', grievanceCount: r.total },
          createdAt: '', updatedAt: '',
        });
      }
    }

    const recentHighSeverity = severityRows.rows[0]?.total ?? 0;
    if (recentHighSeverity > 0) {
      predictions.push({
        id: '', entityType: 'organization', organizationId, type: 'worker_intelligence', category: 'worker',
        title: 'Rising high-severity grievances', description: `${recentHighSeverity} high/critical grievances in the last 30 days`,
        probability: Math.min(85, 40 + recentHighSeverity * 8), confidenceScore: 70,
        riskLevel: recentHighSeverity > 5 ? 'high' : 'medium',
        reasoning: 'High-severity grievances are trending upward and may signal systemic issues.',
        suggestedActions: ['Interview affected workers', 'Review department management', 'Escalate to HR'],
        timeframe: '30d', metadata: { source: 'grievance_trend', highSeverityCount: recentHighSeverity },
        createdAt: '', updatedAt: '',
      });
    }

    if (themeRows.rows.length > 0) {
      predictions.push({
        id: '', entityType: 'organization', organizationId, type: 'worker_intelligence', category: 'general',
        title: 'Repeated complaint themes', description: themeRows.rows.map((r) => `${r.total} ${r.category}`).join(', '),
        probability: 65, confidenceScore: 60, riskLevel: 'medium',
        reasoning: 'Recurring grievance themes indicate unresolved systemic issues.',
        suggestedActions: ['Address top complaint themes', 'Update grievance handling SOP', 'Train supervisors'],
        timeframe: '90d', metadata: { source: 'grievance_themes', themes: themeRows.rows },
        createdAt: '', updatedAt: '',
      });
    }

    for (const p of predictions) {
      await predictionService.create({
        organizationId: p.organizationId, type: p.type, category: p.category, entityType: p.entityType,
        entityId: p.entityId, title: p.title, description: p.description, probability: p.probability,
        confidenceScore: p.confidenceScore, reasoning: p.reasoning, suggestedActions: p.suggestedActions,
        riskLevel: p.riskLevel, timeframe: p.timeframe, metadata: p.metadata,
      });
    }

    return predictions;
  },

  async predictSupplierRisk(organizationId: string): Promise<PredictionRecord[]> {
    const [findingsRows, caseRows] = await Promise.all([
      query<{ supplier_id: string | null; total: number }>(
        `SELECT f.supplier_id, COUNT(*)::int as total FROM findings f JOIN audits a ON f.linked_audit_id = a.id WHERE a.organization_id = $1 AND f.supplier_id IS NOT NULL GROUP BY f.supplier_id`,
        [organizationId],
      ),
      query<{ supplier_id: string | null; total: number; avg_risk: string }>(
        `SELECT metadata->>'supplierId' as supplier_id, COUNT(*)::int as total, COALESCE(AVG(risk_score),0) as avg_risk FROM cases WHERE organization_id = $1 AND metadata->>'supplierId' IS NOT NULL AND is_deleted = FALSE GROUP BY metadata->>'supplierId'`,
        [organizationId],
      ),
    ]);

    const predictions: PredictionRecord[] = [];
    for (const r of findingsRows.rows) {
      if (r.total > 3) {
        predictions.push({
          id: '', entityType: 'supplier', entityId: r.supplier_id ?? undefined,
          organizationId, type: 'supplier_risk', category: 'supplier',
          title: `Supplier repeated findings`, description: `${r.total} findings linked to supplier`,
          probability: Math.min(85, 35 + r.total * 8), confidenceScore: 62,
          riskLevel: r.total > 8 ? 'high' : 'medium',
          reasoning: 'Supplier has multiple audit findings indicating compliance decline.',
          suggestedActions: ['Request corrective action plan', 'Schedule follow-up audit', 'Review supplier documentation'],
          timeframe: '60d', metadata: { source: 'audit_findings', findingsCount: r.total },
          createdAt: '', updatedAt: '',
        });
      }
    }
    for (const r of caseRows.rows) {
      const riskScore = parseFloat(r.avg_risk ?? '0');
      if (riskScore > 40) {
        predictions.push({
          id: '', entityType: 'supplier', entityId: r.supplier_id ?? undefined,
          organizationId, type: 'supplier_risk', category: 'supplier',
          title: 'Supplier compliance decline', description: `Average risk score ${riskScore.toFixed(1)} across ${r.total} supplier-linked cases`,
          probability: Math.min(80, 30 + riskScore), confidenceScore: 58,
          riskLevel: riskScore > 60 ? 'high' : 'medium',
          reasoning: 'Supplier-linked case risk scores indicate deteriorating compliance.',
          suggestedActions: ['Increase supplier monitoring', 'Require corrective actions', 'Assess alternative sources'],
          timeframe: '90d', metadata: { source: 'case_history', supplierId: r.supplier_id, avgRisk: riskScore },
          createdAt: '', updatedAt: '',
        });
      }
    }

    for (const p of predictions) {
      if (p.entityId) {
        await predictionService.create({
          organizationId: p.organizationId, type: p.type, category: p.category, entityType: p.entityType,
          entityId: p.entityId, title: p.title, description: p.description, probability: p.probability,
          confidenceScore: p.confidenceScore, reasoning: p.reasoning, suggestedActions: p.suggestedActions,
          riskLevel: p.riskLevel, timeframe: p.timeframe, metadata: p.metadata,
        });
      }
    }

    return predictions;
  },
};
