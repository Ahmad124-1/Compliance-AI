'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Save, Mail, MessageSquare, Languages, Palette, ShieldCheck, Clock, Bell } from 'lucide-react';

import { Button, Card, Field, Input, Skeleton } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { CHANNEL_LABELS, LANGUAGE_LABELS } from '@/modules/communication-settings/constants.js';
import { useCommSettings, useUpdateChannels, useUpdateCommSettings } from '@/modules/communication-settings/store.js';

export default function CommunicationSettingsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission('organization:update');
  const { data: settings, isLoading } = useCommSettings();
  const updateChannels = useUpdateChannels();
  const update = useUpdateCommSettings();

  const [channels, setChannels] = useState<Record<string, boolean>>({});
  const [contact, setContact] = useState({ emailAddress: '', smsSenderId: '', whatsappNumber: '', hotlineNumber: '' });
  const [languages, setLanguages] = useState<string[]>([]);
  const [defaultLang, setDefaultLang] = useState('en');

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!settings) return <p className="text-sm text-[rgb(var(--muted))]">Settings unavailable.</p>;

  const initChannels = () => {
    if (Object.keys(channels).length === 0) {
      setChannels({
        email: !!settings.emailAddress,
        sms: !!settings.smsSenderId,
        whatsapp: !!settings.whatsappNumber,
        hotline: !!settings.hotlineNumber,
        voiceRecording: settings.voiceRecordingEnabled,
        suggestionBox: settings.suggestionBoxEnabled,
        walkIn: settings.walkInEnabled,
        union: settings.unionChannelEnabled,
        ngo: settings.ngoChannelEnabled,
        government: settings.governmentChannelEnabled,
        mobileApp: settings.mobileAppEnabled,
      });
    }
  };
  initChannels();

  const saveChannels = async () => {
    try {
      await updateChannels.mutateAsync(channels);
      toast({ title: 'Channels updated', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to update channels', description: String(e), variant: 'error' });
    }
  };

  const saveContact = async () => {
    try {
      await update.mutateAsync({
        emailAddress: contact.emailAddress || settings.emailAddress,
        smsSenderId: contact.smsSenderId || settings.smsSenderId,
        whatsappNumber: contact.whatsappNumber || settings.whatsappNumber,
        hotlineNumber: contact.hotlineNumber || settings.hotlineNumber,
        defaultLanguage: defaultLang,
        supportedLanguages: languages.length ? languages : settings.supportedLanguages,
      });
      toast({ title: 'Settings saved', variant: 'success' });
    } catch (e) {
      toast({ title: 'Failed to save', description: String(e), variant: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Communication Settings</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Configure how workers reach you and how messages are branded.</p>
        </div>
        <Link href="/templates">
          <Button size="sm" variant="outline"><Palette className="h-4 w-4" /> Message Templates</Button>
        </Link>
      </div>

      <Section icon={<MessageSquare className="h-4 w-4" />} title="Channels">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!channels[key]}
                disabled={!canEdit}
                onChange={(e) => setChannels((c) => ({ ...c, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        {canEdit && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={saveChannels} disabled={updateChannels.isPending}>
              <Save className="h-4 w-4" /> Save Channels
            </Button>
          </div>
        )}
      </Section>

      <Section icon={<Languages className="h-4 w-4" />} title="Languages">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Default">
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)} disabled={!canEdit}>
              {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-1 text-sm font-medium">Supported</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                <label key={k} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={languages.includes(k) || settings.supportedLanguages.includes(k)}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setLanguages((prev) => (e.target.checked ? [...new Set([...prev, k])] : prev.filter((l) => l !== k)))
                    }
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section icon={<Mail className="h-4 w-4" />} title="Contact Details">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Email"><Input value={contact.emailAddress} placeholder={settings.emailAddress ?? ''} onChange={(e) => setContact((c) => ({ ...c, emailAddress: e.target.value }))} disabled={!canEdit} /></Field>
          <Field label="SMS Sender ID"><Input value={contact.smsSenderId} placeholder={settings.smsSenderId ?? ''} onChange={(e) => setContact((c) => ({ ...c, smsSenderId: e.target.value }))} disabled={!canEdit} /></Field>
          <Field label="WhatsApp Number"><Input value={contact.whatsappNumber} placeholder={settings.whatsappNumber ?? ''} onChange={(e) => setContact((c) => ({ ...c, whatsappNumber: e.target.value }))} disabled={!canEdit} /></Field>
          <Field label="Hotline"><Input value={contact.hotlineNumber} placeholder={settings.hotlineNumber ?? ''} onChange={(e) => setContact((c) => ({ ...c, hotlineNumber: e.target.value }))} disabled={!canEdit} /></Field>
        </div>
        {canEdit && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={saveContact} disabled={update.isPending}><Save className="h-4 w-4" /> Save Contact</Button>
          </div>
        )}
      </Section>

      <Section icon={<ShieldCheck className="h-4 w-4" />} title="Privacy & Anonymous Reporting">
        <div className="space-y-2 text-sm">
          <Row label="Anonymous reporting enabled" value={settings.privacySettings?.allowAnonymous ? 'Yes' : 'No'} />
          <Row label="Retention policy (days)" value={settings.retentionPolicyDays?.toString() ?? '—'} />
          <Row label="Notification preferences" value={settings.notificationSettings ? 'Configured' : 'Default'} />
        </div>
      </Section>

      <Section icon={<Clock className="h-4 w-4" />} title="Working Hours">
        <p className="text-sm text-[rgb(var(--muted))]">Configure SLA working hours and holiday calendars in the SLA module.</p>
        <Link href="/sla"><Button size="sm" variant="outline" className="mt-2">Open SLA Settings</Button></Link>
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notification Preferences">
        <p className="text-sm text-[rgb(var(--muted))]">Per-user notification preferences are managed from the notification center.</p>
        <Link href="/notifications"><Button size="sm" variant="outline" className="mt-2">Open Notifications</Button></Link>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </div>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border-color))] py-1 last:border-0">
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
