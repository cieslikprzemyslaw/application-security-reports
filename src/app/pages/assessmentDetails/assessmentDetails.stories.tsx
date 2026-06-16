import type { Meta, StoryObj } from '@storybook/react';

import PageContent from '~/app/layouts/pageContent';

import AssessmentDetailsView from './assessmentDetails.view';

const meta = {
  title: 'Pages/AssessmentDetails',
  component: AssessmentDetailsView,
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
    onSectionChange: {
      action: 'change section',
    },
    onBack: {
      action: 'back',
    },
    onAction: {
      action: 'assessment action',
    },
  },
} satisfies Meta<typeof AssessmentDetailsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeSection: 'overview',
    overviewHref: '/companies/cmp_1/assessments/asm_1/overview',
    onSectionChange: () => undefined,
    onAction: () => undefined,
    assessment: {
      id: 'asm_1',
      companyId: 'cmp_1',
      companyName: 'Northstar Digital',
      applicationName: 'Customer Services Portal',
      assessmentType: 'Web App',
      description: 'Assessment of the customer portal',
      scope: 'Authenticated portal workflows',
      startedAt: '2026-06-01',
      completedAt: '2026-06-10',
      environment: 'Production',
      status: 'in-progress',
      overallRisk: 'high',
      recordVersion: 3,
      findingsCount: 14,
      evidenceCount: 6,
      reportVersionCount: 2,
      testerName: 'Alex Mercer',
      availableActions: ['complete', 'archive'],
    },
  },
};
