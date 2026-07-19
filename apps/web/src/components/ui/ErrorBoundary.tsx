'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

import { classifyError } from '@/lib/errors/classify.js';
import { Button } from '@/components/ui/button.js';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors in the subtree and shows a user-friendly
 * screen with a recovery action (reset). Resets on route change via key.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);
      const classified = classifyError(error);
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-red-500"><AlertTriangle className="h-10 w-10" /></div>
          <div>
            <h2 className="text-base font-semibold text-[rgb(var(--text))]">{classified.title}</h2>
            <p className="mt-1 max-w-md text-sm text-[rgb(var(--muted))]">{classified.message}</p>
          </div>
          <Button onClick={this.reset} variant="outline" size="sm">
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
