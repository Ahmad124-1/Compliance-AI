import { supplierCarbonApi } from './api.js';

export const supplierCarbonService = {
  listCarbonRecords: (params?: Record<string, unknown>) => supplierCarbonApi.records.list(params),
  getCarbonRecord: (id: string) => supplierCarbonApi.records.get(id),
  createCarbonRecord: (input: Record<string, unknown>) => supplierCarbonApi.records.create(input),
  updateCarbonRecord: (id: string, input: Record<string, unknown>) => supplierCarbonApi.records.update(id, input),
  deleteCarbonRecord: (id: string) => supplierCarbonApi.records.delete(id),
  listTargets: (params?: Record<string, unknown>) => supplierCarbonApi.targets.list(params),
  createTarget: (input: Record<string, unknown>) => supplierCarbonApi.targets.create(input),
  updateTarget: (id: string, input: Record<string, unknown>) => supplierCarbonApi.targets.update(id, input),
};