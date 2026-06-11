import type { Meta, StoryObj } from '@storybook/react';

import SeverityDistribution from './severityDistribution.component';

const meta = {
  title: 'AppSec/SeverityDistribution',
  component: SeverityDistribution,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SeverityDistribution>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
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
