import Link from 'next/link';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="mb-3 text-4xl font-semibold">ComplianceOS AI</h1>
      <p className="mb-8 text-[rgb(var(--muted))]">
        Enterprise compliance management with identity, RBAC and multi-tenant isolation.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
        <Link href="/register">
          <Button variant="outline">Create organization</Button>
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['Identity & Auth', 'RBAC & Permissions', 'Multi-Tenant'].map((f) => (
          <Card key={f} className="p-4">
            <p className="text-sm font-medium">{f}</p>
          </Card>
        ))}
        <Link href="/grievances">
          <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
            <p className="text-sm font-medium">Worker Voice</p>
            <p className="text-xs text-[rgb(var(--muted))]">Submit & track grievances</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
