import type { Meta, StoryObj } from '@storybook/react';

import IconSVG from '~/app/components/ui/iconSVG';
import ActivityFeed from './activityFeed.component';

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
        icon: <IconSVG name="warning" />,
        tone: 'error',
      },
    ],
  },
};
