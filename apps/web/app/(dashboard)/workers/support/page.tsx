'use client';

import { HelpCircle, MessageSquare, BookOpen, Phone, Mail, Users } from 'lucide-react';

import { Card, Button } from '@/components/ui';
import Link from 'next/link';

const SUPPORT_ITEMS = [
  { title: 'FAQ', description: 'Find answers to common questions about workplace policies, benefits, and procedures.', icon: BookOpen, href: '#faq' },
  { title: 'Contact HR', description: 'Get in touch with the Human Resources team for employment-related matters.', icon: Users, href: '#hr' },
  { title: 'Help Desk', description: 'Submit a technical issue or request for IT and workplace support.', icon: Phone, href: '#helpdesk' },
  { title: 'Open Tickets', description: 'Track the status of your support requests and escalations.', icon: Mail, href: '#tickets' },
  { title: 'Worker Voice', description: 'Share feedback, suggestions, or concerns through our anonymous channel.', icon: MessageSquare, href: '/worker-communication' },
  { title: 'AI Worker Assistant', description: 'Get instant answers with our AI-powered worker assistant.', icon: HelpCircle, href: '/ai' },
];

export default function SupportCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Center</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Get help and access resources for workplace questions and issues.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_ITEMS.map((item) => (
          <Card key={item.title} className="p-5 transition-colors hover:bg-[rgb(var(--panel-2))]">
            <Link href={item.href}>
              <div className="flex items-start gap-3">
                <div className="rounded bg-[rgb(var(--primary)/0.1)] p-2">
                  <item.icon className="h-5 w-5 text-[rgb(var(--primary))]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{item.description}</p>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">FAQs</h2>
        <div className="space-y-3 text-sm">
          <details className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
            <summary className="cursor-pointer font-medium">How do I request leave?</summary>
            <p className="mt-2 text-[rgb(var(--muted))]">Navigate to My Tasks {'>'} Forms and submit a Leave Request form. Your manager will review it.</p>
          </details>
          <details className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
            <summary className="cursor-pointer font-medium">How can I access my payslip?</summary>
            <p className="mt-2 text-[rgb(var(--muted))]">Payslips will be available in the Documents section once payroll integration is connected.</p>
          </details>
          <details className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
            <summary className="cursor-pointer font-medium">How do I update my emergency contacts?</summary>
            <p className="mt-2 text-[rgb(var(--muted))]">Go to My Profile {'>'} Emergency Contacts and update your information. Changes are saved instantly.</p>
          </details>
        </div>
      </Card>
    </div>
  );
}
