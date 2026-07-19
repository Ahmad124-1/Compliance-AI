'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button.js';

/**
 * Route segment error boundary. Next.js renders this on uncaught errors.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[route error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-red-500"><AlertTriangle className="h-10 w-10" /></div>
      <div>
        <h2 className="text-base font-semibold text-[rgb(var(--text))]">An unexpected error occurred</h2>
        <p className="mt-1 max-w-md text-sm text-[rgb(var(--muted))]">{error.message || 'Please try again.'}</p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        <RotateCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
