import { query } from '../db/pool.js';

// =====================================================================
// PHASE 4 — SPRINT 4.2: AUTO POPULATION & BUSINESS LOGIC
// Removes repetitive manual data entry. Every module automatically
// populates information already available elsewhere. All computations
// derive from existing tables at read time — no placeholders, no mock
// values, no duplicated calculations.
// =====================================================================

export interface AutoFill {
  facilityId: string | null;
  facilityName: string | null;
  supplierIds: string[];
  projectId: string | null;
  projectName: string | null;
  kpiId: string | null;
  kpiName: string | null;
  reportingPeriodId: string | null;
  reportingPeriodName: string | null;
  documentIds: string[];
  programId: string | null;
  programName: string | null;
  goalId: string | null;
  goalName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  siteId: string | null;
  siteName: string | null;
  userId: string | null;
  userName: string | null;
}

const first = (rows: any[]): { id: string | null; name: string | null } =>
  rows.length > 0 ? { id: rows[0].id, name: rows[0].name } : { id: null, name: null };

export class AutoPopulateService {
  // Smart defaults — most relevant existing record per master entity.
  async getAutoFill(orgId: string, opts: Record<string, string | null | undefined> = {}): Promise<AutoFill> {
    const [facility, program, kpi, project, period, goal, department, site, suppliers, documents, user] = await Promise.all([
      query(`SELECT id, name FROM facilities WHERE organization_id=$1 AND is_deleted=FALSE ORDER BY created_at ASC LIMIT 1`, [orgId]),
      query(`SELECT id, name FROM sustainability_programs WHERE organization_id=$1 AND is_deleted=FALSE AND ($2::uuid IS NULL OR id=$2::uuid) ORDER BY created_at ASC LIMIT 1`, [orgId, opts.programId ?? null]),
      query(`SELECT id, name FROM sustainability_kpis WHERE organization_id=$1 AND is_deleted=FALSE AND ($2::uuid IS NULL OR id=$2::uuid) AND ($3::uuid IS NULL OR program_id=$3::uuid) ORDER BY created_at ASC LIMIT 1`, [orgId, opts.kpiId ?? null, opts.programId ?? null]),
      query(`SELECT id, name FROM carbon_projects WHERE organization_id=$1 AND is_deleted=FALSE AND ($2::uuid IS NULL OR id=$2::uuid) AND ($3::uuid IS NULL OR facility_id=$3::uuid) ORDER BY created_at ASC LIMIT 1`, [orgId, opts.projectId ?? null, opts.facilityId ?? null]),
      query(`SELECT id, name FROM esg_reporting_periods WHERE organization_id=$1 AND is_deleted=FALSE AND ($2::uuid IS NULL OR id=$2::uuid) ORDER BY start_date DESC, created_at DESC LIMIT 1`, [orgId, opts.reportingPeriodId ?? null]),
      query(`SELECT id, name FROM esg_goals WHERE organization_id=$1 AND is_deleted=FALSE AND ($2::uuid IS NULL OR id=$2::uuid) AND ($3::uuid IS NULL OR program_id=$3::uuid) ORDER BY created_at ASC LIMIT 1`, [orgId, opts.goalId ?? null, opts.programId ?? null]),
      query(`SELECT id, name FROM departments WHERE organization_id=$1 AND ($2::uuid IS NULL OR id=$2::uuid) ORDER BY created_at ASC LIMIT 1`, [orgId, opts.departmentId ?? null]),
      query(`SELECT id, name FROM sites WHERE organization_id=$1 ORDER BY created_at ASC LIMIT 1`, [orgId]),
      query(`SELECT id, name FROM suppliers WHERE organization_id=$1 ORDER BY created_at ASC LIMIT 5`, [orgId]),
      query(`SELECT id, filename AS name FROM documents WHERE organization_id=$1 AND status='ready' ORDER BY created_at DESC LIMIT 10`, [orgId]),
      query(`SELECT id, name FROM users WHERE organization_id=$1 ORDER BY created_at ASC LIMIT 1`, [orgId]),
    ]);

    const f = first(facility.rows); const p = first(program.rows); const k = first(kpi.rows);
    const pr = first(project.rows); const pe = first(period.rows); const g = first(goal.rows);
    const d = first(department.rows); const s = first(site.rows); const u = first(user.rows);

    return {
      facilityId: f.id, facilityName: f.name,
      supplierIds: suppliers.rows.map((r: any) => r.id),
      projectId: pr.id, projectName: pr.name,
      kpiId: k.id, kpiName: k.name,
      reportingPeriodId: pe.id, reportingPeriodName: pe.name,
      documentIds: documents.rows.map((r: any) => r.id),
      programId: p.id, programName: p.name,
      goalId: g.id, goalName: g.name,
      departmentId: d.id, departmentName: d.name,
      siteId: s.id, siteName: s.name,
      userId: u.id, userName: u.name,
    };
  }

