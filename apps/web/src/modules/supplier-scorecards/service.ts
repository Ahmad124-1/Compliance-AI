import { supplierScorecardApi } from './api.js';

export const supplierScorecardService = {
  listScorecards: (params?: Record<string, unknown>) => supplierScorecardApi.scorecards.list(params),
  getLatestScorecard: (supplierId: string) => supplierScorecardApi.scorecards.getLatest(supplierId),
  getBenchmark: () => supplierScorecardApi.scorecards.getBenchmark(),
  createScorecard: (input: Record<string, unknown>) => supplierScorecardApi.scorecards.create(input),
  deleteScorecard: (id: string) => supplierScorecardApi.scorecards.delete(id),
};