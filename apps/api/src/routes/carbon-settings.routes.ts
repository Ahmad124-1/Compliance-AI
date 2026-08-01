import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { authenticate, getAuth, requirePermission } from './guard.js';
import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';

const settingsSchema = z.object({
  defaultUnit: z.string().optional(),
  massUnit: z.enum(['kg', 'tonnes', 'metric_tonnes']).optional(),
  energyUnit: z.enum(['kwh', 'mwh', 'mj', 'gj']).optional(),
  volumeUnit: z.enum(['liters', 'gallons', 'cubic_meters']).optional(),
  distanceUnit: z.enum(['km', 'miles']).optional(),
  reportingFrequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  defaultReportFormat: z.enum(['pdf', 'xlsx', 'csv']).optional(),
  defaultReportType: z.enum(['carbon_inventory', 'ghg_inventory', 'executive_report', 'facility_report', 'sbti_report']).optional(),
  autoCalculateEmissions: z.boolean().optional(),
  enableAiRecommendations: z.boolean().optional(),
  enableSbtiTracking: z.boolean().optional(),
  defaultBaseYear: z.number().int().nullable().optional(),
  approvalWorkflow: z.enum(['none', 'single', 'dual', 'chain']).optional(),
  currency: z.string().optional(),
  carbonCostPerTonne: z.number().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  reportFooter: z.string().nullable().optional(),
});

export async function carbonSettingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/carbon/settings', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const { rows } = await query('SELECT * FROM carbon_settings WHERE organization_id = $1', [auth.org]);
    if (!rows[0]) {
      // Return defaults
      return {
        defaultUnit: 'metric_tonnes',
        massUnit: 'tonnes',
        energyUnit: 'kwh',
        volumeUnit: 'liters',
        distanceUnit: 'km',
        reportingFrequency: 'monthly',
        defaultReportFormat: 'pdf',
        defaultReportType: 'carbon_inventory',
        autoCalculateEmissions: true,
        enableAiRecommendations: true,
        enableSbtiTracking: true,
        defaultBaseYear: null,
        approvalWorkflow: 'single',
        currency: 'USD',
        carbonCostPerTonne: null,
        logoUrl: null,
        brandColor: '#059669',
        reportFooter: null,
      };
    }
    const r = rows[0];
    return {
      id: r.id,
      organizationId: r.organization_id,
      defaultUnit: r.default_unit,
      massUnit: r.mass_unit,
      energyUnit: r.energy_unit,
      volumeUnit: r.volume_unit,
      distanceUnit: r.distance_unit,
      reportingFrequency: r.reporting_frequency,
      defaultReportFormat: r.default_report_format,
      defaultReportType: r.default_report_type,
      autoCalculateEmissions: r.auto_calculate_emissions,
      enableAiRecommendations: r.enable_ai_recommendations,
      enableSbtiTracking: r.enable_sbti_tracking,
      defaultBaseYear: r.default_base_year,
      approvalWorkflow: r.approval_workflow,
      currency: r.currency,
      carbonCostPerTonne: r.carbon_cost_per_tonne !== null ? parseFloat(r.carbon_cost_per_tonne) : null,
      logoUrl: r.logo_url,
      brandColor: r.brand_color,
      reportFooter: r.report_footer,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  app.put('/carbon/settings', { preHandler: requirePermission('sustainability:update'), schema: { body: settingsSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;

    // Upsert pattern
    const { rows: existing } = await query('SELECT id FROM carbon_settings WHERE organization_id = $1', [auth.org]);

    const cols = ['default_unit', 'mass_unit', 'energy_unit', 'volume_unit', 'distance_unit', 'reporting_frequency', 'default_report_format', 'default_report_type', 'auto_calculate_emissions', 'enable_ai_recommendations', 'enable_sbti_tracking', 'default_base_year', 'approval_workflow', 'currency', 'carbon_cost_per_tonne', 'logo_url', 'brand_color', 'report_footer'];
    const vals: Record<string, unknown> = {
      default_unit: body.defaultUnit ?? 'metric_tonnes',
      mass_unit: body.massUnit ?? 'tonnes',
      energy_unit: body.energyUnit ?? 'kwh',
      volume_unit: body.volumeUnit ?? 'liters',
      distance_unit: body.distanceUnit ?? 'km',
      reporting_frequency: body.reportingFrequency ?? 'monthly',
      default_report_format: body.defaultReportFormat ?? 'pdf',
      default_report_type: body.defaultReportType ?? 'carbon_inventory',
      auto_calculate_emissions: body.autoCalculateEmissions ?? true,
      enable_ai_recommendations: body.enableAiRecommendations ?? true,
      enable_sbti_tracking: body.enableSbtiTracking ?? true,
      default_base_year: body.defaultBaseYear ?? null,
      approval_workflow: body.approvalWorkflow ?? 'single',
      currency: body.currency ?? 'USD',
      carbon_cost_per_tonne: body.carbonCostPerTonne ?? null,
      logo_url: body.logoUrl ?? null,
      brand_color: body.brandColor ?? '#059669',
      report_footer: body.reportFooter ?? null,
    };

    if (existing.length > 0) {
      const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
      const params = cols.map(c => vals[c]);
      params.push(auth.org);
      await query(`UPDATE carbon_settings SET ${sets}, updated_at = now() WHERE organization_id = $${params.length}`, params);
    } else {
      const placeholders = cols.map((_, i) => `$${i + 2}`).join(', ');
      const params = [auth.org, ...cols.map(c => vals[c])];
      await query(`INSERT INTO carbon_settings (organization_id, ${cols.join(', ')}) VALUES ($1, ${placeholders})`, params);
    }

    await audit({ action: 'carbon.settings.update', entity: 'carbon_settings', organizationId: auth.org, actorId: auth.sub });

    // Return updated settings
    const { rows } = await query('SELECT * FROM carbon_settings WHERE organization_id = $1', [auth.org]);
    return rows[0] || vals;
  });
}

