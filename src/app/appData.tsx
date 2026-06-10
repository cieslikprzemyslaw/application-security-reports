import type { ActivityItem } from '~/app/components/common/activityFeed';
import type { AssessmentStatusChartItem } from '~/app/components/appsec/assessmentStatusChart';
import type { AssessmentTableRow } from '~/app/components/appsec/assessmentTable';
import type { CompanyTableRow } from '~/app/components/appsec/companyTable';
import type { GlobalThreatRow } from '~/app/components/appsec/globalThreatTable';
import type { RecentAssessmentRow } from '~/app/components/appsec/recentAssessmentTable';
import type { ReportCoverProps } from '~/app/components/appsec/reportCover';
import type { SeverityDistributionItem } from '~/app/components/appsec/severityDistribution';

import type { DashboardStats } from './pages/dashboard';
import type { SettingsValue } from './pages/settings';

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const CompanyLogo = () => (
  <svg
    viewBox="0 0 48 48"
    width="48"
    height="48"
    aria-label="Northstar Digital logo"
  >
    <rect width="48" height="48" rx="10" fill="currentColor" />

    <path d="M24 11 28 20 38 24 28 28 24 37 20 28 10 24 20 20Z" fill="white" />
  </svg>
);

export const dashboardStats: DashboardStats = {
  totalAssessments: 24,
  totalAssessmentsChange: 4,
  openThreats: 86,
  openThreatsChange: -9,
  criticalHighFindings: 31,
  criticalHighChange: -3,
  retestRequired: 12,
  retestRequiredChange: 0,
};

export const severityDistribution: SeverityDistributionItem[] = [
  { severity: 'Critical', count: 9 },
  { severity: 'High', count: 22 },
  { severity: 'Medium', count: 31 },
  { severity: 'Low', count: 17 },
  { severity: 'Informational', count: 7 },
];

export const assessmentStatuses: AssessmentStatusChartItem[] = [
  { label: 'Completed', count: 11, tone: 'completed' },
  { label: 'In Progress', count: 7, tone: 'inProgress' },
  { label: 'In Review', count: 4, tone: 'inReview' },
  { label: 'Draft', count: 2, tone: 'draft' },
];

export const recentAssessments: RecentAssessmentRow[] = [
  {
    id: 'asm_1',
    applicationName: 'Customer Services Portal',
    companyName: 'Northstar Digital',
    assessmentType: 'Web App',
    severity: 'High',
    findingsCount: 14,
    status: 'In Progress',
  },
  {
    id: 'asm_2',
    applicationName: 'Payments Gateway API',
    companyName: 'Northstar Digital',
    assessmentType: 'API',
    severity: 'Critical',
    findingsCount: 9,
    status: 'Retest Required',
  },
  {
    id: 'asm_3',
    applicationName: 'Partner Mobile App',
    companyName: 'Northstar Digital',
    assessmentType: 'Mobile',
    severity: 'Medium',
    findingsCount: 11,
    status: 'Resolved',
  },
  {
    id: 'asm_4',
    applicationName: 'Internal Admin Console',
    companyName: 'Northstar Digital',
    assessmentType: 'Web App',
    severity: 'Medium',
    findingsCount: 6,
    status: 'Resolved',
  },
  {
    id: 'asm_5',
    applicationName: 'Data Export Service',
    companyName: 'Northstar Digital',
    assessmentType: 'API',
    severity: 'Low',
    findingsCount: 3,
    status: 'Accepted Risk',
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: 'act_1',
    title: (
      <>
        <strong>Alex Mercer</strong> raised a Critical finding on Customer
        Services Portal
      </>
    ),
    meta: 'Missing Server-Side Authorization · 2h ago',
    icon: <ActivityIcon />,
    tone: 'error',
  },
  {
    id: 'act_2',
    title: (
      <>
        <strong>Priya Shah</strong> marked Verbose Error Messages as Resolved
      </>
    ),
    meta: 'Orders API · 5h ago',
    icon: <ActivityIcon />,
    tone: 'success',
  },
  {
    id: 'act_3',
    title: 'Retest requested for Missing Audit Logging',
    meta: 'Admin Console · Yesterday',
    icon: <ActivityIcon />,
    tone: 'brand',
  },
];

export const companies: CompanyTableRow[] = [
  {
    id: 'cmp_1',
    name: 'Northstar Digital',
    initials: 'ND',
    applicationCount: 4,
    website: 'https://northstar.example',
    primaryContact: 'security@northstar.example',
    assessmentCount: 6,
    openThreats: 2,
    riskPosture: 'High',
  },
  {
    id: 'cmp_2',
    name: 'Meridian Finance',
    initials: 'MF',
    applicationCount: 2,
    website: 'https://meridian.example',
    primaryContact: 'appsec@meridian.example',
    assessmentCount: 4,
    openThreats: 1,
    riskPosture: 'Medium',
  },
];

