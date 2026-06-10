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
      options: ['Critical', 'High', 'Medium', 'Low', 'Informational'],
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
    severity: 'Critical',
    size: 'medium',
    showDot: true,
  },
};

export const AllSeverities: Story = {
  args: {
    severity: 'Critical',
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
      <SeverityBadge severity="Critical" />
      <SeverityBadge severity="High" />
      <SeverityBadge severity="Medium" />
      <SeverityBadge severity="Low" />
      <SeverityBadge severity="Informational" />
    </div>
  ),
};
