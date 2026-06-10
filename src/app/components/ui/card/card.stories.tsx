import type { Meta, StoryObj } from '@storybook/react';

import Card from './card.component';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '30rem' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    title: 'Assessment summary',
    subtitle: 'Customer Services Portal',
    children: 'This card can contain any React content.',
    footer: 'Last updated 10 minutes ago',
  },
};
