import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Reports from './reports.component';

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

const meta = {
  title: 'Pages/Reports',
  component: Reports,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <PageContent maxWidth="full" spacing="default">
        <Story />
      </PageContent>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Reports>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    cover: {
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
      overallRisk: 'high',
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
          severity: 'critical',
          status: 'open',
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
          severity: 'medium',
          status: 'mitigated',
          affectedAsset: '/api/v1/orders',
          observation:
            'Unhandled errors exposed internal implementation details.',
          risk: 'Attackers could use leaked details to improve further attacks.',
          recommendation:
            'Return generic client-facing errors and log detailed diagnostics only on the server.',
        },
      ],
      footerText: '© 2026 Northstar Digital. Confidential — do not distribute.',
      confidential: true,
    },
  },
};
