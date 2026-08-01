'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, Settings2, DollarSign, Bell, Shield, Palette, Cpu, Globe } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/providers/ToastProvider';

const settingsSchema = z.object({
  orgName: z.string().min(1, 'Organization name is required'),
  defaultUnit: z.string().default('metric'),
  currency: z.string().default('USD'),
  fiscalYearStart: z.string().default('01'),
  fiscalYearEnd: z.string().default('12'),
  defaultKpiFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  aiEnabled: z.boolean().default(true),
  aiAutoAnalyze: z.boolean().default(false),
  enableNotifications: z.boolean().default(true),
  notifyOnThresholds: z.boolean().default(true),
  notifyOnMilestones: z.boolean().default(false),
  primaryColor: z.string().default('#2563eb'),
  companyLogo: z.string().optional(),
  reportFooter: z.string().optional(),
});

type SettingsData = z.infer<typeof settingsSchema>;

const SECTIONS = [
  { id: 'organization', label: 'Organization', icon: Globe },
  { id: 'reporting', label: 'Reporting', icon: Settings2 },
  { id: 'measurement', label: 'Measurement', icon: DollarSign },
  { id: 'ai', label: 'AI Preferences', icon: Cpu },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'branding', label: 'Branding', icon: Palette },
];

export default function SustainabilitySettingsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('organization');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      orgName: '',
      defaultUnit: 'metric',
      currency: 'USD',
      fiscalYearStart: '01',
      fiscalYearEnd: '12',
      defaultKpiFrequency: 'monthly',
      aiEnabled: true,
      aiAutoAnalyze: false,
      enableNotifications: true,
      notifyOnThresholds: true,
      notifyOnMilestones: false,
      primaryColor: '#2563eb',
      companyLogo: '',
      reportFooter: '',
    },
  });

  const onSubmit = async (data: SettingsData) => {
    setIsSaving(true);
    try {
      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast({ title: 'Settings saved', description: 'Your sustainability settings have been updated.', variant: 'success' });
      setIsSaving(false);
    } catch (err: any) {
      toast({ title: 'Failed to save settings', description: err.message, variant: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Configure your sustainability platform preferences and defaults.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                      : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))] hover:text-[rgb(var(--text))]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {activeSection === 'organization' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Organization Defaults</h2>
                <Field label="Organization Name" error={errors.orgName?.message}>
                  <Input {...register('orgName')} placeholder="Your Organization" />
                </Field>
                <Field label="Default Measurement Unit">
                  <select {...register('defaultUnit')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                    <option value="both">Both</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <select {...register('currency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Fiscal Year Start Month">
                    <select {...register('fiscalYearStart')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Fiscal Year End Month">
                    <select {...register('fiscalYearEnd')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Card>
            )}

            {activeSection === 'measurement' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Measurement & Defaults</h2>
                <Field label="Default KPI Frequency">
                  <select {...register('defaultKpiFrequency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Field>
                <p className="text-xs text-[rgb(var(--muted))]">Default frequency applied to new KPIs.</p>
              </Card>
            )}

            {activeSection === 'ai' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">AI Preferences</h2>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('aiEnabled')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <div>
                    <p className="text-sm font-medium">Enable AI Sustainability Copilot</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Allow AI to provide insights and recommendations.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('aiAutoAnalyze')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <div>
                    <p className="text-sm font-medium">Auto-analyze on view</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Automatically analyze sustainability data when viewing detail pages.</p>
                  </div>
                </label>
              </Card>
            )}

            {activeSection === 'notifications' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Notification Preferences</h2>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('enableNotifications')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <div>
                    <p className="text-sm font-medium">Enable Notifications</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Receive notifications about sustainability updates.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('notifyOnThresholds')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <div>
                    <p className="text-sm font-medium">Threshold Alerts</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Notify when KPI thresholds are exceeded.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" {...register('notifyOnMilestones')} className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                  <div>
                    <p className="text-sm font-medium">Milestone Reminders</p>
                    <p className="text-xs text-[rgb(var(--muted))]">Notify about upcoming initiative milestones.</p>
                  </div>
                </label>
              </Card>
            )}

            {activeSection === 'branding' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Branding</h2>
                <Field label="Primary Color">
                  <div className="flex items-center gap-3">
                    <input type="color" {...register('primaryColor')} className="h-10 w-16 rounded border border-[rgb(var(--border-color))] bg-transparent" />
                    <Input {...register('primaryColor')} className="flex-1" />
                  </div>
                </Field>
                <Field label="Company Logo URL">
                  <Input {...register('companyLogo')} placeholder="https://example.com/logo.png" />
                </Field>
                <Field label="Report Footer Text">
                  <Input {...register('reportFooter')} placeholder="© 2025 Your Organization. All rights reserved." />
                </Field>
              </Card>
            )}

            {activeSection === 'reporting' && (
              <Card className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Reporting Preferences</h2>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Configure default report settings for generated sustainability reports.
                </p>
                <div className="space-y-3">
                  <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Default Report Settings</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                    Include charts
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                    Include KPI tables
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                    Include company branding
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 rounded border-[rgb(var(--border-color))]" />
                    Include SDG mapping
                  </label>
                </div>
              </Card>
            )}

            {/* Mobile Section Selector */}
            <div className="flex gap-2 overflow-x-auto md:hidden">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeSection === section.id
                        ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]'
                        : 'border-[rgb(var(--border-color))] text-[rgb(var(--muted))]'
                    }`}
                  >
                    <Icon className="mr-1 inline-block h-3 w-3" />
                    {section.label}
                  </button>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

