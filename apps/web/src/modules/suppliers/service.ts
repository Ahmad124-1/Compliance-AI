import { supplierApi } from './api.js';

export const supplierService = {
  listSuppliers: (params?: Record<string, unknown>) => supplierApi.suppliers.list(params),
  getSupplier: (id: string) => supplierApi.suppliers.get(id),
  createSupplier: (input: Record<string, unknown>) => supplierApi.suppliers.create(input),
  updateSupplier: (id: string, input: Record<string, unknown>) => supplierApi.suppliers.update(id, input),
  deleteSupplier: (id: string) => supplierApi.suppliers.delete(id),
  getSupplierStats: () => supplierApi.stats.get(),
  getSupplierRanking: () => supplierApi.ranking.get(),
  getSupplierFacilities: (supplierId: string) => supplierApi.facilities.list(supplierId),
  createFacility: (supplierId: string, input: Record<string, unknown>) => supplierApi.facilities.create(supplierId, input),
};