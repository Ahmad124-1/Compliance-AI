import { audit } from '../../../core/audit.js';
import { grievanceRepo, attachmentRepo } from '../repositories/grievance.repo.js';
import { categoryRepo, sourceRepo, channelRepo, languageRepo, portalConfigRepo, qrPortalRepo } from '../repositories/lookup.repo.js';
import type { Grievance, GrievanceAttachment, GrievanceCategory, ComplaintSource, GrievanceChannel, Language, WorkerPortalConfiguration, QRPortal, GrievanceCreateInput, GrievanceUpdateInput, GrievanceStatus } from '../types.js';

const DEFAULT_CATEGORIES = [
  { name: 'Harassment', code: 'harassment' },
  { name: 'Discrimination', code: 'discrimination' },
  { name: 'Working Hours', code: 'working_hours' },
  { name: 'Overtime', code: 'overtime' },
  { name: 'Wages', code: 'wages' },
  { name: 'Health & Safety', code: 'health_safety' },
  { name: 'Forced Labour', code: 'forced_labour' },
  { name: 'Child Labour', code: 'child_labour' },
  { name: 'Abuse', code: 'abuse' },
  { name: 'Violence', code: 'violence' },
  { name: 'Environmental Issue', code: 'environmental' },
  { name: 'Corruption', code: 'corruption' },
  { name: 'Human Rights', code: 'human_rights' },
  { name: 'Ethics', code: 'ethics' },
  { name: 'Suggestion', code: 'suggestion' },
  { name: 'Other', code: 'other' },
];

const DEFAULT_SOURCES = [
  { name: 'Website', code: 'website' },
  { name: 'QR Code', code: 'qr' },
  { name: 'Email', code: 'email' },
  { name: 'SMS', code: 'sms' },
  { name: 'WhatsApp', code: 'whatsapp' },
  { name: 'Phone', code: 'phone' },
  { name: 'Walk-In', code: 'walk-in' },
  { name: 'Suggestion Box', code: 'suggestion_box' },
  { name: 'NGO', code: 'ngo' },
  { name: 'Union', code: 'union' },
  { name: 'Government', code: 'government' },
];

const DEFAULT_CHANNELS = [
  { name: 'Email', code: 'email' },
  { name: 'SMS', code: 'sms' },
  { name: 'WhatsApp', code: 'whatsapp' },
  { name: 'Phone', code: 'phone' },
  { name: 'In-App', code: 'in_app' },
];

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export const grievanceService = {
  async create(input: GrievanceCreateInput & { trackingNumber: string; trackingPIN: string }): Promise<Grievance> {
    const grievance = await grievanceRepo.create(input);
    await audit({ organizationId: input.organizationId, action: 'grievance.create', entity: 'grievance', entityId: grievance.id });
    return grievance;
  },

  async findById(id: string): Promise<Grievance | null> {
    return grievanceRepo.findById(id);
  },

  async findByTracking(trackingNumber: string): Promise<Grievance | null> {
    return grievanceRepo.findByTrackingNumber(trackingNumber);
  },

  async findByTrackingAndPIN(trackingNumber: string, pin: string): Promise<Grievance | null> {
    return grievanceRepo.findByTrackingNumberAndPIN(trackingNumber, pin);
  },

  async list(orgId: string, filter: { status?: GrievanceStatus; category?: string; source?: string } = {}): Promise<Grievance[]> {
    return grievanceRepo.listByOrganization(orgId, filter);
  },

  async update(id: string, patch: GrievanceUpdateInput): Promise<Grievance | null> {
    const updated = await grievanceRepo.update(id, patch);
    if (updated) {
      await audit({ organizationId: updated.organizationId, action: 'grievance.update', entity: 'grievance', entityId: updated.id });
    }
    return updated;
  },

  async addAttachment(input: { grievanceId: string; filename: string; mimeType: string; sizeBytes: number; storagePath: string }): Promise<GrievanceAttachment> {
    const attachment = await attachmentRepo.create(input);
    await audit({ action: 'grievance.attachment.create', entity: 'grievance_attachment', entityId: attachment.id });
    return attachment;
  },

  async getAttachments(grievanceId: string): Promise<GrievanceAttachment[]> {
    return attachmentRepo.findByGrievance(grievanceId);
  },
};

export const lookupService = {
  async seedDefaults(): Promise<void> {
    for (const c of DEFAULT_CATEGORIES) {
      await categoryRepo.create({ name: c.name, code: c.code });
    }
    for (const s of DEFAULT_SOURCES) {
      await sourceRepo.create({ name: s.name, code: s.code });
    }
    for (const c of DEFAULT_CHANNELS) {
      await channelRepo.create({ name: c.name, code: c.code });
    }
    for (const l of DEFAULT_LANGUAGES) {
      await languageRepo.create({ code: l.code, name: l.name });
    }
  },

  async categories(organizationId?: string): Promise<GrievanceCategory[]> {
    return categoryRepo.list(organizationId);
  },

  async createCategory(input: { organizationId?: string | null; name: string; code: string }): Promise<GrievanceCategory> {
    return categoryRepo.create(input);
  },

  async sources(): Promise<ComplaintSource[]> {
    return sourceRepo.list();
  },

  async channels(): Promise<GrievanceChannel[]> {
    return channelRepo.list();
  },

  async languages(): Promise<Language[]> {
    return languageRepo.list();
  },

  async portalConfig(organizationId: string): Promise<WorkerPortalConfiguration | null> {
    return portalConfigRepo.findByOrganization(organizationId);
  },

  async upsertPortalConfig(input: { organizationId: string; theme?: Record<string, unknown>; languages?: string[]; customText?: Record<string, unknown> }): Promise<WorkerPortalConfiguration> {
    return portalConfigRepo.upsert(input);
  },
};

export const qrService = {
  async create(input: { organizationId: string; portalUrl: string; configuration?: Record<string, unknown> }): Promise<QRPortal> {
    const portal = await qrPortalRepo.create(input);
    await audit({ organizationId: input.organizationId, action: 'qr_portal.create', entity: 'qr_portal', entityId: portal.id });
    return portal;
  },

  async list(organizationId: string): Promise<QRPortal[]> {
    return qrPortalRepo.listByOrganization(organizationId);
  },

  async findById(id: string): Promise<QRPortal | null> {
    return qrPortalRepo.findById(id);
  },
};
