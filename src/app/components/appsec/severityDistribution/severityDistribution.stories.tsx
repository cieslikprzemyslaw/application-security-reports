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
