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
      options: [
        'Open',
        'In Progress',
        'Resolved',
        'Retest Required',
        'Accepted Risk',
      ],
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
    status: 'Open',
    size: 'medium',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <StatusBadge status="Open" />
      <StatusBadge status="In Progress" />
      <StatusBadge status="Resolved" />
      <StatusBadge status="Retest Required" />
      <StatusBadge status="Accepted Risk" />
    </div>
  ),
};
