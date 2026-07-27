import { supplierRiskApi } from './api.js';

export const supplierRiskService = {
  listRisks: (params?: Record<string, unknown>) => supplierRiskApi.risks.list(params),
  getRisk: (id: string) => supplierRiskApi.risks.get(id),
  createRisk: (input: Record<string, unknown>) => supplierRiskApi.risks.create(input),
  updateRisk: (id: string, input: Record<string, unknown>) => supplierRiskApi.risks.update(id, input),
  closeRisk: (id: string) => supplierRiskApi.risks.close(id),
  deleteRisk: (id: string) => supplierRiskApi.risks.delete(id),
  getRiskHeatmap: () => supplierRiskApi.heatmap.get(),
};