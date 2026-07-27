'use client';

import { useState } from 'react';
import { Globe, Moon, Bell, Eye, Shield } from 'lucide-react';

import { Card, Field, Button } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState({ inApp: true, email: false, sms: false });
  const [accessibility, setAccessibility] = useState({ reducedMotion: false, highContrast: false });

  const handleSave = () => {
    toast({ title: 'Settings saved', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Language</h2>
        </div>
        <Field label="Preferred Language">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-48">
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </Field>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Theme</h2>
        </div>
        <div className="flex gap-3">
          {['light', 'dark', 'system'].map((t) => (
            <Button key={t} size="sm" variant={theme === t ? 'default' : 'outline'} onClick={() => setTheme(t)}>{t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'}</Button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          {Object.entries({ inApp: 'In-App Notifications', email: 'Email Notifications', sms: 'SMS Alerts' }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
              <span className="text-sm">{label}</span>
              <input type="checkbox" checked={(notifications as any)[key]} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} />
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Accessibility</h2>
        </div>
        <div className="space-y-3">
          {Object.entries({ reducedMotion: 'Reduce Animations', highContrast: 'High Contrast Mode' }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
              <span className="text-sm">{label}</span>
              <input type="checkbox" checked={(accessibility as any)[key]} onChange={(e) => setAccessibility({ ...accessibility, [key]: e.target.checked })} />
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Privacy</h2>
        </div>
        <p className="text-sm text-[rgb(var(--muted))]">Your data is kept private and secure. For privacy requests, contact your HR representative.</p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
