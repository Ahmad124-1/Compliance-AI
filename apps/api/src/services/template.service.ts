import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { messageTemplateRepo, mapMessageTemplate } from '../repositories/message-template.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface TemplateInput {
  organizationId?: string;
  name: string;
  channel: string;
  type: string;
  subject?: string;
  body: string;
  variables?: string[];
  locale?: string;
  isDefault?: boolean;
}

export const templateService = {
  async createTemplate(input: TemplateInput, actorId?: string) {
    const orgId = input.organizationId;
    if (orgId) {
      const org = await organizationRepo.findById(orgId);
      if (!org) throw new NotFoundError('Organization not found');
    }
    const template = await messageTemplateRepo.create(input);
    await audit({ organizationId: orgId ?? null, actorId: actorId ?? null, action: 'template.create', entity: 'message_template', entityId: template.id });
    return template;
  },

  async getTemplate(orgId, id) {
    const template = await messageTemplateRepo.findById(id);
    if (!template || (orgId && template.organizationId !== orgId)) throw new NotFoundError('Template not found');
    return template;
  },

  async listTemplates(orgId, filters: any = {}) {
    return messageTemplateRepo.findByOrganization(orgId, filters);
  },

  async getDefaultTemplate(channel, type, locale = 'en') {
    return messageTemplateRepo.findDefault(channel, type, locale);
  },

  async updateTemplate(orgId, id, patch, actorId?) {
    const template = await messageTemplateRepo.findById(id);
    if (!template || template.organizationId !== orgId) throw new NotFoundError('Template not found');
    const updated = await messageTemplateRepo.update(id, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'template.update', entity: 'message_template', entityId: id });
    return updated;
  },

  async deleteTemplate(orgId, id) {
    const template = await messageTemplateRepo.findById(id);
    if (!template || template.organizationId !== orgId) throw new NotFoundError('Template not found');
    await messageTemplateRepo.delete(id);
    await audit({ organizationId: orgId, action: 'template.delete', entity: 'message_template', entityId: id });
  },

  async renderTemplate(template: ReturnType<typeof mapMessageTemplate>, variables: Record<string, string>) {
    let subject = template.subject ?? '';
    let body = template.body;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
    return { subject, body };
  },

  async createDefaultTemplates(orgId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');

    const defaults = [
      { name: 'Case Assignment', channel: 'email', type: 'assignment', subject: 'You have been assigned to case {{caseNumber}}', body: 'Dear {{assigneeName}},\n\nYou have been assigned to case {{caseNumber}}: {{caseTitle}}.\n\nPriority: {{priority}}\nDescription: {{description}}\n\nPlease review and take action.', variables: ['caseNumber', 'assigneeName', 'caseTitle', 'priority', 'description'] },
      { name: 'Status Update', channel: 'email', type: 'status_update', subject: 'Case {{caseNumber}} status updated', body: 'Case {{caseNumber}} status has been updated to {{status}}.\n\nUpdated by: {{updatedBy}}\nDate: {{date}}', variables: ['caseNumber', 'status', 'updatedBy', 'date'] },
      { name: 'Escalation Notice', channel: 'email', type: 'escalation', subject: 'Case {{caseNumber}} escalated', body: 'Case {{caseNumber}} has been escalated to you.\n\nReason: {{reason}}\nPrevious assignee: {{previousAssignee}}\n\nPlease review immediately.', variables: ['caseNumber', 'reason', 'previousAssignee'] },
      { name: 'Resolution Notice', channel: 'email', type: 'resolution', subject: 'Case {{caseNumber}} resolved', body: 'Case {{caseNumber}} has been resolved.\n\nResolution: {{resolution}}\nResolved by: {{resolvedBy}}\nDate: {{date}}', variables: ['caseNumber', 'resolution', 'resolvedBy', 'date'] },
      { name: 'Case Closed', channel: 'email', type: 'case_closed', subject: 'Case {{caseNumber}} closed', body: 'Case {{caseNumber}} has been closed.\n\nThank you for your cooperation.', variables: ['caseNumber'] },
      { name: 'SLA Breach Alert', channel: 'email', type: 'reminder', subject: 'SLA breach warning for {{caseNumber}}', body: 'Warning: Case {{caseNumber}} is approaching its SLA deadline.\n\nDeadline: {{deadline}}\nTime remaining: {{timeRemaining}}', variables: ['caseNumber', 'deadline', 'timeRemaining'] },
    ];

    const results: any[] = [];
    for (const t of defaults) {
      const existing = await messageTemplateRepo.findByOrganization(orgId, { channel: t.channel, type: t.type });
      if (existing.length === 0) {
        results.push(await messageTemplateRepo.create({ organizationId: orgId, ...t, locale: 'en', isDefault: true, version: 1 }));
      }
    }
    await audit({ organizationId: orgId, action: 'template.defaults.seed', entity: 'message_template', metadata: { count: results.length } });
    return results;
  },
};
