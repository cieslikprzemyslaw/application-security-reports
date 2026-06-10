import type { Meta, StoryObj } from '@storybook/react';

import ReportHeader from '../reportHeader';
import RiskSummary from '../riskSummary';
import ReportPreview from './reportPreview.component';

const meta = {
  title: 'AppSec/ReportPreview',
  component: ReportPreview,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReportPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: (
      <ReportHeader
        companyName="Northstar Digital"
        companyLogo={<strong>ND</strong>}
        reportTitle="Application Security Assessment"
        applicationName="Customer Services Portal"
        environment="Production"
        assessmentId="asm_123"
        dateRange="12 May 2026 – 28 May 2026"
        testerName="Alex Mercer"
      />
    ),
    executiveSummary:
      'The assessment identified one critical and three high-severity findings requiring immediate attention.',
    riskSummary: (
      <RiskSummary
        overallRisk="High"
        totalFindings={14}
        openThreats={10}
        retestRequired={2}
        severityCounts={[
          {
            severity: 'Critical',
            count: 1,
          },
          {
            severity: 'High',
            count: 3,
          },
          {
            severity: 'Medium',
            count: 5,
          },
          {
            severity: 'Low',
            count: 4,
          },
          {
            severity: 'Informational',
            count: 1,
          },
        ]}
      />
    ),
    threats: [
      {
        id: 'thr_1',
        title: 'Missing Server-Side Authorization',
        severity: 'Critical',
        observation:
          'The endpoint returns objects without verifying resource ownership.',
        risk: 'An authenticated attacker can access another customer’s order details.',
        recommendation: 'Enforce object-level authorization on every request.',
      },
    ],
    footer: 'Confidential — Northstar Digital',
  },
};
