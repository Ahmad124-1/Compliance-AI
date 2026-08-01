import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { environmentalIncidentRepo } from '../repositories/environmental-incident.repo.js';

export const environmentalIncidentsService = {
  async list(orgId: string, filter: Record<string, unknown> = {}) {
    return environmentalIncidentRepo.listByOrganization(orgId, {
      facilityId: filter.facilityId as string | undefined,
      siteId: filter.siteId as string | undefined,
      incidentType: filter.incidentType as any,
      severity: filter.severity as any,
      status: filter.status as any,
      startDate: filter.startDate as string | undefined,
      endDate: filter.endDate as string | undefined,
    });
  },
  async get(orgId: string, id: string) {
    const incident = await environmentalIncidentRepo.findById(id, orgId);
    if (!incident) throw new NotFoundError('Environmental incident not found');
    return incident;
  },
  async create(orgId: string, input: Record<string, unknown>, userId?: string) {
    const incident = await environmentalIncidentRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      siteId: input.siteId as string | undefined,
      incidentType: input.incidentType as any,
      title: input.title as string,
      description: input.description as string | undefined,
      severity: input.severity as any,
      status: input.status as any,
      incidentDate: input.incidentDate as string | undefined,
      location: input.location as string | undefined,
      rootCause: input.rootCause as string | undefined,
      capaId: input.capaId as string | undefined,
      investigationStatus: input.investigationStatus as any,
      investigationNotes: input.investigationNotes as string | undefined,
      evidenceUrls: input.evidenceUrls as string[] | undefined,
      timeline: input.timeline as Record<string, unknown>[] | undefined,
      responsiblePersonId: input.responsiblePersonId as string | undefined,
      reportedBy: userId,
      resolvedBy: input.resolvedBy as string | undefined,
      resolutionDate: input.resolutionDate as string | undefined,
      resolutionNotes: input.resolutionNotes as string | undefined,
    });
    await audit({ action: 'incident.create', entity: 'environmental_incident', entityId: incident.id, organizationId: orgId, actorId: userId });
    return incident;
  },
  async update(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['incidentType','title','description','severity','status','incidentDate','location','rootCause','capaId','investigationStatus','investigationNotes','evidenceUrls','timeline','responsiblePersonId','resolvedBy','resolutionDate','resolutionNotes'];
    for (const f of fields) { if (input[f] !== undefined) patch[f] = input[f]; }
    const incident = await environmentalIncidentRepo.update(id, orgId, patch as any);
    if (!incident) throw new NotFoundError('Environmental incident not found');
    await audit({ action: 'incident.update', entity: 'environmental_incident', entityId: id, organizationId: orgId, actorId: userId });
    return incident;
  },
  async delete(orgId: string, id: string, userId?: string) {
    const existing = await environmentalIncidentRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Environmental incident not found');
    await environmentalIncidentRepo.softDelete(id, orgId);
    await audit({ action: 'incident.delete', entity: 'environmental_incident', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },
};
