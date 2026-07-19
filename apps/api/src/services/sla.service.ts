import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { slaDefinitionRepo } from '../repositories/sla-definition.repo.js';
import { slaInstanceRepo } from '../repositories/sla-instance.repo.js';
import { slaPauseHistoryRepo } from '../repositories/sla-pause-history.repo.js';
import { slaWorkingHoursRepo } from '../repositories/sla-working-hours.repo.js';
import { slaHolidayCalendarRepo } from '../repositories/sla-holiday-calendar.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface SlaDefinitionInput {
  organizationId: string;
  name: string;
  description?: string;
  slaType: string;
  priority: string;
  severity?: string;
  category?: string;
  targetDurationMinutes: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface SlaInstanceInput {
  organizationId: string;
  caseId: string;
  slaDefinitionId: string;
  slaType: string;
  deadline: Date;
}

export interface WorkingHoursInput {
  organizationId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface HolidayInput {
  organizationId: string;
  name: string;
  date: string;
  isRecurring?: boolean;
}

export const slaService = {
  async createDefinition(input: SlaDefinitionInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const definition = await slaDefinitionRepo.create(input);
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'sla.definition.create', entity: 'sla_definition', entityId: definition.id });
    return definition;
  },

  async getDefinition(orgId, id) {
    const definition = await slaDefinitionRepo.findById(id);
    if (!definition || definition.organizationId !== orgId) throw new NotFoundError('SLA definition not found');
    return definition;
  },

  async listDefinitions(orgId, filters: any = {}) {
    return slaDefinitionRepo.findByOrganization(orgId, filters);
  },

  async updateDefinition(orgId, id, patch, actorId?) {
    const definition = await slaDefinitionRepo.findById(id);
    if (!definition || definition.organizationId !== orgId) throw new NotFoundError('SLA definition not found');
    const updated = await slaDefinitionRepo.update(id, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'sla.definition.update', entity: 'sla_definition', entityId: id });
    return updated;
  },

  async deleteDefinition(orgId, id) {
    const definition = await slaDefinitionRepo.findById(id);
    if (!definition || definition.organizationId !== orgId) throw new NotFoundError('SLA definition not found');
    await slaDefinitionRepo.delete(id);
    await audit({ organizationId: orgId, action: 'sla.definition.delete', entity: 'sla_definition', entityId: id });
  },

  async createInstance(input: SlaInstanceInput) {
    const case_ = await caseRepo.findById(input.caseId);
    if (!case_ || case_.organizationId !== input.organizationId) throw new NotFoundError('Case not found');
    const instance = await slaInstanceRepo.create(input);
    await audit({ organizationId: input.organizationId, action: 'sla.instance.create', entity: 'sla_instance', entityId: instance.id, metadata: { caseId: input.caseId } });
    return instance;
  },

  async getInstance(orgId, id) {
    const instance = await slaInstanceRepo.findById(id);
    if (!instance || instance.organizationId !== orgId) throw new NotFoundError('SLA instance not found');
    return instance;
  },

  async listInstancesByCase(orgId, caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return slaInstanceRepo.findByCase(orgId, caseId);
  },

  async pauseInstance(orgId, id, reason) {
    const instance = await slaInstanceRepo.findById(id);
    if (!instance || instance.organizationId !== orgId) throw new NotFoundError('SLA instance not found');
    if (instance.status !== 'active') throw new NotFoundError('SLA instance is not active');
    const updated = await slaInstanceRepo.updateStatus(id, 'paused');
    await slaPauseHistoryRepo.create({ slaInstanceId: id, reason });
    await audit({ organizationId: orgId, action: 'sla.instance.pause', entity: 'sla_instance', entityId: id, metadata: { reason } });
    return updated;
  },

  async resumeInstance(orgId, id) {
    const instance = await slaInstanceRepo.findById(id);
    if (!instance || instance.organizationId !== orgId) throw new NotFoundError('SLA instance not found');
    if (instance.status !== 'paused') throw new NotFoundError('SLA instance is not paused');
    await slaPauseHistoryRepo.resumeLatest(id);
    const updated = await slaInstanceRepo.updateStatus(id, 'active');
    await audit({ organizationId: orgId, action: 'sla.instance.resume', entity: 'sla_instance', entityId: id });
    return updated;
  },

  async checkBreaches() {
    const activeInstances = await slaInstanceRepo.listBreached(null);
    const results: any[] = [];
    for (const instance of activeInstances) {
      const updated = await slaInstanceRepo.updateStatus(instance.id, 'breached');
      results.push(updated);
    }
    return results;
  },

  async calculateDeadline(definition, caseCreatedAt: Date) {
    const workingHours = await slaWorkingHoursRepo.findByOrganization(definition.organizationId);
    const holidays = await slaHolidayCalendarRepo.findByOrganization(definition.organizationId);
    let current = new Date(caseCreatedAt);
    let remaining = definition.targetDurationMinutes;
    const dayMs = 24 * 60 * 60 * 1000;

    while (remaining > 0) {
      const day = current.getDay();
      const hours = workingHours.find((h) => h.dayOfWeek === day && h.isActive);
      const isHoliday = holidays.some((h) => {
        const holidayDate = new Date(h.date);
        return holidayDate.toDateString() === current.toDateString();
      });

      if (hours && !isHoliday) {
        const start = new Date(current);
        const [startH, startM] = String(hours.startTime).split(':').map(Number);
        start.setHours(startH, startM, 0, 0);
        const end = new Date(current);
        const [endH, endM] = String(hours.endTime).split(':').map(Number);
        end.setHours(endH, endM, 0, 0);

        if (current < start) current = start;
        const availableEnd = end;
        const availableMinutes = (availableEnd.getTime() - current.getTime()) / 60000;
        if (availableMinutes > 0) {
          remaining -= availableMinutes;
          current = availableEnd;
          if (remaining <= 0) break;
        }
      }
      current = new Date(current.getTime() + dayMs);
    }
    return current;
  },

  async getWorkingHours(orgId) {
    return slaWorkingHoursRepo.findByOrganization(orgId);
  },

  async setWorkingHours(orgId, dayOfWeek, startTime, endTime) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return slaWorkingHoursRepo.upsert({ organizationId: orgId, dayOfWeek, startTime, endTime });
  },

  async addHoliday(orgId, name, date, isRecurring = false) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return slaHolidayCalendarRepo.create({ organizationId: orgId, name, date, isRecurring });
  },

  async listHolidays(orgId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return slaHolidayCalendarRepo.findByOrganization(orgId);
  },

  async deleteHoliday(orgId, id) {
    const holiday = await slaHolidayCalendarRepo.findById(id);
    if (!holiday || holiday.organizationId !== orgId) throw new NotFoundError('Holiday not found');
    await slaHolidayCalendarRepo.delete(id);
  },

  async getSlaStats(orgId) {
    return slaInstanceRepo.getStats(orgId);
  },
};
