import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { qrCodeRepo } from '../repositories/qr-code.repo.js';
import { qrScanEventRepo } from '../repositories/qr-scan-event.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { caseRepo } from '../repositories/case.repo.js';

export interface QrCodeInput {
  organizationId: string;
  name: string;
  type: string;
  url: string;
  siteId?: string | null;
  departmentId?: string | null;
  configuration?: Record<string, unknown>;
  isActive?: boolean;
}

export const qrService = {
  async createQrCode(input: QrCodeInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const code = `QR-${org.slug}-${Date.now().toString(36).toUpperCase()}`;
    const qrCode = await qrCodeRepo.create({ ...input, code, scanCount: 0 });
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'qr.create', entity: 'qr_code', entityId: qrCode.id });
    return qrCode;
  },

  async getQrCode(orgId, id) {
    const qrCode = await qrCodeRepo.findById(id);
    if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
    return qrCode;
  },

  async getQrCodeByCode(code) {
    return qrCodeRepo.findByCode(code);
  },

  async listQrCodes(orgId, filters: any = {}) {
    return qrCodeRepo.findByOrganization(orgId, filters);
  },

  async updateQrCode(orgId, id, patch, actorId?) {
    const qrCode = await qrCodeRepo.findById(id);
    if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
    const updated = await qrCodeRepo.update(id, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'qr.update', entity: 'qr_code', entityId: id });
    return updated;
  },

  async deleteQrCode(orgId, id) {
    const qrCode = await qrCodeRepo.findById(id);
    if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
    await qrCodeRepo.delete(id);
    await audit({ organizationId: orgId, action: 'qr.delete', entity: 'qr_code', entityId: id });
  },

  async regenerateQrCode(orgId, id) {
    const qrCode = await qrCodeRepo.findById(id);
    if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const code = `QR-${org.slug}-${Date.now().toString(36).toUpperCase()}`;
    const updated = await qrCodeRepo.update(id, { code });
    await audit({ organizationId: orgId, action: 'qr.regenerate', entity: 'qr_code', entityId: id });
    return updated;
  },

  async recordScan(orgId, qrCodeId, eventData) {
    const qrCode = await qrCodeRepo.findById(qrCodeId);
    if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
    const event = await qrScanEventRepo.create({ organizationId: orgId, qrCodeId, ...eventData });
    await qrCodeRepo.incrementScan(qrCodeId);
    if (qrCode.url.includes('cases')) {
      const caseMatch = qrCode.url.match(/\/cases\/([^/]+)/);
      if (caseMatch) {
        const caseId = caseMatch[1];
        const case_ = await caseRepo.findById(caseId);
        if (case_ && case_.organizationId === orgId) {
          await caseRepo.createActivity({ caseId, actorId: null, activityType: 'qr_scan', description: 'QR code scanned', metadata: { qrCodeId, eventId: event.id } });
        }
      }
    }
    await audit({ organizationId: orgId, action: 'qr.scan', entity: 'qr_code', entityId: qrCodeId, metadata: { eventId: event.id } });
    return event;
  },

  async getQrAnalytics(orgId, qrCodeId?, filters: any = {}) {
    if (qrCodeId) {
      const qrCode = await qrCodeRepo.findById(qrCodeId);
      if (!qrCode || qrCode.organizationId !== orgId) throw new NotFoundError('QR code not found');
      return qrScanEventRepo.getAnalytics(qrCodeId);
    }
    return qrScanEventRepo.getOrgAnalytics(orgId, filters);
  },

  async getQrStats(orgId, filters: any = {}) {
    const qrCodes = await qrCodeRepo.findByOrganization(orgId, filters);
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0);
    return {
      totalQrCodes: qrCodes.length,
      activeQrCodes: qrCodes.filter((qr) => qr.isActive).length,
      totalScans,
    };
  },

  async downloadQrPng(orgId, id) {
    const qrCode = await this.getQrCode(orgId, id);
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(qrCode.code, 20, 200);
    return canvas.toBuffer('image/png');
  },

  async downloadQrSvg(orgId, id) {
    const qrCode = await this.getQrCode(orgId, id);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="10" y="100" font-family="Arial" font-size="14" fill="black">${qrCode.code}</text></svg>`;
    return Buffer.from(svg);
  },
};
