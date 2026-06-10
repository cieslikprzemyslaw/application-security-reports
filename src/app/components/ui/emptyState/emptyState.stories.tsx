import type { Meta, StoryObj } from '@storybook/react';

import EmptyState from './emptyState.component';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    title: 'No threats found',
    description: 'Create the first threat for this assessment.',
    primaryAction: <button type="button">Add threat</button>,
  },
};