  /** Project Progress % = completed vs total milestones. */
  async getProjectProgress(orgId: string, projectId?: string | null) {
    const { rows } = await query(
      `SELECT c.id, c.name,
              COALESCE(SUM(CASE WHEN ch.status='completed' THEN 1 ELSE 0 END),0)::int AS completed,
              COUNT(ch.id)::int AS total
         FROM carbon_projects c
         LEFT JOIN project_milestones ch ON ch.project_id = c.id
        WHERE c.organization_id=$1 AND c.is_deleted=FALSE AND ($2::uuid IS NULL OR c.id=$2::uuid)
        GROUP BY c.id, c.name ORDER BY c.name ASC`,
      [orgId, projectId ?? null],
    );
    return rows.map((r: any) => {
      const total = Number(r.total ?? 0); const completed = Number(r.completed ?? 0);
      return { id: r.id, name: r.name, progressPct: total === 0 ? 0 : Math.round((completed / total) * 100), completedMilestones: completed, totalMilestones: total };
    });
  }

  /** Goal Progress % = current vs target (baseline-adjusted). */
  async getGoalProgress(orgId: string, programId?: string | null) {
    const { rows } = await query(
      `SELECT g.id, g.name, g.current_value, g.target_value, g.baseline FROM esg_goals g
        WHERE g.organization_id=$1 AND g.is_deleted=FALSE AND ($2::uuid IS NULL OR g.program_id=$2::uuid)
        ORDER BY g.name ASC`,
      [orgId, programId ?? null],
    );
    return rows.map((r: any) => {
      const target = Number(r.target_value ?? 0); const current = Number(r.current_value ?? 0);
      const baseline = r.baseline == null ? null : Number(r.baseline);
      let pct = 0;
      if (target !== 0) {
        pct = baseline !== null && target !== baseline
          ? Math.min(100, Math.max(0, Math.round(((current - baseline) / (target - baseline)) * 100)))
          : Math.min(100, Math.max(0, Math.round((current / target) * 100)));
      }
      return { id: r.id, name: r.name, progressPct: pct, currentValue: current, targetValue: target, baseline };
    });
  }

  /** Target Progress % for carbon reduction / SBTI targets. */
  async getTargetProgress(orgId: string) {
    const { rows } = await query(
      `SELECT t.id, t.name, t.current_value, t.target_value FROM reduction_targets t
        WHERE t.organization_id=$1 AND t.is_deleted=FALSE ORDER BY t.name ASC`,
      [orgId],
    );
    return rows.map((r: any) => {
      const target = Number(r.target_value ?? 0); const current = Number(r.current_value ?? 0);
      return { id: r.id, name: r.name, progressPct: target === 0 ? 0 : Math.min(100, Math.max(0, Math.round((current / target) * 100))), currentValue: current, targetValue: target };
    });
  }

  /** KPI Status — on_track / at_risk / critical / no_data from latest measurement. */
  async getKpiStatuses(orgId: string, programId?: string | null) {
    const { rows } = await query(
      `SELECT k.id, k.name, k.target_value, k.threshold_warning, k.threshold_critical,
              (SELECT m.value FROM kpi_measurements m WHERE m.kpi_id=k.id ORDER BY m.recorded_at DESC LIMIT 1) AS latest
         FROM sustainability_kpis k
        WHERE k.organization_id=$1 AND k.is_deleted=FALSE AND ($2::uuid IS NULL OR k.program_id=$2::uuid)
        ORDER BY k.name ASC`,
      [orgId, programId ?? null],
    );
    return rows.map((r: any) => {
      const latest = r.latest == null ? null : Number(r.latest);
      const target = r.target_value == null ? null : Number(r.target_value);
      const warning = r.threshold_warning == null ? null : Number(r.threshold_warning);
      const critical = r.threshold_critical == null ? null : Number(r.threshold_critical);
      let status = 'no_data';
      if (latest !== null && target !== null) {
        const pct = target === 0 ? 100 : Math.abs(latest / target) * 100;
        if (critical !== null && pct <= critical) status = 'critical';
        else if (warning !== null && pct <= warning) status = 'at_risk';
        else status = 'on_track';
      }
      return { id: r.id, name: r.name, status, latestValue: latest, targetValue: target, warningThreshold: warning, criticalThreshold: critical };
    });
  }

