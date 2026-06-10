import type { Meta, StoryObj } from '@storybook/react';

import Checkbox from './checkbox.component';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Include evidence in report',
    description: 'Screenshots and request traces will be exported.',
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all threats',
    indeterminate: true,
  },
};
