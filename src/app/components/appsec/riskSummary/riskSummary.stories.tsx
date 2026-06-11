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
    overallRisk: 'high',
    totalFindings: 14,
    openThreats: 10,
    retestRequired: 2,
    severityCounts: [
      {
        severity: 'critical',
        count: 1,
      },
      {
        severity: 'high',
        count: 3,
      },
      {
        severity: 'medium',
        count: 5,
      },
      {
        severity: 'low',
        count: 4,
      },
      {
        severity: 'informational',
        count: 1,
      },
    ],
  },
};