  /** Carbon Reduction = sum of offset quantities per project. */
  async getCarbonReduction(orgId: string, facilityId?: string | null) {
    const { rows } = await query(
      `SELECT c.id, c.name, COALESCE(SUM(co.quantity_tco2e),0) AS reduction
         FROM carbon_projects c LEFT JOIN carbon_offsets co ON co.project_id=c.id
        WHERE c.organization_id=$1 AND c.is_deleted=FALSE AND ($2::uuid IS NULL OR c.facility_id=$2::uuid)
        GROUP BY c.id, c.name ORDER BY c.name ASC`,
      [orgId, facilityId ?? null],
    );
    return rows.map((r: any) => ({ id: r.id, name: r.name, reductionTco2e: Math.round(Number(r.reduction ?? 0) * 100) / 100 }));
  }

  /** Emission Totals by scope from emission records × factors. */
  async getEmissionTotals(orgId: string, facilityId?: string | null, fromDate?: string | null, toDate?: string | null) {
    const { rows } = await query(
      `SELECT s.name AS scope, COALESCE(SUM(e.quantity * e.emission_factor_value),0) AS total, COUNT(e.id)::int AS record_count
         FROM emission_records e LEFT JOIN ghg_scopes s ON s.id=e.scope_id
        WHERE e.organization_id=$1 AND ($2::uuid IS NULL OR e.facility_id=$2::uuid)
          AND ($3::date IS NULL OR e.recorded_at >= $3::date) AND ($4::date IS NULL OR e.recorded_at <= $4::date)
        GROUP BY s.name, s.sort_order ORDER BY s.sort_order ASC NULLS LAST`,
      [orgId, facilityId ?? null, fromDate ?? null, toDate ?? null],
    );
    return rows.map((r: any) => ({ scope: r.scope ?? 'unassigned', totalTco2e: Math.round(Number(r.total ?? 0) * 100) / 100, recordCount: Number(r.record_count ?? 0) }));
  }

  /** Supplier Contribution = per-supplier carbon + share %. */
  async getSupplierContributions(orgId: string) {
    const { rows } = await query(
      `SELECT su.id, su.name, COALESCE(SUM(sc.total_tco2e),0) AS contribution
         FROM suppliers su LEFT JOIN supplier_carbon sc ON sc.supplier_id=su.id AND sc.organization_id=$1
        WHERE su.organization_id=$1
        GROUP BY su.id, su.name HAVING COALESCE(SUM(sc.total_tco2e),0) > 0
        ORDER BY contribution DESC`,
      [orgId],
    );
    const total = rows.reduce((acc: number, r: any) => acc + Number(r.contribution ?? 0), 0);
    return rows.map((r: any) => {
      const c = Number(r.contribution ?? 0);
      return { id: r.id, name: r.name, contributionTco2e: Math.round(c * 100) / 100, contributionPct: total === 0 ? 0 : Math.round((c / total) * 100) };
    });
  }

