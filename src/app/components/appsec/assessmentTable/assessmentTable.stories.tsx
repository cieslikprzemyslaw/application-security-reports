import type { Meta, StoryObj } from '@storybook/react';

import AssessmentTable from './assessmentTable.component';

const meta = {
  title: 'AppSec/AssessmentTable',
  component: AssessmentTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onAssessmentClick: {
      action: 'assessment clicked',
    },
  },
} satisfies Meta<typeof AssessmentTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assessments: [
      {
        id: 'asm_1',
        code: 'ASMT-001',
        initials: 'ND',
        companyName: 'Northstar Digital',
        applicationName: 'Customer Services Portal',
        environment: 'Production',
        assessmentType: 'Web Application',
        overallRisk: 'high',
        findingsCount: 5,
        highCount: 2,
        status: 'in-progress',
        testerName: 'Alex Mercer',
      },
    ],
  },
};
