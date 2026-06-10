import type { Meta, StoryObj } from '@storybook/react';

import ActivityFeed from './activityFeed.component';

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
    <path
      d="M12 9v4M12 17h.01M10.3 4 2 18h20L13.7 4a2 2 0 0 0-3.4 0Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const meta = {
  title: 'Common/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '28rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ActivityFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: '1',
        title: 'A critical threat was added.',
        meta: 'Customer Services Portal · 2 hours ago',
        icon: <AlertIcon />,
        tone: 'error',
      },
    ],
  },
};
