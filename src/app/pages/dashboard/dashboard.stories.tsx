import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import Dashboard from './dashboard.component';

import type { DashboardPeriod } from './dashboard.type';

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <PageContent maxWidth="wide" spacing="default">
        <Story />
      </PageContent>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    onCreateAssessment: {
      action: 'create assessment',
    },
    onViewAllAssessments: {
      action: 'view all assessments',
    },
    onAssessmentClick: {
      action: 'assessment clicked',
    },
  },
} satisfies Meta<typeof Dashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: args => {
    const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('90');

    return (
      <Dashboard
        {...args}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
    );
  },
  args: {
    selectedPeriod: '90',
    onPeriodChange: () => undefined,
    stats: {
      totalAssessments: 24,
      totalAssessmentsChange: 4,
      openThreats: 86,
      openThreatsChange: -9,
      criticalHighFindings: 31,
      criticalHighChange: -3,
      retestRequired: 12,
      retestRequiredChange: 0,
    },
    severityDistribution: [
      {
        severity: 'Critical',
        count: 9,
      },
      {
        severity: 'High',
        count: 22,
      },
      {
        severity: 'Medium',
        count: 31,
      },
      {
        severity: 'Low',
        count: 17,
      },
      {
        severity: 'Informational',
        count: 7,
      },
    ],
    assessmentStatuses: [
      {
        label: 'Completed',
        count: 11,
        tone: 'completed',
      },
      {
        label: 'In Progress',
        count: 7,
        tone: 'inProgress',
      },
      {
        label: 'In Review',
        count: 4,
        tone: 'inReview',
      },
      {
        label: 'Draft',
        count: 2,
        tone: 'draft',
      },
    ],
    recentAssessments: [
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
    ],
    recentActivity: [
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
            <strong>Priya Shah</strong> marked Verbose Error Messages as
            Resolved
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
    ],
  },
};
