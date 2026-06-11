import type { Meta, StoryObj } from '@storybook/react';

import RecentAssessmentTable from './recentAssessmentTable.component';

const meta = {
  title: 'AppSec/RecentAssessmentTable',
  component: RecentAssessmentTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onAssessmentClick: {
      action: 'assessment clicked',
    },
  },
} satisfies Meta<typeof RecentAssessmentTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assessments: [
      {
        id: 'asm_1',
        applicationName: 'Customer Services Portal',
        companyName: 'Northstar Digital',
        assessmentType: 'Web App',
        severity: 'high',
        findingsCount: 14,
        status: 'in-progress',
      },
      {
        id: 'asm_2',
        applicationName: 'Payments Gateway API',
        companyName: 'Northstar Digital',
        assessmentType: 'API',
        severity: 'critical',
        findingsCount: 9,
        status: 'completed',
      },
    ],
  },
};