export const assessments: AssessmentTableRow[] = [
  {
    id: 'asm_1',
    code: 'NSD-CSP-2026-014',
    initials: 'CSP',
    logoTone: 'blue',
    applicationName: 'Customer Services Portal',
    companyName: 'Northstar Digital',
    assessmentType: 'Web App',
    environment: 'Production',
    overallRisk: 'High',
    findingsCount: 14,
    criticalCount: 1,
    highCount: 3,
    testerName: 'Alex Mercer',
    status: 'In Progress',
  },
  {
    id: 'asm_2',
    code: 'CB-OBP-2026-013',
    initials: 'OBP',
    logoTone: 'indigo',
    applicationName: 'Online Banking Portal',
    companyName: 'Continental Bank',
    assessmentType: 'Web App',
    environment: 'Production',
    overallRisk: 'Critical',
    findingsCount: 17,
    criticalCount: 3,
    highCount: 4,
    testerName: 'Priya Shah',
    status: 'In Progress',
  },
];

export const threats: GlobalThreatRow[] = [
  {
    id: 'thr_1',
    title: 'Missing Server-Side Authorization',
    applicationName: 'Customer Services Portal',
    companyName: 'Northstar Digital',
    strideCategory: 'Elevation of Privilege',
    severity: 'Critical',
    status: 'Open',
    updatedAt: '28 May 2026',
  },
  {
    id: 'thr_2',
    title: 'Verbose Error Messages',
    applicationName: 'Customer Services Portal',
    companyName: 'Northstar Digital',
    strideCategory: 'Information Disclosure',
    severity: 'Medium',
    status: 'Resolved',
    updatedAt: '24 May 2026',
  },
];

export const settingsValue: SettingsValue = {
  fullName: 'Alex Mercer',
  role: 'Lead Pentester',
  email: 'alex.mercer@appsec.io',
  companyName: 'Northstar Digital',
  website: 'www.northstardigital.io',
  contactEmail: 'security@northstardigital.io',
  reportFooterText:
    '© 2026 Northstar Digital. Confidential — do not distribute.',
  methodology: 'OWASP ASVS / WSTG',
  reportStyle: 'Technical & structured',
  includeEvidence: true,
  confidentialReports: true,
};

export const assessmentDetailsById: Record<
  string,
  {
    assessment: AssessmentTableRow;
    executiveSummary: string;
    threats: GlobalThreatRow[];
  }
> = {
  [assessments[0].id]: {
    assessment: assessments[0],
    executiveSummary:
      'The assessment identified 14 confirmed findings across the Customer Services Portal. The overall risk is rated High due to one critical authorization weakness and three high-severity findings.',
    threats,
  },
};

export const reportCover: ReportCoverProps = {
  companyName: 'Northstar Digital',
  companyLogo: <CompanyLogo />,
  companyWebsite: 'www.northstardigital.io',
  companyContactEmail: 'security@northstardigital.io',
  reportId: 'NSD-CSP-2026-014',
  issuedDate: 'May 30, 2026',
  applicationName: 'Customer Services Portal',
  environment: 'Production',
  engagementDate: 'May 12 – 30, 2026',
  testerName: 'Alex Mercer',
  methodology: 'OWASP ASVS / WSTG',
  findingsCount: 14,
  overallRisk: 'High',
  executiveSummary:
    'This assessment identified 14 findings across the Customer Services Portal. The overall risk is rated High, driven by one critical authorization weakness and three high-severity data-exposure issues requiring prompt remediation.',
  scope: [
    'Customer Services Portal web application',
    'Authenticated and unauthenticated workflows',
    'Orders API and customer profile endpoints',
    'Session management and access-control checks',
  ],
  findings: [
    {
      id: 'thr_1',
      title: 'Missing Server-Side Authorization',
      severity: 'Critical',
      status: 'Open',
      affectedAsset: '/api/v1/orders/{id}',
      observation:
        'The endpoint returns order data without verifying that the authenticated user owns the requested object.',
      risk: 'An authenticated attacker can access another customer’s order information.',
      recommendation:
        'Apply object-level authorization to every request and deny access by default.',
    },
    {
      id: 'thr_2',
      title: 'Verbose Error Messages',
      severity: 'Medium',
      status: 'Resolved',
      affectedAsset: '/api/v1/orders',
      observation: 'Unhandled errors exposed internal implementation details.',
      risk: 'Attackers could use leaked details to improve further attacks.',
      recommendation:
        'Return generic client-facing errors and log detailed diagnostics only on the server.',
    },
  ],
  footerText: '© 2026 Northstar Digital. Confidential — do not distribute.',
  confidential: true,
};
