import { certificationApi } from './api.js';

export const certificationService = {
  listCertifications: (params?: Record<string, unknown>) => certificationApi.certifications.list(params),
  getCertification: (id: string) => certificationApi.certifications.get(id),
  createCertification: (input: Record<string, unknown>) => certificationApi.certifications.create(input),
  verifyCertification: (id: string, status: string) => certificationApi.certifications.verify(id, status),
  updateCertificationStatus: (id: string, status: string) => certificationApi.certifications.updateStatus(id, status),
  deleteCertification: (id: string) => certificationApi.certifications.delete(id),
  getExpiringCertifications: (daysAhead?: number) => certificationApi.expiring.get(daysAhead),
};