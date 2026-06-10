import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import AssessmentDetails from './assessmentDetails.component';

const meta = {
  title: 'Pages/AssessmentDetails',
  component: AssessmentDetails,
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
    onBack: {
      action: 'back',
    },
    onEdit: {
      action: 'edit assessment',
    },
    onAddThreat: {
      action: 'add threat',
    },
    onThreatClick: {
      action: 'threat clicked',
    },
  },
} satisfies Meta<typeof AssessmentDetails>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assessment: {
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

    executiveSummary:
      'The assessment identified 14 confirmed findings across the Customer Services Portal. The overall risk is rated High due to one critical authorization weakness and three high-severity findings.',

    threats: [
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
    ],
  },
};
