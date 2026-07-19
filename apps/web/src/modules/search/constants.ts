export const SEARCH_ENDPOINTS = {
  search: '/api/v1/search',
  saved: '/api/v1/search/saved',
  recent: '/api/v1/search/recent',
} as const;

export const SCOPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Everything' },
  { value: 'complaints', label: 'Complaints' },
  { value: 'cases', label: 'Cases' },
  { value: 'tracking', label: 'Tracking Numbers' },
  { value: 'factories', label: 'Factories' },
  { value: 'departments', label: 'Departments' },
  { value: 'organizations', label: 'Organizations' },
  { value: 'investigators', label: 'Investigators' },
  { value: 'categories', label: 'Categories' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'qr_codes', label: 'QR Codes' },
  { value: 'templates', label: 'Templates' },
];

export const SCOPE_LABELS: Record<string, string> = Object.fromEntries(
  SCOPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const SCOPE_COLORS: Record<string, string> = {
  complaints: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  tracking: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
  cases: 'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  factories: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  departments: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  organizations: 'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  investigators: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
  categories: 'bg-teal-500/15 text-teal-600 dark:text-teal-300',
  notifications: 'bg-pink-500/15 text-pink-600 dark:text-pink-300',
  qr_codes: 'bg-orange-500/15 text-orange-600 dark:text-orange-300',
  templates: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
};
