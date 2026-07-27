import { randomUUID } from 'node:crypto';

import { query } from '../../../db/pool.js';
import type { ForecastSnapshot, TrendMetric } from '../types.js';

interface ForecastRow {
  id: string;
  organizationId: string;
  forecastType: string;
  horizonDays: string;
  data: Record<string, unknown>;
  computedAt: string;
}

function mapRow(row: ForecastRow): ForecastSnapshot {
  return { id: row.id, organizationId: row.organizationId, forecastType: row.forecastType, horizonDays: parseInt(row.horizonDays, 10), data: row.data ?? {}, computedAt: row.computedAt };
}

export const forecastingService = {
  async computeForecast(organizationId: string, metric: TrendMetric, horizonDays = 30): Promise<ForecastSnapshot> {
    const { rows } = await query<{ day: string; value: string }>(
      `SELECT DATE_TRUNC('day', created_at) as day, COUNT(*)::int as value FROM cases WHERE organization_id = $1 AND is_deleted = FALSE AND created_at > now() - interval '90 days' GROUP BY 1 ORDER BY 1 ASC`,
      [organizationId],
    );
    const values = rows.map((r) => parseFloat(r.value));
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / values.length : 0;
    const forecast: number[] = [];
    for (let d = 1; d <= horizonDays; d++) {
      forecast.push(Math.max(0, Math.round(avg + trend * d)));
    }
    const data = { metric, horizonDays, values: forecast, trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable', generatedAt: new Date().toISOString() };
    const id = randomUUID();
    const { rows: inserted } = await query<ForecastRow>(`INSERT INTO forecast_snapshots (id, organization_id, forecast_type, horizon_days, data, computed_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [id, organizationId, metric, horizonDays, data, new Date().toISOString()]);
    return mapRow(inserted[0]);
  },

  async getForecasts(organizationId: string, forecastType?: string): Promise<ForecastSnapshot[]> {
    const where = forecastType ? 'WHERE organization_id = $1 AND forecast_type = $2' : 'WHERE organization_id = $1';
    const params = forecastType ? [organizationId, forecastType] : [organizationId];
    const { rows } = await query<ForecastRow>(`SELECT * FROM forecast_snapshots ${where} ORDER BY computed_at DESC LIMIT 30`, params);
    return rows.map(mapRow);
  },
};
