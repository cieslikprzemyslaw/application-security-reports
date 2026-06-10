import type { Meta, StoryObj } from '@storybook/react';

import Callout from './callout.component';

const meta = {
  title: 'Components/Callout',
  component: Callout,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '32rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error', 'neutral'],
    },
  },
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    title: 'Evidence required',
    children:
      'Add at least one screenshot or request trace before closing this threat.',
    variant: 'warning',
  },
};
