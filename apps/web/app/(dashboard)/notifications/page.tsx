'use client';

import { useState } from 'react';
import { Bell, Mail, Check, Archive, Trash2, Settings } from 'lucide-react';

import { Button, Card, Skeleton, ErrorState, EmptyState, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useNotifications, useUnreadCount, useNotificationStats, useMarkRead, useMarkUnread, useArchiveNotification, useMarkAllRead, useDeleteNotification, useNotificationPreferences, useUpdatePreference } from '@/modules/notifications/store.js';
import { NOTIFICATION_CHANNEL_LABELS, NOTIFICATION_TYPE_LABELS, NOTIFICATION_STATUS_LABELS } from '@/modules/notifications/constants.js';
import type { Notification } from '@/modules/notifications/types.js';

export default function NotificationsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canManage = hasPermission('notification:write');
  const { data: notifications, isLoading, error, refetch } = useNotifications();
  const { data: unreadData } = useUnreadCount();
  const { data: stats } = useNotificationStats();
  const { data: preferences = [], isLoading: prefsLoading } = useNotificationPreferences();
  const markRead = useMarkRead();
  const markUnread = useMarkUnread();
  const archive = useArchiveNotification();
  const deleteNotif = useDeleteNotification();
  const markAllRead = useMarkAllRead();
  const updatePref = useUpdatePreference();

  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Notification | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);

  const filtered = (notifications?.notifications ?? []).filter((n) => {
    if (filterStatus && n.status !== filterStatus) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = unreadData?.count ?? 0;

  const act = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      toast({ title: label, variant: 'success' });
    } catch (e) {
      toast({ title: 'Action failed', description: String(e), variant: 'error' });
    }
  };

  if (error) return <ErrorState title="Failed to load notifications" message={String(error)} onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage your notifications, preferences, and delivery status.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && canManage && <Button size="sm" variant="outline" onClick={() => act(() => markAllRead.mutateAsync(), 'All marked as read')}><Check className="h-4 w-4" /> Mark All Read</Button>}
          <Button size="sm" variant="outline" onClick={() => setShowPrefs(true)}><Settings className="h-4 w-4" /> Preferences</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total" value={stats?.total ?? 0} />
        <StatTile label="Unread" value={unreadCount} />
        <StatTile label="Sent" value={(stats?.byType?.sent ?? 0) + (stats?.byType?.delivered ?? 0)} hint="delivered" />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Bell className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent pl-9 pr-3 text-sm" placeholder="Search notifications…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." />
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => (
              <div key={notif.id} className={`flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3 ${notif.status === 'unread' ? 'border-l-2 border-l-[rgb(var(--primary))]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{notif.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${notif.status === 'unread' ? 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>{NOTIFICATION_STATUS_LABELS[notif.status] ?? notif.status}</span>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))] truncate">{notif.body}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">{NOTIFICATION_TYPE_LABELS[notif.type] ?? notif.type}</span>
                    {notif.channels.map((ch) => (<span key={ch} className="rounded bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">{NOTIFICATION_CHANNEL_LABELS[ch] ?? ch}</span>))}
                    <span className="text-[10px] text-[rgb(var(--muted))]">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  {notif.status === 'unread' && canManage && <Button size="sm" variant="ghost" aria-label="Mark read" onClick={() => act(() => markRead.mutateAsync(notif.id), 'Marked as read')}><Check className="h-4 w-4" /></Button>}
                  {notif.status === 'read' && canManage && <Button size="sm" variant="ghost" aria-label="Mark unread" onClick={() => act(() => markUnread.mutateAsync(notif.id), 'Marked as unread')}><Mail className="h-4 w-4" /></Button>}
                  {canManage && <Button size="sm" variant="ghost" aria-label="Archive" onClick={() => act(() => archive.mutateAsync(notif.id), 'Archived')}><Archive className="h-4 w-4" /></Button>}
                  {canManage && <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => act(() => deleteNotif.mutateAsync(notif.id), 'Deleted')}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  <Button size="sm" variant="ghost" aria-label="View" onClick={() => setSelected(notif)}><Bell className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.title} description={selected?.body} size="md" footer={
        <Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button>
      }>
        {selected && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Type</span><span>{NOTIFICATION_TYPE_LABELS[selected.type] ?? selected.type}</span></div>
            <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Status</span><span>{NOTIFICATION_STATUS_LABELS[selected.status]}</span></div>
            <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Channels</span><span>{selected.channels.map((ch) => NOTIFICATION_CHANNEL_LABELS[ch] ?? ch).join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-[rgb(var(--muted))]">Created</span><span>{new Date(selected.createdAt).toLocaleString()}</span></div>
            {selected.deliveries.length > 0 && (
              <div>
                <p className="text-xs text-[rgb(var(--muted))] mb-1">Deliveries</p>
                <div className="space-y-1">
                  {selected.deliveries.map((d) => (
                    <div key={d.id} className="flex justify-between rounded bg-[rgb(var(--panel-2))] px-2 py-1 text-xs">
                      <span>{NOTIFICATION_CHANNEL_LABELS[d.channel] ?? d.channel}</span>
                      <span className={d.status === 'sent' ? 'text-[rgb(var(--success))]' : d.status === 'failed' ? 'text-red-500' : 'text-[rgb(var(--muted))]'}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog open={showPrefs} onClose={() => setShowPrefs(false)} title="Notification Preferences" description="Manage your notification channel preferences." size="lg" footer={
        <Button size="sm" variant="outline" onClick={() => setShowPrefs(false)}>Close</Button>
      }>
        {prefsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="space-y-3">
            {preferences.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No preferences set.</p>}
            {preferences.map((pref) => (
              <div key={pref.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
                <div>
                  <p className="text-sm font-medium">{NOTIFICATION_TYPE_LABELS[pref.notificationType] ?? pref.notificationType}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Channel: {NOTIFICATION_CHANNEL_LABELS[pref.channel] ?? pref.channel}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={pref.enabled} onChange={(e) => updatePref.mutateAsync({ id: pref.id, patch: { enabled: e.target.checked } })} disabled={!canManage} />
                  Enabled
                </label>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text))]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </Card>
  );
}
