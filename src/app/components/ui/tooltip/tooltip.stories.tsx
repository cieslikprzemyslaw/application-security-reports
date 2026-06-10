import type { Meta, StoryObj } from '@storybook/react';

import Tooltip from './tooltip.component';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    content: 'This action generates a local PDF report.',
    children: <button type="button">Download PDF</button>,
    position: 'top',
  },
};
