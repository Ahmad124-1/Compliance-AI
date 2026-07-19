'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Printer, RefreshCw, PowerOff } from 'lucide-react';

import { Button, Card, DataTable, type Column, StatTile, Skeleton, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { QR_ROUTES, QR_TYPE_LABELS } from '@/modules/qr/constants.js';
import { qrApi } from '@/modules/qr/api.js';
import { useQrCode, useQrAnalytics, useRegenerateQrCode, useUpdateQrCode } from '@/modules/qr/store.js';
import { QrPreview } from '@/modules/qr/components/QrPreview.js';
import type { QrScanEvent } from '@/modules/qr/types.js';

export default function QrDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { data: qr, isLoading } = useQrCode(id);
  const { data: scans, isLoading: scansLoading } = useQrAnalytics(id);
  const regenerate = useRegenerateQrCode();
  const update = useUpdateQrCode();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!qr) return <p className="text-sm text-[rgb(var(--muted))]">QR code not found.</p>;

  const download = (format: 'png' | 'svg') => {
    const a = document.createElement('a');
    a.href = qrApi.downloadUrl(qr.id, format);
    a.download = `${qr.code}.${format}`;
    a.click();
  };

  const toggleActive = () => {
    if (qr.isActive) {
      setDeactivateOpen(true);
    } else {
      update.mutate(
        { id: qr.id, patch: { isActive: true } },
        { onSuccess: () => toast({ title: 'QR code activated', variant: 'success' }), onError: (e) => toast({ title: 'Update failed', description: String(e), variant: 'error' }) },
      );
    }
  };

  const columns: Column<QrScanEvent>[] = [
    { key: 'country', header: 'Country', render: (r) => r.country ?? '—' },
    { key: 'city', header: 'City', render: (r) => r.city ?? '—' },
    { key: 'device', header: 'Device', render: (r) => r.device ?? '—' },
    { key: 'browser', header: 'Browser', render: (r) => r.browser ?? '—' },
    { key: 'createdAt', header: 'Scanned', sortable: true, sortValue: (r) => r.createdAt, render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href={QR_ROUTES.list}>
          <Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{qr.name}</h1>
          <p className="text-xs text-[rgb(var(--muted))]">{qr.code} · {QR_TYPE_LABELS[qr.type] ?? qr.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 p-5">
          <QrPreview code={qr.code} size={200} />
          <p className="break-all text-center text-xs text-[rgb(var(--muted))]">{qr.url}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => download('png')}><Download className="h-4 w-4" /> PNG</Button>
            <Button size="sm" variant="outline" onClick={() => download('svg')}><Download className="h-4 w-4" /> SVG</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Scans" value={qr.scanCount} />
            <StatTile label="Last scanned" value={qr.lastScannedAt ? new Date(qr.lastScannedAt).toLocaleDateString() : '—'} />
            <StatTile label="Status" value={qr.isActive ? 'Active' : 'Inactive'} />
          </div>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {hasPermission('qr:update') && (
                <Button size="sm" variant="outline" onClick={() => regenerate.mutate(qr.id, { onSuccess: () => toast({ title: 'Code regenerated', variant: 'success' }), onError: (e) => toast({ title: 'Failed', description: String(e), variant: 'error' }) })}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              )}
              {hasPermission('qr:update') && (
                <Button size="sm" variant="outline" onClick={toggleActive}>
                  <PowerOff className="h-4 w-4" /> {qr.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Scan History</h2>
        <DataTable columns={columns} data={scans} isLoading={scansLoading} emptyMessage="No scans recorded yet." rowKey={(r) => r.id} />
      </div>

      <Dialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate QR code?"
        description="Existing scans will stop being accepted until reactivated."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() =>
                update.mutate(
                  { id: qr.id, patch: { isActive: false } },
                  {
                    onSuccess: () => {
                      toast({ title: 'QR code deactivated', variant: 'success' });
                      setDeactivateOpen(false);
                    },
                    onError: (e) => toast({ title: 'Update failed', description: String(e), variant: 'error' }),
                  },
                )
              }
            >
              Deactivate
            </Button>
          </>
        }
      >
        <p className="text-sm text-[rgb(var(--muted))]">You can reactivate it at any time.</p>
      </Dialog>
    </div>
  );
}
