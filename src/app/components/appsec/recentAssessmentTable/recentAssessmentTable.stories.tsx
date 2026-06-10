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
    ],
  },
};
