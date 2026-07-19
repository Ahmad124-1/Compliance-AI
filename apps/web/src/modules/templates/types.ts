export type TemplateChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp' | 'webhook';

export interface TemplateVariable {
  name: string;
  label: string;
  description: string | null;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue: string | null;
}

export interface MessageTemplate {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  channel: TemplateChannel;
  category: string;
  subject: string | null;
  body: string;
  language: string;
  variables: TemplateVariable[];
  version: number;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateCreateInput {
  name: string;
  slug: string;
  channel: TemplateChannel;
  category: string;
  subject?: string | null;
  body: string;
  language?: string;
  variables?: TemplateVariable[];
  isActive?: boolean;
}

export interface MessageTemplateUpdateInput {
  name?: string;
  slug?: string;
  channel?: TemplateChannel;
  category?: string;
  subject?: string | null;
  body?: string;
  language?: string;
  variables?: TemplateVariable[];
  isActive?: boolean;
}

export interface TemplateRenderInput {
  templateId: string;
  variables: Record<string, string>;
}

export interface TemplateRenderOutput {
  subject: string | null;
  body: string;
  missingVariables: string[];
}
