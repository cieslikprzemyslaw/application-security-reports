import type { Meta, StoryObj } from '@storybook/react';

import Badge from './badge.component';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: {
        type: 'text',
      },
    },
    variant: {
      control: {
        type: 'select',
      },
      options: ['neutral', 'brand', 'success', 'warning', 'error', 'info'],
    },
    size: {
      control: {
        type: 'select',
      },
      options: ['small', 'medium'],
    },
    showDot: {
      control: {
        type: 'boolean',
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'In progress',
    variant: 'brand',
    size: 'medium',
    showDot: true,
  },
};

export const Neutral: Story = {
  args: {
    label: 'Draft',
    variant: 'neutral',
  },
};

export const Success: Story = {
  args: {
    label: 'Resolved',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    label: 'Needs review',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    label: 'Critical',
    variant: 'error',
  },
};
