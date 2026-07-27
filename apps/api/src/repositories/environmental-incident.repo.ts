import { query } from '../db/pool.js';
import type { EnvironmentalIncident, IncidentType, IncidentSeverity, IncidentStatus, InvestigationStatus } from '../types/environment.js';

function mapEnvironmentalIncident(row: any): EnvironmentalIncident {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    incidentType: row.incident_type,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    incidentDate: row.incident_date,
    location: row.location,
    rootCause: row.root_cause,
    capaId: row.capa_id,
    investigationStatus: row.investigation_status,
    investigationNotes: row.investigation_notes,
    evidenceUrls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [],
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
    responsiblePersonId: row.responsible_person_id,
    reportedBy: row.reported_by,
    resolvedBy: row.resolved_by,
    resolutionDate: row.resolution_date,
    resolutionNotes: row.resolution_notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EnvironmentalIncidentFilter {
  facilityId?: string;
  siteId?: string;
  incidentType?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  startDate?: string;
  endDate?: string;
}

export const environmentalIncidentRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    incidentType: IncidentType;
    title: string;
    description?: string | null;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    incidentDate?: string;
    location?: string | null;
    rootCause?: string | null;
    capaId?: string | null;
    investigationStatus?: InvestigationStatus | null;
    investigationNotes?: string | null;
    evidenceUrls?: string[];
    timeline?: Record<string, unknown>[];
    responsiblePersonId?: string | null;
    reportedBy?: string | null;
    resolvedBy?: string | null;
    resolutionDate?: string | null;
    resolutionNotes?: string | null;
  }): Promise<EnvironmentalIncident> {
    const { rows } = await query<EnvironmentalIncident>(
      `INSERT INTO environmental_incidents (organization_id, facility_id, site_id, incident_type, title, description, severity, status, incident_date, location, root_cause, capa_id, investigation_status, investigation_notes, evidence_urls, timeline, responsible_person_id, reported_by, resolved_by, resolution_date, resolution_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.incidentType,
        input.title,
        input.description ?? null,
        input.severity ?? 'medium',
        input.status ?? 'open',
        input.incidentDate ? new Date(input.incidentDate).toISOString() : new Date().toISOString(),
        input.location ?? null,
        input.rootCause ?? null,
        input.capaId ?? null,
        input.investigationStatus ?? null,
        input.investigationNotes ?? null,
        input.evidenceUrls ?? [],
        input.timeline ?? [],
        input.responsiblePersonId ?? null,
        input.reportedBy ?? null,
        input.resolvedBy ?? null,
        input.resolutionDate ?? null,
        input.resolutionNotes ?? null,
      ],
    );
    return mapEnvironmentalIncident(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EnvironmentalIncident | null> {
    const { rows } = await query<EnvironmentalIncident>(
      `SELECT * FROM environmental_incidents WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEnvironmentalIncident(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EnvironmentalIncidentFilter = {}): Promise<EnvironmentalIncident[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.incidentType) { where.push(`incident_type = $${i++}`); params.push(filter.incidentType); }
    if (filter.severity) { where.push(`severity = $${i++}`); params.push(filter.severity); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.startDate) { where.push(`incident_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`incident_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<EnvironmentalIncident>(
      `SELECT * FROM environmental_incidents WHERE ${where.join(' AND ')} ORDER BY incident_date DESC`,
      params,
    );
    return rows.map(mapEnvironmentalIncident);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EnvironmentalIncident, 'incidentType' | 'title' | 'description' | 'severity' | 'status' | 'incidentDate' | 'location' | 'rootCause' | 'capaId' | 'investigationStatus' | 'investigationNotes' | 'evidenceUrls' | 'timeline' | 'responsiblePersonId' | 'resolvedBy' | 'resolutionDate' | 'resolutionNotes'>>): Promise<EnvironmentalIncident | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.incidentType !== undefined) set('incident_type', patch.incidentType);
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.incidentDate !== undefined) set('incident_date', new Date(patch.incidentDate).toISOString());
    if (patch.location !== undefined) set('location', patch.location);
    if (patch.rootCause !== undefined) set('root_cause', patch.rootCause);
    if (patch.capaId !== undefined) set('capa_id', patch.capaId);
    if (patch.investigationStatus !== undefined) set('investigation_status', patch.investigationStatus);
    if (patch.investigationNotes !== undefined) set('investigation_notes', patch.investigationNotes);
    if (patch.evidenceUrls !== undefined) set('evidence_urls', patch.evidenceUrls);
    if (patch.timeline !== undefined) set('timeline', patch.timeline);
    if (patch.responsiblePersonId !== undefined) set('responsible_person_id', patch.responsiblePersonId);
    if (patch.resolvedBy !== undefined) set('resolved_by', patch.resolvedBy);
    if (patch.resolutionDate !== undefined) set('resolution_date', patch.resolutionDate ? new Date(patch.resolutionDate).toISOString() : null);
    if (patch.resolutionNotes !== undefined) set('resolution_notes', patch.resolutionNotes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EnvironmentalIncident>(
      `UPDATE environmental_incidents SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEnvironmentalIncident(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE environmental_incidents SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
