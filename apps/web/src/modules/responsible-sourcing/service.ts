import { responsibleSourcingApi } from './api.js';

export const responsibleSourcingService = {
  listMaterials: (params?: Record<string, unknown>) => responsibleSourcingApi.materials.list(params),
  getMaterial: (id: string) => responsibleSourcingApi.materials.get(id),
  createMaterial: (input: Record<string, unknown>) => responsibleSourcingApi.materials.create(input),
  updateMaterial: (id: string, input: Record<string, unknown>) => responsibleSourcingApi.materials.update(id, input),
  deleteMaterial: (id: string) => responsibleSourcingApi.materials.delete(id),
  getSourcingSummary: () => responsibleSourcingApi.summary.get(),
};