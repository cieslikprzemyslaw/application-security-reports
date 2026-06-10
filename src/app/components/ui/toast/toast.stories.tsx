import type { Meta, StoryObj } from '@storybook/react';

import Toast from './toast.component';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onDismiss: {
      action: 'dismissed',
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    title: 'Threat saved',
    description: 'The local JSON file was updated successfully.',
    variant: 'success',
  },
};
