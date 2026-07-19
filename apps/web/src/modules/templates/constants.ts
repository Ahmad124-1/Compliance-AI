export const TEMPLATE_ENDPOINTS = {
  list: '/api/v1/templates',
  stats: '/api/v1/templates/stats',
  create: '/api/v1/templates',
  get: (id: string) => `/api/v1/templates/${id}`,
  update: (id: string) => `/api/v1/templates/${id}`,
  delete: (id: string) => `/api/v1/templates/${id}`,
  render: (id: string) => `/api/v1/templates/${id}/render`,
  duplicate: (id: string) => `/api/v1/templates/${id}/duplicate`,
} as const;

export const TEMPLATE_ROUTES = {
  list: '/templates',
  detail: (id: string) => `/templates/${id}`,
  create: '/templates/create',
} as const;

export const TEMPLATE_CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  push: 'Push',
  in_app: 'In-App',
  whatsapp: 'WhatsApp',
  webhook: 'Webhook',
};

export const TEMPLATE_VARIABLE_TYPE_LABELS: Record<string, string> = {
  string: 'Text',
  number: 'Number',
  date: 'Date',
  boolean: 'Boolean',
};
