'use client';

import type { ReactNode } from 'react';

import { ProtectedRoute } from '@/components/guards/RouteGuard.js';
import { DashboardNav } from '@/components/layouts/DashboardNav.js';
import { Breadcrumbs } from '@/components/layouts/Breadcrumbs.js';
import { usePathname } from 'next/navigation';

const PATH_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/search': 'Global Search',
  '/executive': 'Executive Intelligence',
  '/compliance-score': 'Compliance Score',

  // Sustainability
  '/sustainability': 'Sustainability',
  '/sustainability/programs': 'Programs',
  '/sustainability/programs/new': 'New Program',
  '/sustainability/programs/[id]': 'Program',
  '/sustainability/goals': 'Goals',
  '/sustainability/goals/new': 'New Goal',
  '/sustainability/goals/[id]': 'Goal',
  '/sustainability/kpis': 'KPIs',
  '/sustainability/kpis/new': 'New KPI',
  '/sustainability/kpis/[id]': 'KPI',
  '/sustainability/initiatives': 'Initiatives',
  '/sustainability/initiatives/new': 'New Initiative',
  '/sustainability/initiatives/[id]': 'Initiative',
  '/sustainability/reports': 'Reports',
  '/sustainability/reports/new': 'New Report',
  '/sustainability/reports/[id]': 'Report',
  '/sustainability/settings': 'Settings',

  // Carbon & GHG
  '/carbon': 'Carbon & GHG',
  '/carbon/dashboard': 'Dashboard',
  '/carbon/facilities': 'Facilities',
  '/carbon/emission-sources': 'Emission Sources',
  '/carbon/scopes': 'GHG Scopes',
  '/carbon/emissions': 'Activity Data',
  '/carbon/emission-factors': 'Emission Factors',
  '/carbon/projects': 'Carbon Projects',
  '/carbon/offsets': 'Carbon Offsets',
  '/carbon/targets': 'SBTi Targets',
  '/carbon/reports': 'Carbon Reports',
  '/carbon/calculator': 'Calculator',

  // Environmental
  '/dashboard/environment': 'Environmental',
  '/dashboard/environment/air': 'Air',
  '/dashboard/environment/chemicals': 'Chemicals',
  '/dashboard/environment/incidents': 'Incidents',
  '/dashboard/environment/permits': 'Permits',
  '/dashboard/environment/projects': 'Biodiversity',
  '/dashboard/environment/biodiversity': 'Biodiversity',
  '/dashboard/environment/biodiversity/new': 'New Biodiversity Record',
  '/dashboard/environment/resources': 'Resources',
  '/dashboard/environment/risks': 'Risk Register',
  '/dashboard/environment/settings': 'EMS Settings',
  '/dashboard/environment/waste': 'Waste',
  '/dashboard/environment/water': 'Water',
  '/dashboard/environment/objectives': 'Objectives',
  '/dashboard/environment/objectives/new': 'New Objective',
  '/dashboard/environment/reports': 'Reports',
  '/dashboard/environment/reports/new': 'New Report',

  // ESG
  '/dashboard/esg': 'ESG',
  '/dashboard/esg/frameworks': 'Frameworks',
  '/dashboard/esg/metrics': 'Metrics',
  '/dashboard/esg/periods': 'Reporting Periods',
  '/dashboard/esg/data-points': 'Data Points',
  '/dashboard/esg/materiality': 'Materiality Assessment',
  '/dashboard/esg/disclosures': 'Disclosures',
  '/dashboard/esg/reports': 'ESG Reporting',
  '/dashboard/esg/assurance': 'Assurance',

  // Suppliers
  '/suppliers': 'Supplier Dashboard',
  '/supplier': 'Suppliers',
  '/supplier-esg': 'Supplier ESG',
  '/responsible-sourcing': 'Responsible Sourcing',
  '/supplier-carbon': 'Supplier Carbon',
  '/supplier-audits': 'Supplier Audits',
  '/supplier-risk': 'Supplier Risk',
  '/supplier-scorecards': 'Supplier Scorecards',

  // Compliance
  '/audits': 'Audits',
  '/audits/[id]': 'Audit',
  '/capa': 'CAPA',
  '/risk': 'Risks',
  '/policies': 'Policies',
  '/documents': 'Documents',
  '/standards': 'Standards',
  '/standards/[id]': 'Standard',
  '/standards/frameworks/[id]': 'Framework',
  '/assessments': 'Assessments',
  '/assessments/templates': 'Templates',
  '/assessments/library/[id]': 'Library',

  // Analytics
  '/analytics': 'Analytics',
  '/reports': 'Reports',

  // Administration
  '/admin/users': 'Users',
  '/admin/organizations': 'Organizations',
  '/admin/sites': 'Sites / Factories',
  '/admin/roles': 'Roles & Permissions',
  '/admin/audit': 'Audit Trail',
  '/admin/security': 'Security Review',
  '/admin/ai': 'AI Foundation',
  '/settings/profile': 'Profile',

  // Legacy modules (hidden from nav but reachable directly)
  '/worker-voice': 'Worker Voice',
  '/worker-communication': 'Worker Communication',
  '/worker-ai': 'AI Worker Assistant',
  '/workers': 'Workers',
  '/grievances': 'Grievances',
  '/admin/grievances': 'Grievances',
  '/admin/cases': 'Cases',
  '/escalation': 'Escalation',
  '/ai': 'AI Compliance Copilot',
  '/factory': 'Factories',
  '/certifications': 'Certifications',
  '/qr-codes': 'QR Codes',
  '/communication-hub': 'Communication Hub',
  '/communication-settings': 'Communication Settings',
  '/notifications': 'Notifications',
  '/sla': 'SLA',
  '/templates': 'Templates',
  '/queue': 'Queue',
  '/organization': 'Organization',
  '/department': 'Department',
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

