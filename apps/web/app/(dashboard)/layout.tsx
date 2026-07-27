'use client';

import type { ReactNode } from 'react';

import { ProtectedRoute } from '@/components/guards/RouteGuard.js';
import { DashboardNav } from '@/components/layouts/DashboardNav.js';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs.js';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
'/dashboard': 'Overview',
  '/worker-voice': 'Worker Voice',
  '/worker-voice/my-cases': 'My Cases',
  '/worker-voice/hotline': 'Ethics Hotline',
  '/worker-voice/report': 'Report Concern',
   '/worker-voice/ai-assistant': 'AI Worker Assistant',
   '/worker-voice/knowledge-center': 'Knowledge Center',
   '/worker-ai': 'AI Worker Assistant',
   '/worker-ai/chat': 'AI Chat',
   '/worker-ai/documents': 'Documents',
   '/worker-ai/training': 'Training',
   '/worker-ai/rights': 'Rights',
   '/worker-ai/emergency': 'Emergency',
  '/executive': 'Executive Dashboard',
  '/analytics': 'Analytics',
  '/reports': 'Reports & Exports',
  '/search': 'Global Search',
  '/audits': 'Audits',
  '/capa': 'Findings & CAPA',
  '/queue': 'Queue',
  '/worker-communication': 'Worker Communication',
  '/communication-settings': 'Communication Settings',
  '/communication-hub': 'Communication Hub',
  '/communication-hub/inbox': 'Inbox',
  '/communication-hub/chat': 'Chat',
  '/communication-hub/broadcasts': 'Broadcasts',
  '/communication-hub/emergency': 'Emergency Center',
  '/communication-hub/calendar': 'Calendar',
  '/communication-hub/analytics': 'Communication Analytics',
  '/communication-hub/manager': 'Manager Dashboard',
  '/qr-codes': 'QR Codes',
  '/admin/users': 'Users',
  '/admin/organizations': 'Organizations',
  '/admin/sites': 'Sites',
  '/admin/roles': 'Roles & Permissions',
  '/admin/grievances': 'Grievances',
  '/admin/cases': 'Cases',
  '/admin/audit': 'Audit Trail',
  '/admin/security': 'Security Review',
  '/admin/ai': 'AI Foundation',
  '/standards': 'Standards',
  '/assessments': 'Assessments',
  '/organization': 'Organization',
  '/compliance-score': 'Compliance Score',
  '/risk': 'Risk',
  '/supplier': 'Supplier',
  '/factory': 'Factory',
  '/department': 'Department',
  '/escalation': 'Escalation',
  '/notifications': 'Notifications',
  '/sla': 'SLA',
  '/templates': 'Templates',
  '/workers': 'Worker Experience',
  '/workers/engagement': 'Engagement & Wellbeing',
  '/workers/engagement/surveys': 'Surveys',
  '/workers/engagement/surveys/builder': 'Survey Builder',
  '/workers/engagement/surveys/analytics': 'Survey Analytics',
  '/workers/engagement/recognition': 'Recognition',
  '/workers/engagement/recognition/leaderboard': 'Leaderboard',
  '/workers/engagement/recognition/history': 'History',
  '/workers/engagement/wellbeing': 'Wellbeing',
  '/workers/engagement/wellbeing/checkin': 'Check-in',
  '/workers/engagement/wellbeing/tips': 'Tips & Resources',
  '/workers/engagement/goals': 'Goals',
  '/workers/engagement/community': 'Community',
  '/workers/engagement/events': 'Events',
  '/workers/engagement/ai-insights': 'AI Insights',
  '/workers/engagement/manager': 'Manager Dashboard',
  '/workers/engagement/analytics': 'Analytics',
  '/dashboard/sustainability': 'Sustainability',
  '/dashboard/sustainability/programs': 'Programs',
  '/dashboard/sustainability/goals': 'Goals',
  '/dashboard/sustainability/kpis': 'KPIs',
  '/dashboard/sustainability/initiatives': 'Initiatives',
  '/dashboard/sustainability/reports': 'Reports',
  '/dashboard/sustainability/settings': 'Settings',
  '/dashboard/carbon': 'Carbon & GHG',
  '/dashboard/carbon/dashboard': 'Dashboard',
  '/dashboard/carbon/facilities': 'Facilities',
  '/dashboard/carbon/emission-sources': 'Emission Sources',
  '/dashboard/carbon/scopes': 'GHG Scopes',
  '/dashboard/carbon/emissions': 'Emissions',
  '/dashboard/carbon/emission-factors': 'Emission Factors',
  '/dashboard/carbon/projects': 'Reduction Projects',
  '/dashboard/carbon/offsets': 'Carbon Offsets',
  '/dashboard/carbon/targets': 'Reduction Targets',
  '/dashboard/carbon/reports': 'Carbon Reports',
  '/dashboard/carbon/calculator': 'Calculator',
};

export default function DashboardLayoutRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    return { label: PATH_LABELS[path] ?? decodeURIComponent(seg), href: i < segments.length - 1 ? path : undefined };
  });

  return (
    <ProtectedRoute>
      <DashboardNav>
        <div className="mx-auto max-w-6xl space-y-6">
          <Breadcrumbs items={crumbs} />
          {children}
        </div>
      </DashboardNav>
    </ProtectedRoute>
  );
}
