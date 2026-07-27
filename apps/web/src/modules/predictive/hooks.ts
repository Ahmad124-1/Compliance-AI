import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { predictiveApi } from './api.js';
import type { PredictionQuery, RunScenarioInput, GenerateRecommendationsInput } from './types.js';

export function usePredictions(query: PredictionQuery = {}) {
  return useQuery({
    queryKey: ['predictions', query],
    queryFn: () => predictiveApi.predictions(query),
  });
}

export function usePredictionStats() {
  return useQuery({
    queryKey: ['prediction-stats'],
    queryFn: () => predictiveApi.predictionStats(),
  });
}

export function useRiskForecast(timeframe?: string) {
  return useQuery({
    queryKey: ['risk-forecast', timeframe],
    queryFn: () => predictiveApi.riskForecast(timeframe),
  });
}

export function useAuditPrediction(auditId?: string, departmentId?: string) {
  return useQuery({
    queryKey: ['audit-prediction', auditId, departmentId],
    queryFn: () => predictiveApi.auditPrediction(auditId, departmentId),
  });
}

export function useTrends(metric?: string, period = 'month') {
  return useQuery({
    queryKey: ['trends', metric, period],
    queryFn: () => predictiveApi.trends(metric, period),
  });
}

export function useComplianceTrends() {
  return useQuery({
    queryKey: ['compliance-trends'],
    queryFn: () => predictiveApi.complianceTrends(),
  });
}

export function useDepartmentTrends() {
  return useQuery({
    queryKey: ['department-trends'],
    queryFn: () => predictiveApi.departmentTrends(),
  });
}

export function useFactoryComparison() {
  return useQuery({
    queryKey: ['factory-comparison'],
    queryFn: () => predictiveApi.factoryComparison(),
  });
}

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => predictiveApi.scenarios(),
  });
}

export function useRunScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RunScenarioInput) => predictiveApi.runScenario(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenarios'] }),
  });
}

export function useRecommendations(filters: { status?: string; priority?: string; type?: string } = {}) {
  return useQuery({
    queryKey: ['recommendations', filters],
    queryFn: () => predictiveApi.recommendations(filters),
  });
}

export function useGenerateRecommendations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateRecommendationsInput) => predictiveApi.generateRecommendations(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
}

export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => predictiveApi.updateRecommendation(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
}

export function useForecasts(forecastType?: string) {
  return useQuery({
    queryKey: ['forecasts', forecastType],
    queryFn: () => predictiveApi.forecasts(forecastType),
  });
}

export function useComputeForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ metric, horizonDays }: { metric: string; horizonDays?: number }) => predictiveApi.computeForecast(metric, horizonDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forecasts'] }),
  });
}