  /** Compliance % from real requirement statuses. */
  async getCompliancePct(orgId: string) {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(SUM(CASE WHEN status='compliant' THEN 1 ELSE 0 END),0)::int AS compliant,
              COALESCE(SUM(CASE WHEN status='non_compliant' THEN 1 ELSE 0 END),0)::int AS non_compliant
         FROM compliance_requirements WHERE organization_id=$1`,
      [orgId],
    );
    const total = Number(rows[0]?.total ?? 0); const compliant = Number(rows[0]?.compliant ?? 0); const nonCompliant = Number(rows[0]?.non_compliant ?? 0);
    return { totalRequirements: total, compliant, nonCompliant, compliancePct: total === 0 ? 0 : Math.round((compliant / total) * 100) };
  }

  /** ESG Progress = average goal progress per pillar + overall. */
  async getEsgProgress(orgId: string, programId?: string | null) {
    const goals = await this.getGoalProgress(orgId, programId ?? null);
    const { rows } = await query(`SELECT id, esg_pillar FROM esg_goals WHERE organization_id=$1 AND is_deleted=FALSE`, [orgId]);
    const pillarOf = new Map(rows.map((r: any) => [r.id, r.esg_pillar]));
    const by: Record<string, number[]> = { environment: [], social: [], governance: [] };
    for (const g of goals) { const p = pillarOf.get(g.id) ?? 'environment'; if (by[p]) by[p].push(g.progressPct); }
    const avg = (a: number[]) => (a.length === 0 ? 0 : Math.round(a.reduce((x, y) => x + y, 0) / a.length));
    const environment = avg(by.environment); const social = avg(by.social); const governance = avg(by.governance);
    const all = [environment, social, governance].filter((v) => v > 0);
    return { environment, social, governance, overall: all.length === 0 ? 0 : Math.round(all.reduce((a, b) => a + b, 0) / all.length) };
  }

  /** Evidence Count per entity type. */
  async getEvidenceCounts(orgId: string, entityType?: string | null) {
    const { rows } = await query(
      `SELECT entity_type, COUNT(*)::int AS count FROM sustainability_evidence e
        WHERE e.organization_id=$1 AND ($2::text IS NULL OR e.entity_type=$2::text)
        GROUP BY e.entity_type ORDER BY e.entity_type ASC`,
      [orgId, entityType ?? null],
    );
    return rows.map((r: any) => ({ entityType: r.entity_type, count: Number(r.count ?? 0) }));
  }

  /** Report Completion % from linked evidence + approval status. */
  async getReportCompletion(orgId: string) {
    const { rows } = await query(
      `SELECT r.id, r.name, r.status,
              (SELECT COUNT(*)::int FROM sustainability_evidence e WHERE e.entity_type='report' AND e.entity_id=r.id) AS evidence_count
         FROM sustainability_reports r WHERE r.organization_id=$1 AND r.is_deleted=FALSE
        ORDER BY r.created_at DESC`,
      [orgId],
    );
    const SECTIONS = 6;
    return rows.map((r: any) => {
      const ec = Number(r.evidence_count ?? 0);
      const sc = Math.min(SECTIONS, ec + (r.status === 'approved' ? 1 : 0));
      return { id: r.id, name: r.name, completionPct: Math.round((sc / SECTIONS) * 100), sectionsComplete: sc, totalSections: SECTIONS, status: r.status };
    });
  }

  /** Report Snapshot — aggregates existing data into one payload. */
  async getReportSnapshot(orgId: string, reportId?: string | null): Promise<Record<string, unknown>> {
    const [goals, kpis, projects, emissions, compliance, esg, suppliers, evidence, reports] = await Promise.all([
      this.getGoalProgress(orgId), this.getKpiStatuses(orgId), this.getProjectProgress(orgId),
      this.getEmissionTotals(orgId), this.getCompliancePct(orgId), this.getEsgProgress(orgId),
      this.getSupplierContributions(orgId), this.getEvidenceCounts(orgId),
      reportId ? this.getReportCompletion(orgId).then((r) => r.filter((x) => x.id === reportId)) : this.getReportCompletion(orgId),
    ]);
    const report = reports[0] ?? null;
    return {
      generatedAt: new Date().toISOString(),
      reportId: report ? report.id : null, reportName: report ? report.name : null,
      reportStatus: report ? report.status : null, reportCompletionPct: report ? report.completionPct : 0,
      goals, kpis, projects, emissions, compliance, esgProgress: esg, supplierContributions: suppliers, evidenceCounts: evidence,
      totals: {
        goalCount: goals.length, kpiCount: kpis.length, projectCount: projects.length,
        evidenceCount: evidence.reduce((acc: number, e: any) => acc + e.count, 0), supplierCount: suppliers.length,
        scope1Tco2e: emissions.find((e: any) => String(e.scope).toLowerCase().includes('1'))?.totalTco2e ?? 0,
        scope2Tco2e: emissions.find((e: any) => String(e.scope).toLowerCase().includes('2'))?.totalTco2e ?? 0,
        scope3Tco2e: emissions.find((e: any) => String(e.scope).toLowerCase().includes('3'))?.totalTco2e ?? 0,
      },
    };
  }
}

export const autoPopulateService = new AutoPopulateService();