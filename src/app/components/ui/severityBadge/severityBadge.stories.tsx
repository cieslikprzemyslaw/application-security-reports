import type { Meta, StoryObj } from '@storybook/react';

import SeverityBadge from './severityBadge.component';

const meta = {
  title: 'Components/SeverityBadge',
  component: SeverityBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: {
        type: 'select',
      },
      options: ['critical', 'high', 'medium', 'low', 'informational'],
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium'],
    },
    showDot: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof SeverityBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    severity: 'critical',
    size: 'medium',
    showDot: true,
  },
};

export const AllSeverities: Story = {
  args: {
    severity: 'critical',
    size: 'medium',
    showDot: true,
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <SeverityBadge severity="critical" />
      <SeverityBadge severity="high" />
      <SeverityBadge severity="medium" />
      <SeverityBadge severity="low" />
      <SeverityBadge severity="informational" />
    </div>
  ),
};
