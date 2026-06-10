import type { Meta, StoryObj } from '@storybook/react';

import AssessmentSummary from './assessmentSummary.component';

const meta = {
  title: 'AppSec/AssessmentSummary',
  component: AssessmentSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AssessmentSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    companyName: 'Northstar Digital',
    companyLogo: <strong>ND</strong>,
    applicationName: 'Customer Services Portal',
    assessmentId: 'asm_7b164497-3d58-47e1-bc81-649265c76910',
    environment: 'Production',
    dateRange: '12 May 2026 – 28 May 2026',
    testerName: 'Alex Mercer',
    overallRisk: 'High',
    status: 'In Progress',
  },
};
