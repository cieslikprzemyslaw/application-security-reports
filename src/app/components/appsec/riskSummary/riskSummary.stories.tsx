import type { Meta, StoryObj } from '@storybook/react';

import RiskSummary from './riskSummary.component';

const meta = {
  title: 'AppSec/RiskSummary',
  component: RiskSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RiskSummary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    overallRisk: 'High',
    totalFindings: 14,
    openThreats: 10,
    retestRequired: 2,
    severityCounts: [
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
    ],
  },
};
