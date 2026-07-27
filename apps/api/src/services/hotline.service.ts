import { NotFoundError } from '../core/errors.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface HotlineContact {
  id: string;
  type: 'emergency' | 'compliance' | 'hr' | 'external' | 'ethics';
  name: string;
  phone: string | null;
  email: string | null;
  availableHours: string | null;
  description: string | null;
  is24x7: boolean;
}

export interface EmergencyReportInput {
  organizationId: string;
  caseId?: string | null;
  reporterName?: string | null;
  reporterPhone?: string | null;
  emergencyType: string;
  description: string;
  location: string | null;
}

export const hotlineService = {
  async getContacts(orgId: string): Promise<HotlineContact[]> {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');

    const settings = (org.settings || {}) as Record<string, unknown>;
    const contacts: HotlineContact[] = [];

    if (settings.hotlineNumber || settings.emergencyPhone) {
      contacts.push({
        id: `${orgId}-emergency-hotline`,
        type: 'emergency',
        name: 'Emergency Hotline',
        phone: String(settings.hotlineNumber || settings.emergencyPhone || ''),
        email: null,
        availableHours: '24/7',
        description: 'Emergency reporting and immediate assistance',
        is24x7: true,
      });
    }

    if (settings.complianceEmail || settings.complaintEmail) {
      contacts.push({
        id: `${orgId}-compliance-officer`,
        type: 'compliance',
        name: 'Compliance Officer',
        email: String(settings.complianceEmail || settings.complaintEmail || ''),
        phone: null,
        availableHours: 'Business hours',
        description: 'Compliance officer for ethics concerns',
        is24x7: false,
      });
    }

    if (settings.hrEmail || settings.hrPhone) {
      contacts.push({
        id: `${orgId}-hr-contact`,
        type: 'hr',
        name: 'Human Resources',
        email: String(settings.hrEmail || ''),
        phone: String(settings.hrPhone || ''),
        availableHours: 'Business hours',
        description: 'HR contact for worker concerns',
        is24x7: false,
      });
    }

    contacts.push({
      id: `${orgId}-external-ethics`,
      type: 'external',
      name: 'External Ethics Line',
      email: 'ethics@external.org',
      phone: '+1-800-ETHICS',
      availableHours: '24/7',
      description: 'Third-party anonymous ethics hotline',
      is24x7: true,
    });

    return contacts;
  },

  async submitEmergencyReport(input: EmergencyReportInput, actorId?: string) {
    const case_ = await caseService.createCase({
      organizationId: input.organizationId,
      title: `Emergency Report: ${input.emergencyType}`,
      description: input.description,
      category: 'ethics',
      source: 'hotline',
      priority: 'critical',
      reporterName: input.reporterName ?? null,
      reporterPhone: input.reporterPhone ?? null,
      reporterAnonymous: !input.reporterName,
      metadata: { location: input.location, emergencyType: input.emergencyType, caseId: input.caseId },
    }, actorId);

    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'hotline.emergency_report', entity: 'case', entityId: case_.id });
    return case_;
  },
};

import { caseService } from './case.service.js';
import { audit } from '../core/audit.js';
