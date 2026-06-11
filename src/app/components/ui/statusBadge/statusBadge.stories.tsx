import type { Meta, StoryObj } from '@storybook/react';

import StatusBadge from './statusBadge.component';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: {
        type: 'select',
      },
      options: ['open', 'in-review', 'mitigated', 'accepted-risk', 'false-positive'],
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium'],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    status: 'open',
    size: 'medium',
  },
};

export const AllStatuses: Story = {
  args: {
    status: 'open',
    size: 'medium',
  },
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <StatusBadge status="open" />
      <StatusBadge status="in-review" />
      <StatusBadge status="mitigated" />
      <StatusBadge status="accepted-risk" />
      <StatusBadge status="false-positive" />
    </div>
  ),
};
