import { z } from 'zod';

export const slaTypeSchema = z.enum(['response', 'resolution', 'escalation', 'approval', 'custom']);
export const slaStatusSchema = z.enum(['on_track', 'at_risk', 'breached', 'paused', 'met', 'unknown']);

export const slaDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  type: slaTypeSchema,
  category: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  targetMinutes: z.number().int().positive('Target must be positive'),
  warningMinutes: z.number().int().min(0, 'Warning cannot be negative'),
  isActive: z.boolean().optional(),
  workingHoursId: z.string().nullable().optional(),
  holidayCalendarId: z.string().nullable().optional(),
});
export type SlaDefinitionInput = z.infer<typeof slaDefinitionSchema>;

export const slaInstanceListSchema = z.object({
  status: slaStatusSchema.optional(),
  entityType: z.string().optional(),
  definitionId: z.string().optional(),
  breached: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});
export type SlaInstanceListParams = z.infer<typeof slaInstanceListSchema>;

export const slaWorkingHoursSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  schedule: z.record(
    z.object({
      start: z.string(),
      end: z.string(),
      enabled: z.boolean(),
    })
  ),
});
export type SlaWorkingHoursInput = z.infer<typeof slaWorkingHoursSchema>;

export const slaHolidayCalendarSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().nullable().optional(),
  holidays: z.array(z.object({ date: z.string(), name: z.string() })),
});
export type SlaHolidayCalendarInput = z.infer<typeof slaHolidayCalendarSchema>;
