'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, MessageSquare, Info, Megaphone, XCircle, Star } from 'lucide-react';

import { Button, Textarea, Skeleton, Dialog } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider.js';
import { useToast } from '@/providers/ToastProvider.js';
import { WORKER_COMM_ROUTES } from '@/modules/worker-communication/constants.js';
import { useTimeline, useAcknowledge, usePublicMessage, useRequestInfo, useResolutionNotice, useCloseCaseMessage, useRequestFeedback } from '@/modules/worker-communication/store.js';
import { useCase } from '@/modules/cases/module.store.js';

export default function WorkerTimelinePage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const { data: case_, isLoading: caseLoading } = useCase(caseId);
  const { data: timeline, isLoading } = useTimeline(caseId);
  const acknowledge = useAcknowledge();
  const publicMsg = usePublicMessage();
  const requestInfo = useRequestInfo();
  const resolution = useResolutionNotice();
  const closeMsg = useCloseCaseMessage();
  const feedback = useRequestFeedback();

  const [action, setAction] = useState<null | 'public' | 'info' | 'resolution'>(null);
  const [message, setMessage] = useState('');

  const run = async (fn: () => Promise<unknown>, label: string) => {
    try {
      await fn();
      toast({ title: label, variant: 'success' });
      setAction(null);
      setMessage('');
    } catch (e) {
      toast({ title: 'Action failed', description: String(e), variant: 'error' });
    }
  };

  if (caseLoading || isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href={WORKER_COMM_ROUTES.list}>
          <Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{case_?.caseNumber ?? 'Case'}</h1>
          <p className="text-xs text-[rgb(var(--muted))]">{case_?.title}</p>
        </div>
      </div>

      {hasPermission('case:update') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => run(() => acknowledge.mutateAsync(caseId), 'Acknowledgement sent')}>
            <CheckCircle2 className="h-4 w-4" /> Acknowledge
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAction('public')}>
            <Megaphone className="h-4 w-4" /> Public Message
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAction('info')}>
            <Info className="h-4 w-4" /> Request Info
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAction('resolution')}>
            <MessageSquare className="h-4 w-4" /> Resolution Notice
          </Button>
          <Button size="sm" variant="outline" onClick={() => run(() => closeMsg.mutateAsync(caseId), 'Case closed notice sent')}>
            <XCircle className="h-4 w-4" /> Close Notice
          </Button>
          <Button size="sm" variant="outline" onClick={() => run(() => feedback.mutateAsync(caseId), 'Feedback requested')}>
            <Star className="h-4 w-4" /> Request Feedback
          </Button>
        </div>
      )}

      <ol className="space-y-3">
        {(timeline ?? []).map((entry) => (
          <li key={entry.id} className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{entry.description}</span>
              <span className="text-xs text-[rgb(var(--muted))]">{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              {entry.action} · {entry.isAnonymous ? 'anonymous' : entry.actorType}
            </p>
          </li>
        ))}
        {(timeline ?? []).length === 0 && (
          <p className="rounded-lg border border-[rgb(var(--border-color))] p-6 text-center text-sm text-[rgb(var(--muted))]">No communication history for this case.</p>
        )}
      </ol>

      <Dialog
        open={action !== null}
        onClose={() => setAction(null)}
        title={action === 'public' ? 'Send Public Message' : action === 'info' ? 'Request Additional Information' : 'Send Resolution Notice'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              disabled={!message}
              onClick={() => {
                if (action === 'public') run(() => publicMsg.mutateAsync({ caseId, message }), 'Public message sent');
                else if (action === 'info') run(() => requestInfo.mutateAsync({ caseId, message }), 'Info requested');
                else if (action === 'resolution') run(() => resolution.mutateAsync({ caseId, message }), 'Resolution notice sent');
              }}
            >
              Send
            </Button>
          </>
        }
      >
        <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message…" />
      </Dialog>
    </div>
  );
}
